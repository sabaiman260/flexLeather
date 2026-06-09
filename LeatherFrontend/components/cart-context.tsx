"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { pushGtmEcommerceEvent } from '@/lib/gtm'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'

type CartItem = {
  id: string
  name: string
  price: number
  originalPrice?: number
  discount?: number
  image?: string
  quantity: number
  selectedSize?: string
  selectedColor?: string
  availableSizes?: string[]
  availableColors?: string[]
}

type CartContextType = {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  updateItemOption: (id: string, option: 'selectedSize' | 'selectedColor', value: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'flexleather_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()
  const prevLoggedIn = useRef(isLoggedIn)

  // Start with empty list on first render (server and client) to avoid hydration mismatch.
  const [items, setItems] = useState<CartItem[]>([])

  // Read cart from localStorage after hydration to keep SSR and client render consistent.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY)
      const parsed = raw ? (JSON.parse(raw) as CartItem[]) : []
      setItems(parsed)
    } catch (e) {
      setItems([])
    }
  }, [])

  useEffect(() => {
    if (prevLoggedIn.current && !isLoggedIn) {
      setItems([])
      localStorage.removeItem(CART_STORAGE_KEY)
    }
    prevLoggedIn.current = isLoggedIn
  }, [isLoggedIn])

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (err) {
      // ignore
    }
  }, [items])

  // When admin updates products, other tabs will receive a storage event and
  // we should reconcile cart item prices/discounts with latest product data.
  useEffect(() => {
    const onStorage = async (e: StorageEvent) => {
      if (e.key !== 'products_last_updated') return
      try {
        const raw = localStorage.getItem(CART_STORAGE_KEY)
        const parsed: CartItem[] = raw ? JSON.parse(raw) : []
        if (!parsed || parsed.length === 0) return

        // Get unique product IDs
        const ids = Array.from(new Set(parsed.map(i => i.id)))
        // Fetch product details in parallel
        const fetches = ids.map(id => apiFetch(`/api/v1/products/get/${id}`).then(r => ({ id, data: r?.data?.product })).catch(() => ({ id, data: null })))
        const results = await Promise.all(fetches)
        const map = new Map<string, any>()
        results.forEach(r => { if (r.data) map.set(r.id, r.data) })

        // Update cart with latest prices/discounts
        const updated = parsed.map(item => {
          const prod = map.get(item.id)
          if (!prod) return item
          const discount = prod.discount || 0
          const effectivePrice = discount > 0 ? Math.round(prod.price * (1 - discount / 100)) : prod.price
          return { ...item, price: effectivePrice, originalPrice: discount > 0 ? prod.price : undefined, discount: discount }
        })

        setItems(updated)
      } catch (err) {
        // ignore
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [setItems])

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0)

  const addToCart = (item: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems(prev => {
      // Find item with same ID AND same options
      const existing = prev.find(i => 
        i.id === item.id && 
        i.selectedSize === item.selectedSize && 
        i.selectedColor === item.selectedColor
      )
      
      if (existing) {
        return prev.map(i => 
          (i.id === item.id && i.selectedSize === item.selectedSize && i.selectedColor === item.selectedColor)
            ? { ...i, quantity: i.quantity + qty } 
            : i
        )
      }
      // If adding new item, use timestamp based temp ID if needed or just rely on combination
      // But simple array append is enough for now, though removing might be tricky if we rely only on ID.
      // Better: Generate unique 'cartId' or just filter carefully. 
      // For simplicity in this codebase, let's treat (id + size + color) as unique key logic in find/map
      // BUT removeFromCart uses only 'id'. This needs fix.
      // We'll update removeFromCart to use index or unique key? 
      // Let's attach a unique _cartId to each item to be safe.
      const cartItem = { ...item, quantity: qty, _cartId: Date.now() + Math.random().toString() } as CartItem & { _cartId: string }
      // Fire GTM AddToCart event (non-blocking)
      try {
        pushGtmEcommerceEvent('AddToCart', {
          actionField: {
            id: cartItem.id,
            value: cartItem.price * cartItem.quantity,
            revenue: cartItem.price * cartItem.quantity,
            source: typeof window !== 'undefined' ? window.location.pathname : null
          },
          items: [
            {
              item_id: cartItem.id,
              item_name: cartItem.name,
              price: cartItem.price,
              quantity: cartItem.quantity,
              discount: cartItem.discount || 0
            }
          ]
        })
      } catch (err) {}

      return [...prev, cartItem]
    })
  }

  const removeFromCart = (cartId: string) => setItems(prev => prev.filter(i => (i as any)._cartId !== cartId))

  const updateQuantity = (cartId: string, qty: number) => {
    setItems(prev => prev.map(i => (i as any)._cartId === cartId ? { ...i, quantity: Math.max(1, qty) } : i))
  }

  const updateItemOption = (cartId: string, option: 'selectedSize' | 'selectedColor', value: string) => {
    setItems(prev => prev.map(i => (i as any)._cartId === cartId ? { ...i, [option]: value } : i))
  }

  const clearCart = () => setItems([])

  return (
    <CartContext.Provider value={{ items, totalItems, totalPrice, addToCart, removeFromCart, updateQuantity, updateItemOption, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export default CartProvider
