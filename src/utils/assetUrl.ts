/**
 * Resolves static assets placed inside `public/` so they work reliably
 * both at root (`/`) and on GitHub Pages project subpaths (`/<repo>/`).
 */
export function assetUrl(path: string): string {
  const cleanPath = path.replace(/^\/+/, '');
  const base = import.meta.env.BASE_URL || '/';
  return `${base.endsWith('/') ? base : `${base}/`}${cleanPath}`;
}
