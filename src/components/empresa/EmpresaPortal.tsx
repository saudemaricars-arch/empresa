import { useState, useEffect } from 'react';
import {
  LogOut, Building2, Loader2, MessageSquare, AlertTriangle,
  FileText, Heart, Stethoscope, HardHat, Bell, ChevronRight,
  Eye, RefreshCw, ExternalLink, Calendar
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { Company, Sugestao, Denuncia, Atestado, AuxilioSaudeMental, ApoioSaude, SegurancaTrabalho } from '../../types';
import {
  onSugestoesSnapshot, onDenunciasSnapshot, onAtestadosSnapshot,
  onAuxiliosSnapshot, onApoioSaudeSnapshot, onSegurancaTrabalhoSnapshot,
  updateSugestaoStatus, updateDenunciaStatus, updateAtestadoStatus,
  updateAuxilioStatus, updateApoioSaudeStatus, updateSegurancaTrabalhoStatus,
} from '../../lib/firestoreService';
import { useAuth } from '../../contexts/AuthContext';

// ─── Tipos de aba disponíveis ────────────────────────────────────────────────

type AbaId = 'sugestoes' | 'denuncias' | 'atestados' | 'auxilios' | 'apoioSaude' | 'segurancaTrabalho';

// ─── Helpers visuais ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    nova:          { label: 'Nova',          className: 'bg-blue-50 text-blue-700 border border-blue-100' },
    pendente:      { label: 'Pendente',      className: 'bg-amber-50 text-amber-700 border border-amber-100' },
    lida:          { label: 'Lida',          className: 'bg-slate-100 text-slate-600 border border-slate-200' },
    respondida:    { label: 'Respondida',    className: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
    em_analise:    { label: 'Em análise',    className: 'bg-purple-50 text-purple-700 border border-purple-100' },
    em_atendimento:{ label: 'Em atendimento',className: 'bg-indigo-50 text-indigo-700 border border-indigo-100' },
    resolvida:     { label: 'Resolvida',     className: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
    concluido:     { label: 'Concluído',     className: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
    arquivada:     { label: 'Arquivada',     className: 'bg-slate-100 text-slate-500 border border-slate-200' },
    aprovado:      { label: 'Aprovado',      className: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
    rejeitado:     { label: 'Rejeitado',     className: 'bg-red-50 text-red-700 border border-red-100' },
  };
  const cfg = map[status] || { label: status, className: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

// ─── Card de resumo ───────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  count,
  novos,
  color,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  count: number;
  novos: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-start gap-3 p-5 rounded-2xl border-2 transition-all text-left w-full ${
        active
          ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
          : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
      }`}
    >
      {novos > 0 && (
        <span className="absolute top-3 right-3 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {novos}
        </span>
      )}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ background: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{count}</p>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
      </div>
    </button>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  empresaId: string;
}

export function EmpresaPortal({ empresaId }: Props) {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<AbaId>('sugestoes');
  const [itemDetalhado, setItemDetalhado] = useState<any | null>(null);
  const [filtroPreset, setFiltroPreset] = useState<'todos' | 'hoje' | '7dias' | '30dias' | 'custom'>('todos');
  const [dataCustomInicio, setDataCustomInicio] = useState('');
  const [dataCustomFim, setDataCustomFim] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Dados em tempo real
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [atestados, setAtestados] = useState<Atestado[]>([]);
  const [auxilios, setAuxilios] = useState<AuxilioSaudeMental[]>([]);
  const [apoioSaude, setApoioSaude] = useState<ApoioSaude[]>([]);
  const [seguranca, setSeguranca] = useState<SegurancaTrabalho[]>([]);

  // Carrega dados da empresa
  useEffect(() => {
    if (!empresaId) return;

    (async () => {
      try {
        const snap = await getDoc(doc(db, 'empresas', empresaId));
        if (snap.exists()) {
          const d = snap.data() as Record<string, unknown>;
          setCompany({
            id: empresaId,
            cnpj: (d.cnpj as string) || '',
            razaoSocial: (d.razaoSocial as string) || '',
            nomeFantasia: (d.nomeFantasia as string) || undefined,
            numeroFuncionarios: (d.numeroFuncionarios as number) || 0,
            slug: (d.slug as string) || empresaId,
            corPrimaria: (d.corPrimaria as string) || '#2563EB',
            logoUrl: (d.logoUrl as string) || undefined,
            descricao: (d.descricao as string) || undefined,
            email: (d.email as string) || undefined,
            noticias: [],
            enableSugestoes: d.enableSugestoes !== false,
            enableDenuncias: d.enableDenuncias !== false,
            enableAtestados: d.enableAtestados !== false,
            enableAuxilios: d.enableAuxilios !== false,
            enableApoioSaude: d.enableApoioSaude !== false,
            enableSegurancaTrabalho: d.enableSegurancaTrabalho !== false,
          });
        }
      } catch (e) {
        console.error('Erro ao carregar empresa:', e);
      } finally {
        setLoading(false);
      }
    })();

    // Listeners em tempo real
    const unsubs = [
      onSugestoesSnapshot(empresaId, setSugestoes),
      onDenunciasSnapshot(empresaId, setDenuncias),
      onAtestadosSnapshot(empresaId, setAtestados),
      onAuxiliosSnapshot(empresaId, setAuxilios),
      onApoioSaudeSnapshot(empresaId, setApoioSaude),
      onSegurancaTrabalhoSnapshot(empresaId, setSeguranca),
    ];

    return () => unsubs.forEach(u => u());
  }, [empresaId]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-slate-500 text-sm">Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  const cor = company?.corPrimaria || '#2563EB';

  // ─── Lógica de Filtro por Data ────────────────────────────────────────────────
  const filterByDate = (items: any[]) => {
    if (filtroPreset === 'todos') return items;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return items.filter(item => {
      if (!item.criadoEm) return false;
      const itemDate = new Date(item.criadoEm);
      const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

      if (filtroPreset === 'custom') {
        if (dataCustomInicio) {
          const inicio = new Date(dataCustomInicio + 'T00:00:00');
          if (itemDateOnly < inicio) return false;
        }
        if (dataCustomFim) {
          const fim = new Date(dataCustomFim + 'T00:00:00');
          if (itemDateOnly > fim) return false;
        }
        return true;
      }

      const diffTime = now.getTime() - itemDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      
      if (filtroPreset === 'hoje') return itemDate >= today;
      if (filtroPreset === '7dias') return diffDays <= 7;
      if (filtroPreset === '30dias') return diffDays <= 30;
      return true;
    });
  };

  // Abas disponíveis baseadas nos módulos habilitados
  type AbaConfig = { id: AbaId; label: string; icon: any; dados: any[]; color: string; enabled: boolean };
  const abas: AbaConfig[] = [
    { id: 'sugestoes',        label: 'Sugestões',          icon: MessageSquare, dados: filterByDate(sugestoes),  color: '#3b82f6', enabled: company?.enableSugestoes !== false },
    { id: 'denuncias',        label: 'Denúncias',           icon: AlertTriangle, dados: filterByDate(denuncias),  color: '#ef4444', enabled: company?.enableDenuncias !== false },
    { id: 'atestados',        label: 'Atestados',           icon: FileText,      dados: filterByDate(atestados),  color: '#f59e0b', enabled: company?.enableAtestados !== false },
    { id: 'auxilios',         label: 'Auxílio Mental',      icon: Heart,         dados: filterByDate(auxilios),   color: '#ec4899', enabled: company?.enableAuxilios !== false },
    { id: 'apoioSaude',       label: 'Apoio à Saúde',       icon: Stethoscope,   dados: filterByDate(apoioSaude), color: '#10b981', enabled: company?.enableApoioSaude !== false },
    { id: 'segurancaTrabalho',label: 'Seg. do Trabalho',    icon: HardHat,       dados: filterByDate(seguranca),  color: '#f97316', enabled: company?.enableSegurancaTrabalho !== false },
  ].filter(a => a.enabled);

  const abaAtual = abas.find(a => a.id === abaAtiva) || abas[0];
  const totalNovos = sugestoes.filter(s => s.status === 'nova').length
    + denuncias.filter(d => d.status === 'nova').length
    + atestados.filter(a => a.status === 'pendente').length
    + auxilios.filter(a => a.status === 'pendente').length
    + apoioSaude.filter(a => a.status === 'pendente').length
    + seguranca.filter(s => s.status === 'nova').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">

      {/* ─── HEADER PERSONALIZADO ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo + nome */}
          <div className="flex items-center gap-3">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt="Logo" className="h-9 w-auto object-contain rounded-lg" />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: cor }}
              >
                <Building2 className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="hidden sm:block">
              <p className="font-bold text-slate-900 leading-tight text-sm">
                {company?.nomeFantasia || company?.razaoSocial || 'Meu Painel'}
              </p>
              <p className="text-xs text-slate-400">Portal da Empresa</p>
            </div>
          </div>

          {/* Notificações + usuário + sair */}
          <div className="flex items-center gap-3">
            {totalNovos > 0 && (
              <div className="relative">
                <Bell className="w-5 h-5 text-slate-400" />
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalNovos}
                </span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-500 max-w-[160px] truncate">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-xl transition-colors text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── CONTEÚDO PRINCIPAL ─────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Boas-vindas */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Olá, {company?.nomeFantasia || company?.razaoSocial} 👋
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Acompanhe todas as demandas da sua empresa em tempo real.
            </p>
          </div>
          
          {company?.slug && (
            <a
              href={`/#/empresa/${company.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl transition-colors text-sm shrink-0 border border-blue-100"
            >
              <ExternalLink className="w-4 h-4" />
              Ver Página Pública
            </a>
          )}
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {abas.map(aba => {
            const novos = aba.dados.filter((d: any) =>
              d.status === 'nova' || d.status === 'pendente'
            ).length;
            return (
              <SummaryCard
                key={aba.id}
                icon={aba.icon}
                label={aba.label}
                count={aba.dados.length}
                novos={novos}
                color={aba.color}
                active={abaAtiva === aba.id}
                onClick={() => { setAbaAtiva(aba.id); setItemDetalhado(null); }}
              />
            );
          })}
        </div>

        {/* Painel de demandas */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Tabs e Filtros */}
          <div className="border-b border-slate-100 px-6 pt-4 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide w-full lg:w-auto">
              {abas.map(aba => (
                <button
                  key={aba.id}
                  onClick={() => { setAbaAtiva(aba.id); setItemDetalhado(null); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    abaAtiva === aba.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <aba.icon className="w-4 h-4" />
                  {aba.label}
                  {aba.dados.length > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                      abaAtiva === aba.id ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {aba.dados.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Controles de Calendário e Filtro */}
            <div className="mb-2 shrink-0 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm h-[34px]">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={dataCustomInicio}
                  onChange={(e) => {
                    setDataCustomInicio(e.target.value);
                    setFiltroPreset('custom');
                  }}
                  className="bg-transparent text-slate-700 outline-none w-auto sm:w-[110px]"
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
                  className="bg-transparent text-slate-700 outline-none w-auto sm:w-[110px]"
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
                className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors h-[34px]"
              >
                <option value="todos">Todo o período</option>
                <option value="hoje">Hoje</option>
                <option value="7dias">Últimos 7 dias</option>
                <option value="30dias">Últimos 30 dias</option>
                <option value="custom" disabled hidden>Período selecionado</option>
              </select>
            </div>
          </div>

          {/* Lista de itens */}
          <div className="divide-y divide-slate-50">
            {(!abaAtual || abaAtual.dados.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                  {abaAtual && <abaAtual.icon className="w-8 h-8 text-slate-300" />}
                </div>
                <p className="text-slate-500 font-medium">Nenhuma demanda aqui ainda</p>
                <p className="text-slate-400 text-sm mt-1">Os registros aparecerão aqui em tempo real</p>
              </div>
            ) : (
              abaAtual.dados.map((item: any) => (
                <ListaItem
                  key={item.id}
                  item={item}
                  abaId={abaAtiva}
                  empresaId={empresaId}
                  isDetalhado={itemDetalhado?.id === item.id}
                  onToggle={() => setItemDetalhado(itemDetalhado?.id === item.id ? null : item)}
                  onPreview={(url) => setPreviewUrl(url)}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* ─── MODAL DE PREVIEW DE ARQUIVO ───────────────────────────────────── */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4 text-blue-600" />
                Visualizar Documento Anexado
              </h3>
              <div className="flex items-center gap-2">
                {/* Botão de Download */}
                <a
                  href={previewUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  title="Baixar arquivo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
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

// ─── Item da lista ────────────────────────────────────────────────────────────

function ListaItem({
  item,
  abaId,
  empresaId,
  isDetalhado,
  onToggle,
  onPreview,
}: {
  item: any;
  abaId: AbaId;
  empresaId: string;
  isDetalhado: boolean;
  onToggle: () => void;
  onPreview: (url: string) => void;
}) {
  const [atualizando, setAtualizando] = useState(false);

  const getTitulo = () => {
    switch (abaId) {
      case 'sugestoes':         return item.mensagem?.slice(0, 60) || 'Sugestão';
      case 'denuncias':         return item.descricao?.slice(0, 60) || 'Denúncia';
      case 'atestados':         return `Atestado — ${item.nomeFuncionario}`;
      case 'auxilios':          return `Auxílio — ${item.nomeFuncionario}`;
      case 'apoioSaude':        return `Apoio à Saúde — ${item.nomeFuncionario}`;
      case 'segurancaTrabalho': return item.mensagem?.slice(0, 60) || 'Seg. Trabalho';
      default:                  return 'Item';
    }
  };

  const getSubtitulo = () => {
    switch (abaId) {
      case 'sugestoes':         return `Categoria: ${item.categoria} · ${item.nome}`;
      case 'denuncias':         return `Tipo: ${item.tipo} · ${item.nome}`;
      case 'atestados':         return `${item.diasAfastamento} dia(s) · Dr. ${item.nomeMedico}`;
      case 'auxilios':          return `${item.tipoAuxilio === 'psicologico' ? 'Psicológico' : 'Psiquiátrico'}`;
      case 'apoioSaude':        return item.tipoConsulta;
      case 'segurancaTrabalho': return `Categoria: ${item.categoria}`;
      default:                  return '';
    }
  };

  const handleAtualizarStatus = async (novoStatus: string) => {
    setAtualizando(true);
    try {
      if (abaId === 'sugestoes')         await updateSugestaoStatus(empresaId, item.id, novoStatus as any);
      if (abaId === 'denuncias')         await updateDenunciaStatus(empresaId, item.id, novoStatus as any);
      if (abaId === 'atestados')         await updateAtestadoStatus(empresaId, item.id, novoStatus as any);
      if (abaId === 'auxilios')          await updateAuxilioStatus(empresaId, item.id, novoStatus as any);
      if (abaId === 'apoioSaude')        await updateApoioSaudeStatus(empresaId, item.id, novoStatus as any);
      if (abaId === 'segurancaTrabalho') await updateSegurancaTrabalhoStatus(empresaId, item.id, novoStatus as any);
    } finally {
      setAtualizando(false);
    }
  };

  const getProximosStatus = (): string[] => {
    switch (abaId) {
      case 'sugestoes': return item.status === 'nova' ? ['lida', 'respondida'] : ['respondida'];
      case 'denuncias': return item.status === 'nova' ? ['em_analise', 'resolvida', 'arquivada'] : ['resolvida', 'arquivada'];
      case 'atestados': return ['aprovado', 'rejeitado'];
      case 'auxilios': case 'apoioSaude': return item.status === 'pendente' ? ['em_atendimento', 'concluido'] : ['concluido'];
      case 'segurancaTrabalho': return item.status === 'nova' ? ['em_analise', 'resolvida'] : ['resolvida'];
      default: return [];
    }
  };

  const statusLabels: Record<string, string> = {
    lida: 'Marcar como Lida', respondida: 'Marcar como Respondida',
    em_analise: 'Em Análise', resolvida: 'Resolver', arquivada: 'Arquivar',
    aprovado: 'Aprovar', rejeitado: 'Rejeitar',
    em_atendimento: 'Iniciar Atendimento', concluido: 'Concluir',
  };

  return (
    <div className={`transition-colors ${isDetalhado ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}>
      <button
        className="w-full flex items-center gap-4 px-6 py-4 text-left"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 text-sm truncate">{getTitulo()}</p>
          <p className="text-xs text-slate-400 mt-0.5">{getSubtitulo()}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-400">{formatDate(item.criadoEm)}</span>
          <StatusBadge status={item.status} />
          <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${isDetalhado ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {/* Detalhe expandido */}
      {isDetalhado && (
        <div className="px-6 pb-6 border-t border-slate-100 pt-4 space-y-4">
          {/* Campos completos */}
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(item)
              .filter(([k]) => !['id', 'status', 'criadoEm', 'arquivoUrl', 'provas'].includes(k))
              .map(([k, v]) => (
                <div key={k} className="bg-white rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-400 mb-1 capitalize">
                    {k.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </p>
                  <p className="text-sm text-slate-700 font-medium break-words">
                    {String(v) || '—'}
                  </p>
                </div>
              ))}
          </div>

          {/* Arquivo / Anexo */}
          {(item.arquivoUrl || item.provas) && (
            <button
              onClick={() => onPreview(item.arquivoUrl || item.provas)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition-colors border border-blue-100"
            >
              <Eye className="w-4 h-4" />
              Visualizar Documento Anexado
            </button>
          )}
        </div>
      )}
    </div>
  );
}


