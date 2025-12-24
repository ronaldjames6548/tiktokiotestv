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
    // Recommended: Enable Vercel Analytics and Speed Insights
    webAnalytics: {
      enabled: true,
    },
    speedInsights: {
      enabled: true,
    },
    // Optional: Better image optimization via Vercel
    imageService: true,
  }),

  // Your i18n configuration (perfect as-is)
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
    // Prevent SSR issues with the TikTok library (dynamic require only works server-side)
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
        const allowedPages = [
          'https://tiktokiotestv.vercel.app/',
          'https://tiktokiotestv.vercel.app/about/',
          'https://tiktokiotestv.vercel.app/blog/how-to-save-tiktok-videos-without-watermark/',
          'https://tiktokiotestv.vercel.app/contact/',
          'https://tiktokiotestv.vercel.app/privacy-policy/',
        ];
        
        return allowedPages.includes(page);
      },
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

  // Optional: Keep your CSP if needed (Astro doesn't have built-in security.csp yet)
  // Note: Astro core doesn't support `security` field natively – remove if causing issues
  // If you need CSP, handle via middleware or Vercel headers instead
});
