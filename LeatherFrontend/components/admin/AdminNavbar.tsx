'use client'

export default function AdminNavbar() {
  return (
    <div className="w-full h-12 border-b border-border flex items-center justify-between px-4 sticky top-0 z-40 bg-background">
      <div className="text-sm opacity-70">Dashboard</div>
      <div className="text-xs opacity-50">Signed in</div>
    </div>
  )
}
