import { useState } from 'react';
import { ShieldCheck, Users, Search } from 'lucide-react';
import type { LandingStrings } from '@/i18n';
import { Reveal } from './Reveal';
import { SectionTitle } from './Sections';

export function DocumentsSection({
  t, verifyHref,
}: {
  t: LandingStrings;
  verifyHref: string | null;
}) {
  const [code, setCode] = useState('');

  return (
    <section aria-labelledby="documents" className="bg-white">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <SectionTitle id="documents" title={t.documents.title} sub={t.documents.text} />
        <Reveal>
          <ul className="flex flex-wrap justify-center gap-2">
            {t.documents.items.map((item) => (
              <li key={item} className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-text-primary">
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
        {verifyHref && (
          <Reveal className="mx-auto mt-8 max-w-xl rounded-xl border border-surface-200 bg-surface-50 p-6">
            <h3 className="font-sans text-lg font-bold text-text-primary">{t.documents.verifyTitle}</h3>
            <p className="mt-1 text-sm text-text-secondary">{t.documents.verifyText}</p>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (code.trim() === '') return;
                window.location.href = `${verifyHref.replace(/\/$/, '')}/${encodeURIComponent(code.trim())}`;
              }}
            >
              <label htmlFor="verify-code" className="sr-only">{t.documents.verifyTitle}</label>
              <input
                id="verify-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t.documents.verifyPlaceholder}
                dir="ltr"
                className="min-h-[44px] flex-1 rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <button type="submit"
                className="inline-flex min-h-[44px] items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                <Search className="h-4 w-4 sm:me-1.5" aria-hidden="true" />
                <span className="hidden sm:inline">{t.documents.verifyCta}</span>
              </button>
            </form>
          </Reveal>
        )}
      </div>
    </section>
  );
}

export function AutomationSection({ t, showAssistant, showAi }: { t: LandingStrings; showAssistant: boolean; showAi: boolean }) {
  const cards = [
    { title: t.automation.remindersTitle, text: t.automation.remindersText, always: true },
    { title: t.automation.assistantTitle, text: t.automation.assistantText, always: false, show: showAssistant },
    { title: t.automation.aiTitle, text: t.automation.aiText, always: false, show: showAi },
  ].filter((c) => c.always || c.show);

  return (
    <section aria-labelledby="automatisation" className="bg-surface-50">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <SectionTitle id="automatisation" title={t.automation.title} />
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((c) => (
            <Reveal key={c.title} className="rounded-xl border border-surface-200 bg-white p-6">
              <h3 className="font-sans text-lg font-bold text-text-primary">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{c.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TeamSection({ t }: { t: LandingStrings }) {
  return (
    <section aria-labelledby="equipe" className="bg-white">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <SectionTitle id="equipe" title={t.team.title} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.team.roles.map((r) => (
            <Reveal key={r.title} className="rounded-xl border border-surface-100 bg-surface-50 p-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Users className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-3 font-sans text-base font-bold text-text-primary">{r.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">{r.text}</p>
            </Reveal>
          ))}
        </div>
        <ul className="mx-auto mt-6 grid max-w-3xl gap-2 sm:grid-cols-3">
          {t.team.facts.map((f) => (
            <Reveal as="li" key={f} className="rounded-lg bg-brand-50 px-4 py-3 text-center text-sm font-medium text-text-primary">
              {f}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function SecuritySection({ t }: { t: LandingStrings }) {
  return (
    <section aria-labelledby="securite" className="bg-surface-50">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <SectionTitle id="securite" title={t.security.title} sub={t.security.intro} />
          <Reveal as="span" className="block rounded-xl border border-surface-200 bg-white p-6">
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {t.security.points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm leading-relaxed text-text-secondary">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-surface-100 pt-4 text-sm font-medium text-text-primary">{t.security.note}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
