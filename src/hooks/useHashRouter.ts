import { useState, useEffect } from 'react';

export interface HashRoute {
  path: string;           // ex: "/empresa/tech-solutions-ltda"
  segments: string[];     // ex: ["empresa", "tech-solutions-ltda"]
  params: Record<string, string>;
}

/**
 * Hook de roteamento por hash simples.
 * Detecta mudanças em window.location.hash e retorna a rota atual.
 * Rota pública: /#/empresa/{slug}
 * Rota admin:   / (sem hash ou hash vazio)
 */
export function useHashRouter(): { route: HashRoute; navigate: (path: string) => void; isPublicRoute: boolean } {
  const getRoute = (): HashRoute => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    const path = hash || '';
    const segments = path ? path.split('/').filter(Boolean) : [];
    const params: Record<string, string> = {};

    // Padrão: /empresa/{slug}
    if (segments[0] === 'empresa' && segments[1]) {
      params.slug = segments[1];
    }

    return { path, segments, params };
  };

  const [route, setRoute] = useState<HashRoute>(getRoute);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(getRoute());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path ? `/${path}` : '';
  };

  const isPublicRoute = route.segments[0] === 'empresa' && !!route.params.slug;

  return { route, navigate, isPublicRoute };
}
