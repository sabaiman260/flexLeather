'use client'

import { useEffect, useState } from 'react'
import { apiFetch, API_BASE_URL, BackendProduct } from '@/lib/api'
import { X, Upload, Plus, Pencil, Trash2 } from 'lucide-react'

type FormState = {
  name: string
  price?: number
  description?: string
  discount?: number
  stock?: number
  sizes?: string
  colors?: string
  specs?: string
  isActive?: boolean
  category?: string
}

const FIXED_CATEGORIES = ['MEN', 'WOMEN', 'KIDS', 'OFFICE', 'GIFT IDEAS']

export default function AdminProductsPage() {
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([])
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [form, setForm] = useState<FormState>({
    name: '',
    price: undefined,
    description: '',
    discount: undefined,
    stock: undefined,
    sizes: '',
    colors: '',
    specs: '',
    isActive: true,
    category: ''
  })
  
  const [images, setImages] = useState<File[] | null>(null)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Initial Load
  useEffect(() => {
    loadCategories()
    loadAllProducts()
  }, [])

  // Image Previews
  useEffect(() => {
    if (images) {
      const urls = images.map(file => URL.createObjectURL(file))
      setImagePreviews(urls)
      return () => urls.forEach(url => URL.revokeObjectURL(url))
    } else {
      setImagePreviews([])
    }
  }, [images])

  const loadCategories = async () => {
    try {
      const res = await apiFetch('/api/v1/categories')
      setCategories(res?.data?.filter((c: any) => FIXED_CATEGORIES.includes(c.name.toUpperCase())) || [])
    } catch (e) {
      console.error(e)
    }
  }

  const loadAllProducts = async () => {
    try {
      setLoading(true)
      const res = await apiFetch('/api/v1/products/getAll')
      setProducts(res?.data || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      name: '',
      price: undefined,
      description: '',
      discount: undefined,
      stock: undefined,
      sizes: '',
      colors: '',
      specs: '',
      isActive: true,
      category: ''
    })
    setImages(null)
    setEditingId(null)
    setIsEditing(false)
    setError(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsEditing(false)
    setModalOpen(true)
  }

  const openEditModal = (p: BackendProduct) => {
    const catId = typeof p.category === 'object' ? p.category?._id : (p.category as string | undefined)
    setForm({
      name: p.name || '',
      price: p.price,
      description: p.description || '',
      discount: p.discount,
      stock: p.stock,
      sizes: Array.isArray(p.sizes) ? p.sizes.join(',') : '',
      colors: Array.isArray(p.colors) ? p.colors.join(',') : '',
      specs: Array.isArray(p.specs) ? p.specs.join(',') : '',
      isActive: true,
      category: catId || ''
    })
    setImages(null)
    setEditingId(p._id)
    setIsEditing(true)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name || form.price === undefined || !form.category) {
      setError('Name, price, and category are required!')
      return
    }

    try {
      const fd = new FormData()
      const sanitizeArrayString = (v?: string) =>
        v ? v.split(',').map(s => s.trim()).filter(Boolean).join(',') : ''

      fd.append('name', form.name)
      fd.append('price', String(form.price))
      if (form.discount !== undefined) fd.append('discount', String(form.discount))
      if (form.stock !== undefined) fd.append('stock', String(form.stock))
      if (form.description) fd.append('description', form.description)
      if (form.category) fd.append('category', form.category)
      if (form.isActive !== undefined) fd.append('isActive', String(form.isActive))
      if (form.sizes !== undefined) fd.append('sizes', sanitizeArrayString(form.sizes))
      if (form.colors !== undefined) fd.append('colors', sanitizeArrayString(form.colors))
      if (form.specs !== undefined) fd.append('specs', sanitizeArrayString(form.specs))
      
      images?.forEach(f => fd.append('images', f))

      const token = localStorage.getItem('accessToken')
      const url = isEditing 
        ? `${API_BASE_URL}/api/v1/products/update/${editingId}`
        : `${API_BASE_URL}/api/v1/products/create`
      
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: fd
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message || `Failed to ${isEditing ? 'update' : 'create'} product`)
      }

      setModalOpen(false)
      loadAllProducts()
      resetForm()
    } catch (e: any) {
      setError(e?.message || `Failed to ${isEditing ? 'update' : 'create'} product`)
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      const token = localStorage.getItem('accessToken')
      await fetch(`${API_BASE_URL}/api/v1/products/delete/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      })
      loadAllProducts()
    } catch (e: any) {
      alert(e?.message || 'Failed to delete product')
    }
  }

  const removeImage = (index: number) => {
    if (!images) return
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages.length > 0 ? newImages : null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif">Products</h2>
        <button onClick={openCreateModal} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded hover:bg-black/80 transition">
          <Plus size={18} /> Add Product
        </button>
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted border-b">
              <tr>
                <th className="p-4 font-medium">Image</th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Price (PKR)</th>
                <th className="p-4 font-medium">Stock</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map(p => (
                <tr key={p._id} className="hover:bg-muted/50 transition">
                  <td className="p-4">
                    <div className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden">
                      {p.imageUrls?.[0] ? (
                        <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <img src="/placeholder.jpg" alt="placeholder" className="w-full h-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4 text-muted-foreground">
                    {typeof p.category === 'object' ? p.category?.name : 'Unknown'}
                  </td>
                  <td className="p-4">PKR {p.price.toLocaleString()}</td>
                  <td className="p-4">{p.stock || 0}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => deleteProduct(p._id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-lg shadow-xl relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black">
              <X size={20} />
            </button>
            
            <h3 className="text-xl mb-6 font-serif">{isEditing ? 'Update Product' : 'Create Product'}</h3>
            
            {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-gray-500">Name</label>
                <input className="w-full border p-2 rounded focus:border-black outline-none" placeholder="Product Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-gray-500">Category</label>
                <select className="w-full border p-2 rounded focus:border-black outline-none" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-gray-500">Price (PKR)</label>
                <input className="w-full border p-2 rounded focus:border-black outline-none" type="number" placeholder="0" value={form.price ?? ''} onChange={e => setForm({ ...form, price: e.target.value === '' ? undefined : Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-gray-500">Discount (PKR)</label>
                <input className="w-full border p-2 rounded focus:border-black outline-none" type="number" placeholder="0" value={form.discount ?? ''} onChange={e => setForm({ ...form, discount: e.target.value === '' ? undefined : Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-gray-500">Stock</label>
                <input className="w-full border p-2 rounded focus:border-black outline-none" type="number" placeholder="0" value={form.stock ?? ''} onChange={e => setForm({ ...form, stock: e.target.value === '' ? undefined : Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-gray-500">Status</label>
                <select className="w-full border p-2 rounded focus:border-black outline-none" value={form.isActive ? 'true' : 'false'} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-medium uppercase text-gray-500">Description</label>
                <textarea className="w-full border p-2 rounded focus:border-black outline-none" rows={3} placeholder="Product description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}></textarea>
              </div>

              <div className="md:col-span-2 grid grid-cols-3 gap-4">
                 <div className="space-y-1">
                  <label className="text-xs font-medium uppercase text-gray-500">Sizes</label>
                  <input className="w-full border p-2 rounded focus:border-black outline-none" placeholder="S, M, L" value={form.sizes} onChange={e => setForm({ ...form, sizes: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase text-gray-500">Colors</label>
                  <input className="w-full border p-2 rounded focus:border-black outline-none" placeholder="Red, Blue" value={form.colors} onChange={e => setForm({ ...form, colors: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase text-gray-500">Specs</label>
                  <input className="w-full border p-2 rounded focus:border-black outline-none" placeholder="Cotton, Slim Fit" value={form.specs} onChange={e => setForm({ ...form, specs: e.target.value })} />
                </div>
              </div>

              <div className="md:col-span-2 space-y-3 pt-2">
                <label className="block text-sm font-medium text-gray-700">{isEditing ? 'Add New Images (Optional)' : 'Product Images'}</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {imagePreviews.map((src, index) => (
                    <div key={index} className="relative aspect-square border rounded-lg overflow-hidden group bg-gray-50">
                      {/* Use native img for blob/local previews to avoid Next/Image loader issues */}
                      <img src={src} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg aspect-square cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">Upload</span>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                      onChange={e => {
                        const newFiles = Array.from(e.target.files || [])
                        setImages(prev => prev ? [...prev, ...newFiles] : newFiles)
                      }} 
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
              <button className="px-4 py-2 border rounded hover:bg-gray-50" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="px-6 py-2 bg-black text-white rounded hover:bg-black/80" onClick={handleSubmit}>
                {isEditing ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
