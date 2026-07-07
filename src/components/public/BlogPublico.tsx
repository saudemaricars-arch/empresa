import { useState } from 'react';
import { Noticia } from '../../types';
import { PostCard } from './PostCard';
import { PostModal } from './PostModal';
import { Newspaper, ChevronDown } from 'lucide-react';

interface BlogPublicoProps {
  noticias: Noticia[];
  company: { nomeFantasia?: string; razaoSocial: string; slug: string; corPrimaria?: string };
  primaryColor: string;
  rgb: string;
}

const PAGE_SIZE = 6;

export function BlogPublico({ noticias, company, primaryColor, rgb }: BlogPublicoProps) {
  const [selectedPost, setSelectedPost] = useState<Noticia | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (!noticias || noticias.length === 0) return null;

  const destaque = noticias[0];
  const restantes = noticias.slice(1);
  const visiveis = restantes.slice(0, visibleCount - 1);
  const temMais = restantes.length > visibleCount - 1;

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-24 md:mb-20" aria-label="Campanhas & Informativos">
      {/* Título */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full shrink-0" style={{ background: primaryColor }} />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Campanhas & Informativos</h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              {noticias.length} publicaç{noticias.length === 1 ? 'ão' : 'ões'}
            </p>
          </div>
        </div>
        <span
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
          style={{ borderColor: `${primaryColor}40`, color: primaryColor, background: `${primaryColor}0d` }}
        >
          <Newspaper className="w-3.5 h-3.5" />
          Publicações
        </span>
      </div>

      {/* Post destaque */}
      <PostCard
        noticia={destaque}
        primaryColor={primaryColor}
        rgb={rgb}
        destaque
        onClick={() => setSelectedPost(destaque)}
      />

      {/* Grid de posts — 1 col mobile, 2 cols tablet, 3 cols desktop */}
      {visiveis.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-8">
          {visiveis.map(n => (
            <PostCard
              key={n.id}
              noticia={n}
              primaryColor={primaryColor}
              rgb={rgb}
              onClick={() => setSelectedPost(n)}
            />
          ))}
        </div>
      )}

      {/* Botão "Ver mais" */}
      {temMais && (
        <div className="flex justify-center">
          <button
            onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold border-2 transition-all min-h-[48px]"
            style={{ borderColor: primaryColor, color: primaryColor, background: `${primaryColor}0d` }}
          >
            <ChevronDown className="w-4 h-4" />
            Ver mais ({restantes.length - (visibleCount - 1)} restantes)
          </button>
        </div>
      )}

      {/* Modal de post completo */}
      {selectedPost && (
        <PostModal
          noticia={selectedPost}
          company={company}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </section>
  );
}
