import { useEffect } from 'react';
import { Noticia } from '../../types';
import { X, Calendar, User, Tag, Share2, Copy, ExternalLink, ArrowLeft } from 'lucide-react';

interface PostModalProps {
  noticia: Noticia;
  company: { nomeFantasia?: string; razaoSocial: string; slug: string; corPrimaria?: string };
  onClose: () => void;
}

export function PostModal({ noticia, company, onClose }: PostModalProps) {
  const primaryColor = company.corPrimaria || '#2563EB';
  const postUrl = `${window.location.origin}${window.location.pathname}#/empresa/${company.slug}`;

  useEffect(() => {
    // Salva posição de scroll e trava o body
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);

    return () => {
      window.removeEventListener('keydown', fn);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [onClose]);

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(postUrl); } catch { /* fallback */ }
  };

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/*
        Mobile: bottom-sheet (desliza de baixo, ocupa ~95vh)
        Desktop: modal centralizado com max-h
      */}
      <div className="
        bg-white w-full flex flex-col overflow-hidden
        rounded-t-3xl sm:rounded-2xl
        max-h-[95vh] sm:max-h-[90vh]
        sm:max-w-2xl sm:mx-4
        shadow-2xl
      ">
        {/* Handle visual (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors py-2 pr-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar</span>
          </button>

          <div className="flex items-center gap-2">
            {noticia.categoria && (
              <span
                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: `${primaryColor}18`, color: primaryColor }}
              >
                <Tag className="w-3 h-3" />
                {noticia.categoria}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Imagem de capa */}
          {noticia.imagemUrl && (
            <div className="w-full h-52 sm:h-64 overflow-hidden shrink-0">
              <img
                src={noticia.imagemUrl}
                alt={noticia.titulo}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="px-4 sm:px-8 py-5 sm:py-6">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-3">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(noticia.data).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </span>
              {noticia.autor && (
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {noticia.autor}
                </span>
              )}
            </div>

            {/* Título */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {noticia.titulo}
            </h2>

            {/* Resumo */}
            {noticia.resumo && (
              <p className="text-sm sm:text-base font-medium text-gray-600 mb-5 pb-5 border-b border-gray-100 leading-relaxed italic">
                {noticia.resumo}
              </p>
            )}

            {/* Conteúdo */}
            <div className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap pb-6">
              {noticia.conteudo}
            </div>
          </div>
        </div>

        {/* Footer de compartilhamento — fixo na base */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0 safe-area-bottom">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5 shrink-0">
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compartilhar</span>
            </span>
            <div className="flex gap-2 flex-1 justify-end">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors min-h-[44px]"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
