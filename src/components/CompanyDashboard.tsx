import React, { useState, useEffect } from 'react';
import { Company, Noticia, TIPOS_GESTAO } from '../types';
import {
  ArrowLeft, Building2, Users, MapPin, Phone, Mail, Briefcase, Calendar,
  FileText, Plus, Trash2, Globe, Lightbulb, ShieldAlert, Image, User, Tag, Edit, Trash, Upload, Loader2, Info, FilePlus, Heart, Brain, PlusCircle, Stethoscope, ShieldCheck, KeyRound, Save
} from 'lucide-react';
import { motion } from 'motion/react';
import { PublicPageTab } from './PublicPageTab';
import { SugestoesTab } from './admin/SugestoesTab';
import { DenunciasTab } from './admin/DenunciasTab';
import { AtestadosTab } from './admin/AtestadosTab';
import { AuxiliosTab } from './admin/AuxiliosTab';
import { ApoioSaudeTab } from './admin/ApoioSaudeTab';
import { SegurancaTrabalhoTab } from './admin/SegurancaTrabalhoTab';
import { CriarAcessoEmpresaModal } from './admin/CriarAcessoEmpresaModal';
import { AcessoEmpresaTab } from './admin/AcessoEmpresaTab';
import { onNoticiasSnapshot } from '../lib/firestoreService';
import { uploadImage } from '../lib/storageService';

interface CompanyDashboardProps {
  company: Company;
  onBack: () => void;
  onAddNoticia: (companyId: string, noticia: Omit<Noticia, 'id' | 'data'>) => void;
  onDeleteNoticia: (companyId: string, noticiaId: string) => void;
  onUpdateNoticia?: (companyId: string, noticiaId: string, noticia: Partial<Omit<Noticia, 'id' | 'data'>>) => void;
  onUpdateCompany: (companyId: string, updates: Partial<Company>) => void;
  onOpenPublicPreview: (company: Company) => void;
  onEditCompany: (company: Company) => void;
  onDeleteCompany: (companyId: string) => void;
}

type TabId = 'overview' | 'blog' | 'pagina' | 'sugestoes' | 'denuncias' | 'atestados' | 'auxilios' | 'apoioSaude' | 'segurancaTrabalho' | 'acesso';

