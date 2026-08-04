import { useState, useEffect } from 'react';
import { Company } from '../types';
import {
  Building2, Mail, Phone, MapPin, Globe, Users, Calendar,
  ArrowLeft, Briefcase, ExternalLink, ShieldAlert, Lightbulb, FilePlus, Heart, Brain, PlusCircle, Stethoscope
} from 'lucide-react';
import { BlogPublico } from './public/BlogPublico';
import { SugestaoModal } from './public/SugestaoModal';
import { DenunciaModal } from './public/DenunciaModal';
import { AtestadoModal } from './public/AtestadoModal';
import { AuxilioModal } from './public/AuxilioModal';
import { ApoioSaudeModal } from './public/ApoioSaudeModal';
import { SegurancaTrabalhoModal } from './public/SegurancaTrabalhoModal';

interface CompanyPublicPageProps {
  company: Company;
  onBack?: () => void;
  isPreview?: boolean;
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export function CompanyPublicPage({ company, onBack, isPreview = false }: CompanyPublicPageProps) {
  const [modal, setModal] = useState<'sugestao' | 'denuncia' | 'atestado' | 'auxilio' | 'apoioSaude' | 'segurancaTrabalho' | null>(null);
  const primaryColor = company.corPrimaria || '#2563EB';
  const rgb = hexToRgb(primaryColor);
  const nome = company.nomeFantasia || company.razaoSocial;
  const formatCnpj = (v: string) => v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  const publicUrl = `${window.location.origin}${window.location.pathname}#/empresa/${company.slug}`;

  // SEO dinâmico + meta mobile
  useEffect(() => {
    if (isPreview) return;
    const prev = document.title;
    document.title = `${nome} | CorpCore DB`;

    // Meta description
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = company.descricao?.slice(0, 160) || `Página oficial de ${nome}.`;

    // theme-color (cor da barra do browser mobile)
    let theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!theme) { theme = document.createElement('meta'); theme.name = 'theme-color'; document.head.appendChild(theme); }
    theme.content = primaryColor;

    return () => {
      document.title = prev;
      if (theme) theme.content = '';
    };
  }, [nome, company.descricao, primaryColor, isPreview]);

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      {/* Botão voltar admin — fixo mobile */}
      {onBack && (
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full shadow-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all border border-gray-200 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Admin
          </button>
        </div>
      )}

      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <header
        className="relative overflow-hidden"
        style={{ 
          background: company.fundoUrl 
            ? `linear-gradient(to bottom, rgba(30, 41, 59, 0.7), rgba(30, 41, 59, 0.95)), url(${company.fundoUrl}) center/cover no-repeat` 
            : `linear-gradient(135deg, ${primaryColor} 0%, rgba(${rgb}, 0.75) 60%, #1e293b 100%)` 
        }}
      >
        {/* Decorações de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute -top-20 -right-20 w-72 h-72 sm:w-96 sm:h-96 rounded-full opacity-10 bg-white" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 sm:w-64 sm:h-64 rounded-full opacity-5 bg-white" />
        </div>

        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-16 flex flex-col items-center text-center">
          {/* Logo */}
          {company.logoUrl && (
            <div className="w-48 sm:w-80 h-auto flex items-center justify-center mb-5 sm:mb-6">
              <img
                src={company.logoUrl}
                alt={nome}
                className="max-w-full h-auto max-h-48 sm:max-h-80 object-contain"
              />
            </div>
          )}

