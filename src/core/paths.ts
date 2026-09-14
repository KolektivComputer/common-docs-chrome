// Base-aware path helpers. Framework-agnostic: no Astro or Vite globals.

/** Normalise a site base into a leading-and-trailing-slash string (`/` stays `/`). */
export function normalizeBase(base = '/'): string {
  if (!base || base === '/') return '/';
  let next = base.startsWith('/') ? base : `/${base}`;
  if (!next.endsWith('/')) next += '/';
  return next;
}

/** True for absolute URLs, protocol-relative URLs and in-page anchors. */
export function isExternal(href: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//');
}

/**
 * Prefix an absolute site path with the configured base. External URLs and
 * hash links are returned untouched so they work from any base.
 */
export function path(to: string, base = '/'): string {
  if (!to) return normalizeBase(base);
  if (to.startsWith('#') || isExternal(to)) return to;
  const root = normalizeBase(base);
  if (to === '/') return root;
  return `${root}${to.replace(/^\/+/, '')}`;
}

/** Remove the configured base from a pathname, leaving a leading slash. */
export function stripBase(pathname: string, base = '/'): string {
  const root = normalizeBase(base);
  if (root === '/') return pathname;
  if (pathname === root.slice(0, -1)) return '/';
  if (pathname.startsWith(root)) return `/${pathname.slice(root.length)}`;
  return pathname;
}

/** Join a base and a relative path without doubling slashes. */
export function joinPath(base = '/', to: string): string {
  return path(to, base);
}
