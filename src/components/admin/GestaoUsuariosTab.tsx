import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, ShieldCheck, Building2, UserPlus, Search, Filter,
  Download, RefreshCw, KeyRound, Lock, Unlock, Trash2, ExternalLink,
  Mail, Calendar, CheckCircle2, AlertTriangle, AlertCircle, Loader2,
  X, Eye, EyeOff, Sparkles, ShieldAlert, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Company, EmpresaUsuario, AdminUsuario, UsuarioSistema } from '../../types';
import {
  getAllEmpresaUsuarios, getAllAdmins, toggleStatusUsuario,
  enviarEmailRedefinicaoSenha, criarUsuarioEmpresa, criarUsuarioAdmin,
  removerUsuarioEmpresa
} from '../../lib/empresaUsuariosService';
import { exportToCsv } from '../../utils/exportCsv';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  companies: Company[];
  onViewCompany?: (companyId: string) => void;
}

export function GestaoUsuariosTab({ companies, onViewCompany }: Props) {
  const { user: currentAdmin } = useAuth();
  const [usuariosEmpresa, setUsuariosEmpresa] = useState<EmpresaUsuario[]>([]);
  const [admins, setAdmins] = useState<AdminUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroPapel, setFiltroPapel] = useState<'todos' | 'admin' | 'empresa' | 'desativado'>('todos');
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('todas');

  // Modais e ações
  const [modalNovoUsuarioOpen, setModalNovoUsuarioOpen] = useState(false);
  const [usuarioAExcluir, setUsuarioAExcluir] = useState<UsuarioSistema | null>(null);
  const [loadingAcaoId, setLoadingAcaoId] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Mapeamento rápido de ID da empresa -> Empresa
  const companyMap = useMemo(() => {
    const map = new Map<string, Company>();
    companies.forEach(c => map.set(c.id, c));
    return map;
  }, [companies]);

  // Carregar dados
  const carregarDados = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    else setRefreshing(true);
    try {
      const [listaEmpresas, listaAdmins] = await Promise.all([
        getAllEmpresaUsuarios(),
        getAllAdmins(),
      ]);
      setUsuariosEmpresa(listaEmpresas);
      setAdmins(listaAdmins);
    } catch (err: any) {
      console.error('Erro ao carregar lista de usuários:', err);
      setMensagemErro('Não foi possível carregar a lista de usuários.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Notificação temporária
  const exibirNotificacao = (texto: string, isError = false) => {
    if (isError) {
      setMensagemErro(texto);
      setTimeout(() => setMensagemErro(null), 5000);
    } else {
      setMensagemSucesso(texto);
      setTimeout(() => setMensagemSucesso(null), 4000);
    }
  };

  // Consolidação da lista unificada de usuários
  const listaUnificada: UsuarioSistema[] = useMemo(() => {
    const lista: UsuarioSistema[] = [];

    // 1. Administradores
    admins.forEach(a => {
      lista.push({
        uid: a.uid,
        email: a.email,
        role: 'admin',
        criadoEm: a.criadoEm,
        criadoPorAdmin: a.criadoPorAdmin,
      });
    });

    // 2. Usuários de empresas
    usuariosEmpresa.forEach(u => {
      const comp = companyMap.get(u.empresaId);
      lista.push({
        uid: u.uid,
        email: u.email,
        role: u.role,
        empresaId: u.empresaId,
        empresaNome: comp ? (comp.nomeFantasia || comp.razaoSocial) : 'Empresa não vinculada',
        criadoEm: u.criadoEm,
        criadoPorAdmin: u.criadoPorAdmin,
        desativadoEm: u.desativadoEm,
      });
    });

    // Ordenar pelos mais recentes
    return lista.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }, [admins, usuariosEmpresa, companyMap]);

  // Filtros aplicados
  const usuariosFiltrados = useMemo(() => {
    return listaUnificada.filter(u => {
      // Filtro de texto
      const termo = busca.toLowerCase();
      const matchEmail = u.email.toLowerCase().includes(termo);
      const matchEmpresa = (u.empresaNome || '').toLowerCase().includes(termo);
      const matchBusca = matchEmail || matchEmpresa;

      // Filtro de papel
      let matchPapel = true;
      if (filtroPapel === 'admin') matchPapel = u.role === 'admin';
      else if (filtroPapel === 'empresa') matchPapel = u.role === 'empresa';
      else if (filtroPapel === 'desativado') matchPapel = u.role === 'desativado';

      // Filtro de empresa
      let matchEmpresaSelect = true;
      if (filtroEmpresa !== 'todas') {
        matchEmpresaSelect = u.empresaId === filtroEmpresa;
      }

      return matchBusca && matchPapel && matchEmpresaSelect;
    });
  }, [listaUnificada, busca, filtroPapel, filtroEmpresa]);

  // Contadores KPIs
  const totalUsuarios = listaUnificada.length;
  const totalAdmins = admins.length;
  const totalEmpresasAtivas = usuariosEmpresa.filter(u => u.role === 'empresa').length;
  const totalDesativados = usuariosEmpresa.filter(u => u.role === 'desativado').length;

  // ─── Ações de Usuário ────────────────────────────────────────────────────────

  // Enviar link de redefinição de senha
  const handleRedefinirSenha = async (usuario: UsuarioSistema) => {
    if (!window.confirm(`Deseja enviar o e-mail de redefinição de senha para ${usuario.email}?`)) return;

    setLoadingAcaoId(usuario.uid);
    try {
      await enviarEmailRedefinicaoSenha(usuario.email);
      exibirNotificacao(`E-mail oficial de redefinição de senha enviado para ${usuario.email}`);
    } catch (err: any) {
      console.error(err);
      exibirNotificacao(err.message || 'Erro ao enviar e-mail de recuperação.', true);
    } finally {
      setLoadingAcaoId(null);
    }
  };

  // Alternar Bloqueio / Ativação
  const handleToggleStatus = async (usuario: UsuarioSistema) => {
    if (usuario.role === 'admin') {
      alert('Não é possível desativar uma conta de administrador geral por este painel.');
      return;
    }

    const novoStatus = usuario.role === 'desativado' ? 'ativo' : 'desativado';
    const acaoTexto = novoStatus === 'ativo' ? 'reativar' : 'desativar e bloquear';

    if (!window.confirm(`Tem certeza que deseja ${acaoTexto} o acesso de ${usuario.email}?`)) return;

    setLoadingAcaoId(usuario.uid);
    try {
      await toggleStatusUsuario(usuario.uid, novoStatus, usuario.empresaId);
      exibirNotificacao(`Acesso de ${usuario.email} ${novoStatus === 'ativo' ? 'reativado com sucesso!' : 'bloqueado com sucesso!'}`);
      await carregarDados(true);
    } catch (err: any) {
      console.error(err);
      exibirNotificacao('Erro ao alterar status do usuário.', true);
    } finally {
      setLoadingAcaoId(null);
    }
  };

  // Excluir Acesso
  const handleConfirmarExclusao = async () => {
    if (!usuarioAExcluir) return;

    setLoadingAcaoId(usuarioAExcluir.uid);
    try {
      if (usuarioAExcluir.role === 'admin') {
        alert('Contas de administrador mestre são protegidas e não podem ser excluídas por esta lista.');
        setUsuarioAExcluir(null);
        return;
      }

      if (usuarioAExcluir.empresaId) {
        await removerUsuarioEmpresa(usuarioAExcluir.uid, usuarioAExcluir.empresaId);
      }
      exibirNotificacao(`Acesso de ${usuarioAExcluir.email} removido do sistema.`);
      setUsuarioAExcluir(null);
      await carregarDados(true);
    } catch (err: any) {
      console.error(err);
      exibirNotificacao('Erro ao excluir usuário.', true);
    } finally {
      setLoadingAcaoId(null);
    }
  };

  // Exportar para Planilha CSV
  const handleExportarCsv = () => {
    const dados = usuariosFiltrados.map(u => ({
      'UID': u.uid,
      'E-mail': u.email,
      'Tipo de Usuário': u.role === 'admin' ? 'Administrador Geral' : u.role === 'empresa' ? 'Cliente Empresa' : 'Acesso Desativado',
      'Status': u.role === 'desativado' ? 'DESATIVADO' : 'ATIVO',
      'Empresa Vinculada': u.empresaNome || 'N/A',
      'ID Empresa': u.empresaId || 'N/A',
      'Data de Criação': new Date(u.criadoEm).toLocaleDateString('pt-BR') + ' ' + new Date(u.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      'Criado por': u.criadoPorAdmin || 'Sistema',
    }));

    const dataHoje = new Date().toISOString().slice(0, 10);
    exportToCsv(`usuarios_sistema_multimed_${dataHoje}.csv`, dados);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">

      {/* ─── TOASTS / FEEDBACK ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {mensagemSucesso && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-600/20 text-sm font-medium"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{mensagemSucesso}</span>
          </motion.div>
        )}
        {mensagemErro && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-rose-600 text-white rounded-2xl shadow-xl shadow-rose-600/20 text-sm font-medium"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{mensagemErro}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CABEÇALHO DA SEÇÃO ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Usuários & Acessos</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Controle central de credenciais, administradores e contas de portais de clientes
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => carregarDados(true)}
            disabled={refreshing || loading}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/90 rounded-xl transition-all shadow-sm hover:border-slate-300 disabled:opacity-50"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={handleExportarCsv}
            disabled={usuariosFiltrados.length === 0}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm hover:border-slate-300 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Exportar Planilha (CSV)</span>
            <span className="sm:hidden">CSV</span>
          </button>

          <button
            onClick={() => setModalNovoUsuarioOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-blue-600/20 hover:shadow-blue-600/30"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* ─── CARDS DE INDICADORES (KPIS) ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total de Usuários</span>
            <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalUsuarios}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Cadastrados no sistema</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600">Administradores</span>
            <span className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600">{totalAdmins}</span>
            <p className="text-[11px] text-indigo-400 mt-0.5">Acesso mestre irrestrito</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Clientes Ativos</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{totalEmpresasAtivas}</span>
            <p className="text-[11px] text-emerald-500 mt-0.5">Portais liberados</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600">Acessos Bloqueados</span>
            <span className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <Lock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600">{totalDesativados}</span>
            <p className="text-[11px] text-rose-400 mt-0.5">Sem permissão de entrada</p>
          </div>
        </div>
      </div>

      {/* ─── FILTROS E BUSCA ─────────────────────────────────────────────────── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Campo de Busca */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por e-mail ou nome da empresa..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtros em Pílulas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFiltroPapel('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filtroPapel === 'todos'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Todos ({totalUsuarios})
            </button>
            <button
              onClick={() => setFiltroPapel('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filtroPapel === 'admin'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admins ({totalAdmins})
            </button>
            <button
              onClick={() => setFiltroPapel('empresa')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filtroPapel === 'empresa'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Empresas ({totalEmpresasAtivas})
            </button>
            <button
              onClick={() => setFiltroPapel('desativado')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filtroPapel === 'desativado'
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Bloqueados ({totalDesativados})
            </button>
          </div>
        </div>

        {/* Filtro Dropdown de Empresa */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Filtrar por empresa:</span>
          </div>
          <select
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="todas">Todas as empresas ({companies.length})</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>
                {c.nomeFantasia || c.razaoSocial}
              </option>
            ))}
          </select>

          {(busca || filtroPapel !== 'todos' || filtroEmpresa !== 'todas') && (
            <button
              onClick={() => {
                setBusca('');
                setFiltroPapel('todos');
                setFiltroEmpresa('todas');
              }}
              className="text-xs text-blue-600 hover:underline font-semibold ml-auto"
            >
              Limpar todos os filtros
            </button>
          )}
        </div>
      </div>

      {/* ─── TABELA / LISTA DE USUÁRIOS ─────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Carregando lista de usuários do sistema...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Nenhum usuário encontrado</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
              Não encontramos nenhum usuário correspondente aos filtros selecionados.
            </p>
            <button
              onClick={() => { setBusca(''); setFiltroPapel('todos'); setFiltroEmpresa('todas'); }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-5">Usuário / E-mail</th>
                  <th className="py-4 px-5">Tipo & Função</th>
                  <th className="py-4 px-5">Empresa Vinculada</th>
                  <th className="py-4 px-5">Status do Acesso</th>
                  <th className="py-4 px-5">Data de Cadastro</th>
                  <th className="py-4 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {usuariosFiltrados.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const isDesativado = u.role === 'desativado';
                  const inicial = u.email ? u.email.charAt(0).toUpperCase() : 'U';

                  return (
                    <tr
                      key={u.uid}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Usuário / E-mail */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm shrink-0 ${
                            isAdmin
                              ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white'
                              : isDesativado
                              ? 'bg-slate-200 text-slate-500'
                              : 'bg-gradient-to-tr from-blue-600 to-cyan-600 text-white'
                          }`}>
                            {inicial}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {u.email}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              UID: {u.uid.slice(0, 8)}...{u.uid.slice(-6)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tipo & Função */}
                      <td className="py-4 px-5">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            Administrador
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            Cliente Empresa
                          </span>
                        )}
                      </td>

                      {/* Empresa Vinculada */}
                      <td className="py-4 px-5">
                        {u.empresaId ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">
                              {u.empresaNome}
                            </span>
                            {onViewCompany && (
                              <button
                                onClick={() => onViewCompany(u.empresaId!)}
                                className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                title="Abrir ficha da empresa"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">
                            Acesso Global do Sistema
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        {isDesativado ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Bloqueado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Ativo
                          </span>
                        )}
                      </td>

                      {/* Data de Cadastro */}
                      <td className="py-4 px-5 text-slate-500 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(u.criadoEm).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Abrir Portal do Cliente se for Empresa */}
                          {u.empresaId && !isDesativado && (
                            <a
                              href={`/#/portal/${u.empresaId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Visualizar Portal do Cliente"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          {/* Enviar E-mail Redefinição de Senha */}
                          <button
                            onClick={() => handleRedefinirSenha(u)}
                            disabled={loadingAcaoId === u.uid}
                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Enviar E-mail de Redefinição de Senha"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Alternar Status (Ativar / Desativar) - Exceto Admins */}
                          {!isAdmin && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={loadingAcaoId === u.uid}
                              className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                isDesativado
                                  ? 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                                  : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title={isDesativado ? 'Reativar Acesso' : 'Bloquear / Desativar Acesso'}
                            >
                              {isDesativado ? (
                                <Unlock className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Lock className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          )}

                          {/* Excluir Acesso - Exceto Admins */}
                          {!isAdmin && (
                            <button
                              onClick={() => setUsuarioAExcluir(u)}
                              disabled={loadingAcaoId === u.uid}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Excluir Acesso do Usuário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL DE CONFIRMAÇÃO DE EXCLUSÃO ───────────────────────────────── */}
      <AnimatePresence>
        {usuarioAExcluir && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">Excluir Acesso do Usuário?</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Tem certeza que deseja remover o acesso de <strong className="text-slate-800">{usuarioAExcluir.email}</strong>?
                  {usuarioAExcluir.empresaNome && (
                    <span> Vinculado a <strong>{usuarioAExcluir.empresaNome}</strong>.</span>
                  )}
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-[11px] text-amber-800 leading-relaxed flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  O usuário perderá imediatamente a permissão para entrar no sistema e em qualquer portal de empresa.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUsuarioAExcluir(null)}
                  disabled={!!loadingAcaoId}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarExclusao}
                  disabled={!!loadingAcaoId}
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-2"
                >
                  {loadingAcaoId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Sim, Excluir</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL DE CRIAÇÃO DE USUÁRIO ────────────────────────────────────── */}
      <AnimatePresence>
        {modalNovoUsuarioOpen && (
          <ModalCriarUsuario
            companies={companies}
            onClose={() => setModalNovoUsuarioOpen(false)}
            onSuccess={async (emailCriado) => {
              exibirNotificacao(`Usuário [${emailCriado}] criado com sucesso!`);
              setModalNovoUsuarioOpen(false);
              await carregarDados(true);
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

// ─── Subcomponente Modal de Criação de Usuário ───────────────────────────────

interface ModalCriarUsuarioProps {
  companies: Company[];
  onClose: () => void;
  onSuccess: (email: string) => void;
}

function ModalCriarUsuario({ companies, onClose, onSuccess }: ModalCriarUsuarioProps) {
  const { user: currentAdmin } = useAuth();
  const [tipo, setTipo] = useState<'empresa' | 'admin'>('empresa');
  const [empresaId, setEmpresaId] = useState<string>(companies[0]?.id || '');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Gerador de senha forte aleatória
  const handleGerarSenhaForte = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSenha(pass);
    setConfirmarSenha(pass);
    setShowSenha(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const emailLimpo = email.trim().toLowerCase();
    if (!emailLimpo) {
      setErro('Informe um endereço de e-mail válido.');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas digitadas não coincidem.');
      return;
    }

    if (tipo === 'empresa' && !empresaId) {
      setErro('Selecione a empresa à qual este usuário será vinculado.');
      return;
    }

    setLoading(true);
    try {
      const adminEmail = currentAdmin?.email || 'admin@multimed.com.br';

      if (tipo === 'empresa') {
        await criarUsuarioEmpresa(empresaId, emailLimpo, senha, adminEmail);
      } else {
        await criarUsuarioAdmin(emailLimpo, senha, adminEmail);
      }

      onSuccess(emailLimpo);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setErro('Este e-mail já está cadastrado no sistema.');
      } else if (err.code === 'auth/invalid-email') {
        setErro('O formato do e-mail é inválido.');
      } else if (err.code === 'auth/weak-password') {
        setErro('A senha é muito fraca. Insira pelo menos 6 caracteres.');
      } else {
        setErro(err.message || 'Erro ao criar usuário. Verifique os dados e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200"
      >
        {/* Header Modal */}
        <div className="p-6 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Cadastrar Novo Usuário</h3>
              <p className="text-xs text-slate-500">Crie credenciais de acesso ao portal da empresa ou admin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {erro && (
            <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          {/* Seleção do Tipo de Usuário */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tipo de Permissão / Papel
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipo('empresa')}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  tipo === 'empresa'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-950 shadow-sm ring-2 ring-blue-600/10'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${tipo === 'empresa' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold">Cliente Empresa</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Acesso exclusivo ao portal de sua empresa
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTipo('admin')}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  tipo === 'admin'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-sm ring-2 ring-indigo-600/10'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${tipo === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold">Administrador</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Controle total sobre todas as empresas
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Seleção de Empresa (se tipo === empresa) */}
          {tipo === 'empresa' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Empresa Contratante
              </label>
              <select
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nomeFantasia || c.razaoSocial} — CNPJ: {c.cnpj}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* E-mail */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              E-mail de Acesso (Login)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="gestor@empresa.com.br"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Senha e Confirmação */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Senha Inicial
              </label>
              <button
                type="button"
                onClick={handleGerarSenhaForte}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                Gerar senha segura
              </button>
            </div>

            <div className="relative">
              <input
                type={showSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Confirmar Senha
              </label>
              <input
                type={showSenha ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                placeholder="Repita a senha digitada"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cadastrando...</span>
                </>
              ) : (
                <span>Criar Usuário</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
