import React, { useState, useEffect, useMemo } from 'react';
import { Company, PostUniversal, PostUniversalDestinatario, TipoGestao, TIPOS_GESTAO } from '../../types';
import {
  Send, CheckSquare, Square, Building2, Image as ImageIcon, CheckCircle,
  Loader2, Upload, X, History, Search, Edit3, Trash2, Eye, Calendar,
  Tag, ShieldCheck, UserCheck, Sparkles, Filter, AlertTriangle, ExternalLink
} from 'lucide-react';
import {
  addUniversalPost, updateUniversalPost, deleteUniversalPost, onPostsUniversaisSnapshot
} from '../../lib/firestoreService';
import { uploadImage } from '../../lib/storageService';

interface UniversalPostsTabProps {
  companies: Company[];
}

export function UniversalPostsTab({ companies }: UniversalPostsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'novo' | 'historico'>('novo');

  // ─── Estado do Formulário de Novo Disparo ───
  const [formData, setFormData] = useState({
    titulo: '',
    categoria: '',
    imagemUrl: '',
    resumo: '',
    conteudo: ''
  });
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Filtro de destinatários por TAG
  const [recipientTagFilter, setRecipientTagFilter] = useState<string>('all');

  // ─── Estado do Histórico ───
  const [postsHistorico, setPostsHistorico] = useState<PostUniversal[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  const [searchHistorico, setSearchHistorico] = useState('');

  // Modais de Ação no Histórico
  const [editingPost, setEditingPost] = useState<PostUniversal | null>(null);
  const [deletingPost, setDeletingPost] = useState<PostUniversal | null>(null);
  const [previewPost, setPreviewPost] = useState<PostUniversal | null>(null);

  // ─── Listener do Histórico em Tempo Real ───
  useEffect(() => {
    const unsubscribe = onPostsUniversaisSnapshot((posts) => {
      setPostsHistorico(posts);
      setLoadingHistorico(false);
    });
    return () => unsubscribe();
  }, []);

  // ─── Contadores e Filtros de Destinatários ───
  const countGerenciadas = useMemo(
    () => companies.filter((c) => c.tipoGestao === 'gerenciada_multimed').length,
    [companies]
  );
  const countClientes = useMemo(
    () => companies.filter((c) => c.tipoGestao === 'cliente_nao_gerenciada').length,
    [companies]
  );
  const countPropria = useMemo(
    () => companies.filter((c) => c.tipoGestao === 'plataforma_propria').length,
    [companies]
  );

  const filteredRecipients = useMemo(() => {
    if (recipientTagFilter === 'all') return companies;
    if (recipientTagFilter === 'sem_tag') return companies.filter((c) => !c.tipoGestao);
    return companies.filter((c) => c.tipoGestao === recipientTagFilter);
  }, [companies, recipientTagFilter]);

  const toggleAll = () => {
    if (selectedCompanyIds.size === companies.length) {
      setSelectedCompanyIds(new Set());
    } else {
      setSelectedCompanyIds(new Set(companies.map((c) => c.id)));
    }
  };

  const toggleFiltered = () => {
    const allFilteredSelected = filteredRecipients.every((c) => selectedCompanyIds.has(c.id));
    const next = new Set(selectedCompanyIds);
    if (allFilteredSelected) {
      filteredRecipients.forEach((c) => next.delete(c.id));
    } else {
      filteredRecipients.forEach((c) => next.add(c.id));
    }
    setSelectedCompanyIds(next);
  };

  const toggleCompany = (id: string) => {
    const next = new Set(selectedCompanyIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCompanyIds(next);
  };

  // ─── Disparo de Novo Post ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCompanyIds.size === 0) {
      alert('Selecione pelo menos uma empresa para enviar o post.');
      return;
    }

    if (!formData.titulo.trim() || !formData.conteudo.trim()) {
      alert('O título e o conteúdo são obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = formData.imagemUrl;
      if (imagemArquivo) {
        imageUrl = await uploadImage('blog_universal', imagemArquivo);
      }

      const destinatarios: PostUniversalDestinatario[] = companies
        .filter((c) => selectedCompanyIds.has(c.id))
        .map((c) => ({
          id: c.id,
          nome: c.nomeFantasia || c.razaoSocial,
          tag: c.tipoGestao,
        }));

      await addUniversalPost(
        Array.from(selectedCompanyIds),
        {
          titulo: formData.titulo.trim(),
          categoria: formData.categoria.trim() || undefined,
          resumo: formData.resumo.trim() || undefined,
          conteudo: formData.conteudo.trim(),
          imagemUrl: imageUrl || undefined,
        },
        destinatarios
      );

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData({ titulo: '', categoria: '', imagemUrl: '', resumo: '', conteudo: '' });
        setImagemArquivo(null);
        setSelectedCompanyIds(new Set());
        setActiveSubTab('historico');
      }, 2500);
    } catch (error) {
      alert('Erro ao enviar posts universais: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Posts Filtrados no Histórico ───
  const filteredHistorico = useMemo(() => {
    if (!searchHistorico.trim()) return postsHistorico;
    const lower = searchHistorico.toLowerCase();
    return postsHistorico.filter(
      (p) =>
        p.titulo.toLowerCase().includes(lower) ||
        (p.categoria && p.categoria.toLowerCase().includes(lower)) ||
        (p.resumo && p.resumo.toLowerCase().includes(lower)) ||
        (p.destinatarios && p.destinatarios.some((d) => d.nome.toLowerCase().includes(lower)))
    );
  }, [postsHistorico, searchHistorico]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho Principal com Seletor de Abas */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Send className="w-6 h-6 text-blue-600" />
            Posts Universais
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Crie comunicados em massa e gerencie publicações sincronizadas em todos os blogs corporativos.
          </p>
        </div>

        {/* Abas Superiores */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl self-start md:self-auto shrink-0">
          <button
            onClick={() => setActiveSubTab('novo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeSubTab === 'novo'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            Novo Disparo
          </button>
          <button
            onClick={() => setActiveSubTab('historico')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeSubTab === 'historico'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            Histórico de Posts
            {postsHistorico.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 ml-0.5">
                {postsHistorico.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          ABA 1: NOVO DISPARO
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'novo' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          {success ? (
            <div className="flex flex-col items-center justify-center py-16 bg-emerald-50 border border-emerald-100 rounded-2xl animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-emerald-900 mb-2">Disparo Concluído com Sucesso!</h3>
              <p className="text-emerald-700 font-medium text-sm text-center max-w-md">
                O post foi publicado no blog das {selectedCompanyIds.size} empresas selecionadas e registrado no histórico.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Formulário de Criação do Post */}
              <div className="lg:col-span-2 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Título do Post *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-medium"
                      placeholder="Ex: Campanha de Conscientização de Saúde Mental"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                      placeholder="Ex: Saúde, Comunicados, Benefícios"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Imagem de Capa <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    {imagemArquivo || formData.imagemUrl ? (
                      <div className="relative w-full sm:w-80 h-40 rounded-2xl overflow-hidden border border-slate-200 group shadow-sm">
                        <img
                          src={imagemArquivo ? URL.createObjectURL(imagemArquivo) : formData.imagemUrl}
                          alt="Capa"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              setImagemArquivo(null);
                              setFormData({ ...formData, imagemUrl: '' });
                            }}
                            className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow"
                            title="Remover imagem"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full sm:w-80 h-40 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                          <Upload className="w-7 h-7 text-slate-400 mb-2" />
                          <p className="text-sm text-slate-700 font-semibold">Clique para enviar imagem</p>
                          <p className="text-xs text-slate-400 mt-1">PNG, JPG ou WebP até 5MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setImagemArquivo(file);
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Resumo <span className="text-slate-400 font-normal">(Breve descrição para o card público)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.resumo}
                      onChange={(e) => setFormData({ ...formData, resumo: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm resize-none"
                      placeholder="Breve resumo da publicação para atrair o colaborador..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Conteúdo Completo *
                    </label>
                    <textarea
                      required
                      rows={9}
                      value={formData.conteudo}
                      onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-sans leading-relaxed"
                      placeholder="Escreva todo o conteúdo do post aqui. Suporta quebras de linha e texto estruturado..."
                    />
                  </div>
                </div>
              </div>

              {/* Seletor de Empresas Destinatárias com Filtro por TAG */}
              <div className="space-y-4 flex flex-col">
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
                  {/* Header do Seletor */}
                  <div className="bg-slate-100/90 border-b border-slate-200 p-4 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        Destinatários ({selectedCompanyIds.size}/{companies.length})
                      </span>
                      <button
                        type="button"
                        onClick={toggleAll}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        {selectedCompanyIds.size === companies.length ? 'Desmarcar Todas' : 'Marcar Todas'}
                      </button>
                    </div>

                    {/* Filtros rápidos por TAG */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Filtrar lista por TAG:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setRecipientTagFilter('all')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all truncate ${
                            recipientTagFilter === 'all'
                              ? 'bg-slate-900 text-white shadow-sm'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Todas ({companies.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecipientTagFilter('gerenciada_multimed')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all border truncate ${
                            recipientTagFilter === 'gerenciada_multimed'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          Gestão Multimed ({countGerenciadas})
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecipientTagFilter('cliente_nao_gerenciada')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all border truncate ${
                            recipientTagFilter === 'cliente_nao_gerenciada'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          Cliente Multimed ({countClientes})
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecipientTagFilter('plataforma_propria')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all border truncate ${
                            recipientTagFilter === 'plataforma_propria'
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                              : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                          }`}
                        >
                          Plat. Própria ({countPropria})
                        </button>
                      </div>

                      {/* Ação rápida para selecionar todas da TAG filtrada */}
                      {recipientTagFilter !== 'all' && filteredRecipients.length > 0 && (
                        <button
                          type="button"
                          onClick={toggleFiltered}
                          className="w-full text-center text-xs font-bold text-blue-700 bg-blue-100/70 hover:bg-blue-200/70 py-1.5 rounded-lg transition-colors border border-blue-200 mt-1"
                        >
                          {filteredRecipients.every((c) => selectedCompanyIds.has(c.id))
                            ? 'Desmarcar todas desta TAG'
                            : 'Marcar todas desta TAG'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lista de Empresas com Checkbox Individual */}
                  <div className="overflow-y-auto p-2.5 space-y-1.5 max-h-[380px]">
                    {filteredRecipients.map((c) => {
                      const isSelected = selectedCompanyIds.has(c.id);
                      const tagInfo = c.tipoGestao ? TIPOS_GESTAO[c.tipoGestao] : null;

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleCompany(c.id)}
                          className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all border ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-300 shadow-sm'
                              : 'bg-white border-slate-200/80 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 shrink-0" />
                            )}
                            <span
                              className={`text-xs truncate ${
                                isSelected ? 'font-bold text-blue-900' : 'text-slate-700 font-medium'
                              }`}
                            >
                              {c.nomeFantasia || c.razaoSocial}
                            </span>
                          </div>

                          {/* Badge da TAG da empresa */}
                          {tagInfo ? (
                            <span
                              className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tagInfo.bgClass} ${tagInfo.textClass} ${tagInfo.borderClass}`}
                            >
                              {tagInfo.badgeLabel}
                            </span>
                          ) : (
                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-100">
                              Sem Tag
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {filteredRecipients.length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-400 italic">
                        Nenhuma empresa encontrada com a TAG selecionada.
                      </div>
                    )}
                  </div>
                </div>

                {/* Botão de Disparo */}
                <button
                  type="submit"
                  disabled={isSubmitting || selectedCompanyIds.size === 0}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.99] flex items-center justify-center gap-2.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Disparando comunicados...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Disparar para {selectedCompanyIds.size} Empresa{selectedCompanyIds.size !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          ABA 2: HISTÓRICO DE POSTS UNIVERSAIS
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'historico' && (
        <div className="space-y-4">
          {/* Barra de Busca no Histórico */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por título, categoria ou empresa..."
                value={searchHistorico}
                onChange={(e) => setSearchHistorico(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Total de disparos: {postsHistorico.length}
            </div>
          </div>

          {/* Listagem do Histórico */}
          {loadingHistorico ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium">Carregando histórico de posts...</p>
            </div>
          ) : filteredHistorico.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                <History className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {searchHistorico ? 'Nenhum post encontrado' : 'Nenhum post universal disparado ainda'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {searchHistorico
                  ? 'Tente buscar com outro termo ou categoria.'
                  : 'Crie seu primeiro comunicado universal na aba "Novo Disparo" para acompanhar o histórico aqui.'}
              </p>
              {!searchHistorico && (
                <button
                  onClick={() => setActiveSubTab('novo')}
                  className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  Criar primeiro post
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredHistorico.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 group"
                >
                  {/* Thumbnail e Conteúdo Principal */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {post.imagemUrl ? (
                      <img
                        src={post.imagemUrl}
                        alt={post.titulo}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 border border-slate-200"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-blue-50 text-blue-500 border border-blue-100 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-8 h-8 opacity-60" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        {post.categoria && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                            {post.categoria}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(post.data).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {post.titulo}
                      </h3>

                      {post.resumo && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {post.resumo}
                        </p>
                      )}

                      {/* Destinatários com chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        <span className="text-[11px] font-semibold text-slate-400 mr-1">
                          Destinatários ({post.empresaIds.length}):
                        </span>
                        {post.destinatarios && post.destinatarios.length > 0 ? (
                          post.destinatarios.slice(0, 4).map((d) => (
                            <span
                              key={d.id}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[140px]"
                              title={d.nome}
                            >
                              {d.nome}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            {post.empresaIds.length} empresa(s)
                          </span>
                        )}
                        {post.destinatarios && post.destinatarios.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                            +{post.destinatarios.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações: Visualizar, Editar, Excluir */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => setPreviewPost(post)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-200"
                      title="Pré-visualizar Post"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingPost(post)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-blue-200"
                      title="Editar Post em todas as empresas"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => setDeletingPost(post)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-200 hover:border-red-200"
                      title="Excluir Post de todas as empresas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL DE EDIÇÃO DE POST UNIVERSAL
      ───────────────────────────────────────────────────────────────────────────── */}
      {editingPost && (
        <EditUniversalPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSuccess={() => {
            setEditingPost(null);
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL DE EXCLUSÃO DE POST UNIVERSAL
      ───────────────────────────────────────────────────────────────────────────── */}
      {deletingPost && (
        <DeleteUniversalPostModal
          post={deletingPost}
          onClose={() => setDeletingPost(null)}
          onSuccess={() => {
            setDeletingPost(null);
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL DE PRÉ-VISUALIZAÇÃO DE POST UNIVERSAL
      ───────────────────────────────────────────────────────────────────────────── */}
      {previewPost && (
        <PreviewUniversalPostModal
          post={previewPost}
          onClose={() => setPreviewPost(null)}
        />
      )}
    </div>
  );
}

// ─── Modal de Edição de Post Universal ────────────────────────────────────────

function EditUniversalPostModal({
  post,
  onClose,
  onSuccess,
}: {
  post: PostUniversal;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [titulo, setTitulo] = useState(post.titulo);
  const [categoria, setCategoria] = useState(post.categoria || '');
  const [resumo, setResumo] = useState(post.resumo || '');
  const [conteudo, setConteudo] = useState(post.conteudo);
  const [imagemUrl, setImagemUrl] = useState(post.imagemUrl || '');
  const [novaImagem, setNovaImagem] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !conteudo.trim()) {
      alert('Título e conteúdo são obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl = imagemUrl;
      if (novaImagem) {
        finalImageUrl = await uploadImage('blog_universal', novaImagem);
      }

      await updateUniversalPost(
        post.id,
        {
          titulo: titulo.trim(),
          categoria: categoria.trim() || undefined,
          resumo: resumo.trim() || undefined,
          conteudo: conteudo.trim(),
          imagemUrl: finalImageUrl || undefined,
        },
        post.empresaIds
      );

      onSuccess();
    } catch (err) {
      alert('Erro ao atualizar post universal: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-fade-in-up">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              Editar Post Universal
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              As alterações serão sincronizadas nas {post.empresaIds.length} empresas que receberam este post.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Título do Post *</label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
            <input
              type="text"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Imagem de Capa</label>
            {novaImagem || imagemUrl ? (
              <div className="relative w-48 h-28 rounded-xl overflow-hidden border border-slate-200 mb-2">
                <img
                  src={novaImagem ? URL.createObjectURL(novaImagem) : imagemUrl}
                  alt="Capa"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setNovaImagem(null);
                    setImagemUrl('');
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer w-max">
                <Upload className="w-4 h-4 text-slate-400" />
                Enviar nova imagem
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setNovaImagem(file);
                  }}
                />
              </label>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Resumo</label>
            <textarea
              rows={2}
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Conteúdo Completo *</label>
            <textarea
              required
              rows={8}
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sincronizando...
                </>
              ) : (
                'Salvar Alterações em Todas as Empresas'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal de Exclusão de Post Universal ──────────────────────────────────────

function DeleteUniversalPostModal({
  post,
  onClose,
  onSuccess,
}: {
  post: PostUniversal;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteUniversalPost(post.id, post.empresaIds);
      onSuccess();
    } catch (err) {
      alert('Erro ao excluir post universal: ' + (err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-fade-in-up">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2">
          Excluir Post Universal?
        </h3>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          Tem certeza que deseja apagar a publicação <strong className="text-slate-900">"{post.titulo}"</strong>?
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-6 text-xs text-amber-800 font-medium leading-relaxed">
          ⚠️ Esta ação removerá o post do blog de <strong>{post.empresaIds.length} empresa(s)</strong> destinatárias e não poderá ser desfeita.
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-500/20 disabled:opacity-60 flex items-center gap-2"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Removendo em lote...
              </>
            ) : (
              'Sim, Excluir de Todas'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Pré-visualização de Post Universal ──────────────────────────────

function PreviewUniversalPostModal({
  post,
  onClose,
}: {
  post: PostUniversal;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-fade-in-up">
        {post.imagemUrl && (
          <div className="w-full h-56 relative bg-slate-100">
            <img src={post.imagemUrl} alt={post.titulo} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              {post.categoria && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  {post.categoria}
                </span>
              )}
              <span className="text-xs text-slate-400">
                {new Date(post.data).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-3">{post.titulo}</h2>

          {post.resumo && (
            <p className="text-sm font-medium text-slate-600 mb-6 italic border-l-4 border-blue-500 pl-3 py-1 bg-slate-50 rounded-r-lg">
              {post.resumo}
            </p>
          )}

          <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {post.conteudo}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Enviado para {post.empresaIds.length} empresa(s)</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
