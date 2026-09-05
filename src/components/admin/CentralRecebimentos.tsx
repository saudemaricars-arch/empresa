import { useState, useMemo, useEffect } from 'react';
import { Company, TipoGestao, TIPOS_GESTAO } from '../../types';
import { 
  updateSugestaoStatus, 
  updateDenunciaStatus, 
  updateAtestadoStatus, 
  updateAuxilioStatus, 
  updateApoioSaudeStatus, 
  updateSegurancaTrabalhoStatus 
} from '../../lib/firestoreService';
import { 
  Search, Filter, ShieldAlert, Lightbulb, FilePlus, Heart, Inbox, Activity, X, Tag,
  User, Mail, MessageCircle, Paperclip, ExternalLink, Save, CheckCircle2, Loader2, Shield
} from 'lucide-react';
import { exportToCsv } from '../../utils/exportCsv';

interface CentralRecebimentosProps {
  companies: Company[];
}

export type UnifiedEvent = {
  id: string;
  empresaId: string;
  empresaNome: string;
  empresaTag?: TipoGestao;
  modulo: 'Sugestão' | 'Denúncia' | 'Atestado' | 'Apoio Emocional' | 'Apoio à Saúde' | 'Segurança do Trabalho';
  dataOriginal: string; // ISO string
  status: string;
  conteudoOriginal: any;
};

const MODULE_STATUS_CONFIG: Record<string, { value: string; label: string }[]> = {
  'Denúncia': [
    { value: 'nova', label: 'Nova' },
    { value: 'em_analise', label: 'Em Análise' },
    { value: 'resolvida', label: 'Resolvida' },
    { value: 'arquivada', label: 'Arquivada' },
  ],
  'Sugestão': [
    { value: 'nova', label: 'Nova' },
    { value: 'lida', label: 'Lida' },
    { value: 'respondida', label: 'Respondida' },
  ],
  'Atestado': [
    { value: 'pendente', label: 'Pendente' },
    { value: 'aprovado', label: 'Aprovado' },
    { value: 'rejeitado', label: 'Rejeitado' },
  ],
  'Apoio Emocional': [
    { value: 'pendente', label: 'Pendente' },
    { value: 'em_atendimento', label: 'Em Atendimento' },
    { value: 'concluido', label: 'Concluído' },
  ],
  'Apoio à Saúde': [
    { value: 'pendente', label: 'Pendente' },
    { value: 'em_atendimento', label: 'Em Atendimento' },
    { value: 'concluido', label: 'Concluído' },
  ],
  'Segurança do Trabalho': [
    { value: 'nova', label: 'Nova' },
    { value: 'em_analise', label: 'Em Análise' },
    { value: 'resolvida', label: 'Resolvida' },
  ],
};

const TIPO_DENUNCIA_MAP: Record<string, string> = {
  assedio: '🚫 Assédio Moral / Sexual',
  fraude: '💰 Fraude ou Desvio Financeiro',
  corrupcao: '⚖️ Corrupção ou Suborno',
  ameaca: '⚠️ Ameaça ou Coação',
  bullying: '🛑 Bullying ou Discriminação',
  descumprimento: '📋 Descumprimento de Normas e Políticas',
  outro: '📌 Outro Tipo de Infração',
};

const isImage = (url?: string) => {
  if (!url) return false;
  return /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url) || url.startsWith('data:image/');
};

function AttachmentCard({ url, title }: { url: string; title: string }) {
  const isImg = isImage(url);
  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 truncate">
          <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate">{title}</span>
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline shrink-0 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 transition-colors"
        >
          <span>Visualizar / Abrir</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      {isImg && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-3 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 max-h-72 group"
          title="Clique para abrir imagem em tamanho original"
        >
          <img
            src={url}
            alt={title}
            className="w-full h-full max-h-72 object-contain mx-auto group-hover:scale-[1.01] transition-transform"
          />
        </a>
      )}
    </div>
  );
}

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    nova: 'Nova',
    em_analise: 'Em Análise',
    resolvida: 'Resolvida',
    arquivada: 'Arquivada',
    lida: 'Lida',
    respondida: 'Respondida',
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    rejeitado: 'Rejeitado',
    em_atendimento: 'Em Atendimento',
    concluido: 'Concluído',
  };
  return map[status] || status;
};

