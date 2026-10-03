import { useEffect } from 'react';

export interface MetaTags {
  title: string;
  description: string;
  locale: 'fr' | 'ar';
  /** Canonical path of the current page (e.g. `/` or `/ar`). */
  path: string;
  /** Path of the same page in the other locale. */
  altPath: string;
  jsonLd?: unknown[];
}

/** Per-locale document head for public pages (SPA: index.html holds FR defaults). */
export function useDocumentMeta({ title, description, locale, path, altPath, jsonLd }: MetaTags) {
  useEffect(() => {
    document.title = title;

    const setMeta = (selector: string, attr: string, value: string, key = 'name') => {
      let el = document.head.querySelector<HTMLMetaElement>(`${selector}[${key}="${attr}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(key, attr);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    setMeta('meta', 'description', description);
    setMeta('meta', 'og:title', title, 'property');
    setMeta('meta', 'og:description', description, 'property');
    setMeta('meta', 'og:locale', locale === 'ar' ? 'ar_MA' : 'fr_MA', 'property');

    const base = window.location.origin;
    const setLink = (rel: string, hreflang: string, href: string) => {
      let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"][hreflang="${hreflang}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        el.setAttribute('hreflang', hreflang);
        document.head.appendChild(el);
      }
      el.setAttribute('href', `${base}${href}`);
    };
    setLink('alternate', 'fr', locale === 'fr' ? path : altPath);
    setLink('alternate', 'ar', locale === 'ar' ? path : altPath);
    setLink('alternate', 'x-default', locale === 'fr' ? path : altPath);

    const scriptId = 'landing-jsonld';
    document.getElementById(scriptId)?.remove();
    if (jsonLd && jsonLd.length > 0) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd.length === 1 ? jsonLd[0] : jsonLd);
      document.head.appendChild(script);
    }
    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, [title, description, locale, path, altPath, jsonLd]);
}
