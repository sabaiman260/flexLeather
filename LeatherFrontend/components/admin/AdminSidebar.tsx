'use client'

import Link from 'next/link'

export default function AdminSidebar() {
  const links = [
    { href: '/admin', label: 'Home' },
    { href: '/admin/categories', label: 'Category' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/buyers', label: 'Buyers' },
    { href: '/admin/settings', label: 'Settings' },
    { href: '/admin/analytics', label: 'Analytics' },
    { href: '/admin/logout', label: 'Logout' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/reviews', label: 'Reviews' },

  ]
  return (
    <aside className="w-64 shrink-0 border-r border-border">
      <div className="p-4 text-lg font-serif">Admin</div>
      <nav className="space-y-1">
        {links.map(l => (
          <Link prefetch={false} key={l.href} href={l.href} className="block px-4 py-2 hover:bg-muted">{l.label}</Link>
        ))}
      </nav>
    </aside>
  )
}
