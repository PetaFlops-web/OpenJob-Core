'use client'

import { useState } from 'react'
import { useI18n } from '@/hooks/use-i18n'

export default function SettingsPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState('hr@techcorp.id')
  const [notifyNew, setNotifyNew] = useState(true)
  const [notifyInterview, setNotifyInterview] = useState(true)
  const [notifyReminder, setNotifyReminder] = useState(false)

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8">
      <div className="mb-4">
        <h2 className="text-xl font-semibold leading-7 text-on-surface">{t('employer.settings.title')}</h2>
        <p className="mt-1 text-sm leading-5 text-on-surface-variant">
          {t('employer.settings.desc')}
        </p>
      </div>

      {/* Organization Settings */}
      <section className="rounded-xl border border-border-subtle bg-surface p-6 shadow-sm">
        <div className="border-b border-border-subtle pb-4">
          <h3 className="text-base font-semibold leading-6 text-primary">{t('employer.settings.accountInfo')}</h3>
          <p className="mt-1 text-[13px] leading-[18px] text-on-surface-variant">
            {t('employer.settings.accountDesc')}
          </p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
              {t('employer.settings.fullName')}
            </label>
            <input
              id="name"
              type="text"
              defaultValue="Sari Dewi"
              className="w-full rounded-lg border border-border-subtle bg-surface-container-lowest px-4 py-2.5 text-sm leading-5 text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
              {t('employer.settings.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-surface-container-lowest px-4 py-2.5 text-sm leading-5 text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
              {t('employer.settings.phone')}
            </label>
            <input
              id="phone"
              type="tel"
              defaultValue="+62 813-9876-5432"
              className="w-full rounded-lg border border-border-subtle bg-surface-container-lowest px-4 py-2.5 text-sm leading-5 text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label htmlFor="role" className="mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
              {t('employer.settings.role')}
            </label>
            <input
              id="role"
              type="text"
              defaultValue="HR Manager"
              disabled
              className="w-full rounded-lg border border-border-subtle bg-surface-container px-4 py-2.5 text-sm leading-5 text-on-surface-variant opacity-70"
            />
          </div>
        </div>
      </section>

      {/* Notification Preferences */}
      <section className="rounded-xl border border-border-subtle bg-surface p-6 shadow-sm">
        <div className="border-b border-border-subtle pb-4">
          <h3 className="text-base font-semibold leading-6 text-primary">{t('employer.settings.notifPreferences')}</h3>
          <p className="mt-1 text-[13px] leading-[18px] text-on-surface-variant">
            {t('employer.settings.notifDesc')}
          </p>
        </div>
        <div className="mt-6 divide-y divide-border-subtle">
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium leading-5 text-on-surface">{t('employer.settings.newApplicant')}</p>
              <p className="text-[13px] leading-[18px] text-on-surface-variant">{t('employer.settings.newApplicantDesc')}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center shrink-0">
              <input type="checkbox" checked={notifyNew} onChange={(e) => setNotifyNew(e.target.checked)} className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-outline-variant after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border-subtle after:bg-white after:transition-all peer-checked:bg-status-open peer-checked:after:translate-x-full peer-checked:after:border-white" />
            </label>
          </div>
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium leading-5 text-on-surface">{t('employer.settings.interviewUpdate')}</p>
              <p className="text-[13px] leading-[18px] text-on-surface-variant">{t('employer.settings.interviewUpdateDesc')}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center shrink-0">
              <input type="checkbox" checked={notifyInterview} onChange={(e) => setNotifyInterview(e.target.checked)} className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-outline-variant after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border-subtle after:bg-white after:transition-all peer-checked:bg-status-open peer-checked:after:translate-x-full peer-checked:after:border-white" />
            </label>
          </div>
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium leading-5 text-on-surface">{t('employer.settings.dailyReminder')}</p>
              <p className="text-[13px] leading-[18px] text-on-surface-variant">{t('employer.settings.dailyReminderDesc')}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center shrink-0">
              <input type="checkbox" checked={notifyReminder} onChange={(e) => setNotifyReminder(e.target.checked)} className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-outline-variant after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border-subtle after:bg-white after:transition-all peer-checked:bg-status-open peer-checked:after:translate-x-full peer-checked:after:border-white" />
            </label>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-status-rejected/30 bg-surface p-6 shadow-sm">
        <div className="border-b border-status-rejected/20 pb-4">
          <h3 className="text-base font-semibold leading-6 text-error">{t('employer.settings.dangerZone')}</h3>
          <p className="mt-1 text-[13px] leading-[18px] text-on-surface-variant">
            {t('employer.settings.dangerDesc')}
          </p>
        </div>
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium leading-5 text-on-surface">{t('employer.settings.deactivate')}</p>
              <p className="text-[13px] leading-[18px] text-on-surface-variant">{t('employer.settings.deactivateDesc')}</p>
            </div>
            <button className="shrink-0 rounded-lg border border-status-rejected px-4 py-2 text-sm font-semibold leading-5 text-status-rejected transition-colors hover:bg-error-container/20">
              {t('employer.settings.deactivateBtn')}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium leading-5 text-on-surface">{t('employer.settings.deletePermanently')}</p>
              <p className="text-[13px] leading-[18px] text-on-surface-variant">{t('employer.settings.deleteDesc')}</p>
            </div>
            <button className="shrink-0 rounded-lg bg-error px-4 py-2 text-sm font-semibold leading-5 text-on-error shadow-sm transition-colors hover:bg-red-700">
              {t('employer.settings.deleteBtn')}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
