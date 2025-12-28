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
        const allowedPages = [
          'https://tiktokiotestv.vercel.app/',
          'https://tiktokiotestv.vercel.app/about/',
          'https://tiktokiotestv.vercel.app/blog/how-to-save-tiktok-videos-without-watermark/',
          'https://tiktokiotestv.vercel.app/contact/',
          'https://tiktokiotestv.vercel.app/privacy-policy/',
          'https://tiktokiotestv.vercel.app/savetik-downloader-download-tiktok-videos-without-watermark/',
          'https://tiktokiotestv.vercel.app/musically-down/',
        ];
        
        return allowedPages.includes(page);
      },
      // Set default values for all pages
      changefreq: 'weekly',
      lastmod: new Date(),
      priority: 0.7,
      // Use serialize to customize individual pages
      serialize(item) {
        // Homepage - highest priority, changes daily
        if (item.url === 'https://tiktokiotestv.vercel.app/') {
          item.changefreq = 'daily';
          item.priority = 1.0;
          item.lastmod = new Date();
        }
        // Blog posts - medium-high priority, changes monthly
        else if (item.url.includes('/blog/')) {
          item.changefreq = 'monthly';
          item.priority = 0.8;
          item.lastmod = new Date();
        }
        // Tool pages - high priority, changes weekly
        else if (item.url.includes('/savetik-downloader-download-tiktok-videos-without-watermark') || item.url.includes('/musically-down')) {
          item.changefreq = 'weekly';
          item.priority = 0.9;
          item.lastmod = new Date();
        }
        // About and Contact - low priority, changes yearly
        else if (item.url.includes('/about') || item.url.includes('/contact')) {
          item.changefreq = 'yearly';
          item.priority = 0.5;
          item.lastmod = new Date();
        }
        // Privacy Policy - low priority, changes yearly
        else if (item.url.includes('/privacy-policy')) {
          item.changefreq = 'yearly';
          item.priority = 0.3;
          item.lastmod = new Date();
        }
        
        return item;
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
});
