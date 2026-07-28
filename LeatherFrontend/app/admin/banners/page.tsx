'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { apiFetch, API_BASE_URL } from '@/lib/api'
import { X, Upload, Plus, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'

type Banner = {
  _id: string
  title?: string
  subtitle?: string
  ctaText?: string
  ctaUrl?: string
  category?: string
  order?: number
  isActive?: boolean
  imageUrl?: string
  imageKey?: string
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState({ title: '', subtitle: '', ctaText: '', ctaUrl: '', category: '', order: 0, isActive: true })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    loadAllBanners()
  }, [])

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile)
      setImagePreview(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setImagePreview(null)
    }
  }, [imageFile])

  const loadAllBanners = async () => {
    try {
      setLoading(true)
      const res = await apiFetch('/api/v1/banners/getAllAdmin')
      setBanners(res?.data || [])
    } catch (e: any) {
      console.error(e)
      toast.error('Failed to load banners')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm({ title: '', subtitle: '', ctaText: '', ctaUrl: '', category: '', order: 0, isActive: true })
    setImageFile(null)
    setIsEditing(false)
    setEditingId(null)
    setModalOpen(true)
  }

  const openEdit = (b: Banner) => {
    setForm({ title: b.title || '', subtitle: b.subtitle || '', ctaText: b.ctaText || '', ctaUrl: b.ctaUrl || '', category: b.category || '', order: b.order || 0, isActive: !!b.isActive })
    setImageFile(null)
    setImagePreview(b.imageUrl || null)
    setIsEditing(true)
    setEditingId(b._id)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      if (form.subtitle) fd.append('subtitle', form.subtitle)
      if (form.ctaText) fd.append('ctaText', form.ctaText)
      if (form.ctaUrl) fd.append('ctaUrl', form.ctaUrl)
      if (form.category) fd.append('category', form.category)
      fd.append('order', String(form.order ?? 0))
      fd.append('isActive', String(form.isActive))
      if (imageFile) fd.append('image', imageFile)

      const token = localStorage.getItem('accessToken')
      const url = isEditing ? `${API_BASE_URL}/api/v1/banners/update/${editingId}` : `${API_BASE_URL}/api/v1/banners/create`
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: fd,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message || 'Failed to save banner')
      }

      toast.success(isEditing ? 'Banner updated' : 'Banner created')
      setModalOpen(false)
      loadAllBanners()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save banner')
    }
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Delete this banner?')) return
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`${API_BASE_URL}/api/v1/banners/delete/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!res.ok) throw new Error('Failed to delete')
      loadAllBanners()
    } catch (e: any) {
      alert(e?.message || 'Failed to delete banner')
    }
  }

  const moveOrder = async (index: number, dir: 'up' | 'down') => {
    const copy = [...banners]
    const target = dir === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= copy.length) return
    const tmp = copy[target]
    copy[target] = copy[index]
    copy[index] = tmp
    // Update order values based on position
    const payload = copy.map((b, i) => ({ id: b._id, order: i }))

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`${API_BASE_URL}/api/v1/banners/reorder`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to reorder')
      loadAllBanners()
    } catch (e: any) {
      alert(e?.message || 'Failed to reorder')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif">Banners</h2>
        <button onClick={openCreate} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded">
          <Plus size={16} /> Add Banner
        </button>
      </div>

      {loading ? (
        <p>Loading banners...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted border-b">
              <tr>
                <th className="p-4 font-medium">Image</th>
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">CTA</th>
                <th className="p-4 font-medium">Order</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {banners.map((b, i) => (
                <tr key={b._id} className={`${b.isActive !== false ? '' : 'opacity-50'}`}>
                  <td className="p-4">
                    <div className="relative w-24 h-16 bg-gray-100 rounded overflow-hidden p-1 flex items-center justify-center">
                      {b.imageUrl ? (
                        <Image src={b.imageUrl} alt={b.title || 'Banner'} fill sizes="100vw" className="object-cover" />
                      ) : (
                        <div className="text-xs text-gray-500">No image</div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-medium">{b.title}</td>
                  <td className="p-4">{b.ctaText}</td>
                  <td className="p-4">{b.order}</td>
                  <td className="p-4">{b.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 items-center">
                      <button onClick={() => moveOrder(i, 'up')} className="p-2 text-gray-600 hover:bg-gray-50 rounded" title="Move up"><ArrowUp size={16} /></button>
                      <button onClick={() => moveOrder(i, 'down')} className="p-2 text-gray-600 hover:bg-gray-50 rounded" title="Move down"><ArrowDown size={16} /></button>
                      <button onClick={() => openEdit(b)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Pencil size={16} /></button>
                      <button onClick={() => deleteBanner(b._id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">No banners found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-lg shadow-xl relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black">
              <X size={20} />
            </button>

            <h3 className="text-xl mb-6 font-serif">{isEditing ? 'Update Banner' : 'Create Banner'}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-gray-500">Title</label>
                <input className="w-full border p-2 rounded" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-gray-500">Subtitle</label>
                <input className="w-full border p-2 rounded" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-gray-500">CTA Text</label>
                <input className="w-full border p-2 rounded" value={form.ctaText} onChange={e => setForm({ ...form, ctaText: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-gray-500">CTA URL</label>
                <input className="w-full border p-2 rounded" value={form.ctaUrl} onChange={e => setForm({ ...form, ctaUrl: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-gray-500">Order</label>
                <input className="w-full border p-2 rounded" type="number" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-gray-500">Status</label>
                <select className="w-full border p-2 rounded" value={String(form.isActive)} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block text-sm font-medium text-gray-700">Banner Image</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {imagePreview ? (
                    <div className="relative aspect-video border rounded-lg overflow-hidden bg-gray-50">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No preview</div>
                  )}
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg aspect-video cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const f = e.target.files?.[0] || null
                      setImageFile(f)
                    }} />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
              <button className="px-4 py-2 border rounded" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="px-6 py-2 bg-black text-white rounded" onClick={handleSubmit}>{isEditing ? 'Save Changes' : 'Create Banner'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
