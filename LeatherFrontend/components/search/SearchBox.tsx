"use client"
import React, { useEffect, useRef, useState } from 'react'
import { searchProducts, getPopularTerms, SearchProduct } from '../../lib/search'
import useDebounce from '../utils/useDebounce'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type Props = {
  products: SearchProduct[]
  onSelect?: (p: SearchProduct) => void
  onQueryChange?: (q: string) => void
  className?: string
}

function highlight(text = '', q = '') {
  if (!q) return text
  try {
    const parts = text.split(new RegExp(`(${q.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'ig'))
    return parts.map((part, i) => part.toLowerCase() === q.toLowerCase() ? <mark key={i} className="bg-yellow-200 text-black px-0">{part}</mark> : <span key={i}>{part}</span>)
  } catch {
    return text
  }
}

export default function SearchBox({ products, onSelect, onQueryChange, className = '' }: Props) {
  const [q, setQ] = useState('')
  const debounced = useDebounce(q, 300)
  const [results, setResults] = useState<Array<{ product: SearchProduct; score: number; matchedFields?: string[] }>>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!debounced) {
      setResults([])
      setOpen(false)
      return
    }
    const r = searchProducts(products, debounced, 8)
    setResults(r)
    setOpen(r.length > 0)
    setActiveIndex(0)
  }, [debounced, products])

  const popular = getPopularTerms(products, 6)
  const recent = typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('recentSearches') || '[]') as string[]) : []
  // Build left-hand suggestion phrases and right-hand product list
  let suggestionPhrases: string[] = []
  const productItems = results.map(r => r.product)
  const productsToShow = productItems.slice(0, 6)

  if (q.trim()) {
    const set = new Set<string>()
    const qn = q.toLowerCase()
    for (const p of productItems) {
      if (p.category && typeof p.category === 'string' && p.category.toLowerCase().includes(qn)) set.add(p.category)
      for (const t of p.tags || []) if (typeof t === 'string' && t.toLowerCase().includes(qn)) set.add(t)
      const nameWords = (p.name || '').split(/\s+/)
      for (let i = 0; i < nameWords.length; i++) {
        const tok = nameWords[i]
        if (!tok) continue
        if (tok.toLowerCase().includes(qn)) {
          set.add(tok)
          if (i + 1 < nameWords.length) set.add(`${tok} ${nameWords[i + 1]}`)
          if (i - 1 >= 0) set.add(`${nameWords[i - 1]} ${tok}`)
        }
      }
    }
    suggestionPhrases = Array.from(set).filter(s => s && s.toLowerCase() !== qn).slice(0, 8)
    if (suggestionPhrases.length === 0) suggestionPhrases = [q]
  } else {
    suggestionPhrases = [...recent, ...popular.filter(p => !recent.includes(p))].slice(0, 8)
  }

  const combined = [
    ...suggestionPhrases.map(p => ({ type: 'phrase', value: p } as const)),
    ...productsToShow.map(p => ({ type: 'product', value: p } as const)),
  ]

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, combined.length - 1))
      setOpen(true)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const sel = combined[activeIndex]
      // If a product is highlighted, go to product; otherwise perform full search on /search
      if (sel && sel.type === 'product') {
        selectItem(sel.value as SearchProduct)
        return
      }
      if (q.trim()) {
        setOpen(false)
        router.push(`/search?q=${encodeURIComponent(q.trim())}`)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  function persistRecent(val: string) {
    try {
      const prev = JSON.parse(localStorage.getItem('recentSearches') || '[]') as string[]
      const filtered = [val, ...prev.filter(r => r !== val)].slice(0, 6)
      localStorage.setItem('recentSearches', JSON.stringify(filtered))
    } catch {}
  }

  function selectItem(p: SearchProduct) {
    const val = p.name || ''
    setQ(val)
    setOpen(false)
    persistRecent(val)
    onSelect?.(p)
    // If the selected item looks like a product id (from index) navigate to product page, otherwise search
    if (p.id && p.id.length === 24) {
      router.push(`/products/${p.id}`)
    } else {
      router.push(`/shop?q=${encodeURIComponent(val)}`)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        className="w-full bg-transparent outline-none text-sm text-[#E6D8C8] placeholder:text-[#E6D8C8]/60"
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true); onQueryChange?.(e.target.value) }}
        onKeyDown={handleKey}
        placeholder="Search products, categories..."
        aria-autocomplete="list"
        aria-expanded={open}
      />

      {open && combined.length > 0 && (
        <div className="absolute z-50 mt-2 left-0 right-0 bg-white border rounded shadow max-h-80 overflow-auto" role="listbox">
          <div className="flex flex-col md:grid md:grid-cols-2">
            {/* Left: Suggestions */}
            <div className="md:border-r p-4">
              <h4 className="text-sm font-semibold mb-2">Suggestions</h4>
              <ul className="space-y-1">
                {suggestionPhrases.map((ph, i) => {
                  const idx = i
                  const active = activeIndex === idx
                  return (
                    <li
                      key={ph + i}
                      className={`px-2 py-1 rounded cursor-pointer ${active ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                      onMouseDown={() => { setQ(ph); persistRecent(ph); setOpen(false); router.push(`/shop?q=${encodeURIComponent(ph)}`) }}
                      role="option"
                      aria-selected={active}
                    >
                      <div className="text-sm">{highlight(ph, q)}</div>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Right: Products */}
            <div className="p-4">
              <h4 className="text-sm font-semibold mb-2">Products</h4>
              <ul className="space-y-3">
                {productsToShow.map((p, j) => {
                  const idx = suggestionPhrases.length + j
                  const active = activeIndex === idx
                  return (
                    <li key={p.id} className={`flex items-center gap-3 p-2 rounded ${active ? 'bg-slate-100' : 'hover:bg-slate-50'}`} onMouseDown={() => selectItem(p)} role="option" aria-selected={active}>
                      {p.image ? (
                        <div className="w-14 h-14 relative flex-shrink-0">
                          <Image src={p.image} alt={p.name || ''} fill sizes="56px" className="object-cover rounded" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-slate-100 rounded flex items-center justify-center text-xs text-slate-500">No</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{highlight(p.name || '', q)}</div>
                        <div className="text-xs text-slate-500">{p.category} {p.price ? `· PKR ${p.price}` : ''}</div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
