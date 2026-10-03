import { useState } from 'react';
import {
  Building2, HeartHandshake, Smartphone, X, Check,
  LayoutGrid, Wallet, Receipt, PiggyBank, Landmark, BellRing,
  MessagesSquare, Vote, FileBadge, BarChart3, KeyRound, History,
} from 'lucide-react';
import type { LandingStrings } from '@/i18n';
import { withApp } from '@/i18n/useLandingLocale';
import { Reveal } from './Reveal';
import { SafeLink } from './SafeLink';

export interface LinkSet {
  portal_login: string | null;
  portal_request_access: string | null;
  portal_forgot_password: string | null;
  staff_login: string | null;
  document_verify: string | null;
}

export function SectionTitle({ id, title, sub }: { id?: string; title: string; sub?: string }) {
  return (
    <Reveal className="mx-auto mb-10 max-w-2xl text-center">
      <h2 id={id} className="font-display text-3xl font-bold text-ink-900 sm:text-4xl" tabIndex={-1}>
        {title}
      </h2>
      {sub && <p className="mt-3 text-base text-ink-600">{sub}</p>}
    </Reveal>
  );
}

export function EspaceBand({ t, links, soonLabel }: { t: LandingStrings; links: LinkSet; soonLabel: string }) {
  const cards = [
    { title: t.espace.loginTitle, text: t.espace.loginText, actions: [
      { label: t.espace.loginCopro, href: links.portal_login },
      { label: t.espace.loginStaff, href: links.staff_login },
    ] },
    { title: t.espace.firstTitle, text: t.espace.firstText, actions: [
      { label: t.espace.firstCta, href: links.portal_request_access },
    ] },
    { title: t.espace.forgotTitle, text: t.espace.forgotText, actions: [
      { label: t.espace.forgotCta, href: links.portal_forgot_password },
    ] },
  ];
  return (
    <section aria-label={t.espace.title} id="espace" className="border-b border-sand-100 bg-white scroll-mt-20">
      <div className="mx-auto grid max-w-[1200px] gap-4 px-4 py-10 sm:px-6 md:grid-cols-3">
        {cards.map((c) => (
          <Reveal key={c.title} className="flex flex-col rounded-xl border border-sand-100 bg-sand-50 p-5">
            <h2 className="font-display text-lg font-bold text-ink-900">{c.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{c.text}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {c.actions.map((a) => (
                <SafeLink key={a.label} href={a.href} fallback={soonLabel}
                  className="inline-flex min-h-[44px] items-center rounded-lg bg-reef-700 px-4 py-2 text-sm font-semibold text-white hover:bg-reef-800">
                  {a.label}
                </SafeLink>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
      <p className="mx-auto max-w-[1200px] px-4 pb-8 text-center text-xs text-ink-400 sm:px-6">{t.espace.note}</p>
    </section>
  );
}

const AUDIENCE_ICONS = [Building2, HeartHandshake, Smartphone];

export function Audiences({ t, base }: { t: LandingStrings; base: string }) {
  return (
    <section aria-labelledby="pour-qui" className="bg-white">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <SectionTitle id="pour-qui" title={t.audiences.title} />
        <div className="grid gap-4 md:grid-cols-3">
          {t.audiences.cards.map((c, i) => {
            const Icon = AUDIENCE_ICONS[i % AUDIENCE_ICONS.length];
            const href = i === 0 ? `${base}/#fonctionnalites` : i === 1 ? `${base}/#demo` : `${base}/#espace`;
            return (
              <Reveal key={c.title} className="flex flex-col rounded-xl border border-sand-100 bg-sand-50 p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-reef-700 text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink-900">{c.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{c.text}</p>
                <a href={href} className="mt-4 text-sm font-semibold text-reef-700 underline underline-offset-4 hover:text-reef-800">
                  {c.cta}
                </a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function BeforeAfter({ t, appName }: { t: LandingStrings; appName: string }) {
  return (
    <section aria-labelledby="avant-apres" className="bg-sand-50">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <SectionTitle id="avant-apres" title={withApp(t.beforeAfter.title, appName)} />
        <div className="grid gap-4 md:grid-cols-2">
          <Reveal className="rounded-xl border border-sand-200 bg-white p-6">
            <h3 className="font-display text-lg font-bold text-ink-400">{t.beforeAfter.beforeTitle}</h3>
            <ul className="mt-4 space-y-2.5">
              {t.beforeAfter.before.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-ink-600">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="rounded-xl border border-reef-200 bg-white p-6 shadow-lift">
            <h3 className="font-display text-lg font-bold text-reef-800">{withApp(t.beforeAfter.afterTitle, appName)}</h3>
            <ul className="mt-4 space-y-2.5">
              {t.beforeAfter.after.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm font-medium text-ink-900">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const FEATURE_ICONS = [
  LayoutGrid, Wallet, Receipt, PiggyBank, Landmark, BellRing,
  MessagesSquare, Vote, FileBadge, BarChart3, KeyRound, History,
];

export function Features({ t }: { t: LandingStrings }) {
  return (
    <section aria-labelledby="fonctionnalites" className="bg-white">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <SectionTitle id="fonctionnalites" title={t.features.title} sub={t.features.sub} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((item, i) => {
            const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
            const wide = i === 0 || i === 5;
            return (
              <Reveal key={item.title} as="span"
                className={`${wide ? 'sm:col-span-2 lg:col-span-1' : ''} rounded-xl border border-sand-100 bg-sand-50 p-5`}>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-reef-700 text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="mt-3 block font-display text-base font-bold text-ink-900">{item.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-600">{item.text}</span>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function PlatformTabs({ t }: { t: LandingStrings }) {
  const [tab, setTab] = useState<'managers' | 'owners'>('managers');
  const items = tab === 'managers' ? t.platform.managers : t.platform.owners;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setTab((prev) => (prev === 'managers' ? 'owners' : 'managers'));
    }
  };

  return (
    <section aria-labelledby="plateforme" className="bg-reef-950 text-white">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <Reveal className="mx-auto mb-8 max-w-2xl text-center">
          <h2 id="plateforme" className="font-display text-3xl font-bold sm:text-4xl" tabIndex={-1}>
            {t.platform.title}
          </h2>
        </Reveal>
        <div role="tablist" aria-label={t.platform.title} onKeyDown={onKeyDown}
          className="mx-auto mb-8 flex w-fit gap-1 rounded-lg bg-white/10 p-1">
          {(['managers', 'owners'] as const).map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`min-h-[44px] rounded-md px-5 py-2 text-sm font-semibold ${
                tab === key ? 'bg-white text-reef-900' : 'text-white/70 hover:text-white'
              }`}
            >
              {key === 'managers' ? t.platform.managersTab : t.platform.ownersTab}
            </button>
          ))}
        </div>
        <ul role="tabpanel" className="mx-auto grid max-w-3xl gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 rounded-lg bg-white/5 px-4 py-3 text-sm leading-relaxed text-white/90">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
