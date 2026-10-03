import type { LandingStrings } from '@/i18n';
import { withApp } from '@/i18n/useLandingLocale';
import { Reveal } from './Reveal';
import { SectionTitle } from './Sections';
import { BuildingGrid } from './BuildingGrid';
import { sampleFacade } from './buildingGridData';
import { SafeLink } from './SafeLink';

export function SalesSection({ t, appName }: { t: LandingStrings; appName: string }) {
  return (
    <section aria-labelledby="ventes" className="bg-white">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <SectionTitle id="ventes" title={t.sales.title} sub={withApp(t.sales.intro, appName)} />
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <Reveal className="rounded-xl border border-surface-100 bg-surface-50 p-6">
            <BuildingGrid
              tiles={sampleFacade()}
              columns={6}
              tileSize={34}
              interactive
              labelledBy="ventes"
              className="mx-auto"
            />
            <ul className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-medium text-text-secondary" aria-label="Légende">
              <li className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-success-light0 text-[10px] font-bold text-white" aria-hidden="true">✓</span>
                {t.sales.legendSold}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-accent-400 text-[10px] font-bold text-white" aria-hidden="true">○</span>
                {t.sales.legendUnsold}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-info text-[10px] font-bold text-white" aria-hidden="true">◐</span>
                {t.sales.legendPending}
              </li>
            </ul>
            <ul className="mt-4 space-y-2">
              {t.sales.bullets.map((b) => (
                <li key={b} className="text-sm leading-relaxed text-text-secondary">• {withApp(b, appName)}</li>
              ))}
            </ul>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Reveal className="rounded-xl border border-surface-100 bg-surface-50 p-6">
              <h3 className="font-sans text-lg font-bold text-text-primary">{t.sales.sellerTitle}</h3>
              <ol className="mt-3 space-y-2">
                {t.sales.seller.map((s, i) => (
                  <li key={s} className="flex gap-2.5 text-sm leading-relaxed text-text-secondary">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white" aria-hidden="true">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </Reveal>
            <Reveal className="rounded-xl border border-surface-100 bg-surface-50 p-6">
              <h3 className="font-sans text-lg font-bold text-text-primary">{t.sales.buyerTitle}</h3>
              <ol className="mt-3 space-y-2">
                {t.sales.buyer.map((s, i) => (
                  <li key={s} className="flex gap-2.5 text-sm leading-relaxed text-text-secondary">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white" aria-hidden="true">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </div>
        <Reveal>
          <p className="mx-auto mt-8 max-w-2xl rounded-xl bg-brand-50 px-5 py-4 text-center text-sm leading-relaxed text-text-primary">
            {t.sales.reassurance}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function AccessSteps({
  t, accessHref, soonLabel,
}: {
  t: LandingStrings;
  accessHref: string | null;
  soonLabel: string;
}) {
  return (
    <section aria-labelledby="acces" className="bg-surface-50">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <SectionTitle id="acces" title={t.access.title} />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.access.steps.map((s, i) => (
            <Reveal as="li" key={s.title} className="relative rounded-xl border border-surface-200 bg-white p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-400 font-sans text-sm font-bold text-brand-950" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="mt-3 font-sans text-base font-bold text-text-primary">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">{s.text}</p>
            </Reveal>
          ))}
        </ol>
        <Reveal className="mt-8 text-center">
          <SafeLink href={accessHref} fallback={soonLabel}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            {t.access.cta}
          </SafeLink>
        </Reveal>
      </div>
    </section>
  );
}
