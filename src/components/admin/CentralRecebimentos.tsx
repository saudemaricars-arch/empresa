import { useState, useMemo } from 'react';
import { Company } from '../../types';
import { updateSugestaoStatus, updateDenunciaStatus, updateAtestadoStatus, updateAuxilioStatus, updateApoioSaudeStatus, updateSegurancaTrabalhoStatus } from '../../lib/firestoreService';
import { Search, Filter, ShieldAlert, Lightbulb, FilePlus, Heart, Inbox, Activity, X } from 'lucide-react';
import { exportToCsv } from '../../utils/exportCsv';

interface CentralRecebimentosProps {
  companies: Company[];
}

export type UnifiedEvent = {
  id: string;
  empresaId: string;
  empresaNome: string;
  modulo: 'Sugestão' | 'Denúncia' | 'Atestado' | 'Apoio Emocional' | 'Apoio à Saúde' | 'Segurança do Trabalho';
  dataOriginal: string; // ISO string
  status: string;
  conteudoOriginal: any;
};

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
  const [filterEmpresa, setFilterEmpresa] = useState<string>('all');
  const [filterModulo, setFilterModulo] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedEvent, setSelectedEvent] = useState<UnifiedEvent | null>(null);

  const eventos: UnifiedEvent[] = useMemo(() => {
    const list: UnifiedEvent[] = [];
    companies.forEach(c => {
      (c.sugestoes || []).forEach(s => list.push({
        id: s.id, empresaId: c.id, empresaNome: c.nomeFantasia || c.razaoSocial,
        modulo: 'Sugestão', dataOriginal: s.criadoEm, status: s.status, conteudoOriginal: s
      }));
      (c.denuncias || []).forEach(d => list.push({
        id: d.id, empresaId: c.id, empresaNome: c.nomeFantasia || c.razaoSocial,
        modulo: 'Denúncia', dataOriginal: d.criadoEm, status: d.status, conteudoOriginal: d
      }));
      (c.atestados || []).forEach(a => list.push({
        id: a.id, empresaId: c.id, empresaNome: c.nomeFantasia || c.razaoSocial,
        modulo: 'Atestado', dataOriginal: a.criadoEm, status: a.status, conteudoOriginal: a
      }));
      (c.auxilios || []).forEach(aux => list.push({
        id: aux.id, empresaId: c.id, empresaNome: c.nomeFantasia || c.razaoSocial,
        modulo: 'Apoio Emocional', dataOriginal: aux.criadoEm, status: aux.status, conteudoOriginal: aux
      }));
      (c.apoioSaude || []).forEach(as => list.push({
        id: as.id, empresaId: c.id, empresaNome: c.nomeFantasia || c.razaoSocial,
        modulo: 'Apoio à Saúde', dataOriginal: as.criadoEm, status: as.status, conteudoOriginal: as
      }));
      (c.segurancaTrabalho || []).forEach(st => list.push({
        id: st.id, empresaId: c.id, empresaNome: c.nomeFantasia || c.razaoSocial,
        modulo: 'Segurança do Trabalho', dataOriginal: st.criadoEm, status: st.status, conteudoOriginal: st
      }));
    });
    return list.sort((a, b) => new Date(b.dataOriginal).getTime() - new Date(a.dataOriginal).getTime());
  }, [companies]);

  const filteredEvents = useMemo(() => {
    return eventos.filter(e => {
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
        const str = JSON.stringify(e.conteudoOriginal).toLowerCase() + e.empresaNome.toLowerCase();
        if (!str.includes(lower)) return false;
      }
      return true;
    });
  }, [eventos, filterEmpresa, filterModulo, filterStatus, searchTerm, dataInicio, dataFim]);

  const handleExport = () => {
    const data = filteredEvents.map(e => {
      const c = e.conteudoOriginal;
      return {
        'Data de Recebimento': new Date(e.dataOriginal).toLocaleString('pt-BR'),
        'Empresa': e.empresaNome,
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

  const handleStatusUpdate = async (novoStatus: string) => {
    if (!selectedEvent) return;
    try {
      if (selectedEvent.modulo === 'Sugestão') await updateSugestaoStatus(selectedEvent.empresaId, selectedEvent.id, novoStatus as any);
      else if (selectedEvent.modulo === 'Denúncia') await updateDenunciaStatus(selectedEvent.empresaId, selectedEvent.id, novoStatus as any);
      else if (selectedEvent.modulo === 'Atestado') await updateAtestadoStatus(selectedEvent.empresaId, selectedEvent.id, novoStatus as any);
      else if (selectedEvent.modulo === 'Apoio Emocional') await updateAuxilioStatus(selectedEvent.empresaId, selectedEvent.id, novoStatus as any);
      else if (selectedEvent.modulo === 'Apoio à Saúde') await updateApoioSaudeStatus(selectedEvent.empresaId, selectedEvent.id, novoStatus as any);
      else if (selectedEvent.modulo === 'Segurança do Trabalho') await updateSegurancaTrabalhoStatus(selectedEvent.empresaId, selectedEvent.id, novoStatus as any);
      
      setSelectedEvent(prev => prev ? { ...prev, status: novoStatus } : null);
    } catch (e) {
      alert("Erro ao atualizar status.");
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm w-full">
            <span className="text-slate-400 font-medium">De:</span>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="bg-transparent focus:outline-none text-slate-700 w-full" />
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm w-full">
            <span className="text-slate-400 font-medium">Até:</span>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="bg-transparent focus:outline-none text-slate-700 w-full" />
          </div>
          
          <select value={filterEmpresa} onChange={e => setFilterEmpresa(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-700">
            <option value="all">Todas as Empresas</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.nomeFantasia || c.razaoSocial}</option>)}
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
                  <td className="p-4 text-sm font-medium text-slate-900">{e.empresaNome}</td>
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

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-200">
                  {getModuleIcon(selectedEvent.modulo)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedEvent.modulo}</h3>
                  <p className="text-xs text-slate-500">{selectedEvent.empresaNome} • {new Date(selectedEvent.dataOriginal).toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                {Object.entries(selectedEvent.conteudoOriginal).map(([key, value]) => {
                  if (['id', 'criadoEm', 'status', 'empresaId'].includes(key) || !value) return null;
                  
                  if (key === 'anexo' || key === 'arquivoUrl' || key === 'provas') {
                    return (
                      <div key={key} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{key}</span>
                        <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium break-all">
                          Ver arquivo anexo
                        </a>
                      </div>
                    );
                  }

                  return (
                    <div key={key} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{key}</span>
                      <span className="text-sm text-slate-800 whitespace-pre-wrap">{String(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-sm font-semibold text-slate-700">Alterar Status:</span>
                <select 
                  value={selectedEvent.status} 
                  onChange={e => handleStatusUpdate(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                >
                  <optgroup label="Aberto">
                    <option value="nova">Nova</option>
                    <option value="pendente">Pendente</option>
                  </optgroup>
                  <optgroup label="Em Andamento">
                    <option value="em_analise">Em Análise</option>
                    <option value="em_atendimento">Em Atendimento</option>
                    <option value="lida">Lida</option>
                  </optgroup>
                  <optgroup label="Concluído">
                    <option value="resolvida">Resolvida</option>
                    <option value="concluido">Concluído</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="rejeitado">Rejeitado</option>
                    <option value="respondida">Respondida</option>
                    <option value="arquivada">Arquivada</option>
                  </optgroup>
                </select>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="px-5 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 w-full sm:w-auto text-center">
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
