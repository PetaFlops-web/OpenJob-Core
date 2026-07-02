'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { categoriesApi, jobsApi } from '@/lib/api'
import { useEmployer } from '@/providers/employer-provider'
import { useToast } from '@/providers/toast-provider'
import { FieldLabel, FormInput as Input, FormSelect as Select, TagsInput } from '@/components/ui/form-fields'
import type { Category } from '@/types'
import { useI18n } from '@/hooks/use-i18n'


export default function NewJobPage() {
  const router = useRouter()
  const { company } = useEmployer()
  const toast = useToast()
  const { t } = useI18n()
  const [categories, setCategories] = useState<Category[]>([])
  const [submitting, setSubmitting] = useState<null | 'open' | 'draft'>(null)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [jobType, setJobType] = useState('full-time')
  const [experienceLevel, setExperienceLevel] = useState('mid')
  const [locationType, setLocationType] = useState('onsite')
  const [locationCity, setLocationCity] = useState('')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [isSalaryVisible, setIsSalaryVisible] = useState(true)
  const [requirements, setRequirements] = useState<string[]>([])
  const [benefits, setBenefits] = useState<string[]>([])

  useEffect(() => {
    categoriesApi.list()
      .then((res) => {
        const list = res.data.categories ?? []
        setCategories(list)
        if (!categoryId && list[0]) setCategoryId(list[0].id)
      })
      .catch(() => setCategories([]))
  }, [categoryId])

  const submit = async (status: 'open' | 'draft') => {
    if (!company?.id) {
      setError(t('employer.jobs.noCompanyProfile'))
      toast.error(t('employer.jobs.noCompanyProfile'))
      return
    }
    if (!title.trim() || !description.trim() || !categoryId) {
      setError(t('employer.jobs.requiredFields'))
      toast.error(t('employer.jobs.requiredFields'))
      return
    }

    setError('')
    setSubmitting(status)
    try {
      await jobsApi.create({
        title: title.trim(),
        description: description.trim(),
        job_type: jobType,
        experience_level: experienceLevel,
        company_id: company.id,
        category_id: categoryId,
        status,
        salary_min: salaryMin ? Number(salaryMin) : undefined,
        salary_max: salaryMax ? Number(salaryMax) : undefined,
        is_salary_visible: isSalaryVisible,
        location_type: locationType,
        location_city: locationCity.trim() || undefined,
        requirements,
        benefits,
      })
      toast.success(status === 'draft' ? t('employer.jobs.draftSaved') : t('employer.jobs.published'))
      router.push('/dashboard/employer/jobs')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('employer.jobs.createFailed'))
    } finally {
      setSubmitting(null)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const intent = submitter?.value === 'draft' ? 'draft' : 'open'
    void submit(intent)
  }

  return (
    <form id="new-job-form" onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6 pb-12 md:space-y-8">
      <div className="flex items-center gap-4 md:hidden">
        <Link href="/dashboard/employer/jobs" className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-primary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold leading-7 text-primary">{t('employer.pages.postJob')}</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-error/30 bg-error-container/30 px-4 py-3 text-sm text-error">{error}</div>
      )}

      {!company && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {t('employer.jobs.companyNeeded')}
        </div>
      )}

      <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm md:p-6">
        <h2 className="mb-6 text-base font-semibold leading-6 text-primary">{t('employer.jobs.basicInfo')}</h2>
        <div className="space-y-6">
          <div>
            <FieldLabel required>{t('employer.jobs.title')}</FieldLabel>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
          </div>
          <div>
            <FieldLabel required>{t('employer.jobs.description')}</FieldLabel>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-y rounded-lg border border-border-subtle bg-surface px-4 py-3 text-sm leading-5 text-on-surface transition-all placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={t('employer.jobs.descriptionPlaceholder')}
              rows={6}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm md:p-6">
        <h2 className="mb-6 text-base font-semibold leading-6 text-primary">{t('employer.jobs.classification')}</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <FieldLabel required>{t('employer.jobs.category')}</FieldLabel>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">{t('employer.jobs.pilihCategory')}</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel required>{t('employer.jobs.jobType')}</FieldLabel>
            <Select value={jobType} onChange={(e) => setJobType(e.target.value)}>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
            </Select>
          </div>
          <div>
            <FieldLabel required>{t('employer.jobs.experienceLevel')}</FieldLabel>
            <Select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
              <option value="entry">Entry Level</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior</option>
            </Select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm md:p-6">
        <h2 className="mb-6 text-base font-semibold leading-6 text-primary">{t('employer.jobs.locationCompensation')}</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <FieldLabel>{t('employer.jobs.locationType')}</FieldLabel>
              <Select value={locationType} onChange={(e) => setLocationType(e.target.value)}>
                <option value="onsite">On-site</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </Select>
            </div>
            <div>
              <FieldLabel>{t('employer.jobs.city')}</FieldLabel>
              <Input value={locationCity} onChange={(e) => setLocationCity(e.target.value)} placeholder="e.g. Jakarta Pusat" />
            </div>
          </div>

          <div className="border-t border-border-subtle pt-4">
            <div className="mb-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <FieldLabel>{t('employer.jobs.salaryMin')}</FieldLabel>
                <Input value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} type="number" placeholder="10000000" />
              </div>
              <div>
                <FieldLabel>{t('employer.jobs.salaryMax')}</FieldLabel>
                <Input value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} type="number" placeholder="20000000" />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSalaryVisible((v) => !v)}
                className={`relative inline-block h-6 w-11 rounded-full transition-colors ${isSalaryVisible ? 'bg-primary' : 'bg-outline-variant'}`}
              >
                <span className={`absolute top-[2px] h-5 w-5 rounded-full border border-white bg-white transition-all ${isSalaryVisible ? 'left-[22px]' : 'left-[2px]'}`} />
              </button>
              <span className="text-sm leading-5 text-on-surface">{t('employer.jobs.showSalary')}</span>
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm md:p-6">
        <h2 className="mb-6 text-base font-semibold leading-6 text-primary">{t('employer.jobs.requirementsBenefits')}</h2>
        <div className="space-y-6">
          <TagsInput label={t('employer.jobs.requirementsLabel')} placeholder={t('employer.jobs.addSkill')} items={requirements} setItems={setRequirements} />
          <TagsInput label={t('employer.jobs.benefitsLabel')} placeholder={t('employer.jobs.addBenefit')} items={benefits} setItems={setBenefits} variant="primary" />
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="submit"
          name="intent"
          value="draft"
          disabled={submitting !== null}
          className="rounded-lg border border-outline px-4 py-2 text-sm font-semibold leading-5 text-on-surface transition-colors hover:bg-surface-variant disabled:opacity-50"
        >
          {submitting === 'draft' ? t('employer.jobs.saving') : t('employer.jobs.saveDraft')}
        </button>
        <button
          type="submit"
          name="intent"
          value="open"
          disabled={submitting !== null}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold leading-5 text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:opacity-50"
        >
          {submitting === 'open' ? t('employer.jobs.publishing') : t('employer.jobs.publish')}
        </button>
      </div>
    </form>
  )
}
