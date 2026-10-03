import { useState } from 'react';
import type { LandingStrings, FaqItem } from '@/i18n';
import { Reveal } from './Reveal';
import { SectionTitle } from './Sections';

function FaqList({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="overflow-hidden rounded-xl border border-surface-200 bg-white">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${i}`}
              className="flex min-h-[44px] w-full items-center justify-between gap-3 px-4 py-3 text-start"
            >
              <span className="text-sm font-semibold text-text-primary">{item.q}</span>
              <span aria-hidden="true" className={`shrink-0 font-sans text-lg text-brand-700 transition-transform ${isOpen ? 'rotate-45' : ''}`}>
                +
              </span>
            </button>
            {isOpen && (
              <p id={`faq-panel-${i}`} className="px-4 pb-4 text-sm leading-relaxed text-text-secondary">
                {item.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FaqSection({ t, appName }: { t: LandingStrings; appName: string }) {
  const [tab, setTab] = useState<'managers' | 'owners'>('managers');
  const withApp = (s: string) => s.replaceAll('{app}', appName).replaceAll(':app', appName);

  return (
    <section aria-labelledby="faq" className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <SectionTitle id="faq" title={t.faq.title} />
        <div role="tablist" aria-label={t.faq.title} className="mx-auto mb-6 flex w-fit gap-1 rounded-lg bg-surface-100 p-1">
          {(['managers', 'owners'] as const).map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`min-h-[44px] rounded-md px-5 py-2 text-sm font-semibold ${
                tab === key ? 'bg-white text-text-primary shadow' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {key === 'managers' ? t.faq.managersTab : t.faq.ownersTab}
            </button>
          ))}
        </div>
        <Reveal role="tabpanel">
          <FaqList
            items={(tab === 'managers' ? t.faq.managers : t.faq.owners).map((item) => ({
              q: item.q,
              a: withApp(item.a),
            }))}
          />
        </Reveal>
      </div>
    </section>
  );
}
