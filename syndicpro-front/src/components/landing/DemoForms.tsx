import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { axiosInstance } from '@/api/axiosInstance';
import type { LandingStrings } from '@/i18n';
import { Reveal } from './Reveal';
import { SectionTitle } from './Sections';

const inputCls =
  'min-h-[44px] w-full rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-sm text-ink-900 outline-none focus:border-reef-500 focus:ring-2 focus:ring-reef-100';
const labelCls = 'mb-1 block text-sm font-medium text-ink-900';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function useStartedAt() {
  const [startedAt] = useState(() => Date.now());
  return startedAt;
}

export function DemoSection({
  t,
  contact,
  base,
}: {
  t: LandingStrings;
  contact: { email: string | null; phone: string | null; whatsapp_number: string | null };
  base: string;
}) {
  const [tab, setTab] = useState<'demo' | 'contact'>('demo');
  void base;

  return (
    <section aria-labelledby="demo" className="bg-sand-50">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <SectionTitle id="demo" title={t.demo.title.replace('{app}', '').replace(':app', '').trim()} />
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <Reveal className="space-y-4">
            <ul className="space-y-2">
              {t.demo.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm font-medium text-ink-900">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white" aria-hidden="true">✓</span>
                  {b}
                </li>
              ))}
            </ul>
            <div className="rounded-xl border border-sand-200 bg-white p-5">
              <h3 className="font-display text-base font-bold text-ink-900">{t.demo.contactTitle}</h3>
              <ul className="mt-2 space-y-1 text-sm text-ink-600">
                {contact.email && (
                  <li><a className="text-reef-700 underline underline-offset-4" href={`mailto:${contact.email}`}>{contact.email}</a></li>
                )}
                {contact.phone && (
                  <li><a className="text-reef-700 underline underline-offset-4" href={`tel:${contact.phone.replace(/\s/g, '')}`}>{contact.phone}</a></li>
                )}
                {contact.whatsapp_number && <li>WhatsApp : {contact.whatsapp_number}</li>}
                {!contact.email && !contact.phone && !contact.whatsapp_number && (
                  <li className="text-ink-400">{t.demo.contactTab} ↓</li>
                )}
              </ul>
            </div>
          </Reveal>

          <Reveal className="rounded-xl border border-sand-200 bg-white p-6">
            <div role="tablist" aria-label={t.demo.title} className="mb-6 flex gap-1 rounded-lg bg-sand-100 p-1">
              {(['demo', 'contact'] as const).map((key) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={`min-h-[44px] flex-1 rounded-md px-4 py-2 text-sm font-semibold ${
                    tab === key ? 'bg-white text-reef-900 shadow' : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  {key === 'demo' ? t.demo.demoTab : t.demo.contactTab}
                </button>
              ))}
            </div>
            {tab === 'demo' ? (
              <DemoForm t={t} />
            ) : (
              <ContactForm t={t} />
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const demoSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  organization: z.string().optional(),
  role: z.string().min(1),
  residences_count: z.string().regex(/^\d*$/, 'Must be a number').optional(),
  lots_count: z.string().regex(/^\d*$/, 'Must be a number').optional(),
  current_tool: z.string().optional(),
  message: z.string().max(2000).optional(),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
});

type DemoValues = z.infer<typeof demoSchema>;

function toCount(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === '') return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) ? undefined : n;
}

function DemoForm({ t }: { t: LandingStrings }) {
  const startedAt = useStartedAt();
  const [done, setDone] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<DemoValues>({
    resolver: zodResolver(demoSchema),
  });

  const onSubmit = async (values: DemoValues) => {
    setServerError(null);
    try {
      const { data } = await axiosInstance.post('/api/public/demo', {
        ...values,
        residences_count: toCount(values.residences_count),
        lots_count: toCount(values.lots_count),
        locale: t.locale,
        form_started_at: startedAt,
      });
      setDone(data.reference ?? '');
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
      setServerError(resp?.errors
        ? Object.values(resp.errors).flat().join(' ')
        : (resp?.message ?? 'Error'));
    }
  };

  if (done !== null) {
    return (
      <div role="status" className="rounded-xl bg-emerald-50 p-6 text-center">
        <p className="font-display text-lg font-bold text-emerald-800">{t.demo.successTitle}</p>
        <p className="mt-1 text-sm text-emerald-700">{t.demo.successText}</p>
        <p className="mt-2 font-mono text-sm font-bold text-emerald-800" dir="ltr">{t.demo.reference} : {done}</p>
      </div>
    );
  }

  const roleValues = ['syndic_pro', 'syndic_benevole', 'association', 'promoteur', 'autre'];
  const toolValues = ['excel', 'autre_logiciel', 'papier', 'rien'];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
      {serverError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{serverError}</p>
      )}
      <div>
        <label className={labelCls} htmlFor="demo-name">{t.demo.name} *</label>
        <input id="demo-name" {...register('name')} aria-describedby="demo-name-err" className={inputCls} />
        <span id="demo-name-err"><FieldError message={errors.name?.message} /></span>
      </div>
      <div>
        <label className={labelCls} htmlFor="demo-email">{t.demo.email} *</label>
        <input id="demo-email" type="email" {...register('email')} dir="ltr" className={inputCls} />
        <FieldError message={errors.email?.message} />
      </div>
      <div>
        <label className={labelCls} htmlFor="demo-phone">{t.demo.phone} *</label>
        <input id="demo-phone" {...register('phone')} dir="ltr" className={inputCls} />
        <FieldError message={errors.phone?.message} />
      </div>
      <div>
        <label className={labelCls} htmlFor="demo-org">{t.demo.organization}</label>
        <input id="demo-org" {...register('organization')} className={inputCls} />
      </div>
      <div>
        <label className={labelCls} htmlFor="demo-role">{t.demo.role} *</label>
        <select id="demo-role" {...register('role')} defaultValue="" className={inputCls}>
          <option value="" disabled>—</option>
          {t.demo.roles.map((label, i) => (
            <option key={label} value={roleValues[i]}>{label}</option>
          ))}
        </select>
        <FieldError message={errors.role?.message} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="demo-res">{t.demo.residencesCount}</label>
          <input id="demo-res" type="number" min={0} {...register('residences_count')} dir="ltr" className={inputCls} />
          <FieldError message={errors.residences_count?.message} />
        </div>
        <div>
          <label className={labelCls} htmlFor="demo-lots">{t.demo.lotsCount}</label>
          <input id="demo-lots" type="number" min={0} {...register('lots_count')} dir="ltr" className={inputCls} />
          <FieldError message={errors.lots_count?.message} />
        </div>
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls} htmlFor="demo-tool">{t.demo.currentTool}</label>
        <select id="demo-tool" {...register('current_tool')} defaultValue="" className={inputCls}>
          <option value="" disabled>—</option>
          {t.demo.tools.map((label, i) => (
            <option key={label} value={toolValues[i]}>{label}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls} htmlFor="demo-msg">{t.demo.message}</label>
        <textarea id="demo-msg" rows={3} {...register('message')} className={`${inputCls} resize-y`} />
      </div>
      <div className="sm:col-span-2">
        <label className="flex cursor-pointer items-start gap-2 text-sm text-ink-600">
          <input type="checkbox" {...register('consent')} className="mt-1 h-4 w-4 shrink-0 accent-teal-700" />
          <span>
            {t.demo.consent}{' '}
            <a href={t.locale === 'ar' ? '/ar/confidentialite' : '/confidentialite'} className="underline underline-offset-4">
              {t.demo.privacyLink}
            </a>
          </span>
        </label>
        <FieldError message={errors.consent?.message} />
      </div>
      <input type="text" {...register('website')} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="sm:col-span-2">
        <button type="submit" disabled={isSubmitting}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-reef-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-reef-800 disabled:opacity-60 sm:w-auto">
          {t.demo.submitDemo}
        </button>
      </div>
    </form>
  );
}

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  message: z.string().min(1).max(2000),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
});

function ContactForm({ t }: { t: LandingStrings }) {
  const startedAt = useStartedAt();
  const [done, setDone] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (values: z.infer<typeof contactSchema>) => {
    setServerError(null);
    try {
      const { data } = await axiosInstance.post('/api/public/contact', {
        ...values,
        locale: t.locale,
        form_started_at: startedAt,
      });
      setDone(data.reference ?? '');
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
      setServerError(resp?.errors
        ? Object.values(resp.errors).flat().join(' ')
        : (resp?.message ?? 'Error'));
    }
  };

  if (done !== null) {
    return (
      <div role="status" className="rounded-xl bg-emerald-50 p-6 text-center">
        <p className="font-display text-lg font-bold text-emerald-800">{t.demo.successTitle}</p>
        <p className="mt-1 text-sm text-emerald-700">{t.demo.successText}</p>
        <p className="mt-2 font-mono text-sm font-bold text-emerald-800" dir="ltr">{t.demo.reference} : {done}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      {serverError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p>
      )}
      <div>
        <label className={labelCls} htmlFor="contact-name">{t.demo.name} *</label>
        <input id="contact-name" {...register('name')} className={inputCls} />
        <FieldError message={errors.name?.message} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="contact-email">{t.demo.email}</label>
          <input id="contact-email" type="email" {...register('email')} dir="ltr" className={inputCls} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <label className={labelCls} htmlFor="contact-phone">{t.demo.phone}</label>
          <input id="contact-phone" {...register('phone')} dir="ltr" className={inputCls} />
        </div>
      </div>
      <p className="-mt-2 text-xs text-ink-400">{t.demo.emailOrPhone}</p>
      <div>
        <label className={labelCls} htmlFor="contact-msg">{t.demo.message} *</label>
        <textarea id="contact-msg" rows={4} {...register('message')} className={`${inputCls} resize-y`} />
        <FieldError message={errors.message?.message} />
      </div>
      <div>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-ink-600">
          <input type="checkbox" {...register('consent')} className="mt-1 h-4 w-4 shrink-0 accent-teal-700" />
          <span>
            {t.demo.consent}{' '}
            <a href={t.locale === 'ar' ? '/ar/confidentialite' : '/confidentialite'} className="underline underline-offset-4">
              {t.demo.privacyLink}
            </a>
          </span>
        </label>
        <FieldError message={errors.consent?.message} />
      </div>
      <input type="text" {...register('website')} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div>
        <button type="submit" disabled={isSubmitting}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-reef-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-reef-800 disabled:opacity-60 sm:w-auto">
          {t.demo.submitContact}
        </button>
      </div>
    </form>
  );
}

export function FinalCta({ t, base }: { t: LandingStrings; base: string }) {
  return (
    <section aria-labelledby="fin" className="bg-reef-950 text-white">
      <Reveal className="mx-auto max-w-[1200px] px-4 py-14 text-center sm:px-6">
        <h2 id="fin" className="font-display text-3xl font-bold sm:text-4xl" tabIndex={-1}>
          {t.final.title}
        </h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={`${base}/#demo`}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-amber-400 px-6 py-2.5 text-sm font-bold text-reef-950 hover:bg-amber-300">
            {t.final.demo}
          </a>
          <a href={`${base}/#espace`}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-white/30 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
            {t.final.space}
          </a>
        </div>
      </Reveal>
    </section>
  );
}
