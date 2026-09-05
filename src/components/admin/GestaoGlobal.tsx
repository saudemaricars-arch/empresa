import React, { useState, useMemo } from 'react';
import { Company, TipoGestao, TIPOS_GESTAO } from '../../types';
import {
  salvarTratativaDemanda,
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
  Building2,
  MessageCircle,
  CheckCircle,
  XCircle,
  Tag,
  AlertCircle,
  Check,
  Edit3,
  FileText,
  User,
  Phone,
  Mail,
  Stethoscope,
  Clock,
  Sparkles,
  ExternalLink,
  ZoomIn,
  CheckSquare,
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
  empresaTag?: TipoGestao;
  modulo: ModuloId;
  moduloNome: string;
  dataOriginal: string;
  status: string;
  resposta?: string;
  respondidoEm?: string;
  observacaoInterna?: string;
  respondidoPor?: string;
  conteudo: any;
};

const MODULOS_CONFIG: { id: ModuloId; label: string; icon: React.ElementType; color: string; badgeColor: string }[] = [
  { id: 'sugestoes', label: 'Sugestões', icon: Lightbulb, color: 'text-amber-500 bg-amber-50', badgeColor: 'bg-amber-100 text-amber-800' },
  { id: 'denuncias', label: 'Denúncias', icon: ShieldAlert, color: 'text-red-500 bg-red-50', badgeColor: 'bg-red-100 text-red-800' },
  { id: 'atestados', label: 'Atestados', icon: FilePlus, color: 'text-blue-500 bg-blue-50', badgeColor: 'bg-blue-100 text-blue-800' },
  { id: 'auxilios', label: 'Apoio Emocional', icon: Heart, color: 'text-teal-500 bg-teal-50', badgeColor: 'bg-teal-100 text-teal-800' },
  { id: 'apoioSaude', label: 'Apoio à Saúde', icon: Activity, color: 'text-purple-500 bg-purple-50', badgeColor: 'bg-purple-100 text-purple-800' },
  { id: 'segurancaTrabalho', label: 'Seg. do Trabalho', icon: ShieldCheck, color: 'text-orange-500 bg-orange-50', badgeColor: 'bg-orange-100 text-orange-800' },
];