export function CompanyDashboard({
  company, onBack, onAddNoticia, onDeleteNoticia, onUpdateNoticia, onUpdateCompany, onOpenPublicPreview,
  onEditCompany, onDeleteCompany,
}: CompanyDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showNoticiaForm, setShowNoticiaForm] = useState(false);
  const [editingNoticiaId, setEditingNoticiaId] = useState<string | null>(null);
  const [noticiaForm, setNoticiaForm] = useState({
    titulo: '', resumo: '', conteudo: '', categoria: '', autor: '', imagemUrl: '',
  });
  const [noticias, setNoticias] = useState<Noticia[]>(company.noticias || []);
  const [uploadingPostImage, setUploadingPostImage] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAcessoModal, setShowAcessoModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onNoticiasSnapshot(company.id, (data) => {
      setNoticias(data);
    });
    return () => unsubscribe();
  }, [company.id]);

  const primaryColor = company.corPrimaria || '#2563EB';
  const formatCnpj = (v: string) => v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');

  const novasSugestoes  = (company.sugestoes  || []).filter(s => s.status === 'nova').length;
  const novasDenuncias  = (company.denuncias   || []).filter(d => d.status === 'nova').length;
  const novosAtestados  = (company.atestados   || []).filter(a => a.status === 'pendente').length;
  const novosAuxilios   = (company.auxilios    || []).filter(a => a.status === 'pendente').length;
  const novosApoiosSaude = (company.apoioSaude || []).filter(a => a.status === 'pendente').length;
  const novosSegurancaTrabalho = (company.segurancaTrabalho || []).filter(s => s.status === 'nova').length;

  const handleSaveNoticia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticiaForm.titulo.trim() || !noticiaForm.conteudo.trim()) return;

    const payload = {
      titulo:    noticiaForm.titulo.trim(),
      resumo:    noticiaForm.resumo.trim() || undefined,
      conteudo:  noticiaForm.conteudo.trim(),
      categoria: noticiaForm.categoria.trim() || undefined,
      autor:     noticiaForm.autor.trim() || undefined,
      imagemUrl: noticiaForm.imagemUrl.trim() || undefined,
    };

    try {
      if (editingNoticiaId) {
        if (onUpdateNoticia) {
          await onUpdateNoticia(company.id, editingNoticiaId, payload);
        }
        setEditingNoticiaId(null);
      } else {
        await onAddNoticia(company.id, payload);
      }
      setNoticiaForm({ titulo: '', resumo: '', conteudo: '', categoria: '', autor: '', imagemUrl: '' });
      setShowNoticiaForm(false);
    } catch (err) {
      console.error('Erro ao salvar publicação:', err);
      alert('Ocorreu um erro ao salvar a publicação.');
    }
  };

  const handleStartEditNoticia = (n: Noticia) => {
    setEditingNoticiaId(n.id);
    setNoticiaForm({
      titulo: n.titulo,
      resumo: n.resumo || '',
      conteudo: n.conteudo,
      categoria: n.categoria || '',
      autor: n.autor || '',
      imagemUrl: n.imagemUrl || '',
    });
    setShowNoticiaForm(true);
  };

  const handleCancelNoticiaForm = () => {
    setEditingNoticiaId(null);
    setNoticiaForm({ titulo: '', resumo: '', conteudo: '', categoria: '', autor: '', imagemUrl: '' });
    setShowNoticiaForm(false);
  };

  const handleRemoveNoticia = async (noticiaId: string) => {
    try {
      await onDeleteNoticia(company.id, noticiaId);
      setConfirmDeleteId(null);
    } catch (e) {
      alert('Erro ao remover: ' + (e as Error).message);
    }
  };

  const handleDeleteCompany = () => {
    if (window.confirm(`Tem certeza que deseja apagar a empresa "${company.nomeFantasia || company.razaoSocial}"? Esta ação não pode ser desfeita e apagará todos os dados associados.`)) {
      onDeleteCompany(company.id);
    }
  };

  const tabs: { id: TabId; label: string; icon: typeof Building2; badge?: number; badgeColor?: string }[] = [
    { id: 'overview',   label: 'Visão Geral',    icon: Building2   },
    { id: 'blog',       label: 'Blog',            icon: FileText,   badge: noticias.length },
    { id: 'pagina',     label: 'Página Pública',  icon: Globe       },
    { id: 'sugestoes',  label: 'Sugestões',       icon: Lightbulb,  badge: novasSugestoes,  badgeColor: 'bg-orange-500' },
    { id: 'denuncias',  label: 'Denúncias',       icon: ShieldAlert, badge: novasDenuncias, badgeColor: 'bg-red-500'  },
    { id: 'atestados',  label: 'Atestados',       icon: FilePlus,    badge: novosAtestados, badgeColor: 'bg-blue-500' },
    { id: 'auxilios',   label: 'Apoio Emocional', icon: Brain,       badge: novosAuxilios,  badgeColor: 'bg-purple-500' },
    { id: 'apoioSaude', label: 'Apoio à Saúde',   icon: Stethoscope, badge: novosApoiosSaude, badgeColor: 'bg-teal-500' },
    { id: 'segurancaTrabalho', label: 'Seg. do Trabalho', icon: PlusCircle, badge: novosSegurancaTrabalho, badgeColor: 'bg-green-500' },
    { id: 'acesso',     label: 'Acesso Empresa',  icon: KeyRound },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar para listagem
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="h-32" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #1e293b 100%)` }} />
        <div className="px-6 sm:px-8 pb-8 relative">
          <div className="flex justify-between items-end -mt-12 mb-4">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center overflow-hidden p-1.5 relative group">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.nomeFantasia || company.razaoSocial}
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <Building2 className="w-12 h-12" style={{ color: primaryColor }} />
              )}
              <button
                type="button"
                onClick={() => onEditCompany(company)}
                className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-medium rounded-2xl backdrop-blur-[1px]"
                title="Alterar logo da empresa"
              >
                <Edit className="w-4 h-4 mb-0.5" />
                <span>Trocar Logo</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              {company.tipoGestao && TIPOS_GESTAO[company.tipoGestao] ? (
                <span
                  className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${TIPOS_GESTAO[company.tipoGestao].bgClass} ${TIPOS_GESTAO[company.tipoGestao].textClass} ${TIPOS_GESTAO[company.tipoGestao].borderClass}`}
                  title={TIPOS_GESTAO[company.tipoGestao].descricao}
                >
                  <span className={`w-2 h-2 rounded-full ${TIPOS_GESTAO[company.tipoGestao].dotClass}`} />
                  {TIPOS_GESTAO[company.tipoGestao].label}
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  Sem Tag de Gestão
                </span>
              )}
              <div className="hidden sm:block bg-slate-100 text-slate-700 font-medium px-3 py-1 text-sm rounded-lg border border-slate-200">
                CNPJ: {formatCnpj(company.cnpj)}
              </div>
              <button
                onClick={() => onEditCompany(company)}
                className="p-2 bg-white text-slate-600 rounded-lg shadow-sm border border-slate-200 hover:text-blue-600 hover:border-blue-200 transition-colors"
                title="Editar Empresa"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteCompany}
                className="p-2 bg-white text-slate-600 rounded-lg shadow-sm border border-slate-200 hover:text-red-600 hover:border-red-200 transition-colors"
                title="Apagar Empresa"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{company.nomeFantasia || company.razaoSocial}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-slate-500">{company.razaoSocial}</p>
            <span className="sm:hidden text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{formatCnpj(company.cnpj)}</span>
            {company.tipoGestao && TIPOS_GESTAO[company.tipoGestao] && (
              <span className={`sm:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${TIPOS_GESTAO[company.tipoGestao].bgClass} ${TIPOS_GESTAO[company.tipoGestao].textClass} ${TIPOS_GESTAO[company.tipoGestao].borderClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${TIPOS_GESTAO[company.tipoGestao].dotClass}`} />
                {TIPOS_GESTAO[company.tipoGestao].badgeLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-8 overflow-x-auto">
        <nav className="-mb-px flex space-x-1 min-w-max">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap pb-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full text-white font-bold ${tab.badgeColor || 'bg-slate-400'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ─── Visão Geral ─── */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4 border-b border-slate-100 pb-3">Informações Principais</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                <div><div className="text-sm font-medium text-slate-900">Tamanho</div><div className="text-sm text-slate-500">{company.numeroFuncionarios} funcionários</div></div>
              </div>
              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-slate-900">Gestão & Relacionamento (TAG)</div>
                  <div className="text-sm text-slate-600 mt-0.5">
                    {company.tipoGestao && TIPOS_GESTAO[company.tipoGestao] ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border mt-1" style={{ borderColor: 'currentColor' }}>
                        <span className={`w-1.5 h-1.5 rounded-full ${TIPOS_GESTAO[company.tipoGestao].dotClass}`} />
                        {TIPOS_GESTAO[company.tipoGestao].label}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Não definida</span>
                    )}
                  </div>
                </div>
              </div>
              {company.setor && <div className="flex items-start gap-3"><Briefcase className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" /><div><div className="text-sm font-medium text-slate-900">Setor</div><div className="text-sm text-slate-500">{company.setor}</div></div></div>}
              {company.dataFundacao && <div className="flex items-start gap-3"><Calendar className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" /><div><div className="text-sm font-medium text-slate-900">Fundação</div><div className="text-sm text-slate-500">{new Date(company.dataFundacao).toLocaleDateString('pt-BR')}</div></div></div>}
              {company.descricao && <div className="mt-2 pt-3 border-t border-slate-100"><div className="text-sm font-medium text-slate-900 mb-1">Sobre</div><div className="text-sm text-slate-500 line-clamp-3">{company.descricao}</div></div>}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4 border-b border-slate-100 pb-3">Contato & Localização</h3>
            <div className="space-y-4">
              {company.email ? <div className="flex items-start gap-3"><Mail className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" /><div><div className="text-sm font-medium text-slate-900">E-mail</div><div className="text-sm text-slate-500">{company.email}</div></div></div> : <div className="text-sm text-slate-400 italic">E-mail não informado</div>}
              {company.telefone ? <div className="flex items-start gap-3"><Phone className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" /><div><div className="text-sm font-medium text-slate-900">Telefone</div><div className="text-sm text-slate-500">{company.telefone}</div></div></div> : <div className="text-sm text-slate-400 italic pl-8">Telefone não informado</div>}
              {company.endereco ? <div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" /><div><div className="text-sm font-medium text-slate-900">Endereço</div><div className="text-sm text-slate-500">{company.endereco}</div></div></div> : <div className="text-sm text-slate-400 italic pl-8">Endereço não informado</div>}
              {company.website && <div className="flex items-start gap-3"><Globe className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" /><div><div className="text-sm font-medium text-slate-900">Website</div><a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{company.website}</a></div></div>}
            </div>
          </div>
          {/* Stats rápidas */}
          <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Posts',            value: noticias.length,                 icon: FileText,    color: 'text-blue-600',   bg: 'bg-blue-50' },
              { label: 'Sugestões',        value: company.sugestoes?.length || 0,  icon: Lightbulb,   color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Denúncias',        value: company.denuncias?.length || 0,  icon: ShieldAlert, color: 'text-red-600',    bg: 'bg-red-50'   },
              { label: 'Atestados',        value: company.atestados?.length || 0,  icon: FilePlus,    color: 'text-blue-600',  bg: 'bg-blue-50' },
              { label: 'Apoio',            value: company.auxilios?.length || 0,   icon: Brain,       color: 'text-purple-600',   bg: 'bg-purple-50' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}><s.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.color}`} /></div>
                <div><div className="text-xl sm:text-2xl font-bold text-slate-900">{s.value}</div><div className="text-[10px] sm:text-xs text-slate-500 truncate">{s.label}</div></div>
              </div>
            ))}
          </div>

          {/* Funcionalidades Opcionais */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Funcionalidades do Perfil</h2>
                <p className="text-sm text-slate-500">Ative ou desative os recursos interativos na página pública da empresa</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <label className="flex items-start gap-3 cursor-pointer bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={company.enableSugestoes !== false}
                  onChange={(e) => onUpdateCompany(company.id, { enableSugestoes: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900">Receber Sugestões</div>
                  <div className="text-xs text-slate-500 mt-1">Permite que visitantes enviem sugestões anônimas ou identificadas pela página pública.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={company.enableDenuncias !== false}
                  onChange={(e) => onUpdateCompany(company.id, { enableDenuncias: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900">Receber Denúncias</div>
                  <div className="text-xs text-slate-500 mt-1">Habilita um canal confidencial para relatar infrações ou desvios de conduta.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={company.enableAtestados !== false}
                  onChange={(e) => onUpdateCompany(company.id, { enableAtestados: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900">Receber Atestados</div>
                  <div className="text-xs text-slate-500 mt-1">Habilita o envio de atestados médicos digitalizados pelos funcionários.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={company.enableAuxilios !== false}
                  onChange={(e) => onUpdateCompany(company.id, { enableAuxilios: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900">Apoio Emocional</div>
                  <div className="text-xs text-slate-500 mt-1">Permite que funcionários solicitem acolhimento psicológico ou psiquiátrico com sigilo.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={company.enableApoioSaude !== false}
                  onChange={(e) => onUpdateCompany(company.id, { enableApoioSaude: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900">Apoio à Saúde</div>
                  <div className="text-xs text-slate-500 mt-1">Habilita a solicitação de consultas médicas e descontos.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={company.enableSegurancaTrabalho !== false}
                  onChange={(e) => onUpdateCompany(company.id, { enableSegurancaTrabalho: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900">Segurança do Trabalho</div>
                  <div className="text-xs text-slate-500 mt-1">Habilita reportes sobre incidentes e melhorias na segurança.</div>
                </div>
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Blog ─── */}
      {activeTab === 'blog' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div>
              <h2 className="text-lg font-medium text-slate-900">Publicações do Blog</h2>
              <p className="text-sm text-slate-500">Posts que aparecem na página pública da empresa</p>
            </div>
            {!showNoticiaForm && (
              <button
                onClick={() => {
                  setEditingNoticiaId(null);
                  setNoticiaForm({ titulo: '', resumo: '', conteudo: '', categoria: '', autor: '', imagemUrl: '' });
                  setShowNoticiaForm(true);
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" /> Nova Publicação
              </button>
            )}
          </div>

          {showNoticiaForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    {editingNoticiaId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {editingNoticiaId ? 'Editar Publicação da Campanha' : 'Nova Publicação da Campanha'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {editingNoticiaId ? 'Atualize as informações da publicação para a página pública' : 'Preencha os dados do post que será exibido no blog'}
                    </p>
                  </div>
                </div>
                {editingNoticiaId && (
                  <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-medium">
                    Modo Edição
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveNoticia} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
                    <input type="text" required value={noticiaForm.titulo} onChange={e => setNoticiaForm(p => ({ ...p, titulo: e.target.value }))} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Título da publicação" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Resumo <span className="text-slate-400 font-normal">(aparece nos cards)</span></label>
                    <input type="text" value={noticiaForm.resumo} onChange={e => setNoticiaForm(p => ({ ...p, resumo: e.target.value }))} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Resumo curto do post (opcional)" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Categoria</label>
                    <input type="text" value={noticiaForm.categoria} onChange={e => setNoticiaForm(p => ({ ...p, categoria: e.target.value }))} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: Tecnologia, RH, Produto" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><User className="w-3.5 h-3.5" /> Autor</label>
                    <input type="text" value={noticiaForm.autor} onChange={e => setNoticiaForm(p => ({ ...p, autor: e.target.value }))} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Nome do autor" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Image className="w-3.5 h-3.5" /> Imagem de Capa</label>
                    <div className="flex items-center gap-4">
                      {noticiaForm.imagemUrl && (
                        <img src={noticiaForm.imagemUrl} alt="Preview" className="w-16 h-16 object-cover rounded border border-slate-200" />
                      )}
                      <label className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors ${uploadingPostImage ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploadingPostImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploadingPostImage ? 'Enviando...' : (noticiaForm.imagemUrl ? 'Trocar Imagem' : 'Escolher Imagem')}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setUploadingPostImage(true);
                              const ext = file.name.split('.').pop();
                              const path = `empresas/${company.id}/blog_${Date.now()}.${ext}`;
                              const url = await uploadImage(path, file);
                              setNoticiaForm(p => ({ ...p, imagemUrl: url }));
                            } catch (error) {
                              console.error('Erro ao fazer upload:', error);
                              alert('Erro ao enviar imagem.');
                            } finally {
                              setUploadingPostImage(false);
                            }
                          }}
                        />
                      </label>
                      {noticiaForm.imagemUrl && (
                        <button
                          type="button"
                          onClick={() => setNoticiaForm(p => ({ ...p, imagemUrl: '' }))}
                          className="text-xs text-red-600 hover:text-red-700 underline"
                        >
                          Remover Imagem
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Conteúdo completo *</label>
                    <textarea required rows={6} value={noticiaForm.conteudo} onChange={e => setNoticiaForm(p => ({ ...p, conteudo: e.target.value }))} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Escreva o conteúdo completo do post..." />
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button type="button" onClick={handleCancelNoticiaForm} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md border border-slate-200">Cancelar</button>
                  <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm">
                    {editingNoticiaId ? (
                      <>
                        <Save className="w-4 h-4" /> Salvar Alterações
                      </>
                    ) : (
                      'Publicar'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {noticias.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="mb-1">Nenhuma publicação ainda.</p>
                <p className="text-xs text-slate-400">Crie seu primeiro post para ele aparecer na página pública.</p>
              </div>
            ) : noticias.map(n => (
              <div key={n.id} className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                {n.imagemUrl ? (
                  <div className="h-32 overflow-hidden"><img src={n.imagemUrl} alt={n.titulo} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} /></div>
                ) : (
                  <div className="h-1" style={{ background: primaryColor }} />
                )}
                <div className="p-5 flex-grow">
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {n.categoria && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{n.categoria}</span>}
                    {n.autor && <span className="text-xs text-slate-400">por {n.autor}</span>}
                  </div>
                  <h3 className="font-semibold text-slate-900 leading-tight mb-1">{n.titulo}</h3>
                  {n.resumo && <p className="text-xs text-slate-500 mb-2 italic">{n.resumo}</p>}
                  <p className="text-sm text-slate-500 line-clamp-3">{n.conteudo}</p>
                </div>
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                  <span>{new Date(n.data).toLocaleDateString('pt-BR')}</span>
                  {confirmDeleteId === n.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 font-medium">Excluir mesmo?</span>
                      <button onClick={() => handleRemoveNoticia(n.id)} className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">Sim</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="bg-slate-200 text-slate-700 px-2 py-1 rounded hover:bg-slate-300">Não</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleStartEditNoticia(n)}
                        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                        title="Editar publicação da campanha"
                      >
                        <Edit className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(n.id)}
                        className="text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
                        title="Remover publicação"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remover
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── Página Pública ─── */}
      {activeTab === 'pagina' && (
        <PublicPageTab company={{ ...company, noticias }} onUpdateCompany={u => onUpdateCompany(company.id, u)} onOpenPreview={() => onOpenPublicPreview({ ...company, noticias })} />
      )}

      {/* ─── Sugestões ─── */}
      {activeTab === 'sugestoes' && (
        <SugestoesTab sugestoes={company.sugestoes || []} empresaId={company.id} primaryColor={primaryColor} />
      )}

      {/* ─── Denúncias ─── */}
      {activeTab === 'denuncias' && (
        <DenunciasTab denuncias={company.denuncias || []} empresaId={company.id} />
      )}

      {/* ─── Atestados ─── */}
      {activeTab === 'atestados' && (
        <AtestadosTab atestados={company.atestados || []} empresaId={company.id} />
      )}

      {/* ─── Apoio Emocional ─── */}
      {activeTab === 'auxilios' && (
        <AuxiliosTab company={company} />
      )}

      {/* ─── Apoio à Saúde ─── */}
      {activeTab === 'apoioSaude' && (
        <ApoioSaudeTab company={company} />
      )}

      {/* ─── Segurança do Trabalho ─── */}
      {activeTab === 'segurancaTrabalho' && (
        <SegurancaTrabalhoTab empresaId={company.id} />
      )}

      {/* ─── Acesso da Empresa ─── */}
      {activeTab === 'acesso' && (
        <AcessoEmpresaTab company={company} onAbrirModal={() => setShowAcessoModal(true)} />
      )}

      {/* Modal de criar acesso */}
      {showAcessoModal && (
        <CriarAcessoEmpresaModal
          company={company}
          onClose={() => setShowAcessoModal(false)}
          onSuccess={() => setShowAcessoModal(false)}
        />
      )}
    </div>
  );
}
