'use client'

import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Minus } from 'lucide-react'
import { useCart } from '@/components/cart-context'

export default function CartPage() {
  const { items: cartItems, totalPrice, updateQuantity, updateItemOption, removeFromCart, clearCart } = useCart()

  const hasMissingOptions = cartItems.some(item => 
    (item.availableColors && item.availableColors.length > 0 && !item.selectedColor) ||
    (item.availableSizes && item.availableSizes.length > 0 && !item.selectedSize)
  )

  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-serif font-light tracking-wide mb-12">
            Shopping Cart
          </h1>

          {cartItems.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg opacity-60 mb-8">Your cart is empty</p>
              <Link href="/shop">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                  {cartItems.map(item => (
                    <div key={(item as any)._cartId || item.id} className="flex gap-4 items-center border border-border p-4 rounded relative">
                      <div className="w-24 h-24 relative">
                        <Image src={item.image ?? '/placeholder.jpg'} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-serif text-sm mb-1">{item.name}</h4>
                        <div className="flex flex-col gap-2 mt-2">
                           {/* Size Selection */}
                           {item.availableSizes && item.availableSizes.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Size:</span>
                              <select 
                                value={item.selectedSize || ''} 
                                onChange={(e) => updateItemOption((item as any)._cartId, 'selectedSize', e.target.value)}
                                className={`text-xs border rounded p-1 ${!item.selectedSize ? 'border-red-500' : 'border-gray-300'}`}
                              >
                                <option value="">Select Size</option>
                                {item.availableSizes.map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          
                          {/* Color Selection */}
                          {item.availableColors && item.availableColors.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Color:</span>
                              <select 
                                value={item.selectedColor || ''} 
                                onChange={(e) => updateItemOption((item as any)._cartId, 'selectedColor', e.target.value)}
                                className={`text-xs border rounded p-1 ${!item.selectedColor ? 'border-red-500' : 'border-gray-300'}`}
                              >
                                <option value="">Select Color</option>
                                {item.availableColors.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <button onClick={() => updateQuantity((item as any)._cartId, item.quantity - 1)} className="px-3 py-2 bg-muted rounded">-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity((item as any)._cartId, item.quantity + 1)} className="px-3 py-2 bg-muted rounded">+</button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-serif">PKR {(item.price * item.quantity).toLocaleString()}</div>
                        <button onClick={() => removeFromCart((item as any)._cartId)} className="text-xs text-red-600 mt-2 flex items-center gap-2"><Trash2 className="w-4 h-4" />Remove</button>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Order Summary */}
                <div className="border border-border p-8">
                <h3 className="text-sm font-light tracking-wide mb-6 uppercase opacity-75">Order Summary</h3>
                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>PKR {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>PKR 0</span>
                  </div>
                </div>
                <div className="flex justify-between text-lg font-serif mb-6">
                  <span>Total</span>
                  <span>PKR {totalPrice.toLocaleString()}</span>
                </div>
                <Link href={cartItems.length && !hasMissingOptions ? '/checkout' : '#'}>
                  <Button disabled={cartItems.length === 0 || hasMissingOptions} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    {hasMissingOptions ? 'Select Options to Checkout' : 'Proceed to Checkout'}
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button variant="outline" className="w-full mt-3">
                    Continue Shopping
                  </Button>
                </Link>
                <div className="mt-4">
                  <Button variant="ghost" onClick={clearCart}>Clear Cart</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