export function GestaoGlobal({ companies }: GestaoGlobalProps) {
  const [abaAtiva, setAbaAtiva] = useState<ModuloId>('sugestoes');
  const [tagFiltro, setTagFiltro] = useState<string>('todos');
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('todos');
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const [filtroPreset, setFiltroPreset] = useState<'todos' | 'hoje' | '7dias' | '30dias' | 'custom'>('todos');
  const [dataCustomInicio, setDataCustomInicio] = useState('');
  const [dataCustomFim, setDataCustomFim] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Overrides locais para feedback instantâneo sem depender de latência de snapshot
  const [tratativasOverrides, setTratativasOverrides] = useState<
    Record<
      string,
      {
        status: string;
        resposta?: string;
        observacaoInterna?: string;
        respondidoEm?: string;
        respondidoPor?: string;
      }
    >
  >({});

  // Demandas selecionada para tratativa no Modal
  const [selectedItem, setSelectedItem] = useState<UnifiedDemand | null>(null);
  const [modalStatus, setModalStatus] = useState<string>('');
  const [modalResposta, setModalResposta] = useState<string>('');
  const [modalObservacao, setModalObservacao] = useState<string>('');
  const [isSavingTratativa, setIsSavingTratativa] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [updatingQuickId, setUpdatingQuickId] = useState<string | null>(null);

  // Consolidação de todas as demandas com mesclagem dos overrides
  const todasDemandas: UnifiedDemand[] = useMemo(() => {
    const list: UnifiedDemand[] = [];
    companies.forEach((c) => {
      const empresaNome = c.nomeFantasia || c.razaoSocial;

      (c.sugestoes || []).forEach((s) => {
        const ov = tratativasOverrides[`${c.id}_${s.id}`];
        list.push({
          id: s.id,
          empresaId: c.id,
          empresaNome,
          empresaLogo: c.logoUrl,
          empresaTag: c.tipoGestao,
          modulo: 'sugestoes',
          moduloNome: 'Sugestão',
          dataOriginal: s.criadoEm,
          status: ov?.status || s.status,
          resposta: ov?.resposta !== undefined ? ov.resposta : s.resposta,
          respondidoEm: ov?.respondidoEm !== undefined ? ov.respondidoEm : s.respondidoEm,
          observacaoInterna: ov?.observacaoInterna !== undefined ? ov.observacaoInterna : s.observacaoInterna,
          respondidoPor: ov?.respondidoPor !== undefined ? ov.respondidoPor : s.respondidoPor,
          conteudo: s,
        });
      });

      (c.denuncias || []).forEach((d) => {
        const ov = tratativasOverrides[`${c.id}_${d.id}`];
        list.push({
          id: d.id,
          empresaId: c.id,
          empresaNome,
          empresaLogo: c.logoUrl,
          empresaTag: c.tipoGestao,
          modulo: 'denuncias',
          moduloNome: 'Denúncia',
          dataOriginal: d.criadoEm,
          status: ov?.status || d.status,
          resposta: ov?.resposta !== undefined ? ov.resposta : d.resposta,
          respondidoEm: ov?.respondidoEm !== undefined ? ov.respondidoEm : d.respondidoEm,
          observacaoInterna: ov?.observacaoInterna !== undefined ? ov.observacaoInterna : d.observacaoInterna,
          respondidoPor: ov?.respondidoPor !== undefined ? ov.respondidoPor : d.respondidoPor,
          conteudo: d,
        });
      });

      (c.atestados || []).forEach((a) => {
        const ov = tratativasOverrides[`${c.id}_${a.id}`];
        list.push({
          id: a.id,
          empresaId: c.id,
          empresaNome,
          empresaLogo: c.logoUrl,
          empresaTag: c.tipoGestao,
          modulo: 'atestados',
          moduloNome: 'Atestado',
          dataOriginal: a.criadoEm,
          status: ov?.status || a.status,
          resposta: ov?.resposta !== undefined ? ov.resposta : a.resposta,
          respondidoEm: ov?.respondidoEm !== undefined ? ov.respondidoEm : a.respondidoEm,
          observacaoInterna: ov?.observacaoInterna !== undefined ? ov.observacaoInterna : a.observacaoInterna,
          respondidoPor: ov?.respondidoPor !== undefined ? ov.respondidoPor : a.respondidoPor,
          conteudo: a,
        });
      });

      (c.auxilios || []).forEach((aux) => {
        const ov = tratativasOverrides[`${c.id}_${aux.id}`];
        list.push({
          id: aux.id,
          empresaId: c.id,
          empresaNome,
          empresaLogo: c.logoUrl,
          empresaTag: c.tipoGestao,
          modulo: 'auxilios',
          moduloNome: 'Apoio Emocional',
          dataOriginal: aux.criadoEm,
          status: ov?.status || aux.status,
          resposta: ov?.resposta !== undefined ? ov.resposta : aux.resposta,
          respondidoEm: ov?.respondidoEm !== undefined ? ov.respondidoEm : aux.respondidoEm,
          observacaoInterna: ov?.observacaoInterna !== undefined ? ov.observacaoInterna : aux.observacaoInterna,
          respondidoPor: ov?.respondidoPor !== undefined ? ov.respondidoPor : aux.respondidoPor,
          conteudo: aux,
        });
      });

      (c.apoioSaude || []).forEach((as) => {
        const ov = tratativasOverrides[`${c.id}_${as.id}`];
        list.push({
          id: as.id,
          empresaId: c.id,
          empresaNome,
          empresaLogo: c.logoUrl,
          empresaTag: c.tipoGestao,
          modulo: 'apoioSaude',
          moduloNome: 'Apoio à Saúde',
          dataOriginal: as.criadoEm,
          status: ov?.status || as.status,
          resposta: ov?.resposta !== undefined ? ov.resposta : as.resposta,
          respondidoEm: ov?.respondidoEm !== undefined ? ov.respondidoEm : as.respondidoEm,
          observacaoInterna: ov?.observacaoInterna !== undefined ? ov.observacaoInterna : as.observacaoInterna,
          respondidoPor: ov?.respondidoPor !== undefined ? ov.respondidoPor : as.respondidoPor,
          conteudo: as,
        });
      });

      (c.segurancaTrabalho || []).forEach((st) => {
        const ov = tratativasOverrides[`${c.id}_${st.id}`];
        list.push({
          id: st.id,
          empresaId: c.id,
          empresaNome,
          empresaLogo: c.logoUrl,
          empresaTag: c.tipoGestao,
          modulo: 'segurancaTrabalho',
          moduloNome: 'Seg. do Trabalho',
          dataOriginal: st.criadoEm,
          status: ov?.status || st.status,
          resposta: ov?.resposta !== undefined ? ov.resposta : st.resposta,
          respondidoEm: ov?.respondidoEm !== undefined ? ov.respondidoEm : st.respondidoEm,
          observacaoInterna: ov?.observacaoInterna !== undefined ? ov.observacaoInterna : st.observacaoInterna,
          respondidoPor: ov?.respondidoPor !== undefined ? ov.respondidoPor : st.respondidoPor,
          conteudo: st,
        });
      });
    });
    return list.sort((a, b) => new Date(b.dataOriginal).getTime() - new Date(a.dataOriginal).getTime());
  }, [companies, tratativasOverrides]);

  // Contagem de demandas por TAG (para badges nos botões de filtro)
  const contagemPorTag = useMemo(() => {
    const counts: Record<string, number> = {
      todos: todasDemandas.length,
      gerenciada_multimed: 0,
      cliente_nao_gerenciada: 0,
      plataforma_propria: 0,
      sem_tag: 0,
    };
    todasDemandas.forEach((d) => {
      if (!d.empresaTag) {
        counts.sem_tag = (counts.sem_tag || 0) + 1;
      } else if (counts[d.empresaTag] !== undefined) {
        counts[d.empresaTag] = (counts[d.empresaTag] || 0) + 1;
      }
    });
    return counts;
  }, [todasDemandas]);

  // Lista de empresas filtrada pela TAG selecionada
  const empresasDisponiveis = useMemo(() => {
    if (tagFiltro === 'todos') return companies;
    if (tagFiltro === 'sem_tag') return companies.filter((c) => !c.tipoGestao);
    return companies.filter((c) => c.tipoGestao === tagFiltro);
  }, [companies, tagFiltro]);

  // Verifica se uma demanda foi tratada
  const isTratada = (d: UnifiedDemand): boolean => {
    if (Boolean(d.resposta?.trim())) return true;
    return ['resolvida', 'concluido', 'aprovado', 'respondida', 'rejeitado', 'arquivada'].includes(d.status);
  };

  // Contagem por aba respeitando o filtro de TAG e empresa
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
      if (tagFiltro !== 'todos') {
        if (tagFiltro === 'sem_tag' && d.empresaTag) return;
        if (tagFiltro !== 'sem_tag' && d.empresaTag !== tagFiltro) return;
      }
      if (empresaFiltro === 'todos' || d.empresaId === empresaFiltro) {
        map[d.modulo] = (map[d.modulo] || 0) + 1;
      }
    });
    return map;
  }, [todasDemandas, tagFiltro, empresaFiltro]);

  // Filtragem da lista da aba ativa
  const demandasFiltradas = useMemo(() => {
    return todasDemandas.filter((d) => {
      if (d.modulo !== abaAtiva) return false;

      // Filtro de TAG
      if (tagFiltro !== 'todos') {
        if (tagFiltro === 'sem_tag' && d.empresaTag) return false;
        if (tagFiltro !== 'sem_tag' && d.empresaTag !== tagFiltro) return false;
      }

      // Filtro de Empresa
      if (empresaFiltro !== 'todos' && d.empresaId !== empresaFiltro) return false;

      // Filtro de Status
      if (statusFiltro === 'pendentes') {
        if (isTratada(d)) return false;
      } else if (statusFiltro === 'tratadas') {
        if (!isTratada(d)) return false;
      } else if (statusFiltro !== 'todos') {
        if (d.status !== statusFiltro) return false;
      }

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
        const tagLabel = d.empresaTag && TIPOS_GESTAO[d.empresaTag] ? TIPOS_GESTAO[d.empresaTag].label.toLowerCase() : '';
        const respostaStr = (d.resposta || '') + ' ' + (d.observacaoInterna || '');
        const str = (
          JSON.stringify(d.conteudo) +
          ' ' +
          d.empresaNome +
          ' ' +
          tagLabel +
          ' ' +
          respostaStr
        ).toLowerCase();
        if (!str.includes(lower)) return false;
      }

      return true;
    });
  }, [
    todasDemandas,
    abaAtiva,
    tagFiltro,
    empresaFiltro,
    statusFiltro,
    filtroPreset,
    dataCustomInicio,
    dataCustomFim,
    searchTerm,
  ]);

  // Contagens para os cards de estatísticas rápidas
  const statsGerais = useMemo(() => {
    let pendentes = 0;
    let tratadas = 0;
    demandasFiltradas.forEach((d) => {
      if (isTratada(d)) tratadas++;
      else pendentes++;
    });
    return {
      total: demandasFiltradas.length,
      pendentes,
      tratadas,
    };
  }, [demandasFiltradas]);

  // Abertura do Modal de Detalhes e Tratativa
  const abrirTratativa = (item: UnifiedDemand) => {
    setSelectedItem(item);
    setModalStatus(item.status);
    setModalResposta(item.resposta || '');
    setModalObservacao(item.observacaoInterna || '');
    setSaveSuccess(false);
  };

  // Salvar Tratativa e Status
  const handleSalvarTratativa = async () => {
    if (!selectedItem) return;
    setIsSavingTratativa(true);
    try {
      const nowIso = new Date().toISOString();
      await salvarTratativaDemanda(selectedItem.empresaId, selectedItem.modulo, selectedItem.id, {
        status: modalStatus,
        resposta: modalResposta.trim() || undefined,
        observacaoInterna: modalObservacao.trim() || undefined,
        respondidoPor: 'Gestão Multimed',
        respondidoEm: nowIso,
      });

      // Atualiza override em memória para sincronização instantânea na tela
      const key = `${selectedItem.empresaId}_${selectedItem.id}`;
      setTratativasOverrides((prev) => ({
        ...prev,
        [key]: {
          status: modalStatus,
          resposta: modalResposta.trim() || undefined,
          observacaoInterna: modalObservacao.trim() || undefined,
          respondidoPor: 'Gestão Multimed',
          respondidoEm: nowIso,
        },
      }));

      // Atualiza o item selecionado
      setSelectedItem((prev) =>
        prev
          ? {
              ...prev,
              status: modalStatus,
              resposta: modalResposta.trim() || undefined,
              observacaoInterna: modalObservacao.trim() || undefined,
              respondidoPor: 'Gestão Multimed',
              respondidoEm: nowIso,
            }
          : null
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Erro ao salvar tratativa:', e);
      alert('Falha ao salvar a tratativa. Verifique a conexão e tente novamente.');
    } finally {
      setIsSavingTratativa(false);
    }
  };

  // Atualização rápida de status na listagem
  const handleQuickStatus = async (item: UnifiedDemand, novoStatus: string) => {
    setUpdatingQuickId(item.id);
    try {
      const { empresaId, id, modulo } = item;
      if (modulo === 'sugestoes') await updateSugestaoStatus(empresaId, id, novoStatus as any);
      else if (modulo === 'denuncias') await updateDenunciaStatus(empresaId, id, novoStatus as any);
      else if (modulo === 'atestados') await updateAtestadoStatus(empresaId, id, novoStatus as any);
      else if (modulo === 'auxilios') await updateAuxilioStatus(empresaId, id, novoStatus as any);
      else if (modulo === 'apoioSaude') await updateApoioSaudeStatus(empresaId, id, novoStatus as any);
      else if (modulo === 'segurancaTrabalho') await updateSegurancaTrabalhoStatus(empresaId, id, novoStatus as any);

      const key = `${empresaId}_${id}`;
      setTratativasOverrides((prev) => ({
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          status: novoStatus,
        },
      }));

      if (selectedItem && selectedItem.id === id) {
        setSelectedItem((prev) => (prev ? { ...prev, status: novoStatus } : null));
        setModalStatus(novoStatus);
      }
    } catch (e) {
      console.error('Erro ao atualizar status rápido:', e);
      alert('Falha ao atualizar o status.');
    } finally {
      setUpdatingQuickId(null);
    }
  };

  // Exportar para Excel / CSV
  const handleExport = () => {
    const data = demandasFiltradas.map((d) => {
      const c = d.conteudo;
      return {
        ID: d.id,
        Empresa: d.empresaNome,
        'TAG / Tipo de Gestão': d.empresaTag && TIPOS_GESTAO[d.empresaTag] ? TIPOS_GESTAO[d.empresaTag].label : 'Sem TAG',
        Módulo: d.moduloNome,
        Status: d.status,
        Tratada: isTratada(d) ? 'Sim' : 'Pendente',
        'Resposta / Parecer': d.resposta || '',
        'Observação Interna': d.observacaoInterna || '',
        'Tratado Por': d.respondidoPor || '',
        'Data da Tratativa': d.respondidoEm ? new Date(d.respondidoEm).toLocaleString('pt-BR') : '',
        'Data da Demanda': new Date(d.dataOriginal).toLocaleString('pt-BR'),
        Nome: c.nome || c.nomeFuncionario || 'Não informado',
        Telefone: c.telefone || c.whatsapp || '',
        Email: c.email || '',
        Setor: c.setor || '',
        Matrícula: c.matricula || '',
        Descrição: c.mensagem || c.descricao || c.motivoCid || c.tipoConsulta || '',
      };
    });
    exportToCsv(`demandas_${abaAtiva}_${tagFiltro}.csv`, data);
  };

  // Status badges visuais
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
      respondida: { label: 'Respondida', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      rejeitado: { label: 'Rejeitado', class: 'bg-rose-100 text-rose-700 border-rose-200' },
      arquivada: { label: 'Arquivada', class: 'bg-slate-100 text-slate-500 border-slate-200' },
    };

    const cfg = map[status] || { label: status, class: 'bg-slate-100 text-slate-700 border-slate-200' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${cfg.class}`}>
        {cfg.label}
      </span>
    );
  };

  // Opções válidas de status por módulo
  const getStatusOptionsForModulo = (modulo: ModuloId) => {
    switch (modulo) {
      case 'denuncias':
        return [
          { value: 'nova', label: 'Nova Denúncia' },
          { value: 'em_analise', label: 'Em Análise / Investigação' },
          { value: 'resolvida', label: 'Resolvida / Finalizada' },
          { value: 'arquivada', label: 'Arquivada' },
        ];
      case 'sugestoes':
        return [
          { value: 'nova', label: 'Nova Sugestão' },
          { value: 'lida', label: 'Lida / Em Avaliação' },
          { value: 'respondida', label: 'Respondida / Tratada' },
        ];
      case 'atestados':
        return [
          { value: 'pendente', label: 'Pendente de Homologação' },
          { value: 'aprovado', label: 'Aprovado / Homologado' },
          { value: 'rejeitado', label: 'Rejeitado / Inconsistente' },
        ];
      case 'auxilios':
        return [
          { value: 'pendente', label: 'Pendente de Agendamento' },
          { value: 'em_atendimento', label: 'Em Atendimento / Acolhimento' },
          { value: 'concluido', label: 'Concluído / Encaminhado' },
        ];
      case 'apoioSaude':
        return [
          { value: 'pendente', label: 'Pendente de Triagem' },
          { value: 'em_atendimento', label: 'Em Atendimento / Consulta Agendada' },
          { value: 'concluido', label: 'Concluído / Realizado' },
        ];
      case 'segurancaTrabalho':
        return [
          { value: 'nova', label: 'Novo Chamado de Risco' },
          { value: 'em_analise', label: 'Em Vistoria / Análise Técnica' },
          { value: 'resolvida', label: 'Medida Corretiva Aplicada (Resolvida)' },
        ];
      default:
        return [
          { value: 'nova', label: 'Nova' },
          { value: 'em_analise', label: 'Em Análise' },
          { value: 'resolvida', label: 'Resolvida' },
        ];
    }
  };

  // Helper para verificar se um anexo é imagem para preview direto
  const isImageAttachment = (url?: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    if (lower.startsWith('data:image/')) return true;
    if (lower.includes('.pdf') || lower.includes('application/pdf')) return false;
    return (
      lower.includes('.jpg') ||
      lower.includes('.jpeg') ||
      lower.includes('.png') ||
      lower.includes('.webp') ||
      lower.includes('.gif') ||
      lower.includes('firebasestorage.googleapis.com')
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <Layers className="w-6 h-6" />
            </div>
            Gestão Interna de Demandas & Tratativas
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Mesa de operações para monitorar, responder, alterar status e dar tratativas diretas em todas as empresas gerenciadas.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-emerald-600/20 shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Exportar para Excel
        </button>
      </div>

      {/* ─── BARRA DE FILTRO POR TAG (PADRÃO BRANCO CLEAN) ───────────────────── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 mb-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              FILTRAR POR TAG / MODELO DE GESTÃO:
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Mostrando demandas de:{' '}
            <strong className="text-blue-600 font-bold">
              {tagFiltro === 'todos'
                ? 'Todas as Empresas'
                : tagFiltro === 'sem_tag'
                ? 'Sem TAG'
                : TIPOS_GESTAO[tagFiltro as TipoGestao]?.label || tagFiltro}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-wrap">
          {/* Todas as TAGs */}
          <button
            onClick={() => {
              setTagFiltro('todos');
              setEmpresaFiltro('todos');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              tagFiltro === 'todos'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <span>🏷️ Todas as Empresas</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                tagFiltro === 'todos' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {contagemPorTag.todos}
            </span>
          </button>

          {/* Empresas Gerenciadas pela Multimed */}
          <button
            onClick={() => {
              setTagFiltro('gerenciada_multimed');
              setEmpresaFiltro('todos');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              tagFiltro === 'gerenciada_multimed'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/25 ring-2 ring-emerald-200'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border-emerald-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                tagFiltro === 'gerenciada_multimed' ? 'bg-white' : 'bg-emerald-500'
              }`}
            />
            <span>🟢 Gestão Multimed</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                tagFiltro === 'gerenciada_multimed'
                  ? 'bg-white/25 text-white'
                  : 'bg-emerald-200/70 text-emerald-800'
              }`}
            >
              {contagemPorTag.gerenciada_multimed || 0}
            </span>
          </button>

          {/* Cliente Multimed (Não Gerenciada) */}
          <button
            onClick={() => {
              setTagFiltro('cliente_nao_gerenciada');
              setEmpresaFiltro('todos');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              tagFiltro === 'cliente_nao_gerenciada'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/25 ring-2 ring-blue-200'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100/80 border-blue-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                tagFiltro === 'cliente_nao_gerenciada' ? 'bg-white' : 'bg-blue-500'
              }`}
            />
            <span>🔵 Cliente Multimed</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                tagFiltro === 'cliente_nao_gerenciada'
                  ? 'bg-white/25 text-white'
                  : 'bg-blue-200/70 text-blue-800'
              }`}
            >
              {contagemPorTag.cliente_nao_gerenciada || 0}
            </span>
          </button>

          {/* Plataforma Própria */}
          <button
            onClick={() => {
              setTagFiltro('plataforma_propria');
              setEmpresaFiltro('todos');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              tagFiltro === 'plataforma_propria'
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-600/25 ring-2 ring-purple-200'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100/80 border-purple-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                tagFiltro === 'plataforma_propria' ? 'bg-white' : 'bg-purple-500'
              }`}
            />
            <span>🟣 Plataforma Própria</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                tagFiltro === 'plataforma_propria'
                  ? 'bg-white/25 text-white'
                  : 'bg-purple-200/70 text-purple-800'
              }`}
            >
              {contagemPorTag.plataforma_propria || 0}
            </span>
          </button>

          {/* Sem TAG */}
          <button
            onClick={() => {
              setTagFiltro('sem_tag');
              setEmpresaFiltro('todos');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              tagFiltro === 'sem_tag'
                ? 'bg-slate-700 text-white border-slate-700 shadow-sm ring-2 ring-slate-300'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <span>⚪ Sem TAG</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                tagFiltro === 'sem_tag' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {contagemPorTag.sem_tag || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Mini Cards de Resumo Operacional */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total no Filtro</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{statsGerais.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Aguardando Tratativa
            </span>
            <p className="text-xl font-extrabold text-amber-700 mt-0.5">{statsGerais.pendentes}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Demandas Tratadas
            </span>
            <p className="text-xl font-extrabold text-emerald-700 mt-0.5">{statsGerais.tratadas}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Check className="w-5 h-5" />
          </div>
        </div>
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
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-medium text-sm transition-all shrink-0 border cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20 font-semibold'
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

      {/* Barra de Filtros Refinados */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Busca por Texto */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por colaborador, telefone, assunto, resposta ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700"
            />
          </div>

          {/* Seleção de TAG (Select sincronizado) */}
          <div className="w-full lg:w-56">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-blue-500">
              <Tag className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={tagFiltro}
                onChange={(e) => {
                  setTagFiltro(e.target.value);
                  setEmpresaFiltro('todos');
                }}
                className="w-full bg-transparent focus:outline-none text-slate-700 font-medium cursor-pointer text-xs"
              >
                <option value="todos">🏷️ Todas as TAGs</option>
                {Object.entries(TIPOS_GESTAO).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
                <option value="sem_tag">Sem TAG Definida</option>
              </select>
            </div>
          </div>

          {/* Seleção de Empresa (Cascata com a TAG) */}
          <div className="w-full lg:w-64">
            <select
              value={empresaFiltro}
              onChange={(e) => setEmpresaFiltro(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer"
            >
              <option value="todos">🏢 Todas as Empresas ({empresasDisponiveis.length})</option>
              {empresasDisponiveis.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nomeFantasia || c.razaoSocial}
                </option>
              ))}
            </select>
          </div>

          {/* Seleção de Status / Tratativa */}
          <div className="w-full lg:w-52">
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer"
            >
              <option value="todos">Qualquer Status</option>
              <option value="pendentes">⚠️ Aguardando Tratativa</option>
              <option value="tratadas">✅ Já Tratadas / Respondidas</option>
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
            <span>FILTRAR POR DATA DA DEMANDA:</span>
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
              <option value="custom" disabled hidden>
                Período Selecionado
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── LISTA DE DEMANDAS COM GESTÃO DIRETA ───────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {demandasFiltradas.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-600">Nenhuma demanda encontrada neste filtro</p>
            <p className="text-xs text-slate-400 mt-1">Ajuste os filtros de TAG, Empresa ou Status acima para visualizar mais dados.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {demandasFiltradas.map((item) => {
              const c = item.conteudo;
              const telefone = c.telefone || c.whatsapp;
              const nome = c.nome || c.nomeFuncionario || 'Anônimo / Não informado';
              const titulo =
                c.mensagem?.slice(0, 90) ||
                c.descricao?.slice(0, 90) ||
                c.motivoCid ||
                c.tipoConsulta ||
                nome;

              const tratada = isTratada(item);

              const rawPhone = String(telefone || '').trim();
              const phoneDigits = rawPhone.replace(/\D/g, '');
              const hasValidPhone = phoneDigits.length >= 8;

              const whatsappUrl = hasValidPhone
                ? `https://wa.me/55${phoneDigits}?text=${encodeURIComponent(
                    `Olá ${nome}, aqui é da equipe Multimed responsável pela gestão de demandas da empresa ${item.empresaNome}. Estamos entrando em contato a respeito da sua solicitação de ${item.moduloNome}.`
                  )}`
                : null;

              return (
                <div
                  key={item.id}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col gap-3"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Dados Principais */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      {/* Logo da Empresa */}
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                        {item.empresaLogo ? (
                          <img src={item.empresaLogo} alt={item.empresaNome} className="w-8 h-8 object-contain rounded" />
                        ) : (
                          <Building2 className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Linha de Metadados: Empresa, TAG, Data e Status de Tratativa */}
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            {item.empresaNome}
                          </span>

                          {/* TAG da Empresa */}
                          {item.empresaTag && TIPOS_GESTAO[item.empresaTag] ? (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${TIPOS_GESTAO[item.empresaTag].bgClass} ${TIPOS_GESTAO[item.empresaTag].borderClass} ${TIPOS_GESTAO[item.empresaTag].textClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${TIPOS_GESTAO[item.empresaTag].dotClass}`} />
                              {TIPOS_GESTAO[item.empresaTag].badgeLabel}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                              Sem TAG
                            </span>
                          )}

                          <span className="text-xs text-slate-400">
                            • {new Date(item.dataOriginal).toLocaleString('pt-BR')}
                          </span>

                          {/* Badge de Tratativa */}
                          {tratada ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              Tratada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                              <AlertCircle className="w-3 h-3" />
                              Aguardando Tratativa
                            </span>
                          )}
                        </div>

                        {/* Conteúdo / Título */}
                        <h3 className="text-sm font-semibold text-slate-800 break-words line-clamp-2">
                          {titulo}
                        </h3>

                        {/* Detalhes do Solicitante e Módulo */}
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mt-1">
                          <span>
                            Solicitante: <strong className="text-slate-700 font-medium">{nome}</strong>
                          </span>
                          {telefone && <span>• Tel: {telefone}</span>}
                          {c.setor && <span>• Setor: {c.setor}</span>}
                          {c.matricula && <span>• Matrícula: {c.matricula}</span>}
                          {c.nomeMedico && <span>• Médico: {c.nomeMedico} (CRM: {c.crmMedico})</span>}
                          {c.diasAfastamento && <span>• Afastamento: {c.diasAfastamento} dias</span>}
                          {c.tipoAuxilio && <span>• Auxílio: {c.tipoAuxilio}</span>}
                          {c.tipoConsulta && <span>• Especialidade: {c.tipoConsulta}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Ações e Status na Linha */}
                    <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 flex-wrap">
                      {getStatusBadge(item.status)}

                      {/* Botão de WhatsApp direto se tiver telefone */}
                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors border border-emerald-200"
                          title="Falar com o solicitante no WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                      )}

                      {/* Ações Rápidas de Homologação de Atestado */}
                      {item.modulo === 'atestados' && item.status === 'pendente' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleQuickStatus(item, 'aprovado')}
                            disabled={updatingQuickId === item.id}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Aprovar Atestado"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleQuickStatus(item, 'rejeitado')}
                            disabled={updatingQuickId === item.id}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Rejeitar Atestado"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}

                      {/* Botão de Detalhes & Tratativa */}
                      <button
                        onClick={() => abrirTratativa(item)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detalhes & Gestão
                      </button>
                    </div>
                  </div>

                  {/* Snippet de Tratativa Existente (se houver) */}
                  {(item.resposta || item.observacaoInterna) && (
                    <div className="mt-1 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5 text-xs">
                      {item.resposta && (
                        <div className="flex-1 bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-2.5 text-emerald-900">
                          <span className="font-bold flex items-center gap-1 text-[11px] text-emerald-800 mb-0.5">
                            <Check className="w-3.5 h-3.5" /> Resposta / Devolutiva Registrada:
                          </span>
                          <p className="line-clamp-2 text-slate-700 italic">"{item.resposta}"</p>
                        </div>
                      )}

                      {item.observacaoInterna && (
                        <div className="flex-1 bg-amber-50/70 border border-amber-200/70 rounded-xl p-2.5 text-amber-900">
                          <span className="font-bold flex items-center gap-1 text-[11px] text-amber-800 mb-0.5">
                            <FileText className="w-3.5 h-3.5" /> Nota Interna Multimed:
                          </span>
                          <p className="line-clamp-2 text-slate-700 italic">"{item.observacaoInterna}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── MODAL COMPLETO DE DETALHES & GESTÃO DA DEMANDA ─────────────────── */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] my-auto border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-base truncate">{selectedItem.empresaNome}</h3>
                    {selectedItem.empresaTag && TIPOS_GESTAO[selectedItem.empresaTag] && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${TIPOS_GESTAO[selectedItem.empresaTag].bgClass} ${TIPOS_GESTAO[selectedItem.empresaTag].borderClass} ${TIPOS_GESTAO[selectedItem.empresaTag].textClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${TIPOS_GESTAO[selectedItem.empresaTag].dotClass}`} />
                        {TIPOS_GESTAO[selectedItem.empresaTag].badgeLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Módulo: <strong className="text-slate-700">{selectedItem.moduloNome}</strong> • Recebida em{' '}
                    {new Date(selectedItem.dataOriginal).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo do Modal com Scroll */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
              {/* Alerta de Sucesso após Salvar */}
              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl flex items-center gap-3 animate-in fade-in">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">Gestão da demanda salva com sucesso!</h4>
                    <p className="text-xs text-emerald-700">
                      O status, as devolutivas e as notas foram gravados no servidor e refletidos em tempo real.
                    </p>
                  </div>
                </div>
              )}

              {/* CONTATO VIA WHATSAPP (BOTÃO EM DESTAQUE) */}
              {(() => {
                const rawPhone = String(
                  selectedItem.conteudo.telefone || selectedItem.conteudo.whatsapp || ''
                ).trim();
                const phoneDigits = rawPhone.replace(/\D/g, '');
                const hasValidPhone = phoneDigits.length >= 8;

                if (!hasValidPhone) {
                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2 text-xs text-slate-500">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Telefone não informado pelo solicitante nesta demanda.</span>
                    </div>
                  );
                }

                return (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-bold text-emerald-950 text-sm">Entrar em contato via WhatsApp</h5>
                        <p className="text-xs text-emerald-700">
                          Telefone do solicitante: <strong className="font-bold text-emerald-900">{rawPhone}</strong>
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/55${phoneDigits}?text=${encodeURIComponent(
                        `Olá ${
                          selectedItem.conteudo.nome || selectedItem.conteudo.nomeFuncionario || ''
                        }, aqui é da Multimed responsável pela gestão de demandas da empresa ${
                          selectedItem.empresaNome
                        }. Recebemos sua solicitação de ${selectedItem.moduloNome} e gostaríamos de dar a tratativa.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Iniciar Conversa no WhatsApp
                    </a>
                  </div>
                );
              })()}

              {/* SEÇÃO 1: DADOS COMPLETOS DA SOLICITAÇÃO */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Informações da Solicitação
                  </h4>
                  {getStatusBadge(selectedItem.status)}
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                  {/* Dados do Solicitante */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-400">Solicitante:</span>
                      <span className="text-sm font-bold text-slate-800">
                        {selectedItem.conteudo.nome || selectedItem.conteudo.nomeFuncionario || 'Anônimo / Não informado'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[11px] font-semibold text-slate-400">Telefone / WhatsApp:</span>
                      <span className="text-sm font-medium text-slate-800">
                        {selectedItem.conteudo.telefone || selectedItem.conteudo.whatsapp || 'Não informado'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[11px] font-semibold text-slate-400">E-mail:</span>
                      <span className="text-sm font-medium text-slate-800">
                        {selectedItem.conteudo.email || 'Não informado'}
                      </span>
                    </div>
                  </div>

                  {/* Setor e Matrícula se houver */}
                  {(selectedItem.conteudo.setor || selectedItem.conteudo.matricula) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                      {selectedItem.conteudo.setor && (
                        <div>
                          <span className="block text-[11px] font-semibold text-slate-400">Setor:</span>
                          <span className="text-sm font-medium text-slate-800">{selectedItem.conteudo.setor}</span>
                        </div>
                      )}
                      {selectedItem.conteudo.matricula && (
                        <div>
                          <span className="block text-[11px] font-semibold text-slate-400">Matrícula:</span>
                          <span className="text-sm font-medium text-slate-800">{selectedItem.conteudo.matricula}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Campos Específicos de Atestados */}
                  {selectedItem.modulo === 'atestados' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-400">Médico Responsável:</span>
                        <span className="text-sm font-medium text-slate-800">{selectedItem.conteudo.nomeMedico}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-400">CRM do Médico:</span>
                        <span className="text-sm font-medium text-slate-800">{selectedItem.conteudo.crmMedico}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-400">CID / Motivo:</span>
                        <span className="text-sm font-medium text-slate-800">
                          {selectedItem.conteudo.motivoCid || 'Não especificado'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-400">Data Afastamento:</span>
                        <span className="text-sm font-medium text-slate-800">
                          {selectedItem.conteudo.dataAfastamento ? new Date(selectedItem.conteudo.dataAfastamento).toLocaleDateString('pt-BR') : 'Não informada'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-400">Dias de Afastamento:</span>
                        <span className="text-sm font-bold text-blue-600">
                          {selectedItem.conteudo.diasAfastamento} dia(s)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Campos de Denúncia */}
                  {selectedItem.modulo === 'denuncias' && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="block text-[11px] font-semibold text-slate-400">Tipo da Denúncia:</span>
                      <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-red-100 text-red-800 rounded-lg text-xs font-bold uppercase">
                        {selectedItem.conteudo.tipo}
                      </span>
                    </div>
                  )}

                  {/* Campos de Apoio Emocional */}
                  {selectedItem.modulo === 'auxilios' && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="block text-[11px] font-semibold text-slate-400">Tipo de Auxílio:</span>
                      <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-teal-100 text-teal-800 rounded-lg text-xs font-bold capitalize">
                        {selectedItem.conteudo.tipoAuxilio === 'psicologico' ? '🧠 Psicológico' : '⚕️ Psiquiátrico'}
                      </span>
                    </div>
                  )}

                  {/* Campos de Apoio à Saúde */}
                  {selectedItem.modulo === 'apoioSaude' && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="block text-[11px] font-semibold text-slate-400">Especialidade / Tipo de Consulta:</span>
                      <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold">
                        {selectedItem.conteudo.tipoConsulta}
                      </span>
                    </div>
                  )}

                  {/* Campos de Segurança do Trabalho */}
                  {selectedItem.modulo === 'segurancaTrabalho' && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="block text-[11px] font-semibold text-slate-400">Categoria do Risco:</span>
                      <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-orange-100 text-orange-800 rounded-lg text-xs font-bold">
                        {selectedItem.conteudo.categoria}
                      </span>
                    </div>
                  )}

                  {/* Mensagem / Descrição Completa */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="block text-[11px] font-semibold text-slate-400 mb-1">Descrição / Relato da Solicitação:</span>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {selectedItem.conteudo.mensagem ||
                        selectedItem.conteudo.descricao ||
                        selectedItem.conteudo.motivoSolicitacao ||
                        selectedItem.conteudo.motivo ||
                        'Sem descrição adicional.'}
                    </div>
                  </div>

                  {/* ─── VISUALIZAÇÃO DIRETA DE IMAGEM / DOCUMENTO ANEXADO ─── */}
                  {(selectedItem.conteudo.arquivoUrl ||
                    selectedItem.conteudo.provas ||
                    selectedItem.conteudo.anexo) && (() => {
                      const attachmentUrl =
                        selectedItem.conteudo.arquivoUrl ||
                        selectedItem.conteudo.provas ||
                        selectedItem.conteudo.anexo;
                      const isImg = isImageAttachment(attachmentUrl);

                      return (
                        <div className="pt-3 border-t border-slate-200/60">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Eye className="w-4 h-4 text-blue-600" />
                              Documento / Imagem Anexada:
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setPreviewUrl(attachmentUrl)}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                              >
                                <ZoomIn className="w-3.5 h-3.5" /> Ampliar em tela cheia
                              </button>
                              <a
                                href={attachmentUrl}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" /> Baixar
                              </a>
                            </div>
                          </div>

                          {isImg ? (
                            <div
                              onClick={() => setPreviewUrl(attachmentUrl)}
                              className="relative group rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-900/5 hover:border-blue-400 transition-all cursor-pointer max-h-72 flex items-center justify-center"
                            >
                              <img
                                src={attachmentUrl}
                                alt="Anexo da Demanda"
                                className="w-full h-auto max-h-72 object-contain rounded-xl"
                              />
                              <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-[1px]">
                                <ZoomIn className="w-5 h-5" /> Clique para ver em tamanho real
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setPreviewUrl(attachmentUrl)}
                              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-colors border border-blue-200 cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                              Visualizar Documento PDF Anexado
                            </button>
                          )}
                        </div>
                      );
                    })()}
                </div>
              </div>

              {/* SEÇÃO 2: PAINEL DE GESTÃO DA MULTIMED (ONDE O FUNCIONÁRIO FAZ TODAS AS AÇÕES) */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-5 rounded-3xl border border-blue-100 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    Tratativa, Devolutiva & Alteração de Status
                  </h4>
                  {selectedItem.respondidoEm && (
                    <span className="text-[11px] text-slate-500">
                      Última tratativa: {new Date(selectedItem.respondidoEm).toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>

                {/* Alterar Status com Botões Rápidos + Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Alterar Status da Demanda:
                  </label>

                  {/* Botões de Ação Rápida de Status */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {getStatusOptionsForModulo(selectedItem.modulo).map((opt) => {
                      const isSelected = modalStatus === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setModalStatus(opt.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 ring-2 ring-blue-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                  >
                    {getStatusOptionsForModulo(selectedItem.modulo).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resposta da Equipe */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Resposta da Equipe:
                  </label>
                  <textarea
                    rows={4}
                    value={modalResposta}
                    onChange={(e) => setModalResposta(e.target.value)}
                    placeholder="Digite a resposta ou tratativa da equipe para esta demanda..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm leading-relaxed"
                  />
                </div>

                {/* Notas Internas da Multimed */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Observações Internas (Uso exclusivo da equipe Multimed):
                  </label>
                  <p className="text-[11px] text-slate-500 mb-1.5">
                    Anotações confidenciais que apenas sua equipe visualiza (ligações com RH, histórico do caso, pendências internas).
                  </p>
                  <textarea
                    rows={2}
                    value={modalObservacao}
                    onChange={(e) => setModalObservacao(e.target.value)}
                    placeholder="Ex: Contato realizado via telefone com o gestor do setor para validar o ocorrido..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Fechar
              </button>

              <button
                onClick={handleSalvarTratativa}
                disabled={isSavingTratativa}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-600/25 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSavingTratativa ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando Tratativa...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Salvar Tratativa & Status
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DE VISUALIZAÇÃO DE ARQUIVO EM TAMANHO REAL ─────────────── */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-sm"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4 text-blue-600" />
                Visualizar Documento / Imagem Anexada
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
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
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
                    parent.innerHTML = `<div class="text-center p-8"><p class="text-slate-500 mb-4">Não foi possível pré-visualizar este arquivo diretamente.</p><a href="${previewUrl}" target="_blank" rel="noreferrer" class="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">Abrir em nova aba</a></div>`;
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
