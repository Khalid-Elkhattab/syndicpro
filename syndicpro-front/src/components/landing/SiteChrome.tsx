import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Globe } from 'lucide-react';
import type { LandingStrings } from '@/i18n';
import { SafeLink } from './SafeLink';
import { landingScrollTop, onLandingScroll } from './scroll';

export function SiteHeader({
  t,
  siteName,
  links,
  soonLabel,
}: {
  t: LandingStrings;
  siteName: string;
  links: {
    portal_login: string | null;
    portal_request_access: string | null;
    portal_forgot_password: string | null;
    staff_login: string | null;
    document_verify: string | null;
  };
  soonLabel: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { pathname, hash } = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);
  const isAr = t.locale === 'ar';
  const base = isAr ? '/ar' : '';

  useEffect(() => {
    const onScroll = () => setScrolled(landingScrollTop() > 8);
    onScroll();
    return onLandingScroll(onScroll);
  }, []);

  // Drawer and login menu close via their own onClick handlers (no effect needed).

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawer(false);
    };
    document.addEventListener('keydown', onKey);
    drawerRef.current?.querySelector('button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer]);

  const anchors = [
    { href: `${base}/#fonctionnalites`, label: t.header.features },
    { href: `${base}/#pour-qui`, label: t.header.audiences },
    { href: `${base}/#ventes`, label: t.header.sales },
    { href: `${base}/#securite`, label: t.header.security },
    { href: `${base}/#faq`, label: t.header.faq },
    { href: `${base}/#demo`, label: t.header.contact },
  ];

  const switchHref = isAr
    ? pathname.replace(/^\/ar(\/|$)/, '/$1') + hash
    : ('/ar' + (pathname === '/' ? '' : pathname) + hash);

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-surface-50/90 backdrop-blur transition-shadow ${
        scrolled ? 'shadow-card border-brand-100' : 'border-transparent'
      }`}
    >
      <nav aria-label="Principal" className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
        <Link to={isAr ? '/ar' : '/'} className="font-sans text-xl font-bold text-text-primary" aria-label={siteName}>
          {siteName}
        </Link>

        <div className="hidden items-center gap-5 lg:flex">
          {anchors.map((a) => (
            <a key={a.href} href={a.href} className="text-sm font-medium text-text-secondary hover:text-brand-700">
              {a.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            to={switchHref}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-brand-50"
          >
            <Globe className="h-4 w-4" aria-hidden="true" />
            {isAr ? 'FR' : 'العربية'}
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setLoginOpen((v) => !v)}
              aria-expanded={loginOpen}
              aria-haspopup="menu"
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              {t.header.login}
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
            {loginOpen && (
              <div role="menu" className="absolute end-0 top-full z-50 mt-2 w-64 rounded-xl border border-brand-100 bg-white p-2 shadow-card">
                <SafeLink href={links.portal_login} fallback={soonLabel} onClick={() => setLoginOpen(false)}
                  className="block rounded-lg px-3 py-2 hover:bg-surface-50">
                  <span role="menuitem" className="block text-sm font-medium text-text-primary">{t.header.loginCopro}</span>
                  <span className="block text-xs text-text-muted">{t.header.loginCoproHint}</span>
                </SafeLink>
                <SafeLink href={links.staff_login} fallback={soonLabel} onClick={() => setLoginOpen(false)}
                  className="mt-1 block rounded-lg px-3 py-2 hover:bg-surface-50">
                  <span role="menuitem" className="block text-sm font-medium text-text-primary">{t.header.loginStaff}</span>
                  <span className="block text-xs text-text-muted">{t.header.loginStaffHint}</span>
                </SafeLink>
              </div>
            )}
          </div>

          <a href={`${base}/#demo`}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            {t.header.demo}
          </a>
        </div>

        <button
          type="button"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-primary hover:bg-brand-50 lg:hidden"
          aria-label={t.header.openMenu}
          aria-expanded={drawer}
          onClick={() => setDrawer(true)}
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </nav>

      {drawer && (
        <div ref={drawerRef} className="fixed inset-0 z-50 bg-brand-950 text-white lg:hidden" role="dialog" aria-modal="true" aria-label={siteName}>
          <div className="flex h-16 items-center justify-between px-4">
            <span className="font-sans text-xl font-bold">{siteName}</span>
            <button type="button" aria-label={t.header.closeMenu} onClick={() => setDrawer(false)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-white/10">
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex flex-col gap-1 overflow-y-auto px-4 pb-24">
            {anchors.map((a) => (
              <a key={a.href} href={a.href} onClick={() => setDrawer(false)}
                className="rounded-lg px-3 py-3 text-lg font-medium hover:bg-white/10">
                {a.label}
              </a>
            ))}
            <div className="mt-4 border-t border-white/15 pt-4">
              <p className="px-3 text-xs uppercase tracking-wide text-white/60">{t.header.login}</p>
              <SafeLink href={links.portal_login} fallback={soonLabel} onClick={() => setDrawer(false)}
                className="mt-1 block rounded-lg px-3 py-3 text-lg font-medium hover:bg-white/10">
                {t.header.loginCopro}
              </SafeLink>
              <SafeLink href={links.staff_login} fallback={soonLabel} onClick={() => setDrawer(false)}
                className="block rounded-lg px-3 py-3 text-lg font-medium hover:bg-white/10">
                {t.header.loginStaff}
              </SafeLink>
            </div>
            <div className="mt-4 flex gap-3 px-3">
              <Link to={switchHref} onClick={() => setDrawer(false)}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-white/30 text-base font-medium">
                {isAr ? 'Français' : 'العربية'}
              </Link>
              <a href={`${base}/#demo`} onClick={() => setDrawer(false)}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-accent-400 text-base font-bold text-brand-950">
                {t.header.demo}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter({
  t,
  appName,
  siteName,
  links,
  contact,
  soonLabel,
  year,
  base,
}: {
  t: LandingStrings;
  appName: string;
  siteName: string;
  links: {
    portal_login: string | null;
    portal_request_access: string | null;
    portal_forgot_password: string | null;
    staff_login: string | null;
    document_verify: string | null;
  };
  contact: { email: string | null; phone: string | null; whatsapp_number: string | null };
  soonLabel: string;
  year: number;
  base: string;
}) {
  void appName;
  return (
    <footer className="bg-brand-950 text-white">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <p className="font-sans text-xl font-bold">{siteName}</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/70">{t.footer.tagline}</p>
        </div>
        <nav aria-label={t.footer.product}>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/50">{t.footer.product}</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a className="text-white/80 hover:text-white" href={`${base}/#fonctionnalites`}>{t.header.features}</a></li>
            <li><a className="text-white/80 hover:text-white" href={`${base}/#pour-qui`}>{t.header.audiences}</a></li>
            <li><a className="text-white/80 hover:text-white" href={`${base}/#ventes`}>{t.header.sales}</a></li>
            <li><a className="text-white/80 hover:text-white" href={`${base}/#faq`}>{t.header.faq}</a></li>
          </ul>
        </nav>
        <nav aria-label={t.footer.coproSpace}>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/50">{t.footer.coproSpace}</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><SafeLink className="text-white/80 hover:text-white" href={links.portal_login} fallback={soonLabel}>{t.footer.coproLogin}</SafeLink></li>
            <li><SafeLink className="text-white/80 hover:text-white" href={links.portal_request_access} fallback={soonLabel}>{t.footer.coproFirst}</SafeLink></li>
            <li><SafeLink className="text-white/80 hover:text-white" href={links.portal_forgot_password} fallback={soonLabel}>{t.footer.coproForgot}</SafeLink></li>
          </ul>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-white/50">{t.footer.staffSpace}</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><SafeLink className="text-white/80 hover:text-white" href={links.staff_login} fallback={soonLabel}>{t.footer.staffLogin}</SafeLink></li>
          </ul>
        </nav>
        <div>
          {(contact.email || contact.phone || contact.whatsapp_number) && (
            <>
              <p className="text-sm font-semibold uppercase tracking-wide text-white/50">{t.footer.contact}</p>
              <ul className="mt-3 space-y-2 text-sm text-white/80">
                {contact.email && <li><a className="hover:text-white" href={`mailto:${contact.email}`}>{contact.email}</a></li>}
                {contact.phone && <li><a className="hover:text-white" href={`tel:${contact.phone.replace(/\s/g, '')}`}>{contact.phone}</a></li>}
                {contact.whatsapp_number && <li>WhatsApp : {contact.whatsapp_number}</li>}
              </ul>
            </>
          )}
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-white/50">{t.footer.legal}</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="text-white/80 hover:text-white" to={`${base}/mentions-legales`}>{t.footer.mentions}</Link></li>
            <li><Link className="text-white/80 hover:text-white" to={`${base}/confidentialite`}>{t.footer.privacy}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-2 px-4 py-4 text-xs text-white/60 sm:flex-row sm:items-center sm:px-6">
          <span>© {year} {siteName}. {t.footer.rights}</span>
          <Link to={base === '/ar' ? '/' : '/ar'} className="hover:text-white">
            {t.footer.language} : {base === '/ar' ? 'Français' : 'العربية'}
          </Link>
        </div>
      </div>
    </footer>
  );
}
