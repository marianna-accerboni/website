const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefix a root-relative path with the Astro base URL. */
export function href(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${base}${path}`;
}
