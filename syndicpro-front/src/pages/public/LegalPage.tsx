import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { landingStrings, type LandingLocale } from '@/i18n';
import { useSiteConfig } from '@/api/site.api';
import { useDocumentMeta } from '@/components/landing/useDocumentMeta';
import { SiteHeader, SiteFooter } from '@/components/landing/SiteChrome';

function NotProvided({ label, value, fallback }: { label: string; value: string | null; fallback: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-48 shrink-0 text-sm font-medium text-text-secondary">{label}</dt>
      <dd className="text-sm text-text-primary">{value || <span className="text-text-muted">{fallback}</span>}</dd>
    </div>
  );
}

export default function LegalPage({ locale, page }: { locale: LandingLocale; page: 'mentions' | 'privacy' }) {
  const t = landingStrings[locale];
  const base = locale === 'ar' ? '/ar' : '';
  const { data: config } = useSiteConfig();

  const appName = config?.name || 'SyndicPro';
  const siteName = appName;
  const links = {
    portal_login: config?.links.portal_login ?? '/login',
    portal_request_access: config?.links.portal_request_access ?? null,
    portal_forgot_password: config?.links.portal_forgot_password ?? null,
    staff_login: config?.links.staff_login ?? '/login',
    document_verify: config?.links.document_verify ?? null,
  };
  const legal = config?.legal ?? { publisher: null, registration: null, address: null, host: null };
  const slug = page === 'mentions' ? 'mentions-legales' : 'confidentialite';
  const path = `${base}/${slug}`;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = t.dir;
  }, [locale, t.dir]);

  useDocumentMeta({
    title: `${page === 'mentions' ? t.legal.mentionsTitle : t.legal.privacyTitle} — ${siteName}`,
    description: t.legal.draftNotice,
    locale,
    path,
    altPath: locale === 'ar' ? `/${slug}` : `/ar/${slug}`,
  });

  return (
    <div className="landing landing-scroll bg-surface-50 text-text-primary">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white">
        {locale === 'ar' ? 'تخطَّ إلى المحتوى' : 'Aller au contenu'}
      </a>
      <SiteHeader t={t} siteName={siteName} links={links} soonLabel={t.common.soon} />
      <main id="contenu" className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-sans text-3xl font-bold">
          {page === 'mentions' ? t.legal.mentionsTitle : t.legal.privacyTitle}
        </h1>
        <p role="note" className="mt-4 flex items-start gap-2 rounded-xl border border-accent-300 bg-accent-50 p-4 text-sm font-medium text-accent-900">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t.legal.draftNotice}
        </p>

        {page === 'mentions' ? (
          <dl className="mt-8 space-y-4 rounded-xl border border-surface-200 bg-white p-6">
            <NotProvided label={t.legal.publisher} value={legal.publisher} fallback={t.legal.notProvided} />
            <NotProvided label={t.legal.address} value={legal.address} fallback={t.legal.notProvided} />
            <NotProvided label={t.legal.registration} value={legal.registration} fallback={t.legal.notProvided} />
            <NotProvided label={t.legal.host} value={legal.host} fallback={t.legal.notProvided} />
          </dl>
        ) : (
          <div className="mt-8 space-y-4 rounded-xl border border-surface-200 bg-white p-6 text-sm leading-relaxed text-text-secondary">
            <p>{t.legal.privacyIntro}</p>
            <p>{t.legal.privacyCollected}</p>
            <p>{t.legal.privacyWhy}</p>
            <p>{t.legal.privacyRights}</p>
          </div>
        )}

        <p className="mt-8">
          <Link to={locale === 'ar' ? '/ar' : '/'} className="text-sm font-semibold text-brand-700 underline underline-offset-4">
            ← {t.common.backHome}
          </Link>
        </p>
      </main>
      <SiteFooter
        t={t}
        appName={appName}
        siteName={siteName}
        links={links}
        contact={config?.contact ?? { email: null, phone: null, whatsapp_number: null }}
        soonLabel={t.common.soon}
        year={new Date().getFullYear()}
        base={base}
      />
    </div>
  );
}
