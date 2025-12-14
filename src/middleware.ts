// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';


// Your supported locales (must match astro.config.mjs)
const supportedLocales = [
  'en', 'it', 'vi', 'ar', 'fr', 'de', 'es',
  'hi', 'id', 'ru', 'pt', 'ko', 'tl', 'nl', 'ms', 'tr'
] as const;

const defaultLocale = 'en';

// Clean function to map country code → locale
// Handles multilingual countries (CH, BE) with clear priority
function getLocaleFromCountry(countryCode: string | null): string | null {
  if (!countryCode) return null;

  const code = countryCode.toUpperCase();

  // High-priority markets (as per your original)
  if (code === 'ID') return 'id';
  if (code === 'VN') return 'vi';
  if (code === 'IN') return 'hi';
  if (code === 'PH') return 'tl';
  if (code === 'MY') return 'ms';

  // Arabic-speaking
  if (['SA', 'AE', 'EG', 'MA', 'DZ', 'IQ', 'JO', 'KW', 'LB', 'OM', 'QA', 'SY', 'YE', 'BH', 'TN', 'LY'].includes(code)) {
    return 'ar';
  }

  // Spanish-speaking
  if (['ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY'].includes(code)) {
    return 'es';
  }

  // French-speaking (priority over Dutch in Belgium)
  if (['FR', 'BE', 'CH', 'CA', 'LU', 'MC', 'CI', 'CM', 'CD', 'MG', 'SN', 'ML'].includes(code)) {
    return 'fr';
  }

  // Portuguese-speaking
  if (['PT', 'BR', 'AO', 'MZ'].includes(code)) {
    return 'pt';
  }

  // German-speaking (priority in Switzerland and Belgium already handled above)
  if (['DE', 'AT', 'LI'].includes(code)) {
    return 'de';
  }

  // Italian
  if (['IT', 'SM', 'VA'].includes(code)) {
    return 'it';
  }

  // Korean
  if (code === 'KR') return 'ko';

  // Dutch
  if (['NL', 'SR'].includes(code)) return 'nl';

  // Russian
  if (['RU', 'BY', 'KZ', 'KG'].includes(code)) return 'ru';

  // Turkish
  if (['TR', 'CY'].includes(code)) return 'tr';

  return null; // No match
}

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Skip API routes, static assets, admin, etc.
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/_') ||
    pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|ico|json|xml|txt|avif|woff|woff2|ttf|eot)$/) ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/ads.txt' ||
    pathname.includes('/rss.xml')
  ) {
    return next();
  }

  // Parse path segments
  const pathSegments = pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0] || '';

  const nonDefaultLocales = supportedLocales.filter(l => l !== defaultLocale);
  const hasLocalePrefix = nonDefaultLocales.includes(firstSegment);

  // Only attempt detection/redirect if no locale prefix exists
  if (!hasLocalePrefix && (pathname === '/' || !nonDefaultLocales.some(l => pathname.startsWith(`/${l}/`)))) {
    let detectedLocale = defaultLocale;
    let shouldRedirect = false;

    // Priority 1: User's saved cookie
    const localeCookie = context.cookies.get('user-locale')?.value;
    if (localeCookie && supportedLocales.includes(localeCookie as any)) {
      detectedLocale = localeCookie;
      if (detectedLocale !== defaultLocale) {
        shouldRedirect = true;
      }
    } else {
      // Priority 2: Country from headers (Vercel, Cloudflare, etc.)
      const countryHeader =
        context.request.headers.get('x-vercel-ip-country') ||
        context.request.headers.get('cf-ipcountry') ||
        context.request.headers.get('x-country-code');

      const countryLocale = getLocaleFromCountry(countryHeader);
      if (countryLocale && countryLocale !== defaultLocale) {
        detectedLocale = countryLocale;
        shouldRedirect = true;
      } else {
        // Priority 3: Accept-Language header
        const acceptLanguage = context.request.headers.get('accept-language');
        if (acceptLanguage) {
          const languages = acceptLanguage
            .split(',')
            .map(part => {
              const [locale, q = 'q=1'] = part.trim().split(';');
              const quality = parseFloat(q.replace('q=', '') || '1');
              const langCode = locale.split('-')[0].toLowerCase();
              return { locale: langCode, quality };
            })
            .sort((a, b) => b.quality - a.quality);

          for (const { locale } of languages) {
            if (supportedLocales.includes(locale as any) && locale !== defaultLocale) {
              detectedLocale = locale;
              shouldRedirect = true;
              break;
            }
          }
        }
      }
    }

    // Perform redirect only for non-default locales
    if (shouldRedirect && detectedLocale !== defaultLocale) {
      const newPath = `/${detectedLocale}${pathname === '/' ? '' : pathname}${url.search}`;
      return context.redirect(newPath, 302);
    }
  }

  return next();
});

