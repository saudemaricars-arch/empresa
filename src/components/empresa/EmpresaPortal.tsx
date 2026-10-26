import { useState, useEffect, useMemo } from 'react';
import {
  LogOut, Building2, Loader2, MessageSquare, AlertTriangle,
  FileText, Heart, Stethoscope, HardHat, Bell, ChevronRight,
  Eye, RefreshCw, ExternalLink, Calendar, Search, Download,
  FolderCheck, Plus, Trash2, ShieldCheck, CheckCircle2, Clock,
  FileCheck2, AlertCircle, X, Menu, User, Filter, Activity,
  FileSpreadsheet
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import {
  Company, Sugestao, Denuncia, Atestado, AuxilioSaudeMental,
  ApoioSaude, SegurancaTrabalho,
} from '../../types';
import {
  onSugestoesSnapshot, onDenunciasSnapshot, onAtestadosSnapshot,
  onAuxiliosSnapshot, onApoioSaudeSnapshot, onSegurancaTrabalhoSnapshot,
  updateEmpresa, updateSugestaoStatus, updateDenunciaStatus, updateAtestadoStatus,
  updateAuxilioStatus, updateApoioSaudeStatus, updateSegurancaTrabalhoStatus,
  getEmpresaBySlug,
} from '../../lib/firestoreService';
import { exportToCsv } from '../../utils/exportCsv';
import { useAuth } from '../../contexts/AuthContext';
import { PerfilClienteTab } from './PerfilClienteTab';
import { RelatoriosClienteTab } from './RelatoriosClienteTab';

// ─── Tipos de aba e filtros ──────────────────────────────────────────────────

type AbaId = 'atestados' | 'denuncias' | 'sugestoes' | 'auxilios' | 'apoioSaude' | 'segurancaTrabalho' | 'perfil' | 'relatorios';
type StatusFilterId = 'todos' | 'pendentes' | 'concluidos' | 'rejeitados';

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


// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  empresaId: string;
}

