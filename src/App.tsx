/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { CompanyList } from './components/CompanyList';
import { CompanyForm } from './components/CompanyForm';
import { CompanyDashboard } from './components/CompanyDashboard';
import { OverviewDashboard } from './components/OverviewDashboard';
import { CompanyPublicPage } from './components/CompanyPublicPage';
import { UniversalPostsTab } from './components/admin/UniversalPostsTab';
import { CentralRecebimentos } from './components/admin/CentralRecebimentos';
import { GestaoGlobal } from './components/admin/GestaoGlobal';
import { EmpresaPortal } from './components/empresa/EmpresaPortal';
import { Company, Noticia } from './types';
import { LayoutDashboard, Building2, Menu, Search, Wifi, WifiOff, Loader2, Send, Inbox, Layers } from 'lucide-react';
import { useHashRouter } from './hooks/useHashRouter';
import { generateSlug, ensureUniqueSlug } from './utils/slug';
import {
  onEmpresasSnapshot,
  createEmpresa,
  updateEmpresa,
  addNoticia,
  deleteNoticia,
  updateNoticia,
  migrateFromLocalStorage,
  getEmpresaBySlug,
  deleteEmpresa,
} from './lib/firestoreService';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { signOut } from 'firebase/auth';
import { auth } from './lib/firebase';

// ─── Estado de carregamento global ───────────────────────────────────────────

type LoadingState = 'loading' | 'ready' | 'error';

