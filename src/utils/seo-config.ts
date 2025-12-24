// src/utils/seo-config.ts
// Centralized configuration for pages allowed to be indexed

export const ALLOWED_PAGES_FOR_INDEXING = [
  '/',  // Homepage (index.astro)
  '/musically-down',
  '/musically-down/',
  '/savetik-downloader-download-tiktok-videos-without-watermark',
  '/savetik-downloader-download-tiktok-videos-without-watermark/',
  '/blog/how-to-save-tiktok-videos-without-watermark',
  '/blog/how-to-save-tiktok-videos-without-watermark/',
];

/**
 * Check if a given pathname should be indexed by search engines
 * @param pathname - The URL pathname to check
 * @returns boolean - true if page should be indexed
 */
export function shouldIndexPage(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, '');
  return ALLOWED_PAGES_FOR_INDEXING.some(allowed => {
    const normalizedAllowed = allowed.replace(/\/$/, '');
    return normalized === normalizedAllowed;
  });
}
