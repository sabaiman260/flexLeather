'use client'

import { Menu } from 'lucide-react'

type Props = {
  onToggleSidebar?: () => void
}

export default function AdminNavbar({ onToggleSidebar }: Props) {
  return (
    <div className="w-full h-12 border-b border-border flex items-center justify-between px-4 sticky top-0 z-40 bg-background">
      <div className="flex items-center gap-2">
        {/* Mobile sidebar toggle */}
        <button
          className="md:hidden p-2"
          aria-label="Toggle sidebar"
          onClick={() => onToggleSidebar && onToggleSidebar()}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
      <div />
    </div>
  )
}
