'use client'

import { cn } from '@/lib/utils'
import type { ViewName, User } from '@/lib/types'
import { ROLE_LABEL, ROLE_BADGE_COLOR } from '@/lib/types'
import { LayoutDashboard, Package, Cog, Truck, ArrowLeftRight, Factory, LogOut } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'

interface SidebarProps {
  activeView: ViewName
  onViewChange: (view: ViewName) => void
  alertsCount: number
  user: User
  onLogout: () => void
}

const navItems: Array<{ id: ViewName; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sparepart', label: 'Katalog Sparepart', icon: Package },
  { id: 'mesin', label: 'Mesin Industri', icon: Cog },
  { id: 'supplier', label: 'Supplier', icon: Truck },
  { id: 'transaksi', label: 'Transaksi Stok', icon: ArrowLeftRight },
]

export function Sidebar({ activeView, onViewChange, alertsCount, user, onLogout }: SidebarProps) {
  const [confirmLogout, setConfirmLogout] = useState(false)
  const initials = user.nama.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <>
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-card h-screen sticky top-0">
        <div className="flex h-16 items-center gap-2 px-6 border-b">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Factory className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">MTC MEIDOH</div>
            <div className="text-xs text-muted-foreground">Mesin Industri</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.id === 'sparepart' && alertsCount > 0 && (
                  <span className={cn(
                    'ml-auto rounded-full px-2 py-0.5 text-xs font-semibold',
                    active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-destructive/15 text-destructive'
                  )}>
                    {alertsCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User info */}
        <div className="px-3 py-3 border-t">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/50 transition-colors">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.nama}</div>
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-semibold border ${ROLE_BADGE_COLOR[user.role]}`}>
                {ROLE_LABEL[user.role]}
              </span>
            </div>
            <button
              onClick={() => setConfirmLogout(true)}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari aplikasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan keluar dari akun <strong>{user.nama}</strong>. Silakan login kembali untuk mengakses aplikasi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={onLogout}>Keluar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function MobileNav({ activeView, onViewChange, alertsCount, user, onLogout }: SidebarProps) {
  const [confirmLogout, setConfirmLogout] = useState(false)
  const initials = user.nama.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-card border-b px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Factory className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm">MTC MEIDOH</span>
        </div>
        <button
          onClick={() => setConfirmLogout(true)}
          className="flex items-center gap-2 rounded-full border px-2 py-1"
        >
          <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
            {initials}
          </div>
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-card grid grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.id === 'sparepart' && alertsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center">
                    {alertsCount}
                  </span>
                )}
              </div>
              <span className="truncate max-w-full px-1">{item.label.split(' ')[0]}</span>
            </button>
          )
        })}
      </nav>

      <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari aplikasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan keluar dari akun <strong>{user.nama}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={onLogout}>Keluar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
