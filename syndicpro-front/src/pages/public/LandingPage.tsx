import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { landingStrings, type LandingLocale } from '@/i18n';
import { landingScrollTop, onLandingScroll, scrollLandingToTop } from '@/components/landing/scroll';
import { useSiteConfig } from '@/api/site.api';
import { useDocumentMeta } from '@/components/landing/useDocumentMeta';
import { SiteHeader, SiteFooter } from '@/components/landing/SiteChrome';
import { Hero } from '@/components/landing/Hero';
import { EspaceBand, Audiences, BeforeAfter, Features, PlatformTabs } from '@/components/landing/Sections';
import { SalesSection, AccessSteps } from '@/components/landing/SalesAccess';
import { DocumentsSection, AutomationSection, TeamSection, SecuritySection } from '@/components/landing/DocsAutomation';
import { FaqSection } from '@/components/landing/Faq';
import { faqJsonLd } from '@/components/landing/faqJsonLd';
import { DemoSection, FinalCta } from '@/components/landing/DemoForms';
import { withApp } from '@/i18n/useLandingLocale';

function MobileDemoBar({ label, base }: { label: string; base: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(landingScrollTop() > window.innerHeight * 0.9);
    onScroll();
    return onLandingScroll(onScroll);
  }, []);

  if (!visible) return null;

  return (
    <a
      href={`${base}/#demo`}
      className="fixed inset-x-3 bottom-3 z-40 flex min-h-[48px] items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white shadow-card sm:hidden"
    >
      {label}
    </a>
  );
}

export default function LandingPage({ locale }: { locale: LandingLocale }) {
  const t = landingStrings[locale];
  const base = locale === 'ar' ? '/ar' : '';
  const altPath = locale === 'ar' ? '/' : '/ar';
  const { pathname } = useLocation();
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
  const features = {
    whatsapp_assistant: config?.features.whatsapp_assistant ?? false,
    ai_connectivity: config?.features.ai_connectivity ?? false,
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = t.dir;
  }, [locale, t.dir]);

  // Anchor navigation on first load (e.g. /ar#faq from the language switch).
  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      el?.scrollIntoView();
    } else {
      scrollLandingToTop();
    }
  }, [pathname]);

  const faqItems = [...t.faq.managers, ...t.faq.owners].map((item) => ({
    q: item.q,
    a: item.a.replaceAll('{app}', appName).replaceAll(':app', appName),
  }));

  useDocumentMeta({
    title: withApp(t.meta.title, appName),
    description: withApp(t.meta.description, appName),
    locale,
    path: locale === 'ar' ? '/ar' : '/',
    altPath,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: appName,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        inLanguage: ['fr', 'ar'],
      },
      faqJsonLd(faqItems),
    ],
  });

  return (
    <div className="landing landing-scroll bg-surface-50 text-text-primary">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white">
        {locale === 'ar' ? 'تخطَّ إلى المحتوى' : 'Aller au contenu'}
      </a>
      <SiteHeader t={t} siteName={siteName} links={links} soonLabel={t.common.soon} />
      <main id="contenu">
        <Hero t={t} appName={appName} siteName={siteName} links={links} soonLabel={t.common.soon} base={base} />
        <EspaceBand t={t} links={links} soonLabel={t.common.soon} />
        <Audiences t={t} base={base} />
        <BeforeAfter t={t} appName={appName} />
        <Features t={t} />
        <PlatformTabs t={t} />
        <SalesSection t={t} appName={appName} />
        <AccessSteps t={t} accessHref={links.portal_request_access} soonLabel={t.common.soon} />
        <DocumentsSection t={t} verifyHref={links.document_verify} />
        <AutomationSection t={t} showAssistant={features.whatsapp_assistant} showAi={features.ai_connectivity} />
        <TeamSection t={t} />
        <SecuritySection t={t} />
        <FaqSection t={t} appName={appName} />
        <DemoSection
          t={t}
          contact={config?.contact ?? { email: null, phone: null, whatsapp_number: null }}
          base={base}
        />
        <FinalCta t={t} base={base} />
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
      <MobileDemoBar label={t.header.demo} base={base} />
    </div>
  );
}
