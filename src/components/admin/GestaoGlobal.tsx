import React, { useState, useMemo } from 'react';
import { Company } from '../../types';
import {
  updateSugestaoStatus,
  updateDenunciaStatus,
  updateAtestadoStatus,
  updateAuxilioStatus,
  updateApoioSaudeStatus,
  updateSegurancaTrabalhoStatus,
} from '../../lib/firestoreService';
import {
  Layers,
  Search,
  Lightbulb,
  ShieldAlert,
  FilePlus,
  Heart,
  Activity,
  ShieldCheck,
  Eye,
  Download,
  Calendar,
  X,
  RefreshCw,
  Building2,
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { exportToCsv } from '../../utils/exportCsv';

interface GestaoGlobalProps {
  companies: Company[];
}

export type ModuloId = 'sugestoes' | 'denuncias' | 'atestados' | 'auxilios' | 'apoioSaude' | 'segurancaTrabalho';

export type UnifiedDemand = {
  id: string;
  empresaId: string;
  empresaNome: string;
  empresaLogo?: string;
  modulo: ModuloId;
  moduloNome: string;
  dataOriginal: string;
  status: string;
  conteudo: any;
};

const MODULOS_CONFIG: { id: ModuloId; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'sugestoes', label: 'Sugestões', icon: Lightbulb, color: 'text-amber-500 bg-amber-50' },
  { id: 'denuncias', label: 'Denúncias', icon: ShieldAlert, color: 'text-red-500 bg-red-50' },
  { id: 'atestados', label: 'Atestados', icon: FilePlus, color: 'text-blue-500 bg-blue-50' },
  { id: 'auxilios', label: 'Apoio Emocional', icon: Heart, color: 'text-teal-500 bg-teal-50' },
  { id: 'apoioSaude', label: 'Apoio à Saúde', icon: Activity, color: 'text-purple-500 bg-purple-50' },
  { id: 'segurancaTrabalho', label: 'Seg. do Trabalho', icon: ShieldCheck, color: 'text-orange-500 bg-orange-50' },
];

