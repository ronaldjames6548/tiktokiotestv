// src/pages/sitemap-0.xml.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const pages = [
    { url: 'https://tiktokiotestv.vercel.app/', changefreq: 'daily', priority: 1.0 },
    { url: 'https://tiktokiotestv.vercel.app/about/', changefreq: 'yearly', priority: 0.5 },
    { url: 'https://tiktokiotestv.vercel.app/blog/how-to-save-tiktok-videos-without-watermark/', changefreq: 'monthly', priority: 0.8 },
    { url: 'https://tiktokiotestv.vercel.app/contact/', changefreq: 'yearly', priority: 0.5 },
    { url: 'https://tiktokiotestv.vercel.app/privacy-policy/', changefreq: 'yearly', priority: 0.3 },
    { url: 'https://tiktokiotestv.vercel.app/savetik-downloader-download-tiktok-videos-without-watermark/', changefreq: 'weekly', priority: 0.9 },
    { url: 'https://tiktokiotestv.vercel.app/musically-down/', changefreq: 'weekly', priority: 0.9 },
  ];

  const lastmod = new Date().toISOString();

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
