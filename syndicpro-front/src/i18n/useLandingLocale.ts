import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { landingStrings, type LandingLocale, type LandingStrings } from '@/i18n';

/** Locale comes only from the URL (/ar* → Arabic). No browser auto-redirect. */
export function landingLocaleFromPath(pathname: string): LandingLocale {
  return pathname === '/ar' || pathname.startsWith('/ar/') ? 'ar' : 'fr';
}

export function useLandingLocale(): { locale: LandingLocale; t: LandingStrings; appName: string } {
  const { pathname } = useLocation();
  const locale = landingLocaleFromPath(pathname);
  const t = landingStrings[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = t.dir;
  }, [locale, t.dir]);

  return { locale, t, appName: 'SyndicPro' };
}

/** Replace the :app / {app} placeholder with the product name. */
export function withApp(text: string, appName: string): string {
  return text.replaceAll('{app}', appName).replaceAll(':app', appName);
}
