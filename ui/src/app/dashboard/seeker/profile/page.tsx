'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/providers/auth-provider'
import { useToast } from '@/providers/toast-provider'
import { profileApi, documentsApi, atsApi, skillsApi } from '@/lib/api'
import { Camera, Upload, FileText, Trash2, Sparkles, Plus, X } from 'lucide-react'

function getAssetUrl(path: string) {
  if (path.startsWith('http')) return path
  // Reject non-file paths (e.g. "/profile/{id}/avatar" — an API endpoint, not a file)
  const isFilePath = path.includes('/uploads/') || /\.\w{2,5}$/.test(path.split('?')[0])
  if (!isFilePath) return ''
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '').replace(/\/api\/v1$/, '')
  return `${baseUrl}${path}`
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    bio: '',
  })
  const [skills, setSkills] = useState<{ id: string; name: string }[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [documents, setDocuments] = useState<{ id: string; filename?: string; url?: string; created_at?: string }[]>([])
  const [atsResult, setAtsResult] = useState<{ analysisId: string; ats_score: number; cv_chars: number; skills_chars: number; job_summary_chars: number } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    try {
      await profileApi.uploadAvatar(file)
      await refreshUser()
      toast.success('Foto profil berhasil diupload.')
  } catch {
    } finally {
      setUploadingAvatar(false)
    }
  }

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, docsRes, skillsRes] = await Promise.all([
        profileApi.get(),
        documentsApi.list(),
        skillsApi.list(),
      ])
      setFormData({
        name: profileRes.data.name || '',
        phone: (profileRes.data as unknown as Record<string, string>).phone ?? '',
        location: (profileRes.data as unknown as Record<string, string>).location ?? '',
        bio: (profileRes.data as unknown as Record<string, string>).bio ?? '',
      })
      setSkills(skillsRes.data.skills || [])
      setDocuments(docsRes.data.documents || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nama wajib diisi')
      return
    }
    setSaving(true)
    try {
      await profileApi.update({
        ...formData,
        name: formData.name.trim(),
      })
      await refreshUser()
      setEditing(false)
      toast.success('Profil berhasil disimpan.')
  } catch {
    } finally {
      setSaving(false)
    }
  }

  const addSkill = async () => {
    const name = newSkill.trim()
    if (!name || skills.some(s => s.name === name)) return
    try {
      const res = await skillsApi.add(name)
      setSkills(prev => [...prev, res.data])
      setNewSkill('')
      toast.success('Keahlian berhasil ditambahkan.')
  } catch {
    }
  }
  const removeSkill = async (skillId: string) => {
    try {
      await skillsApi.remove(skillId)
      setSkills(prev => prev.filter(s => s.id !== skillId))
      toast.success('Keahlian berhasil dihapus.')
  } catch {
    }
  }


  const handleUploadCV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Hanya file PDF yang diperbolehkan')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }
    setUploading(true)
    try {
      const res = await documentsApi.upload(file)
      const doc = res.data as Record<string, unknown>
      setDocuments(prev => [...prev, { id: String(doc.documentId ?? ''), filename: String(doc.originalName ?? doc.filename ?? ''), url: '', created_at: new Date().toISOString() }])
      toast.success('CV berhasil diupload.')
    } catch {
    } finally {
      setUploading(false)
    }
  }

  const handleAnalyzeCV = async (documentId: string) => {
    setAnalyzing(true)
    try {
      const res = await atsApi.scan({ documentId })
      setAtsResult(res.data)
      toast.success('Analisis ATS berhasil dibuat.')
    } catch {
    } finally {
      setAnalyzing(false)
    }
  }

  const removeDocument = async (id: string) => {
    try {
      await documentsApi.remove(id)
      setDocuments(prev => prev.filter(d => d.id !== id))
      toast.success('Dokumen berhasil dihapus.')
    } catch {
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>

      {/* Profile Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="group relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {user?.avatar && getAssetUrl(user.avatar) && (
              <img
                src={getAssetUrl(user.avatar)}
                alt={user.name}
                className="absolute inset-0 h-full w-full rounded-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            )}
            <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <Camera className="h-4 w-4" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
            </label>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <p className="mt-1 text-sm text-gray-400 capitalize">{user?.role === 'seeker' ? 'Pencari Kerja' : user?.role}</p>
          </div>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => setEditing(!editing)}>
            {editing ? 'Batal' : 'Edit Profil'}
          </Button>
        </div>
      </div>

      {/* Personal Info */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Informasi Pribadi</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nama"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            disabled={!editing}
          />
          <Input
            label="Telepon"
            value={formData.phone}
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            disabled={!editing}
            placeholder="08xxxxxxxxxx"
          />
          <Input
            label="Lokasi"
            value={formData.location}
            onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
            disabled={!editing}
            placeholder="Jakarta, Indonesia"
          />
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={formData.bio}
              onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              disabled={!editing}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="Ceritakan tentang diri Anda..."
            />
          </div>
        </div>
        {editing && (
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setEditing(false)}>Batal</Button>
            <Button loading={saving} className="w-full sm:w-auto" onClick={handleSave}>Simpan</Button>
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Keahlian</h2>
        <div className="flex flex-wrap gap-2">
          {skills.map(skill => (
            <Badge key={skill.id} variant="primary" className="gap-1">
              {skill.name}
              <button onClick={() => removeSkill(skill.id)} className="ml-1 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            placeholder="Tambah keahlian..."
            className="w-full sm:flex-1"
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
          />
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={addSkill}>
            <Plus className="mr-1 h-4 w-4" /> Tambah
          </Button>
        </div>
      </div>

      {/* Documents */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Dokumen</h2>

        {/* Upload area */}
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 text-center transition-colors hover:border-blue-400 hover:bg-blue-50 md:p-8">
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <p className="text-sm text-gray-600">Mengupload...</p>
            </div>
          ) : (
            <>
              <Upload className="mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">Drag & drop atau klik untuk upload</p>
              <p className="text-xs text-gray-500">PDF, maksimal 5MB</p>
            </>
          )}
          <input type="file" accept=".pdf" className="hidden" onChange={handleUploadCV} disabled={uploading} />
        </label>

        {/* Document list */}
        {documents.length > 0 && (
          <div className="mt-4 space-y-2">
            {documents.map(doc => (
              <div key={doc.id} className="flex flex-col gap-3 rounded-lg border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-gray-400" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{doc.filename || doc.id}</p>
                    <p className="text-xs text-gray-500">{doc.created_at ? new Date(doc.created_at).toLocaleDateString('id-ID') : ''}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => handleAnalyzeCV(doc.id)} loading={analyzing}>
                    <Sparkles className="mr-1 h-3.5 w-3.5" /> Analisis ATS
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => removeDocument(doc.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ATS Results */}
        {atsResult && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold text-blue-900">Hasil Analisis ATS</h3>
            <div className="mb-3">
              <span className="text-sm text-blue-700">Skor ATS: </span>
              <span className="text-lg font-bold text-blue-900">{atsResult.ats_score}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
