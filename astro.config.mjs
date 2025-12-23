// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { autolinkConfig } from './plugins/rehype-autolink-config';
import rehypeSlug from 'rehype-slug';
import alpinejs from '@astrojs/alpinejs';
import solidJs from '@astrojs/solid-js';
import AstroPWA from '@vite-pwa/astro';
import icon from 'astro-icon';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  site: 'https://tiktokiotestv.vercel.app',

  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
    speedInsights: {
      enabled: true,
    },
    imageService: true,
  }),

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'it', 'vi', 'ar', 'fr', 'de', 'es', 'hi', 'id', 'ru', 'pt', 'ko', 'tl', 'nl', 'ms', 'tr'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  vite: {
    plugins: [tailwindcss()],
    define: {
      __DATE__: `'${new Date().toISOString()}'`,
    },
    ssr: {
      external: ['@tobyg74/tiktok-api-dl'],
    },
    optimizeDeps: {
      exclude: ['@tobyg74/tiktok-api-dl'],
    },
  },

  integrations: [
    sitemap({
      filter(page) {
        const url = new URL(page, 'https://tiktokiotestv.vercel.app');
        
        // Define the ONLY pages that should be included in sitemap
        const allowedPages = [
          '/',  // index.astro
          '/musically-down/',
          '/savetik-downloader-download-tiktok-videos-without-watermark/',
          '/blog/how-to-save-tiktok-videos-without-watermark/',
        ];
        
        // Normalize pathname (remove trailing slash for comparison)
        const normalizedPath = url.pathname.replace(/\/$/, '');
        const normalizedAllowed = allowedPages.map(p => p.replace(/\/$/, ''));
        
        // Only include if the path matches one of our allowed pages
        return normalizedAllowed.includes(normalizedPath) || 
               allowedPages.includes(url.pathname);
      },
      // Optionally customize the sitemap
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date(),
    }),
    alpinejs(),
    solidJs(),
    AstroPWA({
      mode: 'production',
      base: '/',
      scope: '/',
      includeAssets: ['favicon.svg'],
      registerType: 'autoUpdate',
      manifest: {
        name: 'Tiktokio - TikTok Downloader - Download TikTok Videos Without Watermark',
        short_name: 'Tiktokio',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.webp',
            sizes: '192x192',
            type: 'image/webp',
          },
          {
            src: 'pwa-512x512.webp',
            sizes: '512x512',
            type: 'image/webp',
          },
          {
            src: 'pwa-512x512.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/404',
        globPatterns: ['*.js'],
      },
      devOptions: {
        enabled: false,
        navigateFallbackAllowlist: [/^\/404$/],
        suppressWarnings: true,
      },
    }),
    icon(),
  ],

  markdown: {
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, autolinkConfig],
    ],
  },
});