export function GestaoGlobal({ companies }: GestaoGlobalProps) {
  const [abaAtiva, setAbaAtiva] = useState<ModuloId>('sugestoes');
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('todos');
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const [filtroPreset, setFiltroPreset] = useState<'todos' | 'hoje' | '7dias' | '30dias' | 'custom'>('todos');
  const [dataCustomInicio, setDataCustomInicio] = useState('');
  const [dataCustomFim, setDataCustomFim] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedItem, setSelectedItem] = useState<UnifiedDemand | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Consolidação de todas as demandas
  const todasDemandas: UnifiedDemand[] = useMemo(() => {
    const list: UnifiedDemand[] = [];
    companies.forEach((c) => {
      const empresaNome = c.nomeFantasia || c.razaoSocial;
      (c.sugestoes || []).forEach((s) =>
        list.push({
          id: s.id,
          empresaId: c.id,
          empresaNome,
          empresaLogo: c.logoUrl,
          modulo: 'sugestoes',
          moduloNome: 'Sugestão',
          dataOriginal: s.criadoEm,
          status: s.status,
          conteudo: s,
        })
      );
      (c.denuncias || []).forEach((d) =>
        list.push({
          id: d.id,
          empresaId: c.id,
          empresaNome,
          empresaLogo: c.logoUrl,
          modulo: 'denuncias',
          moduloNome: 'Denúncia',
          dataOriginal: d.criadoEm,
          status: d.status,
          conteudo: d,
        })
      );
      (c.atestados || []).forEach((a) =>
        list.push({
          id: a.id,
          empresaId: c.id,
          empresaNome,
          empresaLogo: c.logoUrl,
          modulo: 'atestados',
          moduloNome: 'Atestado',
          dataOriginal: a.criadoEm,
          status: a.status,
          conteudo: a,
        })
      );
      (c.auxilios || []).forEach((aux) =>
        list.push({
          id: aux.id,
          empresaId: c.id,
          empresaNome,
          empresaLogo: c.logoUrl,
          modulo: 'auxilios',
          moduloNome: 'Apoio Emocional',
          dataOriginal: aux.criadoEm,
          status: aux.status,
          conteudo: aux,
        })
      );
      (c.apoioSaude || []).forEach((as) =>
        list.push({
          id: as.id,
          empresaId: c.id,
          empresaNome,
          empresaLogo: c.logoUrl,
          modulo: 'apoioSaude',
          moduloNome: 'Apoio à Saúde',
          dataOriginal: as.criadoEm,
          status: as.status,
          conteudo: as,
        })
      );
      (c.segurancaTrabalho || []).forEach((st) =>
        list.push({
          id: st.id,
          empresaId: c.id,
          empresaNome,
          empresaLogo: c.logoUrl,
          modulo: 'segurancaTrabalho',
          moduloNome: 'Seg. do Trabalho',
          dataOriginal: st.criadoEm,
          status: st.status,
          conteudo: st,
        })
      );
    });
    return list.sort((a, b) => new Date(b.dataOriginal).getTime() - new Date(a.dataOriginal).getTime());
  }, [companies]);

  // Contagem por aba
  const contagemPorAba = useMemo(() => {
    const map: Record<ModuloId, number> = {
      sugestoes: 0,
      denuncias: 0,
      atestados: 0,
      auxilios: 0,
      apoioSaude: 0,
      segurancaTrabalho: 0,
    };
    todasDemandas.forEach((d) => {
      if (empresaFiltro === 'todos' || d.empresaId === empresaFiltro) {
        map[d.modulo] = (map[d.modulo] || 0) + 1;
      }
    });
    return map;
  }, [todasDemandas, empresaFiltro]);

  // Filtragem da lista da aba ativa
  const demandasFiltradas = useMemo(() => {
    return todasDemandas.filter((d) => {
      if (d.modulo !== abaAtiva) return false;
      if (empresaFiltro !== 'todos' && d.empresaId !== empresaFiltro) return false;
      if (statusFiltro !== 'todos' && d.status !== statusFiltro) return false;

      // Filtro de Data
      const itemDate = new Date(d.dataOriginal);
      const now = new Date();

      if (filtroPreset === 'hoje') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (itemDate < startOfDay) return false;
      } else if (filtroPreset === '7dias') {
        const limit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (itemDate < limit) return false;
      } else if (filtroPreset === '30dias') {
        const limit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (itemDate < limit) return false;
      } else if (filtroPreset === 'custom') {
        if (dataCustomInicio) {
          const start = new Date(dataCustomInicio + 'T00:00:00');
          if (itemDate < start) return false;
        }
        if (dataCustomFim) {
          const end = new Date(dataCustomFim + 'T23:59:59');
          if (itemDate > end) return false;
        }
      }

      // Busca por texto
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        const str = JSON.stringify(d.conteudo).toLowerCase() + d.empresaNome.toLowerCase();
        if (!str.includes(lower)) return false;
      }

      return true;
    });
  }, [todasDemandas, abaAtiva, empresaFiltro, statusFiltro, filtroPreset, dataCustomInicio, dataCustomFim, searchTerm]);

  // Atualização rápida de status
  const handleQuickStatus = async (item: UnifiedDemand, novoStatus: string) => {
    setUpdatingId(item.id);
    try {
      const { empresaId, id, modulo } = item;
      if (modulo === 'sugestoes') await updateSugestaoStatus(empresaId, id, novoStatus as any);
      if (modulo === 'denuncias') await updateDenunciaStatus(empresaId, id, novoStatus as any);
      if (modulo === 'atestados') await updateAtestadoStatus(empresaId, id, novoStatus as any);
      if (modulo === 'auxilios') await updateAuxilioStatus(empresaId, id, novoStatus as any);
      if (modulo === 'apoioSaude') await updateApoioSaudeStatus(empresaId, id, novoStatus as any);
      if (modulo === 'segurancaTrabalho') await updateSegurancaTrabalhoStatus(empresaId, id, novoStatus as any);

      if (selectedItem && selectedItem.id === id) {
        setSelectedItem((prev) => (prev ? { ...prev, status: novoStatus } : null));
      }
    } catch (e) {
      console.error('Erro ao atualizar status:', e);
      alert('Falha ao atualizar o status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Exportar CSV/Excel
  const handleExport = () => {
    const data = demandasFiltradas.map((d) => {
      const c = d.conteudo;
      return {
        ID: d.id,
        Empresa: d.empresaNome,
        Módulo: d.moduloNome,
        Status: d.status,
        Data: new Date(d.dataOriginal).toLocaleString('pt-BR'),
        Nome: c.nome || c.nomeFuncionario || 'Não informado',
        Telefone: c.telefone || c.whatsapp || '',
        Setor: c.setor || '',
        Matrícula: c.matricula || '',
        Descrição: c.mensagem || c.descricao || c.motivoCid || c.tipoConsulta || '',
      };
    });
    exportToCsv(`demandas_${abaAtiva}.csv`, data);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; class: string }> = {
      nova: { label: 'Nova', class: 'bg-blue-100 text-blue-700 border-blue-200' },
      pendente: { label: 'Pendente', class: 'bg-amber-100 text-amber-700 border-amber-200' },
      em_analise: { label: 'Em Análise', class: 'bg-purple-100 text-purple-700 border-purple-200' },
      em_atendimento: { label: 'Em Atendimento', class: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
      lida: { label: 'Lida', class: 'bg-slate-100 text-slate-700 border-slate-200' },
      resolvida: { label: 'Resolvida', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      concluido: { label: 'Concluído', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      aprovado: { label: 'Aprovado', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      rejeitado: { label: 'Rejeitado', class: 'bg-red-100 text-red-700 border-red-200' },
      arquivada: { label: 'Arquivada', class: 'bg-slate-100 text-slate-500 border-slate-200' },
    };

    const cfg = map[status] || { label: status, class: 'bg-slate-100 text-slate-700' };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${cfg.class}`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <Layers className="w-6 h-6" />
            </div>
            Gestão Interna de Demandas
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Painel geral para monitoramento e gestão unificada de todas as empresas cadastradas.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          Exportar para Excel
        </button>
      </div>

      {/* Abas Principais de Módulos */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none border-b border-slate-200">
        {MODULOS_CONFIG.map((m) => {
          const Icon = m.icon;
          const isActive = abaAtiva === m.id;
          const count = contagemPorAba[m.id] || 0;

          return (
            <button
              key={m.id}
              onClick={() => {
                setAbaAtiva(m.id);
                setStatusFiltro('todos');
              }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-medium text-sm transition-all shrink-0 border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-white/20 text-white' : m.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span>{m.label}</span>
              <span
                className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Barra de Filtros Avançados */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Busca por Texto */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone, assunto ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700"
            />
          </div>

          {/* Seleção de Empresa */}
          <div className="w-full lg:w-64">
            <select
              value={empresaFiltro}
              onChange={(e) => setEmpresaFiltro(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer"
            >
              <option value="todos">🏢 Todas as Empresas ({companies.length})</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nomeFantasia || c.razaoSocial}
                </option>
              ))}
            </select>
          </div>

          {/* Seleção de Status */}
          <div className="w-full lg:w-48">
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer"
            >
              <option value="todos">Qualquer Status</option>
              <option value="nova">Novas / Pendentes</option>
              <option value="em_analise">Em Análise / Atendimento</option>
              <option value="resolvida">Resolvidas / Concluídas</option>
              <option value="aprovado">Aprovadas</option>
              <option value="rejeitado">Rejeitadas</option>
              <option value="arquivada">Arquivadas</option>
            </select>
          </div>
        </div>

        {/* Filtro de Data Integrado */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>FILTRAR POR DATA:</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600">
              <input
                type="date"
                value={dataCustomInicio}
                onChange={(e) => {
                  setDataCustomInicio(e.target.value);
                  setFiltroPreset('custom');
                }}
                className="bg-transparent outline-none cursor-pointer"
                title="Data Inicial"
              />
              <span className="text-slate-300">até</span>
              <input
                type="date"
                value={dataCustomFim}
                onChange={(e) => {
                  setDataCustomFim(e.target.value);
                  setFiltroPreset('custom');
                }}
                className="bg-transparent outline-none cursor-pointer"
                title="Data Final"
              />
            </div>

            <select
              value={filtroPreset}
              onChange={(e) => {
                setFiltroPreset(e.target.value as any);
                if (e.target.value !== 'custom') {
                  setDataCustomInicio('');
                  setDataCustomFim('');
                }
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="todos">Todo o período</option>
              <option value="hoje">Hoje</option>
              <option value="7dias">Últimos 7 dias</option>
              <option value="30dias">Últimos 30 dias</option>
              <option value="custom" disabled hidden>Período Selecionado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Demandas */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {demandasFiltradas.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-600">Nenhuma demanda encontrada</p>
            <p className="text-xs text-slate-400 mt-1">Ajuste os filtros acima para visualizar mais dados.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {demandasFiltradas.map((item) => {
              const c = item.conteudo;
              const telefone = c.telefone || c.whatsapp;
              const nome = c.nome || c.nomeFuncionario || 'Anônimo / Não informado';
              const titulo =
                c.mensagem?.slice(0, 70) ||
                c.descricao?.slice(0, 70) ||
                c.motivoCid ||
                c.tipoConsulta ||
                nome;

              const whatsappUrl = telefone
                ? `https://wa.me/55${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá ${nome}, recebemos sua solicitação de ${item.moduloNome} no sistema da empresa ${item.empresaNome}.`
                  )}`
                : null;

              return (
                <div
                  key={item.id}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Icone / Logo da Empresa */}
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                      {item.empresaLogo ? (
                        <img src={item.empresaLogo} alt={item.empresaNome} className="w-7 h-7 object-contain rounded" />
                      ) : (
                        <Building2 className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">
                          {item.empresaNome}
                        </span>
                        <span className="text-xs text-slate-400">
                          • {new Date(item.dataOriginal).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800 truncate">{titulo}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        Solicitante: <strong className="text-slate-700 font-medium">{nome}</strong>
                        {c.setor ? ` · Setor: ${c.setor}` : ''}
                        {c.tipoAuxilio ? ` · Tipo: ${c.tipoAuxilio}` : ''}
                        {c.tipoConsulta ? ` · Especialidade: ${c.tipoConsulta}` : ''}
                        {c.diasAfastamento ? ` · Afastamento: ${c.diasAfastamento} dias` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Ações Específicas na Linha */}
                  <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 flex-wrap">
                    {getStatusBadge(item.status)}

                    {/* Botão de WhatsApp direto se tiver telefone */}
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-xs font-bold transition-colors border border-green-200"
                        title="Chamar no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    )}

                    {/* Ações Rápidas de Atestado: Aprovar / Rejeitar */}
                    {item.modulo === 'atestados' && item.status === 'pendente' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuickStatus(item, 'aprovado')}
                          disabled={updatingId === item.id}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Aprovar Atestado"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleQuickStatus(item, 'rejeitado')}
                          disabled={updatingId === item.id}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Rejeitar Atestado"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedItem(item)}
                      className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      Detalhes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── MODAL DE DETALHES DA DEMANDA ──────────────────────────────────── */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedItem.empresaNome}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedItem.moduloNome} • {new Date(selectedItem.dataOriginal).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-white">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-500">STATUS ATUAL:</span>
                {getStatusBadge(selectedItem.status)}
              </div>

              {/* Campos do Objeto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(selectedItem.conteudo).map(([key, value]) => {
                  if (['id', 'criadoEm', 'status', 'empresaId', 'arquivoUrl', 'provas', 'anexo'].includes(key) || !value)
                    return null;

                  return (
                    <div key={key} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="block text-xs font-semibold text-slate-400 capitalize mb-1">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                      <span className="text-sm font-medium text-slate-800 break-words">
                        {String(value)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Botão de WhatsApp no Modal */}
              {(selectedItem.conteudo.telefone || selectedItem.conteudo.whatsapp) && (
                <a
                  href={`https://wa.me/55${(selectedItem.conteudo.telefone || selectedItem.conteudo.whatsapp).replace(
                    /\D/g,
                    ''
                  )}?text=${encodeURIComponent(
                    `Olá ${
                      selectedItem.conteudo.nome || selectedItem.conteudo.nomeFuncionario || ''
                    }, recebemos sua solicitação de ${selectedItem.moduloNome} no sistema da empresa ${
                      selectedItem.empresaNome
                    }.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-xl text-sm transition-colors border border-green-200"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chamar no WhatsApp ({(selectedItem.conteudo.telefone || selectedItem.conteudo.whatsapp)})
                </a>
              )}

              {/* Ver Documento / Anexo */}
              {(selectedItem.conteudo.arquivoUrl || selectedItem.conteudo.provas || selectedItem.conteudo.anexo) && (
                <div>
                  <button
                    onClick={() =>
                      setPreviewUrl(
                        selectedItem.conteudo.arquivoUrl ||
                          selectedItem.conteudo.provas ||
                          selectedItem.conteudo.anexo
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl text-sm transition-colors border border-blue-100"
                  >
                    <Eye className="w-4 h-4" />
                    Visualizar Documento Anexado
                  </button>
                </div>
              )}
            </div>

            {/* Footer do Modal - Alteração de Status */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-600 shrink-0">Alterar Status:</span>
                <select
                  value={selectedItem.status}
                  onChange={(e) => handleQuickStatus(selectedItem, e.target.value)}
                  disabled={updatingId === selectedItem.id}
                  className="bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto cursor-pointer"
                >
                  <option value="nova">Nova / Pendente</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="em_atendimento">Em Atendimento</option>
                  <option value="lida">Lida</option>
                  <option value="resolvida">Resolvida / Concluída</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="rejeitado">Rejeitado</option>
                  <option value="arquivada">Arquivada</option>
                </select>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors w-full sm:w-auto"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DE PREVIEW DE ARQUIVO ───────────────────────────────────── */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4 text-blue-600" />
                Visualizar Documento Anexado
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  title="Baixar arquivo"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar
                </a>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto flex-1 bg-slate-50 flex items-center justify-center min-h-[300px]">
              {previewUrl.includes('.pdf') || previewUrl.includes('application/pdf') ? (
                <iframe
                  src={previewUrl}
                  title="Documento"
                  className="w-full rounded border border-slate-200"
                  style={{ height: 'calc(90vh - 130px)' }}
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Documento anexado"
                  className="max-w-full h-auto object-contain rounded border border-slate-200 shadow-sm"
                  style={{ maxHeight: 'calc(90vh - 130px)' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement!;
                    parent.innerHTML = `<div class="text-center p-8"><p class="text-slate-500 mb-4">Não foi possível pré-visualizar este arquivo.</p><a href="${previewUrl}" target="_blank" rel="noreferrer" class="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">Abrir em nova aba</a></div>`;
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