export function CentralRecebimentos({ companies }: CentralRecebimentosProps) {
  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterEmpresa, setFilterEmpresa] = useState<string>('all');
  const [filterModulo, setFilterModulo] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedEvent, setSelectedEvent] = useState<UnifiedEvent | null>(null);
  const [statusTemp, setStatusTemp] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedEvent) {
      const current = statusOverrides[`${selectedEvent.empresaId}_${selectedEvent.id}`] || selectedEvent.status;
      setStatusTemp(current);
      setSaveSuccess(false);
    }
  }, [selectedEvent, statusOverrides]);

  const eventos: UnifiedEvent[] = useMemo(() => {
    const list: UnifiedEvent[] = [];
    companies.forEach(c => {
      (c.sugestoes || []).forEach(s => list.push({
        id: s.id, empresaId: c.id, empresaNome: c.nomeFantasia || c.razaoSocial, empresaTag: c.tipoGestao,
        modulo: 'Sugestão', dataOriginal: s.criadoEm, 
        status: statusOverrides[`${c.id}_${s.id}`] || s.status, 
        conteudoOriginal: s
      }));
      (c.denuncias || []).forEach(d => list.push({
        id: d.id, empresaId: c.id, empresaNome: c.nomeFantasia || c.razaoSocial, empresaTag: c.tipoGestao,
        modulo: 'Denúncia', dataOriginal: d.criadoEm, 
        status: statusOverrides[`${c.id}_${d.id}`] || d.status, 
        conteudoOriginal: d
      }));
      (c.atestados || []).forEach(a => list.push({
        id: a.id, empresaId: c.id, empresaNome: c.nomeFantasia || c.razaoSocial, empresaTag: c.tipoGestao,
        modulo: 'Atestado', dataOriginal: a.criadoEm, 
        status: statusOverrides[`${c.id}_${a.id}`] || a.status, 
        conteudoOriginal: a
      }));
      (c.auxilios || []).forEach(aux => list.push({
        id: aux.id, empresaId: c.id, empresaNome: c.nomeFantasia || c.razaoSocial, empresaTag: c.tipoGestao,
        modulo: 'Apoio Emocional', dataOriginal: aux.criadoEm, 
        status: statusOverrides[`${c.id}_${aux.id}`] || aux.status, 
        conteudoOriginal: aux
      }));
      (c.apoioSaude || []).forEach(as => list.push({
        id: as.id, empresaId: c.id, empresaNome: c.nomeFantasia || c.razaoSocial, empresaTag: c.tipoGestao,
        modulo: 'Apoio à Saúde', dataOriginal: as.criadoEm, 
        status: statusOverrides[`${c.id}_${as.id}`] || as.status, 
        conteudoOriginal: as
      }));
      (c.segurancaTrabalho || []).forEach(st => list.push({
        id: st.id, empresaId: c.id, empresaNome: c.nomeFantasia || c.razaoSocial, empresaTag: c.tipoGestao,
        modulo: 'Segurança do Trabalho', dataOriginal: st.criadoEm, 
        status: statusOverrides[`${c.id}_${st.id}`] || st.status, 
        conteudoOriginal: st
      }));
    });
    return list.sort((a, b) => new Date(b.dataOriginal).getTime() - new Date(a.dataOriginal).getTime());
  }, [companies, statusOverrides]);

  const availableCompanies = useMemo(() => {
    if (filterTag === 'all') return companies;
    if (filterTag === 'sem_tag') return companies.filter(c => !c.tipoGestao);
    return companies.filter(c => c.tipoGestao === filterTag);
  }, [companies, filterTag]);

  const filteredEvents = useMemo(() => {
    return eventos.filter(e => {
      if (filterTag !== 'all') {
        if (filterTag === 'sem_tag' && e.empresaTag) return false;
        if (filterTag !== 'sem_tag' && e.empresaTag !== filterTag) return false;
      }
      if (filterEmpresa !== 'all' && e.empresaId !== filterEmpresa) return false;
      if (filterModulo !== 'all' && e.modulo !== filterModulo) return false;
      if (filterStatus !== 'all') {
        const isPending = ['nova', 'pendente'].includes(e.status);
        if (filterStatus === 'pending' && !isPending) return false;
        if (filterStatus === 'resolved' && isPending) return false;
      }
      if (dataInicio && new Date(e.dataOriginal) < new Date(dataInicio + 'T00:00:00')) return false;
      if (dataFim && new Date(e.dataOriginal) > new Date(dataFim + 'T23:59:59')) return false;
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        const tagLabel = e.empresaTag && TIPOS_GESTAO[e.empresaTag] ? TIPOS_GESTAO[e.empresaTag].label.toLowerCase() : '';
        const str = JSON.stringify(e.conteudoOriginal).toLowerCase() + e.empresaNome.toLowerCase() + ' ' + tagLabel;
        if (!str.includes(lower)) return false;
      }
      return true;
    });
  }, [eventos, filterTag, filterEmpresa, filterModulo, filterStatus, searchTerm, dataInicio, dataFim]);

  const handleExport = () => {
    const data = filteredEvents.map(e => {
      const c = e.conteudoOriginal;
      return {
        'Data de Recebimento': new Date(e.dataOriginal).toLocaleString('pt-BR'),
        'Empresa': e.empresaNome,
        'TAG / Tipo de Gestão': e.empresaTag && TIPOS_GESTAO[e.empresaTag] ? TIPOS_GESTAO[e.empresaTag].label : 'Sem TAG',
        'Módulo': e.modulo,
        'Status': formatStatus(e.status),
        'Nome / Solicitante': c.nome || c.nomeFuncionario || 'Não informado',
        'CPF / Matrícula': c.matricula || '',
        'Telefone': c.telefone || '',
        'E-mail': c.email || '',
        'Categoria / Tipo da Ação': c.categoria || c.tipo || c.tipoAuxilio || c.tipoConsulta || '',
        'Motivo / CID': c.motivo || c.motivoSolicitacao || c.motivoCid || '',
        'Mensagem / Descrição': c.mensagem || c.descricao || '',
        'Médico': c.nomeMedico || '',
        'CRM': c.crmMedico || '',
        'Data Afastamento': c.dataAfastamento ? new Date(c.dataAfastamento).toLocaleDateString('pt-BR') : '',
        'Dias Afastados': c.diasAfastamento || '',
        'Link do Anexo (Provas / Atestados)': c.provas || c.arquivoUrl || c.anexo || 'Sem anexo'
      };
    });
    exportToCsv('central_recebimentos_completo.csv', data);
  };

  const getModuleIcon = (modulo: string) => {
    switch (modulo) {
      case 'Denúncia': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'Sugestão': return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case 'Atestado': return <FilePlus className="w-5 h-5 text-amber-500" />;
      case 'Apoio Emocional': return <Heart className="w-5 h-5 text-teal-500" />;
      case 'Apoio à Saúde': return <Activity className="w-5 h-5 text-blue-500" />;
      case 'Segurança do Trabalho': return <ShieldAlert className="w-5 h-5 text-orange-500" />;
      default: return <Inbox className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    if (['nova', 'pendente'].includes(status)) return 'bg-red-100 text-red-700';
    if (['em_analise', 'em_atendimento', 'lida'].includes(status)) return 'bg-blue-100 text-blue-700';
    if (['resolvida', 'concluido', 'aprovado', 'respondida'].includes(status)) return 'bg-green-100 text-green-700';
    return 'bg-slate-100 text-slate-700';
  };

  const handleSaveStatus = async () => {
    if (!selectedEvent || !statusTemp) return;
    setIsSaving(true);
    try {
      if (selectedEvent.modulo === 'Sugestão') await updateSugestaoStatus(selectedEvent.empresaId, selectedEvent.id, statusTemp as any);
      else if (selectedEvent.modulo === 'Denúncia') await updateDenunciaStatus(selectedEvent.empresaId, selectedEvent.id, statusTemp as any);
      else if (selectedEvent.modulo === 'Atestado') await updateAtestadoStatus(selectedEvent.empresaId, selectedEvent.id, statusTemp as any);
      else if (selectedEvent.modulo === 'Apoio Emocional') await updateAuxilioStatus(selectedEvent.empresaId, selectedEvent.id, statusTemp as any);
      else if (selectedEvent.modulo === 'Apoio à Saúde') await updateApoioSaudeStatus(selectedEvent.empresaId, selectedEvent.id, statusTemp as any);
      else if (selectedEvent.modulo === 'Segurança do Trabalho') await updateSegurancaTrabalhoStatus(selectedEvent.empresaId, selectedEvent.id, statusTemp as any);
      
      setStatusOverrides(prev => ({
        ...prev,
        [`${selectedEvent.empresaId}_${selectedEvent.id}`]: statusTemp,
      }));
      setSelectedEvent(prev => prev ? { ...prev, status: statusTemp } : null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar status no servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Inbox className="w-7 h-7 text-blue-600" />
            Central de Recebimentos Globais
          </h1>
          <p className="text-slate-500 text-sm mt-1">Acompanhe todas as solicitações, denúncias e envios de todas as empresas cadastradas.</p>
        </div>
        <button onClick={handleExport} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
          Exportar Relatório Geral
        </button>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col gap-4">
        <div className="w-full relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar em todas as solicitações..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm w-full">
            <span className="text-slate-400 font-medium">De:</span>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="bg-transparent focus:outline-none text-slate-700 w-full" />
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm w-full">
            <span className="text-slate-400 font-medium">Até:</span>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="bg-transparent focus:outline-none text-slate-700 w-full" />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm w-full">
            <Tag className="w-4 h-4 text-slate-400 shrink-0" />
            <select 
              value={filterTag} 
              onChange={e => {
                setFilterTag(e.target.value);
                setFilterEmpresa('all');
              }} 
              className="bg-transparent focus:outline-none text-slate-700 w-full cursor-pointer font-medium"
            >
              <option value="all">Todas as TAGs</option>
              {Object.entries(TIPOS_GESTAO).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
              <option value="sem_tag">Sem TAG Definida</option>
            </select>
          </div>
          
          <select 
            value={filterEmpresa} 
            onChange={e => setFilterEmpresa(e.target.value)} 
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-700"
          >
            <option value="all">Todas as Empresas {filterTag !== 'all' ? `(${availableCompanies.length})` : ''}</option>
            {availableCompanies.map(c => (
              <option key={c.id} value={c.id}>{c.nomeFantasia || c.razaoSocial}</option>
            ))}
          </select>
          
          <select value={filterModulo} onChange={e => setFilterModulo(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-700">
            <option value="all">Todos os Módulos</option>
            <option value="Sugestão">Sugestão</option>
            <option value="Denúncia">Denúncia</option>
            <option value="Atestado">Atestado</option>
            <option value="Apoio Emocional">Apoio Emocional</option>
            <option value="Apoio à Saúde">Apoio à Saúde</option>
            <option value="Segurança do Trabalho">Segurança do Trabalho</option>
          </select>
          
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-700">
            <option value="all">Qualquer Status</option>
            <option value="pending">Apenas Pendentes / Novas</option>
            <option value="resolved">Apenas Resolvidas / Concluídas</option>
          </select>
        </div>

        {(filterTag !== 'all' || filterEmpresa !== 'all' || filterModulo !== 'all' || filterStatus !== 'all' || dataInicio || dataFim || searchTerm) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Mostrando <strong className="text-slate-800">{filteredEvents.length}</strong> de <strong className="text-slate-800">{eventos.length}</strong> registros
            </span>
            <button
              onClick={() => {
                setFilterTag('all');
                setFilterEmpresa('all');
                setFilterModulo('all');
                setFilterStatus('all');
                setDataInicio('');
                setDataFim('');
                setSearchTerm('');
              }}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Limpar Filtros
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold w-12">Módulo</th>
                <th className="p-4 font-semibold">Data</th>
                <th className="p-4 font-semibold">Empresa</th>
                <th className="p-4 font-semibold">Solicitante</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhuma solicitação encontrada com estes filtros.</td></tr>
              ) : filteredEvents.map(e => (
                <tr key={e.id + e.modulo} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-center">
                    <div title={e.modulo} className="inline-flex w-10 h-10 items-center justify-center bg-slate-100 rounded-xl">
                      {getModuleIcon(e.modulo)}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-700 whitespace-nowrap">{new Date(e.dataOriginal).toLocaleString('pt-BR')}</td>
                  <td className="p-4">
                    <div className="text-sm font-semibold text-slate-900">{e.empresaNome}</div>
                    {e.empresaTag && TIPOS_GESTAO[e.empresaTag] ? (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1 rounded-full text-[11px] font-semibold border ${TIPOS_GESTAO[e.empresaTag].bgClass} ${TIPOS_GESTAO[e.empresaTag].borderClass} ${TIPOS_GESTAO[e.empresaTag].textClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${TIPOS_GESTAO[e.empresaTag].dotClass}`} />
                        {TIPOS_GESTAO[e.empresaTag].badgeLabel}
                      </span>
                    ) : null}
                  </td>
                  <td className="p-4 text-sm text-slate-700">{e.conteudoOriginal.nome || e.conteudoOriginal.nomeFuncionario || 'Não informado'}</td>
                  <td className="p-4">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(e.status)}`}>
                      {formatStatus(e.status)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => setSelectedEvent(e)} className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-lg text-sm font-medium transition-colors shadow-sm">
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEvent && (() => {
        const c = selectedEvent.conteudoOriginal || {};
        const currentStatus = statusOverrides[`${selectedEvent.empresaId}_${selectedEvent.id}`] || selectedEvent.status;
        const isAnonimo = !c.nome && !c.nomeFuncionario || (c.nome && String(c.nome).toLowerCase() === 'anônimo');
        const nomeExibicao = c.nome || c.nomeFuncionario || (isAnonimo ? 'Anônimo' : 'Não informado');
        const telefone = c.telefone || c.whatsapp;
        const email = c.email;
        const matricula = c.matricula;
        const setor = c.setor;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
              
              {/* Cabeçalho do Modal */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-200 shrink-0">
                    {getModuleIcon(selectedEvent.modulo)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{selectedEvent.modulo}</h3>
                      {selectedEvent.empresaTag && TIPOS_GESTAO[selectedEvent.empresaTag] && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${TIPOS_GESTAO[selectedEvent.empresaTag].bgClass} ${TIPOS_GESTAO[selectedEvent.empresaTag].borderClass} ${TIPOS_GESTAO[selectedEvent.empresaTag].textClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${TIPOS_GESTAO[selectedEvent.empresaTag].dotClass}`} />
                          {TIPOS_GESTAO[selectedEvent.empresaTag].badgeLabel}
                        </span>
                      )}
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full ${getStatusColor(currentStatus)}`}>
                        {formatStatus(currentStatus)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      <strong className="text-slate-700">{selectedEvent.empresaNome}</strong> • Recebido em {new Date(selectedEvent.dataOriginal).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedEvent(null)} 
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors shrink-0 ml-2"
                  title="Fechar"
                >
                  <X className="w-5 h-5"/>
                </button>
              </div>

              {/* Mensagem de sucesso ao salvar status */}
              {saveSuccess && (
                <div className="bg-emerald-600 text-white px-5 py-2.5 flex items-center gap-2 text-sm font-semibold shadow-inner">
                  <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
                  <span>Status atualizado para <strong>"{formatStatus(statusTemp)}"</strong> e salvo com sucesso!</span>
                </div>
              )}

              {/* Corpo de Conteúdo */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-white">

                {/* Card 1: Identificação do Solicitante */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Identificação do Solicitante</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 mb-1">Nome</span>
                      {isAnonimo ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-200 text-slate-700">
                          <Shield className="w-3.5 h-3.5 text-slate-500" />
                          Identidade Preservada (Anônimo)
                        </span>
                      ) : (
                        <span className="font-bold text-slate-900">{nomeExibicao}</span>
                      )}
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-slate-500 mb-1">Telefone / WhatsApp</span>
                      {telefone ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-800">{telefone}</span>
                          <a
                            href={`https://wa.me/55${String(telefone).replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Olá ${!isAnonimo ? nomeExibicao : ''}, recebemos sua solicitação de ${selectedEvent.modulo} no portal da empresa ${selectedEvent.empresaNome}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg text-xs font-bold transition-colors"
                            title="Chamar no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Não informado</span>
                      )}
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-slate-500 mb-1">E-mail</span>
                      {email ? (
                        <a href={`mailto:${email}`} className="text-blue-600 hover:underline font-medium break-all flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {email}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Não informado</span>
                      )}
                    </div>

                    {(matricula || setor) && (
                      <>
                        {matricula && (
                          <div>
                            <span className="block text-xs font-semibold text-slate-500 mb-1">Matrícula / CPF</span>
                            <span className="font-medium text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 inline-block text-xs">
                              {matricula}
                            </span>
                          </div>
                        )}
                        {setor && (
                          <div>
                            <span className="block text-xs font-semibold text-slate-500 mb-1">Setor / Departamento</span>
                            <span className="font-medium text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 inline-block text-xs">
                              {setor}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Card 2: Detalhes Específicos por Módulo */}
                {selectedEvent.modulo === 'Denúncia' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                      <span>Detalhes da Denúncia</span>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-slate-500 mb-1">Tipo de Ocorrência / Infração</span>
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100/80 border border-red-200 text-red-800 font-bold text-sm rounded-xl">
                        {TIPO_DENUNCIA_MAP[c.tipo] || c.tipo || 'Não especificado'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-slate-500 mb-1.5">Relato Completo dos Fatos</span>
                      <div className="p-4 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed shadow-sm">
                        {c.descricao || 'Sem descrição fornecida.'}
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-slate-500 mb-1.5">Provas / Evidências Anexadas</span>
                      {c.provas ? (
                        <AttachmentCard url={c.provas} title="Documento / Prova Anexa à Denúncia" />
                      ) : (
                        <div className="p-3 bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 italic">
                          Nenhuma prova ou anexo adicionado nesta denúncia.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedEvent.modulo === 'Sugestão' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <span>Detalhes da Sugestão</span>
                    </div>

                    {c.categoria && (
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-1">Categoria da Sugestão</span>
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100/80 border border-amber-200 text-amber-800 font-bold text-sm rounded-xl">
                          💡 {c.categoria}
                        </span>
                      </div>
                    )}

                    <div>
                      <span className="block text-xs font-semibold text-slate-500 mb-1.5">Mensagem / Proposta de Melhoria</span>
                      <div className="p-4 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed shadow-sm">
                        {c.mensagem || 'Sem mensagem fornecida.'}
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-slate-500 mb-1.5">Arquivo de Apoio / Anexo</span>
                      {c.anexo ? (
                        <AttachmentCard url={c.anexo} title="Arquivo / Imagem da Sugestão" />
                      ) : (
                        <div className="p-3 bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 italic">
                          Nenhum arquivo anexado.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedEvent.modulo === 'Atestado' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                      <FilePlus className="w-4 h-4 text-blue-600" />
                      <span>Dados do Atestado Médico</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-white p-4 rounded-xl border border-slate-200">
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-1">Médico Emitente</span>
                        <span className="font-bold text-slate-900">{c.nomeMedico || 'Não informado'}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-1">CRM do Médico</span>
                        <span className="font-bold text-slate-900">{c.crmMedico || 'Não informado'}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-1">Início do Afastamento</span>
                        <span className="font-bold text-slate-900">
                          {c.dataAfastamento ? new Date(c.dataAfastamento + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não informado'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-1">Período de Afastamento</span>
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800">
                          {c.diasAfastamento ? `${c.diasAfastamento} dias` : 'Não informado'}
                        </span>
                      </div>
                    </div>

                    {c.motivoCid && (
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-1.5">CID / Diagnóstico Médico</span>
                        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 shadow-sm">
                          {c.motivoCid}
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="block text-xs font-semibold text-slate-500 mb-1.5">Atestado Digitalizado (Foto / Documento)</span>
                      {c.arquivoUrl ? (
                        <AttachmentCard url={c.arquivoUrl} title="Documento do Atestado Médico" />
                      ) : (
                        <div className="p-3 bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 italic">
                          Nenhum comprovante anexado.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedEvent.modulo === 'Apoio Emocional' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                      <Heart className="w-4 h-4 text-teal-600" />
                      <span>Dados do Apoio Emocional / Saúde Mental</span>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-slate-500 mb-1">Modalidade de Atendimento</span>
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100/80 border border-teal-200 text-teal-800 font-bold text-sm rounded-xl">
                        {c.tipoAuxilio === 'psicologico' ? '🧠 Atendimento Psicológico' : c.tipoAuxilio === 'psiquiatrico' ? '💊 Atendimento Psiquiátrico' : c.tipoAuxilio || 'Apoio Emocional'}
                      </span>
                    </div>

                    {c.motivoSolicitacao && (
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-1.5">Motivo da Solicitação</span>
                        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 shadow-sm">
                          {c.motivoSolicitacao}
                        </div>
                      </div>
                    )}

                    {c.descricao && (
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-1.5">Detalhamento / Relato do Colaborador</span>
                        <div className="p-4 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed shadow-sm">
                          {c.descricao}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedEvent.modulo === 'Apoio à Saúde' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span>Dados de Apoio à Saúde / Consulta</span>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-slate-500 mb-1">Especialidade / Consulta Solicitada</span>
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100/80 border border-blue-200 text-blue-800 font-bold text-sm rounded-xl">
                        🩺 {c.tipoConsulta || 'Não especificado'}
                      </span>
                    </div>

                    {c.motivo && (
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-1.5">Motivo / Queixa Principal</span>
                        <div className="p-4 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed shadow-sm">
                          {c.motivo}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedEvent.modulo === 'Segurança do Trabalho' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                      <ShieldAlert className="w-4 h-4 text-orange-600" />
                      <span>Dados de Segurança do Trabalho</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {c.categoria && (
                        <div>
                          <span className="block text-xs font-semibold text-slate-500 mb-1">Categoria de Risco / Ocorrência</span>
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100/80 border border-orange-200 text-orange-800 font-bold text-sm rounded-xl">
                            ⚠️ {c.categoria}
                          </span>
                        </div>
                      )}

                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-1">Termo de Ciência</span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${c.ciente ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {c.ciente ? '✓ Confirmado pelo Colaborador' : 'Não informado'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-slate-500 mb-1.5">Relato da Situação Observada</span>
                      <div className="p-4 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed shadow-sm">
                        {c.mensagem || c.descricao || 'Sem descrição fornecida.'}
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-slate-500 mb-1.5">Evidência / Foto do Local</span>
                      {c.anexo ? (
                        <AttachmentCard url={c.anexo} title="Evidência Fotográfica de Segurança" />
                      ) : (
                        <div className="p-3 bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 italic">
                          Nenhum arquivo ou foto anexada.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Card 3: Informações de Protocolo e Registro */}
                <div className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <span>Protocolo: <strong className="font-mono text-slate-700">{selectedEvent.id}</strong></span>
                  <span>Empresa ID: <strong className="font-mono text-slate-700">{selectedEvent.empresaId}</strong></span>
                  <span>Data de Envio: <strong className="text-slate-700">{new Date(selectedEvent.dataOriginal).toLocaleString('pt-BR')}</strong></span>
                </div>

              </div>

              {/* Rodapé do Modal com Seletor e Botão Salvar Status */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                  <span className="text-sm font-bold text-slate-700 whitespace-nowrap">Alterar Status:</span>
                  <select
                    value={statusTemp}
                    onChange={e => setStatusTemp(e.target.value)}
                    className="bg-white border border-slate-300 text-slate-800 text-sm font-semibold rounded-xl px-3.5 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm"
                  >
                    {(MODULE_STATUS_CONFIG[selectedEvent.modulo] || []).map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleSaveStatus}
                    disabled={isSaving || statusTemp === currentStatus}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
                      statusTemp !== currentStatus
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-95 cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Salvar Status
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors text-sm w-full sm:w-auto cursor-pointer"
                >
                  Fechar Detalhes
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