          {company.showHeaderTexts !== false && (
            <>
              {/* Subtítulo: Portal do Colaborador */}
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3 leading-tight px-2">
                Portal do Colaborador
              </p>
              
              {/* Nome */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3 leading-tight px-2">
                {nome}
              </h1>
              {company.nomeFantasia && (
                <p className="text-white/60 text-sm mb-4">{company.razaoSocial}</p>
              )}

              {/* Tags — scroll horizontal no mobile se necessário */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-7 sm:mb-8 px-2">
                {company.setor && (
                  <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm rounded-full border border-white/30 flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{company.setor}
                  </span>
                )}
                <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm rounded-full border border-white/30 flex items-center gap-1.5">
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  {company.numeroFuncionarios.toLocaleString('pt-BR')} funcionários
                </span>
                {company.dataFundacao && (
                  <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm rounded-full border border-white/30 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    Desde {new Date(company.dataFundacao).getFullYear()}
                  </span>
                )}
                {(company.noticias?.length ?? 0) > 0 && (
                  <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm rounded-full border border-white/30">
                    📰 {company.noticias!.length} post{company.noticias!.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Wave */}
        <div className="hidden sm:block relative -mb-px">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0,60 C360,0 1080,0 1440,60 L1440,60 L0,60 Z" fill="#f9fafb" />
          </svg>
        </div>
      </header>

      {/* Wrapper para dar respiro no mobile entre header e conteúdo */}
      <div className="pt-6 sm:pt-10 px-4 sm:px-0">
        
        {/* CTAs — Movidos para baixo do header */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full max-w-4xl mx-auto mb-8 sm:mb-12">
          {!isPreview && (
            <>
              {company.enableDenuncias !== false && (
                <button
                  onClick={() => setModal('denuncia')}
                  className="flex-1 min-w-[140px] sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 p-3 sm:px-6 sm:py-3.5 bg-red-600 text-white text-xs sm:text-sm font-bold rounded-2xl hover:bg-red-700 transition-all shadow-md min-h-[68px] sm:min-h-[52px] text-center"
                >
                  <ShieldAlert className="w-5 h-5 sm:w-4 sm:h-4" /> 
                  <span>Canal de<br className="sm:hidden" /> Denúncia</span>
                </button>
              )}
              {company.enableSugestoes !== false && (
                <button
                  onClick={() => setModal('sugestao')}
                  className="flex-1 min-w-[140px] sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 p-3 sm:px-6 sm:py-3.5 bg-orange-500 text-white text-xs sm:text-sm font-bold rounded-2xl hover:bg-orange-600 transition-all shadow-md min-h-[68px] sm:min-h-[52px] text-center"
                >
                  <Lightbulb className="w-5 h-5 sm:w-4 sm:h-4" /> 
                  <span>Enviar<br className="sm:hidden" /> Sugestão</span>
                </button>
              )}
              {company.enableAtestados !== false && (
                <button
                  onClick={() => setModal('atestado')}
                  className="flex-1 min-w-[140px] sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 p-3 sm:px-6 sm:py-3.5 bg-blue-600 text-white text-xs sm:text-sm font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-md min-h-[68px] sm:min-h-[52px] text-center"
                >
                  <FilePlus className="w-5 h-5 sm:w-4 sm:h-4" /> 
                  <span>Enviar<br className="sm:hidden" /> Atestado</span>
                </button>
              )}
              {company.enableAuxilios !== false && (
                <button
                  onClick={() => setModal('auxilio')}
                  className="flex-1 min-w-[140px] sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 p-3 sm:px-6 sm:py-3.5 bg-purple-600 text-white text-xs sm:text-sm font-bold rounded-2xl hover:bg-purple-700 transition-all shadow-md min-h-[68px] sm:min-h-[52px] text-center"
                >
                  <Brain className="w-5 h-5 sm:w-4 sm:h-4" /> 
                  <span>Apoio<br className="sm:hidden" /> Emocional</span>
                </button>
              )}
              {company.enableApoioSaude !== false && (
                <button
                  onClick={() => setModal('apoioSaude')}
                  className="flex-1 min-w-[140px] sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 p-3 sm:px-6 sm:py-3.5 bg-teal-500 text-white text-xs sm:text-sm font-bold rounded-2xl hover:bg-teal-600 transition-all shadow-md min-h-[68px] sm:min-h-[52px] text-center"
                >
                  <Stethoscope className="w-5 h-5 sm:w-4 sm:h-4" /> 
                  <span>Apoio à<br className="sm:hidden" /> Saúde</span>
                </button>
              )}
              {company.enableSegurancaTrabalho !== false && (
                <button
                  onClick={() => setModal('segurancaTrabalho')}
                  className="flex-1 min-w-[140px] sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 p-3 sm:px-6 sm:py-3.5 bg-green-600 text-white text-xs sm:text-sm font-bold rounded-2xl hover:bg-green-700 transition-all shadow-md min-h-[68px] sm:min-h-[52px] text-center"
                >
                  <PlusCircle className="w-5 h-5 sm:w-4 sm:h-4" /> 
                  <span>Segurança<br className="sm:hidden" /> do Trabalho</span>
                </button>
              )}
            </>
          )}
          {company.website && (
            <a
              href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[140px] sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 p-3 sm:px-6 sm:py-3.5 bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold rounded-2xl hover:bg-slate-200 transition-all shadow-sm min-h-[68px] sm:min-h-[52px] text-center"
            >
              <Globe className="w-5 h-5 sm:w-4 sm:h-4" /> 
              <span className="flex items-center gap-1">Visitar Site <ExternalLink className="hidden sm:block w-3.5 h-3.5" /></span>
            </a>
          )}
        </div>

      {/* ─── BLOG ─────────────────────────────────────────────────────── */}
      <BlogPublico
        noticias={company.noticias || []}
        company={{ nomeFantasia: company.nomeFantasia, razaoSocial: company.razaoSocial, slug: company.slug, corPrimaria: company.corPrimaria }}
        primaryColor={primaryColor}
        rgb={rgb}
      />

      {/* ─── SOBRE NÓS ────────────────────────────────────────────────── */}
      {company.descricao && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-1 h-7 sm:h-8 rounded-full" style={{ background: primaryColor }} />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Bem vindo ao Portal do colaborador</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
              {company.descricao}
            </p>
          </div>
        </div>
      )}

      {/* ─── CARDS DE CONTATO ─────────────────────────────────────────── */}
      {(company.email || company.telefone || company.endereco) && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-16 sm:mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {company.email && (
              <a
                href={`mailto:${company.email}`}
                className="flex items-center gap-4 p-4 sm:p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.98] transition-all group min-h-[72px]"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `rgba(${rgb}, 0.1)` }}>
                  <Mail className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">E-mail</div>
                  <div className="text-sm font-medium text-gray-800 truncate">{company.email}</div>
                </div>
              </a>
            )}
            {company.telefone && (
              <a
                href={`tel:${company.telefone}`}
                className="flex items-center gap-4 p-4 sm:p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.98] transition-all min-h-[72px]"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `rgba(${rgb}, 0.1)` }}>
                  <Phone className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Telefone</div>
                  <div className="text-sm font-medium text-gray-800">{company.telefone}</div>
                </div>
              </a>
            )}
            {company.endereco && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(company.endereco)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 sm:p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.98] transition-all min-h-[72px] sm:col-span-2 md:col-span-1"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `rgba(${rgb}, 0.1)` }}>
                  <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Localização</div>
                  <div className="text-sm font-medium text-gray-800 line-clamp-2">{company.endereco}</div>
                </div>
              </a>
            )}
          </div>
        </div>
      )}

      {/* ─── RODAPÉ ───────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 py-8 sm:py-10" style={{ background: '#1e293b' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-slate-400 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>{nome}</span>
            </div>
            <span className="hidden sm:inline text-slate-600">·</span>
            <span className="text-xs text-slate-500">CNPJ: {formatCnpj(company.cnpj)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <span>Powered by</span>
            <span className="font-bold" style={{ color: primaryColor }}>CorpCore DB</span>
          </div>
        </div>
        {!isPreview && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-4 pt-4 border-t border-slate-700/50">
            <p className="text-xs text-slate-600 text-center break-all">{publicUrl}</p>
          </div>
        )}
      </footer>

      {/* ─── MODAIS ─────────────────────────────────────────────────────── */}
      {modal === 'sugestao' && (
        <SugestaoModal
          empresaId={company.id}
          empresaNome={nome}
          primaryColor={primaryColor}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'denuncia' && (
        <DenunciaModal
          empresaId={company.id}
          empresaNome={nome}
          primaryColor={primaryColor}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'atestado' && (
        <AtestadoModal
          empresaId={company.id}
          empresaNome={nome}
          primaryColor={primaryColor}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'auxilio' && (
        <AuxilioModal
          companyId={company.id}
          primaryColor={primaryColor}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'apoioSaude' && (
        <ApoioSaudeModal
          companyId={company.id}
          primaryColor={primaryColor}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'segurancaTrabalho' && (
        <SegurancaTrabalhoModal
          empresaId={company.id}
          empresaNome={nome}
          primaryColor={primaryColor}
          onClose={() => setModal(null)}
        />
      )}
      </div>
    </div>
  );
}