export function EmpresaPortal({ empresaId }: Props) {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<AbaId>('atestados');
  const [itemDetalhado, setItemDetalhado] = useState<any | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Filtros
  const [filtroPreset, setFiltroPreset] = useState<'todos' | 'hoje' | '7dias' | '30dias' | 'custom'>('todos');
  const [dataCustomInicio, setDataCustomInicio] = useState('');
  const [dataCustomFim, setDataCustomFim] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [buscaTexto, setBuscaTexto] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusFilterId>('todos');

  // Dados em tempo real
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [atestados, setAtestados] = useState<Atestado[]>([]);
  const [auxilios, setAuxilios] = useState<AuxilioSaudeMental[]>([]);
  const [apoioSaude, setApoioSaude] = useState<ApoioSaude[]>([]);
  const [seguranca, setSeguranca] = useState<SegurancaTrabalho[]>([]);

  const [resolvedEmpresaId, setResolvedEmpresaId] = useState<string | null>(null);

  // Carrega dados da empresa (aceita ID direto ou slug)
  useEffect(() => {
    if (!empresaId) return;

    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        // 1. Tenta carregar por ID direto
        const snap = await getDoc(doc(db, 'empresas', empresaId));
        if (snap.exists() && !cancel) {
          const d = snap.data() as Record<string, unknown>;
          setCompany({
            id: snap.id,
            cnpj: (d.cnpj as string) || '',
            razaoSocial: (d.razaoSocial as string) || '',
            nomeFantasia: (d.nomeFantasia as string) || undefined,
            numeroFuncionarios: (d.numeroFuncionarios as number) || 0,
            slug: (d.slug as string) || snap.id,
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
          setResolvedEmpresaId(snap.id);
          return;
        }

        // 2. Se não encontrou por ID, tenta buscar por slug
        const empresaPorSlug = await getEmpresaBySlug(empresaId);
        if (empresaPorSlug && !cancel) {
          setCompany(empresaPorSlug);
          setResolvedEmpresaId(empresaPorSlug.id);
          return;
        }

        if (!cancel) {
          setCompany(null);
          setResolvedEmpresaId(null);
        }
      } catch (e) {
        console.warn('Aviso ao carregar dados da empresa:', e);
        if (!cancel) {
          setCompany(null);
          setResolvedEmpresaId(null);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => { cancel = true; };
  }, [empresaId]);

  // Listeners em tempo real (ativados apenas com ID real verificado)
  useEffect(() => {
    if (!resolvedEmpresaId) return;

    const unsubs = [
      onSugestoesSnapshot(resolvedEmpresaId, setSugestoes, (err) => console.warn('Sugestões offline ou sem permissão:', err.message)),
      onDenunciasSnapshot(resolvedEmpresaId, setDenuncias, (err) => console.warn('Denúncias offline ou sem permissão:', err.message)),
      onAtestadosSnapshot(resolvedEmpresaId, setAtestados, (err) => console.warn('Atestados offline ou sem permissão:', err.message)),
      onAuxiliosSnapshot(resolvedEmpresaId, setAuxilios, (err) => console.warn('Auxílios offline ou sem permissão:', err.message)),
      onApoioSaudeSnapshot(resolvedEmpresaId, setApoioSaude, (err) => console.warn('Apoio saúde offline ou sem permissão:', err.message)),
      onSegurancaTrabalhoSnapshot(resolvedEmpresaId, setSeguranca, (err) => console.warn('Segurança offline ou sem permissão:', err.message)),
    ];

    return () => unsubs.forEach(u => u());
  }, [resolvedEmpresaId]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  // ─── Pipeline de Filtros ────────────────────────────────────────────────────
  const filterByDate = (items: any[]) => {
    if (filtroPreset === 'todos') return items;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return items.filter(item => {
      const dataStr = item.criadoEm || item.dataEmissao;
      if (!dataStr) return false;
      const itemDate = new Date(dataStr);
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

  const filterByStatus = (items: any[]) => {
    if (filtroStatus === 'todos') return items;
    return items.filter(item => {
      const s = (item.status || '').toLowerCase();
      if (filtroStatus === 'pendentes') {
        return ['nova', 'pendente', 'em_analise', 'em_atendimento'].includes(s);
      }
      if (filtroStatus === 'concluidos') {
        return ['aprovado', 'resolvida', 'concluido', 'respondida', 'lida'].includes(s);
      }
      if (filtroStatus === 'rejeitados') {
        return ['rejeitado', 'arquivada'].includes(s);
      }
      return true;
    });
  };

  const filterBySearch = (items: any[]) => {
    const q = buscaTexto.trim().toLowerCase();
    if (!q) return items;

    return items.filter(item => {
      const haystack = [
        item.nomeFuncionario,
        item.nome,
        item.matricula,
        item.setor,
        item.nomeMedico,
        item.crmMedico,
        item.motivoCid,
        item.mensagem,
        item.descricao,
        item.tipo,
        item.categoria,
        item.tipoConsulta,
        item.tipoAuxilio,
        item.titulo,
        item.responsavelTecnico,
        item.versao,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  };

  const processItems = (rawItems: any[]) => {
    return filterBySearch(filterByStatus(filterByDate(rawItems)));
  };

  // ─── Exportação em CSV para Excel ──────────────────────────────────────────
  const handleExportarPlanilha = () => {
    const dadosAExportar = abaAtual.dados;
    if (!dadosAExportar || dadosAExportar.length === 0) {
      alert('Não há dados filtrados para exportar no momento.');
      return;
    }

    let rows: Record<string, any>[] = [];

    if (abaAtiva === 'atestados') {
      rows = dadosAExportar.map((a: Atestado) => ({
        'Código ID': a.id,
        'Colaborador': a.nomeFuncionario,
        'Matrícula': a.matricula || 'N/A',
        'Setor': a.setor || 'N/A',
        'Telefone / WhatsApp': a.telefone || 'N/A',
        'Médico Emitente': a.nomeMedico,
        'CRM': a.crmMedico,
        'Data Afastamento': a.dataAfastamento ? new Date(a.dataAfastamento + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A',
        'Dias Afastamento': a.diasAfastamento,
        'CID / Diagnóstico': a.motivoCid || 'Não informado',
        'Status Atual': a.status.toUpperCase(),
        'Data de Envio': formatDate(a.criadoEm),
        'Devolutiva / Tratativa': a.resposta || 'Sem devolutiva',
      }));
    } else if (abaAtiva === 'denuncias') {
      rows = dadosAExportar.map((d: Denuncia) => ({
        'Protocolo': d.id,
        'Remetente': d.nome || 'Anônimo',
        'Tipo de Denúncia': d.tipo.toUpperCase(),
        'Descrição': d.descricao,
        'Status': d.status.toUpperCase(),
        'Data Registro': formatDate(d.criadoEm),
        'Despacho / Parecer': d.resposta || 'Sem parecer',
      }));
    } else if (abaAtiva === 'sugestoes') {
      rows = dadosAExportar.map((s: Sugestao) => ({
        'ID': s.id,
        'Autor': s.nome || 'Anônimo',
        'Categoria': s.categoria,
        'Mensagem': s.mensagem,
        'Status': s.status.toUpperCase(),
        'Data Registro': formatDate(s.criadoEm),
      }));
    } else {
      rows = dadosAExportar.map((item: any) => ({
        'ID': item.id,
        'Colaborador': item.nomeFuncionario || item.nome || 'N/A',
        'Matrícula': item.matricula || 'N/A',
        'Telefone': item.telefone || 'N/A',
        'Status': (item.status || '').toUpperCase(),
        'Data Registro': formatDate(item.criadoEm),
      }));
    }

    const nomeArquivo = `${abaAtiva}_${company?.slug || 'empresa'}_${new Date().toISOString().slice(0, 10)}.csv`;
    exportToCsv(nomeArquivo, rows);
  };

  // Configuração das Abas com agrupamento
  type AbaConfig = {
    id: AbaId;
    label: string;
    sublabel?: string;
    icon: any;
    dados: any[];
    color: string;
    grupo: string;
    enabled: boolean;
  };

  const abas: AbaConfig[] = [
    {
      id: 'atestados' as AbaId,
      label: 'Atestados Médicos',
      sublabel: 'Gestão de Absenteísmo & Folha',
      icon: FileText,
      dados: processItems(atestados),
      color: '#f59e0b',
      grupo: 'principal',
      enabled: company?.enableAtestados !== false,
    },
    {
      id: 'denuncias' as AbaId,
      label: 'Canal de Denúncias',
      sublabel: 'Linha Ética (Lei 14.457/22)',
      icon: AlertTriangle,
      dados: processItems(denuncias),
      color: '#ef4444',
      grupo: 'compliance',
      enabled: company?.enableDenuncias !== false,
    },
    {
      id: 'sugestoes' as AbaId,
      label: 'Caixa de Sugestões',
      sublabel: 'Ouvidoria de Colaboradores',
      icon: MessageSquare,
      dados: processItems(sugestoes),
      color: '#3b82f6',
      grupo: 'compliance',
      enabled: company?.enableSugestoes !== false,
    },
    {
      id: 'auxilios' as AbaId,
      label: 'Auxílio Mental',
      sublabel: 'Psicologia & Psiquiatria',
      icon: Heart,
      dados: processItems(auxilios),
      color: '#ec4899',
      grupo: 'saude',
      enabled: company?.enableAuxilios !== false,
    },
    {
      id: 'apoioSaude' as AbaId,
      label: 'Apoio à Saúde',
      sublabel: 'Telemedicina Ocupacional',
      icon: Stethoscope,
      dados: processItems(apoioSaude),
      color: '#10b981',
      grupo: 'saude',
      enabled: company?.enableApoioSaude !== false,
    },
    {
      id: 'segurancaTrabalho' as AbaId,
      label: 'Segurança do Trabalho',
      sublabel: 'Inspeções e Alertas CIPA',
      icon: HardHat,
      dados: processItems(seguranca),
      color: '#f97316',
      grupo: 'saude',
      enabled: company?.enableSegurancaTrabalho !== false,
    },
    {
      id: 'perfil' as AbaId,
      label: 'Meu Perfil & Empresa',
      sublabel: 'Dados cadastrais, marca e segurança',
      icon: User,
      dados: [],
      color: '#6366f1',
      grupo: 'conta',
      enabled: true,
    },
    {
      id: 'relatorios' as AbaId,
      label: 'Relatórios & Exportação',
      sublabel: 'Extração completa em Excel por data',
      icon: FileSpreadsheet,
      dados: [],
      color: '#059669',
      grupo: 'principal',
      enabled: true,
    },
  ].filter(a => a.enabled);

  const abaAtual = abas.find(a => a.id === abaAtiva) || abas[0];

  const pendenciasMap: Record<AbaId, number> = {
    atestados: atestados.filter(a => a.status === 'pendente').length,
    denuncias: denuncias.filter(d => d.status === 'nova').length,
    sugestoes: sugestoes.filter(s => s.status === 'nova').length,
    auxilios: auxilios.filter(a => a.status === 'pendente').length,
    apoioSaude: apoioSaude.filter(a => a.status === 'pendente').length,
    segurancaTrabalho: seguranca.filter(s => s.status === 'nova').length,
    perfil: 0,
    relatorios: 0,
  };

  const handleUpdateCompanyProfile = async (updates: Partial<Company>) => {
    if (!company) return;
    await updateEmpresa(company.id, updates);
    setCompany(prev => prev ? { ...prev, ...updates } : null);
  };

  const totalGeralNovos = Object.values(pendenciasMap).reduce((acc, curr) => acc + curr, 0);


  // Dias totais de afastamento no período
  const totalDiasAfastamento = useMemo(() => {
    return atestados.reduce((acc, a) => acc + (Number(a.diasAfastamento) || 0), 0);
  }, [atestados]);

  // Informações do perfil do usuário
  const userInitial = useMemo(() => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  }, [user?.email]);

  const userNameDisplay = useMemo(() => {
    if (!user?.email) return 'Gestor da Empresa';
    const namePart = user.email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  }, [user?.email]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Carregando painel do cliente...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Empresa não localizada</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Não encontramos os dados da empresa correspondente ou você não possui permissão para acessá-la.
          </p>
          <a
            href="/#/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors w-full"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    );
  }

  const corPrimaria = company.corPrimaria || '#2563EB';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col lg:flex-row antialiased">

      {/* ─── OVERLAY MOBILE ─────────────────────────────────────────────────── */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ─── BARRA LATERAL (SIDEBAR EXECUTIVA) ───────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Topo da Sidebar: Identidade da Empresa */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                {company?.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={company.nomeFantasia || company.razaoSocial}
                    className="h-10 w-auto max-w-[120px] object-contain rounded-xl"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ background: corPrimaria }}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-950 text-sm leading-tight truncate">
                    {company?.nomeFantasia || company?.razaoSocial || 'Portal do Cliente'}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <span className="text-[11px] font-mono font-bold tracking-wider text-blue-600 uppercase">
                      [PORTAL PJ]
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão de Fechar Mobile */}
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Link para a Página Pública do Colaborador */}
            {company?.slug && (
              <a
                href={`/#/empresa/${company.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold rounded-xl transition-all text-xs border border-slate-200/80 group"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span>Página Pública (Colaboradores)</span>
              </a>
            )}
          </div>

          {/* Navegação Vertical por Módulos */}
          <div className="p-4 space-y-6 flex-1">
            
            {/* Bloco 1: Gestão Operacional */}
            <div>
              <p className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                Operação & Laudos
              </p>
              <div className="space-y-1">
                {abas.filter(a => a.grupo === 'principal').map(aba => {
                  const ativa = abaAtiva === aba.id;
                  const pendencias = pendenciasMap[aba.id];
                  return (
                    <button
                      key={aba.id}
                      onClick={() => {
                        setAbaAtiva(aba.id);
                        setItemDetalhado(null);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all text-left ${
                        ativa
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <aba.icon className={`w-4 h-4 shrink-0 ${ativa ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{aba.label}</span>
                      </div>
                      {pendencias > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ativa ? 'bg-white text-blue-700' : 'bg-red-500 text-white'
                        }`}>
                          {pendencias}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bloco 2: Linha Ética e Ouvidoria */}
            <div>
              <p className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                Conformidade & Ética
              </p>
              <div className="space-y-1">
                {abas.filter(a => a.grupo === 'compliance').map(aba => {
                  const ativa = abaAtiva === aba.id;
                  const pendencias = pendenciasMap[aba.id];
                  return (
                    <button
                      key={aba.id}
                      onClick={() => {
                        setAbaAtiva(aba.id);
                        setItemDetalhado(null);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all text-left ${
                        ativa
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <aba.icon className={`w-4 h-4 shrink-0 ${ativa ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{aba.label}</span>
                      </div>
                      {pendencias > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ativa ? 'bg-white text-blue-700' : 'bg-red-500 text-white'
                        }`}>
                          {pendencias}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bloco 3: Saúde & Bem-estar */}
            <div>
              <p className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                Saúde & Telemedicina
              </p>
              <div className="space-y-1">
                {abas.filter(a => a.grupo === 'saude').map(aba => {
                  const ativa = abaAtiva === aba.id;
                  const pendencias = pendenciasMap[aba.id];
                  return (
                    <button
                      key={aba.id}
                      onClick={() => {
                        setAbaAtiva(aba.id);
                        setItemDetalhado(null);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all text-left ${
                        ativa
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <aba.icon className={`w-4 h-4 shrink-0 ${ativa ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{aba.label}</span>
                      </div>
                      {pendencias > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ativa ? 'bg-white text-blue-700' : 'bg-red-500 text-white'
                        }`}>
                          {pendencias}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bloco 4: Minha Conta */}
            <div>
              <p className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                Minha Conta
              </p>
              <div className="space-y-1">
                {abas.filter(a => a.grupo === 'conta').map(aba => {
                  const ativa = abaAtiva === aba.id;
                  return (
                    <button
                      key={aba.id}
                      onClick={() => {
                        setAbaAtiva(aba.id);
                        setItemDetalhado(null);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all text-left ${
                        ativa
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <aba.icon className={`w-4 h-4 shrink-0 ${ativa ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{aba.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ─── RODAPÉ DA SIDEBAR: CARD DE PERFIL EXECUTIVO ─────────────── */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/70">
          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3 hover:border-blue-300 transition-colors">
            
            {/* Avatar estilizado com indicador de status e clique para perfil */}
            <div
              onClick={() => {
                setAbaAtiva('perfil');
                setItemDetalhado(null);
                setIsMobileSidebarOpen(false);
              }}
              className="flex items-center gap-3 min-w-0 cursor-pointer flex-1 group"
              title="Acessar Perfil da Empresa"
            >
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 transition-all ${
                  abaAtiva === 'perfil'
                    ? 'bg-blue-600 ring-blue-400'
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600 ring-blue-100 group-hover:ring-blue-300'
                }`}>
                  <User className="w-5 h-5 text-white" />
                </div>
                {/* Dot verde de status online pulsante */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
                </span>
              </div>

              {/* Dados do usuário */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {userNameDisplay}
                  </p>
                </div>
                <p
                  className="text-[11px] text-slate-500 font-medium truncate max-w-[140px]"
                  title={user?.email || ''}
                >
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Botão de Logout com hover de alerta */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
              title="Encerrar Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between px-2 pt-2 text-[10px] text-slate-400 font-medium">
            <span>Sessão Segura SSL</span>
            <button
              onClick={() => {
                setAbaAtiva('perfil');
                setItemDetalhado(null);
                setIsMobileSidebarOpen(false);
              }}
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Gerenciar Perfil →
            </button>
          </div>
        </div>
      </aside>

      {/* ─── ÁREA DE CONTEÚDO PRINCIPAL (TELA CHEIA) ────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* Top Header Mobile com Toggle de Sidebar */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">
              {company?.nomeFantasia || company?.razaoSocial}
            </span>
          </div>

          {/* Mini avatar mobile */}
          <button
            onClick={() => {
              setAbaAtiva('perfil');
              setItemDetalhado(null);
            }}
            className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-pointer"
            title="Meu Perfil"
          >
            {userInitial}
          </button>
        </header>

        {/* Conteúdo Central */}
        <main className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          {abaAtiva === 'perfil' && company ? (
            <PerfilClienteTab
              company={company}
              userEmail={user?.email || ''}
              onUpdateCompany={handleUpdateCompanyProfile}
              onLogout={handleLogout}
            />
          ) : abaAtiva === 'relatorios' && company ? (
            <RelatoriosClienteTab
              company={company}
              atestados={atestados}
              denuncias={denuncias}
              sugestoes={sugestoes}
              auxilios={auxilios}
              apoioSaude={apoioSaude}
              seguranca={seguranca}
            />
          ) : (
            <>
          {/* Cabeçalho da Seção Ativa & Ações Globais */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                  style={{ background: abaAtual.color }}
                >
                  <abaAtual.icon className="w-4 h-4" />
                </div>
                <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
                  {abaAtual.label}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {abaAtual.sublabel} · Gestão em tempo real e relatórios de conformidade.
              </p>
            </div>

            {/* Ações da Aba (Novo Laudo ou Exportação) */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleExportarPlanilha}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all hover:border-slate-300"
                title="Exportar registros filtrados em planilha CSV"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Exportar Planilha (CSV)</span>
              </button>
            </div>
          </div>

          {/* ─── RESUMO DE KPIs DA SEÇÃO ATIVA ────────────────────────────────── */}
          {abaAtiva === 'atestados' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-400 font-medium">Atestados Registrados</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{atestados.length}</p>
                <span className="text-[11px] text-slate-400">Total cadastrado</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs text-amber-600 font-medium">Pendentes de Validação</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{pendenciasMap.atestados}</p>
                <span className="text-[11px] text-amber-500">Aguardando análise</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-400 font-medium">Dias de Afastamento</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{totalDiasAfastamento} dias</p>
                <span className="text-[11px] text-slate-400">Impacto em absenteísmo</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs text-emerald-600 font-medium">Aprovados para Folha</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {atestados.filter(a => a.status === 'aprovado').length}
                </p>
                <span className="text-[11px] text-emerald-500">Conformidade eSocial</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-400 font-medium">Total de Registros</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{abaAtual.dados.length}</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs text-amber-600 font-medium">Novas Demandas</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{pendenciasMap[abaAtiva]}</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs text-emerald-600 font-medium">Resolvidas / Concluídas</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {abaAtual.dados.filter((d: any) => d.status === 'resolvida' || d.status === 'concluido' || d.status === 'respondida').length}
                </p>
              </div>
            </div>
          )}

          {/* ─── PAINEL CENTRAL DE DADOS & FILTROS ────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Barra de Filtros e Busca em Tempo Real */}
            <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Campo de Busca */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    abaAtiva === 'atestados'
                      ? 'Buscar colaborador, CID, CRM, setor ou matrícula...'
                      : 'Filtrar registros em tempo real...'
                  }
                  value={buscaTexto}
                  onChange={(e) => setBuscaTexto(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-9 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                {buscaTexto && (
                  <button
                    onClick={() => setBuscaTexto('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title="Limpar busca"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filtro de Status e Calendário */}
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value as StatusFilterId)}
                  className="text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer hover:bg-slate-50 shadow-sm transition-colors"
                >
                  <option value="todos">Todos os status</option>
                  <option value="pendentes">Pendentes / Em Análise</option>
                  <option value="concluidos">Aprovados / Resolvidos</option>
                  <option value="rejeitados">Rejeitados / Arquivados</option>
                </select>

                {/* Filtro de Data */}
                <div className="hidden sm:flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-sm shadow-sm">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={dataCustomInicio}
                    onChange={(e) => {
                      setDataCustomInicio(e.target.value);
                      setFiltroPreset('custom');
                    }}
                    className="bg-transparent text-xs text-slate-700 outline-none w-[105px]"
                    title="Data Inicial"
                  />
                  <span className="text-slate-300 text-xs">até</span>
                  <input
                    type="date"
                    value={dataCustomFim}
                    onChange={(e) => {
                      setDataCustomFim(e.target.value);
                      setFiltroPreset('custom');
                    }}
                    className="bg-transparent text-xs text-slate-700 outline-none w-[105px]"
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
                  className="text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer hover:bg-slate-50 shadow-sm transition-colors"
                >
                  <option value="todos">Todo o período</option>
                  <option value="hoje">Hoje</option>
                  <option value="7dias">Últimos 7 dias</option>
                  <option value="30dias">Últimos 30 dias</option>
                  <option value="custom" disabled hidden>Período selecionado</option>
                </select>
              </div>
            </div>

            {/* Conteúdo da Tabela / Lista */}
            <div className="divide-y divide-slate-100">
              {(!abaAtual || abaAtual.dados.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                    {abaAtual && <abaAtual.icon className="w-8 h-8 text-slate-300" />}
                  </div>
                  <p className="text-slate-800 font-bold text-base">Nenhum registro encontrado</p>
                  <p className="text-slate-400 text-xs mt-1">
                    {buscaTexto
                      ? `Nenhum resultado corresponde à busca "${buscaTexto}".`
                      : 'Nenhuma demanda cadastrada para o período selecionado.'}
                  </p>
                  {buscaTexto && (
                    <button
                      onClick={() => setBuscaTexto('')}
                      className="mt-3 text-xs text-blue-600 font-bold hover:underline"
                    >
                      Limpar filtro de busca
                    </button>
                  )}
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
            </>
          )}
        </main>
      </div>



      {/* ─── MODAL DE PREVIEW DE ARQUIVO ───────────────────────────────────── */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
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
                <a
                  href={previewUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
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
                    parent.innerHTML = `<div class="text-center p-8"><p class="text-slate-500 mb-4">Não foi possível pré-visualizar este arquivo diretamente no navegador.</p><a href="${previewUrl}" target="_blank" rel="noreferrer" class="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">Abrir em nova aba</a></div>`;
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

// ─── Helpers de Exibição e Formatação de Campos ──────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  nome: 'Nome',
  nomeFuncionario: 'Colaborador',
  email: 'Email',
  telefone: 'Telefone',
  categoria: 'Categoria',
  mensagem: 'Mensagem',
  anexo: 'Anexo',
  resposta: 'Resposta',
  respondidoEm: 'Respondido Em',
  observacaoInterna: 'Observação Interna',
  respondidoPor: 'Respondido Por',
  tipo: 'Tipo',
  descricao: 'Descrição',
  provas: 'Anexo / Provas',
  matricula: 'Matrícula',
  setor: 'Setor',
  dataAfastamento: 'Data de Afastamento',
  diasAfastamento: 'Dias de Afastamento',
  nomeMedico: 'Médico Emitente',
  crmMedico: 'CRM do Médico',
  motivoCid: 'CID / Diagnóstico',
  tipoAuxilio: 'Tipo de Auxílio',
  tipoConsulta: 'Tipo de Consulta',
  motivoSolicitacao: 'Motivo da Solicitação',
  titulo: 'Título',
  responsavelTecnico: 'Responsável Técnico',
  versao: 'Versão',
  dataEmissao: 'Data de Emissão',
  dataValidade: 'Data de Validade',
};

function formatFieldValue(key: string, val: any): { text: string; isPlaceholder: boolean } {
  if (val === undefined || val === null || val === '' || val === 'undefined' || val === 'null') {
    return { text: 'Não informado', isPlaceholder: true };
  }
  if (key === 'respondidoEm' || key === 'criadoEm' || key === 'dataEmissao') {
    return { text: formatDate(String(val)), isPlaceholder: false };
  }
  if (key === 'dataAfastamento' || key === 'dataValidade') {
    try {
      return { text: new Date(String(val) + 'T12:00:00').toLocaleDateString('pt-BR'), isPlaceholder: false };
    } catch {
      return { text: String(val), isPlaceholder: false };
    }
  }
  if (typeof val === 'boolean') {
    return { text: val ? 'Sim' : 'Não', isPlaceholder: false };
  }
  return { text: String(val), isPlaceholder: false };
}

// ─── Item da lista com expansão ───────────────────────────────────────────────

function ListaItem({
  item,
  abaId,
  empresaId,
  isDetalhado,
  onToggle,
  onPreview,
}: {
  key?: any;
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
      case 'atestados':         return `Atestado — ${item.nomeFuncionario || 'Colaborador'}`;
      case 'auxilios':          return `Auxílio — ${item.nomeFuncionario || 'Colaborador'}`;
      case 'apoioSaude':        return `Apoio à Saúde — ${item.nomeFuncionario || 'Colaborador'}`;
      case 'segurancaTrabalho': return item.mensagem?.slice(0, 60) || 'Seg. Trabalho';
      default:                  return 'Item';
    }
  };

  const getSubtitulo = () => {
    switch (abaId) {
      case 'sugestoes':         return `Categoria: ${item.categoria || 'Geral'} · ${item.nome || 'Anônimo'}`;
      case 'denuncias':         return `Tipo: ${item.tipo || 'Geral'} · ${item.nome || 'Anônimo'}`;
      case 'atestados':         return `${item.diasAfastamento || 1} dia(s) · Dr. ${item.nomeMedico || 'Não informado'} (CRM: ${item.crmMedico || 'Não informado'}) ${item.setor ? `· Setor: ${item.setor}` : ''}`;
      case 'auxilios':          return `${item.tipoAuxilio === 'psicologico' ? 'Psicológico' : 'Psiquiátrico'}`;
      case 'apoioSaude':        return item.tipoConsulta || 'Consulta Geral';
      case 'segurancaTrabalho': return `Categoria: ${item.categoria || 'Geral'}`;
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
      case 'atestados': return item.status === 'pendente' ? ['aprovado', 'rejeitado'] : ['aprovado', 'rejeitado'];
      case 'auxilios': case 'apoioSaude': return item.status === 'pendente' ? ['em_atendimento', 'concluido'] : ['concluido'];
      case 'segurancaTrabalho': return item.status === 'nova' ? ['em_analise', 'resolvida'] : ['resolvida'];
      default: return [];
    }
  };

  const statusLabels: Record<string, string> = {
    lida: 'Marcar como Lida', respondida: 'Marcar como Respondida',
    em_analise: 'Em Análise', resolvida: 'Resolver', arquivada: 'Arquivar',
    aprovado: 'Aprovar Atestado', rejeitado: 'Rejeitar Atestado',
    em_atendimento: 'Iniciar Atendimento', concluido: 'Concluir',
  };

  return (
    <div className={`transition-colors ${isDetalhado ? 'bg-slate-50/80' : 'hover:bg-slate-50/50'}`}>
      <button
        className="w-full flex items-center gap-4 px-6 py-4 text-left"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{getTitulo()}</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{getSubtitulo()}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-400 hidden sm:inline">{formatDate(item.criadoEm)}</span>
          <StatusBadge status={item.status} />
          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isDetalhado ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {/* Detalhe expandido */}
      {isDetalhado && (
        <div className="px-6 pb-6 border-t border-slate-200/60 pt-4 space-y-4">
          {/* Ações de Status */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Alterar Status:
            </span>
            {getProximosStatus().map((statusKey) => (
              <button
                key={statusKey}
                disabled={atualizando || item.status === statusKey}
                onClick={() => handleAtualizarStatus(statusKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  statusKey === 'aprovado' || statusKey === 'resolvida' || statusKey === 'concluido'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : statusKey === 'rejeitado' || statusKey === 'arquivada'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:opacity-40`}
              >
                {statusLabels[statusKey] || statusKey}
              </button>
            ))}
          </div>

          {/* Campos completos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(item)
              .filter(([k]) => !['id', 'status', 'criadoEm', 'arquivoUrl', 'provas'].includes(k))
              .map(([k, v]) => {
                const label = FIELD_LABELS[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                const formatted = formatFieldValue(k, v);

                return (
                  <div key={k} className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <p className="text-[11px] font-bold text-slate-400 mb-1">
                      {label}
                    </p>
                    {k === 'anexo' && !formatted.isPlaceholder && typeof v === 'string' && v.startsWith('http') ? (
                      <button
                        onClick={() => onPreview(v)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-left mt-0.5"
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span>Visualizar anexo</span>
                      </button>
                    ) : (
                      <p className={`text-xs break-words mt-0.5 ${
                        formatted.isPlaceholder
                          ? 'text-slate-400 italic font-normal'
                          : 'text-slate-900 font-semibold'
                      }`}>
                        {formatted.text}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Arquivo / Anexo */}
          {(item.arquivoUrl || item.provas) && (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => onPreview(item.arquivoUrl || item.provas)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors border border-blue-200 shadow-sm"
              >
                <Eye className="w-4 h-4" />
                Visualizar Documento / Atestado
              </button>
              <a
                href={item.arquivoUrl || item.provas}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar Anexo
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
