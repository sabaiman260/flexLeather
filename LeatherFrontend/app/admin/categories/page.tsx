'use client'

import { useEffect, useState } from 'react'
import { apiFetch, API_BASE_URL, CategoryItem } from '@/lib/api'
import { Plus, Edit2, Trash2, ChevronRight, X } from 'lucide-react'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    parentCategory: '',
    description: '',
    isActive: true
  })

  const loadCategories = async () => {
    try {
      setLoading(true)
      const res = await apiFetch('/api/v1/categories?includeInactive=true')
      setCategories(res?.data || [])
      setError(null)
    } catch (e: any) {
      setError(e?.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const mainCategories = categories.filter(c => !c.parentCategory)
  const getSubcategories = (parentId: string) => {
    return categories.filter(c => {
      const pId = typeof c.parentCategory === 'object' ? c.parentCategory?._id : c.parentCategory
      return String(pId) === String(parentId)
    })
  }

  const openCreateModal = (parentId?: string) => {
    setEditingCategory(null)
    setFormData({
      name: '',
      parentCategory: parentId || '',
      description: '',
      isActive: true
    })
    setError(null)
    setSuccess(null)
    setIsModalOpen(true)
  }

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat)
    const pId = typeof cat.parentCategory === 'object' ? cat.parentCategory?._id : (cat.parentCategory || '')
    setFormData({
      name: cat.name,
      parentCategory: pId || '',
      description: cat.description || '',
      isActive: cat.isActive !== false
    })
    setError(null)
    setSuccess(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Category name is required')
      return
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const url = editingCategory
        ? `${API_BASE_URL}/api/v1/categories/${editingCategory._id}`
        : `${API_BASE_URL}/api/v1/categories/create`
      const method = editingCategory ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          parentCategory: formData.parentCategory || null,
          description: formData.description,
          isActive: formData.isActive
        })
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.message || 'Failed to save category')
      }

      setSuccess(editingCategory ? 'Category updated successfully' : 'Category created successfully')
      setIsModalOpen(false)
      await loadCategories()
    } catch (err: any) {
      setError(err?.message || 'Operation failed')
    }
  }

  const handleDelete = async (cat: CategoryItem) => {
    const isMain = !cat.parentCategory
    const label = isMain ? `Main Category "${cat.name}"` : `Subcategory "${cat.name}"`
    if (!confirm(`Are you sure you want to delete ${label}?`)) return

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const res = await fetch(`${API_BASE_URL}/api/v1/categories/${cat._id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.message || 'Failed to delete category')
      }

      setSuccess(`Deleted ${cat.name} successfully`)
      await loadCategories()
    } catch (err: any) {
      setError(err?.message || 'Failed to delete category')
    }
  }

  const ensureDefaultCategories = async () => {
    const defaults = [
      {
        main: 'WOMEN',
        subs: ['Handbags', 'Wallets', 'Accessories', 'Tote Bags', 'Jackets']
      },
      {
        main: 'MEN',
        subs: ['Wallets', 'Belts', 'Jackets', 'Messenger Bags', 'Briefcases']
      },
      {
        main: 'GIFT IDEAS',
        subs: ['For Him', 'For Her', 'Personalized', 'Keychains']
      },
      {
        main: 'TRAVEL',
        subs: ['Duffel Bags', 'Passport Covers', 'Luggage Tags', 'Toiletry Bags']
      },
      {
        main: 'OFFICE',
        subs: ['Laptop Bags', 'Organizers', 'Desk Mats', 'Card Holders']
      }
    ]

    try {
      setLoading(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

      for (const item of defaults) {
        // Create or get main category
        let parentId = ''
        const existingMain = categories.find(
          c => !c.parentCategory && c.name.toUpperCase() === item.main.toUpperCase()
        )

        if (existingMain) {
          parentId = existingMain._id
        } else {
          const res = await fetch(`${API_BASE_URL}/api/v1/categories/create`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              name: item.main,
              description: `${item.main} collection`
            })
          })
          const data = await res.json()
          if (data?.data?._id) {
            parentId = data.data._id
          }
        }

        if (parentId) {
          for (const sub of item.subs) {
            const existingSub = categories.find(c => {
              const pId = typeof c.parentCategory === 'object' ? c.parentCategory?._id : c.parentCategory
              return String(pId) === String(parentId) && c.name.toUpperCase() === sub.toUpperCase()
            })

            if (!existingSub) {
              await fetch(`${API_BASE_URL}/api/v1/categories/create`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                  name: sub,
                  parentCategory: parentId,
                  description: `${sub} under ${item.main}`
                })
              })
            }
          }
        }
      }

      setSuccess('Default categories and subcategories generated successfully!')
      await loadCategories()
    } catch (err: any) {
      setError(err?.message || 'Failed to seed categories')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif">Category Management</h2>
          <p className="text-sm opacity-70">Manage Main Categories & Subcategories dynamically for your store navigation.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={ensureDefaultCategories}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded hover:bg-gray-100 transition"
          >
            Seed Sample Structure
          </button>
          <button
            onClick={() => openCreateModal()}
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-neutral-800 transition flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}><X size={16} /></button>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm opacity-60">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mainCategories.map(main => {
            const subs = getSubcategories(main._id)
            return (
              <div
                key={main._id}
                className="border border-gray-200 rounded-lg p-5 bg-card shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3 pb-3 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-bold text-lg">{main.name}</h3>
                        {main.isActive === false && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-sans">Disabled</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">slug: /{main.slug || main.name.toLowerCase()}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(main)}
                        className="p-1.5 text-gray-500 hover:text-black rounded hover:bg-gray-100 transition"
                        title="Edit Main Category"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(main)}
                        className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition"
                        title="Delete Category"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories List */}
                  <div className="space-y-1.5 mb-4">
                    <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2">Subcategories ({subs.length})</p>
                    {subs.length === 0 ? (
                      <p className="text-xs italic text-gray-400">No subcategories yet</p>
                    ) : (
                      subs.map(sub => (
                        <div
                          key={sub._id}
                          className="flex items-center justify-between py-1.5 px-2.5 rounded bg-gray-50 text-sm group"
                        >
                          <div className="flex items-center gap-1.5">
                            <ChevronRight size={13} className="text-gray-400" />
                            <span className="font-medium text-gray-800">{sub.name}</span>
                            {sub.isActive === false && (
                              <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-sans">Disabled</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(sub)}
                              className="p-1 text-gray-500 hover:text-black"
                              title="Edit Subcategory"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(sub)}
                              className="p-1 text-red-500 hover:text-red-700"
                              title="Delete Subcategory"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button
                  onClick={() => openCreateModal(main._id)}
                  className="mt-2 w-full py-2 border border-dashed border-gray-300 rounded text-xs font-medium text-gray-600 hover:border-black hover:text-black hover:bg-gray-50 transition flex items-center justify-center gap-1"
                >
                  <Plus size={14} />
                  <span>Add Subcategory to {main.name}</span>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="font-serif font-bold text-lg">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Handbags or WOMEN"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-black outline-none"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Parent Category (Leave empty for Main Category)
                </label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-black outline-none bg-white"
                  value={formData.parentCategory}
                  onChange={e => setFormData({ ...formData, parentCategory: e.target.value })}
                >
                  <option value="">None (Top-Level Main Category)</option>
                  {mainCategories
                    .filter(c => !editingCategory || c._id !== editingCategory._id)
                    .map(c => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Category description"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-black outline-none"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Active (Visible on store)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded text-sm font-medium hover:bg-neutral-800"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
