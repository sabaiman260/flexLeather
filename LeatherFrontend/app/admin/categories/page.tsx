'use client'

import { useEffect, useState } from 'react'
import { apiFetch, API_BASE_URL } from '@/lib/api'

type Category = {
  _id: string
  name: string
  slug: string
  description?: string
  isActive?: boolean
}

const FIXED_CATEGORIES = ['MEN', 'WOMEN', 'KIDS', 'OFFICE', 'GIFT IDEAS']

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadCategories = async () => {
    try {
      const res = await apiFetch('/api/v1/categories')
      setCategories(
        res?.data?.filter((c: Category) =>
          FIXED_CATEGORIES.includes(c.name.toUpperCase())
        ) || []
      )
      setError(null)
    } catch {
      setError('Failed to load categories')
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const ensureCategories = async () => {
    try {
      const token = localStorage.getItem('accessToken')

      for (const name of FIXED_CATEGORIES) {
        if (!categories.find(c => c.name.toUpperCase() === name)) {
          await fetch(`${API_BASE_URL}/api/v1/categories/create`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              name,
              description: `${name} category`
            })
          })
        }
      }

      await loadCategories()
    } catch (e: any) {
      setError(e?.message || 'Failed to ensure categories')
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      await fetch(`${API_BASE_URL}/api/v1/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      })
      await loadCategories()
    } catch {
      setError('Failed to delete category')
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-serif">Categories</h2>
      {error && <p className="text-red-600">{error}</p>}

      <button
        onClick={ensureCategories}
        className="px-4 py-2 bg-black text-white"
      >
        Ensure 5 Main Categories
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {categories.map(c => (
          <div key={c._id} className="border p-4">
            <h4 className="font-semibold">{c.name}</h4>
            <p className="text-xs opacity-60">Slug: {c.slug}</p>
            <p className="text-xs opacity-60">{c.description}</p>
            <button
              onClick={() => deleteCategory(c._id)}
              className="mt-2 text-red-600 text-xs"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