export default function App() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [migrated, setMigrated] = useState(false);

  const [currentView, setCurrentView] = useState<'dashboard' | 'list' | 'create' | 'edit' | 'view' | 'universal-posts' | 'central-recebimentos'>('dashboard');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Página pública por slug (rota pública assíncrona)
  const [publicCompany, setPublicCompany] = useState<Company | null | 'loading' | 'not-found'>('loading');

  const { route, isPublicRoute } = useHashRouter();
  const { user, role, empresaId } = useAuth();

  // ─── Migração localStorage → Firestore (executa uma vez) ──────────────────
  useEffect(() => {
    migrateFromLocalStorage()
      .then((count) => {
        if (count > 0) console.info(`✅ ${count} empresa(s) migrada(s) para o Firestore.`);
        setMigrated(true);
      })
      .catch(() => setMigrated(true));
  }, []);

  // ─── Listener em tempo real do Firestore ──────────────────────────────────
  useEffect(() => {
    // Se não estiver migrado, não faz nada
    if (!migrated) return;
    
    // Só carrega todas as empresas se o usuário for explicitamente um administrador
    if (role !== 'admin') {
      if (role === 'empresa' || !user) {
        setLoadingState('ready');
      }
      return;
    }

    const unsubscribe = onEmpresasSnapshot(
      (data) => {
        setCompanies(data);
        setLoadingState('ready');
      },
      (err) => {
        console.error('Falha ao carregar dados do Firestore:', err);
        setLoadingState('error');
      }
    );

    return () => unsubscribe();
  }, [migrated, role, user]);

  // ─── Rota pública: busca empresa por slug ─────────────────────────────────
  useEffect(() => {
    if (!isPublicRoute) return;
    const slug = route.params.slug;
    setPublicCompany('loading');

    getEmpresaBySlug(slug)
      .then((c) => setPublicCompany(c ?? 'not-found'))
      .catch(() => setPublicCompany('not-found'));
  }, [isPublicRoute, route.params.slug]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSaveCompany = useCallback(
    async (companyData: Omit<Company, 'id' | 'noticias' | 'slug'>) => {
      const baseSlug = generateSlug(companyData.nomeFantasia || companyData.razaoSocial);
      const existingSlugs = companies.map((c) => c.slug);
      const slug = ensureUniqueSlug(baseSlug, existingSlugs);

      await createEmpresa({ ...companyData, slug });
      setCurrentView('list');
    },
    [companies]
  );

  const handleUpdateCompany = useCallback(
    async (companyId: string, updates: Partial<Company>) => {
      await updateEmpresa(companyId, updates);
      if (currentView === 'edit') setCurrentView('view');
    },
    [currentView]
  );

  const handleDeleteCompany = useCallback(
    async (companyId: string) => {
      await deleteEmpresa(companyId);
      setCurrentView('list');
      setSelectedCompanyId(null);
    },
    []
  );

  const handleAddNoticia = useCallback(
    async (companyId: string, noticiaData: Omit<Noticia, 'id' | 'data'>) => {
      await addNoticia(companyId, noticiaData);
    },
    []
  );

  const handleDeleteNoticia = useCallback(
    async (companyId: string, noticiaId: string) => {
      await deleteNoticia(companyId, noticiaId);
    },
    []
  );

  const handleUpdateNoticia = useCallback(
    async (companyId: string, noticiaId: string, noticiaData: Partial<Omit<Noticia, 'id' | 'data'>>) => {
      await updateNoticia(companyId, noticiaId, noticiaData);
    },
    []
  );

  const handleOpenPublicPreview = useCallback((company: Company) => {
    const url = `${window.location.origin}${window.location.pathname}#/empresa/${company.slug}`;
    window.open(url, '_blank');
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  // ─── Rota Pública ─────────────────────────────────────────────────────────

  if (isPublicRoute) {
    if (publicCompany === 'loading') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <span className="text-sm">Carregando página da empresa...</span>
          </div>
        </div>
      );
    }

    if (publicCompany === 'not-found') {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-6">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
            <Building2 className="w-10 h-10 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Empresa não encontrada</h1>
          <p className="text-slate-500 mb-6">
            Não existe nenhuma empresa com o endereço{' '}
            <code className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-mono text-sm">
              {route.params.slug}
            </code>
          </p>
          <a
            href={window.location.pathname}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Voltar ao painel
          </a>
        </div>
      );
    }

    return <CompanyPublicPage company={publicCompany} />;
  }

  // ─── Autenticação Administrativa ──────────────────────────────────────────

  const isLoginRoute = route.path === 'login' || route.path === '/login';

  useEffect(() => {
    if (isLoginRoute && user) {
      window.location.hash = '/';
    } else if (!isLoginRoute && !user && !isPublicRoute) {
      window.location.hash = '/login';
    }
  }, [isLoginRoute, user, isPublicRoute]);

  // Enquanto aguarda o useEffect redirecionar, retorna null ou já renderiza a tela certa
  if (isLoginRoute && user) {
    return null;
  }

  if (!user) {
    return <LoginPage />;
  }

  // ─── Portal da Empresa (role = 'empresa') ────────────────────────────────────────

  if (role === 'empresa' && empresaId) {
    return <EmpresaPortal empresaId={empresaId} />;
  }

  // ─── Painel Admin (Logado) ────────────────────────────────────────────────

  const existingCnpjs = companies.map((c) => c.cnpj);
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  const navItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'empresas', label: 'Empresas Cadastradas', icon: Building2 },
    { id: 'central-recebimentos', label: 'Central de Recebimentos', icon: Inbox },
    { id: 'universal-posts', label: 'Posts Universais', icon: Send },
    { id: 'gestao-global', label: 'Gestão de Demandas', icon: Layers },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'empresas') setCurrentView('list');
    else if (id === 'dashboard') setCurrentView('dashboard');
    else if (id === 'universal-posts') setCurrentView('universal-posts');
    else if (id === 'central-recebimentos') setCurrentView('central-recebimentos');
    else if (id === 'gestao-global') setCurrentView('gestao-global');
    setIsSidebarOpen(false);
  };

  const filteredSidebarCompanies = companies.filter((c) =>
    (c.nomeFantasia?.toLowerCase() || '').includes(sidebarSearch.toLowerCase()) ||
    c.razaoSocial.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
    c.cnpj.includes(sidebarSearch)
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg text-white">CorpCore DB</span>
            </div>
            {/* Indicador de conexão */}
            <div title={loadingState === 'ready' ? 'Conectado ao Firebase' : 'Conectando...'}>
              {loadingState === 'ready' ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-slate-500 animate-pulse" />
              )}
            </div>
          </div>

          <div className="px-4 py-6 flex-1 overflow-y-auto">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
              Menu Principal
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  (item.id === 'empresas' && currentView === 'list') ||
                  (item.id === 'dashboard' && currentView === 'dashboard') ||
                  (item.id === 'central-recebimentos' && currentView === 'central-recebimentos') ||
                  (item.id === 'universal-posts' && currentView === 'universal-posts');
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-10 mb-3 px-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Minhas Unidades
                </div>
                <span className="text-xs text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                  {companies.length}
                </span>
              </div>
            </div>

            <div className="px-2 mb-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar unidade..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full bg-slate-800 text-slate-300 text-sm rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-500 transition-colors"
                />
              </div>
            </div>

            <nav className="space-y-1">
              {filteredSidebarCompanies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCompanyId(c.id);
                    setCurrentView('view');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    currentView === 'view' && selectedCompanyId === c.id
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: c.corPrimaria || '#3b82f6' }}
                  />
                  <span className="truncate">{c.nomeFantasia || c.razaoSocial}</span>
                </button>
              ))}

              {loadingState === 'loading' && (
                <div className="px-3 py-2 flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Carregando...
                </div>
              )}
              {loadingState === 'ready' && companies.length === 0 && (
                <div className="px-3 py-2 text-sm text-slate-500 italic">
                  Nenhuma unidade cadastrada.
                </div>
              )}
              {loadingState === 'ready' && companies.length > 0 && filteredSidebarCompanies.length === 0 && (
                <div className="px-3 py-2 text-sm text-slate-500 italic">
                  Nenhuma unidade encontrada.
                </div>
              )}
            </nav>
          </div>

          {/* Footer da sidebar */}
          <div className="px-4 py-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="truncate">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-semibold border border-slate-700"
            >
              Sair do Sistema
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="font-medium text-slate-900">CorpCore DB</div>
          <div className="w-10" />
        </header>

        {/* Loading overlay */}
        {loadingState === 'loading' && (
          <div className="absolute inset-0 z-10 bg-slate-50/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-slate-800 mb-1">Conectando ao Firebase</div>
              <div className="text-sm text-slate-500">Carregando banco de dados...</div>
            </div>
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          {currentView === 'dashboard' && (
            <OverviewDashboard
              companies={companies}
              onViewCompany={(id) => {
                setSelectedCompanyId(id);
                setCurrentView('view');
              }}
            />
          )}

          {currentView === 'central-recebimentos' && (
            <CentralRecebimentos companies={companies} />
          )}

          {currentView === 'universal-posts' && (
            <div className="p-4 sm:p-8 max-w-7xl mx-auto">
              <UniversalPostsTab companies={companies} />
            </div>
          )}

          {currentView === 'gestao-global' && (
            <GestaoGlobal companies={companies} />
          )}

          {currentView === 'list' && (
            <CompanyList
              companies={companies}
              onViewCompany={(id) => {
                setSelectedCompanyId(id);
                setCurrentView('view');
              }}
              onCreateCompany={() => setCurrentView('create')}
            />
          )}

          {currentView === 'create' && (
            <CompanyForm
              existingCnpjs={existingCnpjs}
              onSave={handleSaveCompany}
              onCancel={() => setCurrentView('list')}
            />
          )}

          {currentView === 'edit' && selectedCompany && (
            <CompanyForm
              existingCnpjs={existingCnpjs.filter(c => c !== selectedCompany.cnpj)}
              initialData={selectedCompany}
              onSave={(updated) => handleUpdateCompany(selectedCompany.id, updated)}
              onCancel={() => setCurrentView('view')}
            />
          )}

          {currentView === 'view' && selectedCompanyId && selectedCompany && (
            <CompanyDashboard
              company={selectedCompany}
              onBack={() => setCurrentView('list')}
              onAddNoticia={handleAddNoticia}
              onDeleteNoticia={handleDeleteNoticia}
              onUpdateNoticia={handleUpdateNoticia}
              onUpdateCompany={handleUpdateCompany}
              onOpenPublicPreview={handleOpenPublicPreview}
              onEditCompany={() => setCurrentView('edit')}
              onDeleteCompany={handleDeleteCompany}
            />
          )}
        </main>
      </div>
    </div>
  );
}
