"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useAuth } from '@/components/auth-provider'

type CartItem = {
  id: string
  name: string
  price: number
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
      return [...prev, { ...item, quantity: qty, _cartId: Date.now() + Math.random().toString() } as CartItem]
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
