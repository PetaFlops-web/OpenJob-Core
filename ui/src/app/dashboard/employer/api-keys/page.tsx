'use client'

import { useState, useEffect, useCallback } from 'react'
import { developerApi } from '@/lib/api'
import { useEmployer } from '@/providers/employer-provider'
import { useToast } from '@/providers/toast-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, RotateCw, Copy, Check } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

interface ApiKey {
  id: string
  company_id: string
  name: string
  key_prefix: string
  permissions: string[]
  rate_limit: number
  last_used_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export default function ApiKeysPage() {
  const { company } = useEmployer()
  const toast = useToast()
  const { t } = useI18n()
  const companyId = company?.id
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [revealedKey, setRevealedKey] = useState<{ id: string; key: string } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchKeys = useCallback(async () => {
    if (!companyId) return
    try {
      const res = await developerApi.list(companyId)
      setKeys(res.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      toast.success(t('employer.apiKeys.toastCopied'))
      setTimeout(() => setCopied(null), 2000)
  } catch {
    }
  }

  const handleCreate = async () => {
    if (!newKeyName.trim() || !companyId) return
    setCreating(true)
    try {
      const res = await developerApi.create({ company_id: companyId, name: newKeyName.trim() })
      setRevealedKey({ id: res.data.id, key: res.data.key })
      setNewKeyName('')
      await fetchKeys()
      toast.success(t('employer.apiKeys.toastCreated'))
  } catch {
    } finally {
      setCreating(false)
    }
  }

  const handleRotate = async (id: string) => {
    if (!companyId) return
    try {
      const res = await developerApi.rotate(id, { company_id: companyId })
      setRevealedKey({ id: res.data.id, key: res.data.key })
      await fetchKeys()
      toast.success(t('employer.apiKeys.toastRotated'))
  } catch {
    }
  }

  const handleRevoke = async (id: string) => {
    if (!companyId || !confirm(t('employer.apiKeys.confirmRevoke'))) return
    try {
      await developerApi.revoke(id, { company_id: companyId })
      setKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: false } : k))
      toast.success(t('employer.apiKeys.toastRevoked'))
    } catch {
    }
  }

  if (!company) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">{t('employer.apiKeys.noCompany')}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-7xl">
      <div className="mb-8">
        <h2 className="mb-2 text-xl font-semibold leading-7 text-on-surface">{t('employer.apiKeys.title')}</h2>
        <p className="max-w-2xl text-sm leading-5 text-on-surface-variant">
          {t('employer.apiKeys.desc')}
        </p>
      </div>

      {/* Revealed key banner */}
      {revealedKey && (
        <div className="mb-6 rounded-xl border border-yellow-300 bg-yellow-50 p-4">
          <p className="mb-1 text-sm font-semibold text-yellow-900">🔑 {t('employer.apiKeys.newKeyBanner')}</p>
          <p className="mb-2 text-xs text-yellow-700">{t('employer.apiKeys.newKeyDesc')}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 rounded bg-yellow-100 px-3 py-2 font-mono text-sm text-yellow-900 break-all">{revealedKey.key}</code>
            <Button size="sm" variant="outline" onClick={() => handleCopy(revealedKey.key, revealedKey.id)} className="w-full sm:w-auto">
              {copied === revealedKey.id ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
              {copied === revealedKey.id ? t('employer.apiKeys.copied') : t('employer.apiKeys.copy')}
            </Button>
          </div>
        </div>
      )}

      {/* Create new key */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row">
        <Input
          value={newKeyName}
          onChange={e => setNewKeyName(e.target.value)}
          placeholder={t('employer.apiKeys.keyName')}
          className="flex-1"
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
        />
        <Button onClick={handleCreate} loading={creating} className="w-full sm:w-auto">
          <Plus className="mr-1 h-4 w-4" /> {t('employer.apiKeys.createKey')}
        </Button>
      </div>

      {/* Keys table */}
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">{t('employer.apiKeys.loading')}</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">{t('employer.apiKeys.noKeys')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border-subtle bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  <th className="px-4 py-3">{t('employer.apiKeys.name')}</th>
                  <th className="px-4 py-3">{t('employer.apiKeys.prefix')}</th>
                  <th className="px-4 py-3">{t('employer.apiKeys.permissions')}</th>
                  <th className="px-4 py-3">{t('employer.apiKeys.rateLimit')}</th>
                  <th className="px-4 py-3">{t('employer.table.status')}</th>
                  <th className="px-4 py-3">{t('employer.apiKeys.created')}</th>
                  <th className="px-4 py-3">{t('employer.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {keys.map(key => (
                  <tr key={key.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{key.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700">{key.key_prefix}</code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {key.permissions.map(p => (
                          <span key={p} className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{p}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{key.rate_limit}/min</td>
                    <td className="px-4 py-3">
                      <span className={key.is_active ? 'text-green-600' : 'text-red-500'}>
                        {key.is_active ? t('employer.apiKeys.active') : t('employer.apiKeys.revoked')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(key.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleRotate(key.id)}
                          className="rounded p-1.5 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          title={t('employer.apiKeys.rotate')}
                        >
                          <RotateCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRevoke(key.id)}
                          className="rounded p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          title={t('employer.apiKeys.revoke')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security tip */}
      <div className="mt-8 flex items-start rounded-xl border border-primary-fixed bg-primary-fixed-dim/20 p-4">
        <svg className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h4 className="mb-1 text-sm font-semibold leading-5 text-on-surface">{t('employer.apiKeys.securityTip')}</h4>
          <p className="text-[13px] leading-[18px] text-on-surface-variant">
            {t('employer.apiKeys.securityDesc')}
          </p>
        </div>
      </div>
    </main>
  )
}
