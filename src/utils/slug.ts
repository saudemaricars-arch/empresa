/**
 * Gera um slug URL-friendly a partir de um texto.
 * Ex: "Tech Solutions LTDA" → "tech-solutions-ltda"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')   // remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-')           // espaços → hífens
    .replace(/-+/g, '-');           // hífens duplos → simples
}

/**
 * Garante que o slug seja único dentro de uma lista de slugs existentes.
 * Se houver conflito, adiciona sufixo numérico: "empresa-1", "empresa-2", etc.
 */
export function ensureUniqueSlug(slug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(slug)) return slug;
  let counter = 1;
  while (existingSlugs.includes(`${slug}-${counter}`)) {
    counter++;
  }
  return `${slug}-${counter}`;
}
