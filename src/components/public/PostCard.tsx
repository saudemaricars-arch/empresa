import { useState } from 'react';
import { Noticia } from '../../types';
import { Calendar, Tag, User, ArrowRight } from 'lucide-react';

interface PostCardProps {
  noticia: Noticia;
  primaryColor: string;
  rgb: string;
  destaque?: boolean;
  onClick: () => void;
}

export function PostCard({ noticia, primaryColor, rgb, destaque = false, onClick }: PostCardProps) {
  const [imgError, setImgError] = useState(false);

  const dataFormatada = new Date(noticia.data).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const resumoExibido = noticia.resumo || noticia.conteudo.slice(0, 140) + (noticia.conteudo.length > 140 ? '…' : '');

  if (destaque) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-5 cursor-pointer active:scale-[0.99] transition-all group"
        style={{
          background: `linear-gradient(135deg, rgba(${rgb}, 0.05) 0%, white 100%)`,
          borderLeft: `4px solid ${primaryColor}`,
        }}
      >
        {/* Imagem de capa (topo no mobile, lado no desktop) */}
        {noticia.imagemUrl && !imgError && (
          <div className="w-full h-48 md:hidden overflow-hidden">
            <img
              src={noticia.imagemUrl}
              alt={noticia.titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
            />
          </div>
        )}

        <div className="flex flex-col md:flex-row">
          {/* Imagem lateral (só desktop) */}
          {noticia.imagemUrl && !imgError && (
            <div className="hidden md:block md:w-2/5 overflow-hidden shrink-0">
              <img
                src={noticia.imagemUrl}
                alt={noticia.titulo}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={() => setImgError(true)}
              />
            </div>
          )}

          <div className="p-5 md:p-8 flex flex-col justify-between flex-1 gap-3">
            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: `rgba(${rgb}, 0.12)`, color: primaryColor }}
              >
                ✨ Mais Recente
              </span>
              {noticia.categoria && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                  <Tag className="w-3 h-3" />
                  {noticia.categoria}
                </span>
              )}
            </div>

            {/* Título */}
            <h3 className="text-lg md:text-2xl font-bold text-gray-900 leading-tight" style={{ color: 'inherit' }}>
              {noticia.titulo}
            </h3>

            {/* Resumo */}
            <p className="text-sm md:text-base text-gray-500 leading-relaxed line-clamp-3">
              {resumoExibido}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {dataFormatada}
                </span>
                {noticia.autor && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {noticia.autor}
                  </span>
                )}
              </div>
              <span
                className="flex items-center gap-1 text-sm font-semibold shrink-0 ml-2"
                style={{ color: primaryColor }}
              >
                Ler <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Card normal — scroll horizontal no mobile, grid no desktop
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden cursor-pointer active:scale-[0.98] transition-all group"
    >
      {noticia.imagemUrl && !imgError ? (
        <div className="h-40 overflow-hidden shrink-0">
          <img
            src={noticia.imagemUrl}
            alt={noticia.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="h-1.5 w-full shrink-0" style={{ background: primaryColor }} />
      )}

      <div className="p-4 md:p-5 flex-1 flex flex-col gap-2">
        {noticia.categoria && (
          <span className="self-start inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            <Tag className="w-3 h-3" />
            {noticia.categoria}
          </span>
        )}
        <h4 className="font-bold text-gray-900 leading-snug line-clamp-2 flex-1 text-sm md:text-base">
          {noticia.titulo}
        </h4>
        <p className="text-xs md:text-sm text-gray-500 leading-relaxed line-clamp-2">
          {resumoExibido}
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {dataFormatada}
          </span>
          <span className="text-xs font-semibold flex items-center gap-0.5" style={{ color: primaryColor }}>
            Ler <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </button>
  );
}
