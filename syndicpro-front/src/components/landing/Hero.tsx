import { QrCode } from 'lucide-react';
import type { LandingStrings } from '@/i18n';
import { withApp } from '@/i18n/useLandingLocale';
import { Reveal } from './Reveal';
import { SafeLink } from './SafeLink';
import { BuildingGrid } from './BuildingGrid';
import { sampleFacade } from './buildingGridData';

function FakeQr() {
  const cells: boolean[] = [];
  let seed = 42;
  for (let i = 0; i < 81; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    cells.push(seed % 3 !== 0);
  }
  return (
    <svg viewBox="0 0 9 9" className="h-12 w-12" role="img" aria-hidden="true">
      {cells.map((on, i) => (
        <rect key={i} x={i % 9} y={Math.floor(i / 9)} width={0.92} height={0.92} rx={0.15}
          className={on ? 'fill-reef-900' : 'fill-reef-100'} />
      ))}
    </svg>
  );
}

function LaptopMockup({ t, appName }: { t: LandingStrings; appName: string }) {
  void appName;
  return (
    <div className="relative" aria-label={t.hero.dashboardTitle} role="img">
      <div className="rounded-xl border border-reef-100 bg-white shadow-lift">
        <div className="flex items-center gap-1.5 border-b border-sand-100 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <span className="ms-2 text-xs font-medium text-ink-400">{t.hero.dashboardTitle}</span>
        </div>
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-reef-50 p-3">
              <p className="text-[11px] text-ink-400">{t.hero.collected}</p>
              <p className="font-display text-lg font-bold text-reef-900" dir="ltr">48 200 MAD</p>
            </div>
            <div className="rounded-lg bg-sand-50 p-3">
              <p className="text-[11px] text-ink-400">{t.hero.salesProgress}</p>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand-200">
                <div className="h-full w-2/3 rounded-full bg-emerald-500" />
              </div>
              <p className="mt-1 text-[11px] font-semibold text-ink-600" dir="ltr">64 / 96</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['A12', 'A13', 'B04', 'C07'].map((lot, i) => (
              <span key={lot} className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                i === 2 ? 'bg-red-100 text-red-700' : i === 3 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
              }`} dir="ltr">
                {lot}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto h-2.5 w-3/4 rounded-b-xl bg-reef-100" />
    </div>
  );
}

function PhoneMockup({ t }: { t: LandingStrings }) {
  return (
    <div className="rounded-[2rem] border border-reef-100 bg-white p-2 shadow-lift" role="img" aria-label={t.hero.portalTitle}>
      <div className="rounded-[1.6rem] bg-sand-50 p-3">
        <p className="text-center text-xs font-bold text-ink-900">{t.hero.portalTitle}</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
          {[
            { label: t.hero.due, value: '300', cls: 'text-red-600' },
            { label: t.hero.paid, value: '2 700', cls: 'text-emerald-600' },
            { label: t.hero.remaining, value: '300', cls: 'text-amber-600' },
          ].map((c) => (
            <div key={c.label} className="rounded-lg bg-white p-1.5">
              <p className="text-[10px] text-ink-400">{c.label}</p>
              <p className={`whitespace-nowrap text-[11px] font-bold ${c.cls}`} dir="ltr">{c.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 space-y-1">
          {['01', '02', '03'].map((m, i) => (
            <div key={m} className="flex items-center justify-between rounded-lg bg-white px-2 py-1.5">
              <span className="text-[11px] text-ink-600" dir="ltr">{m}</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                i < 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>•</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-white p-2">
          <FakeQr />
          <div>
            <QrCode className="hidden" aria-hidden="true" />
            <p className="text-[10px] font-semibold text-ink-900" dir="ltr">{t.hero.receipt}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero({
  t,
  appName,
  siteName,
  links,
  soonLabel,
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
  soonLabel: string;
  base: string;
}) {
  void siteName;
  return (
    <section className="relative overflow-hidden bg-sand-50" aria-labelledby="hero-title">
      <div className="pointer-events-none absolute -top-10 end-0 opacity-[0.16]" aria-hidden="true">
        <BuildingGrid tiles={sampleFacade()} columns={8} tileSize={26} gap={5} />
      </div>
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-2 lg:pb-20 lg:pt-16">
        <Reveal>
          <p className="inline-block rounded-full bg-reef-100 px-3 py-1 text-xs font-semibold text-reef-800">
            {t.hero.eyebrow}
          </p>
          <h1 id="hero-title" className="mt-4 font-display text-4xl font-bold leading-tight text-ink-900 sm:text-5xl">
            {withApp(t.hero.title, appName)}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg">
            {withApp(t.hero.sub, appName)}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href={`${base}/#demo`}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-reef-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-reef-800">
              {t.hero.primary}
            </a>
            <SafeLink href={links.portal_login} fallback={soonLabel}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-reef-200 bg-white px-5 py-2.5 text-sm font-semibold text-reef-800 hover:bg-reef-50">
              {t.hero.secondary}
            </SafeLink>
          </div>
          <p className="mt-3 text-sm">
            <SafeLink href={links.portal_request_access} fallback={soonLabel} className="font-medium text-reef-700 underline underline-offset-4 hover:text-reef-800">
              {t.hero.tertiary}
            </SafeLink>
          </p>
          <p className="mt-5 text-xs leading-relaxed text-ink-400">{t.hero.micro}</p>
        </Reveal>
        <Reveal className="relative" aria-label={t.hero.mockupCaption}>
          <div className="grid items-end gap-4 sm:grid-cols-[1fr_170px]">
            <LaptopMockup t={t} appName={appName} />
            <div className="mx-auto w-44 sm:w-full">
              <PhoneMockup t={t} />
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-ink-400 sm:text-start">
            {t.hero.mockupCaption}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
