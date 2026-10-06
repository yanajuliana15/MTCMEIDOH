'use client'

import { cn } from '@/lib/utils'
import type { ViewName } from '@/lib/types'
import { LayoutDashboard, Package, Cog, Truck, ArrowLeftRight, Wrench } from 'lucide-react'

interface SidebarProps {
  activeView: ViewName
  onViewChange: (view: ViewName) => void
  alertsCount: number
}

const navItems: Array<{ id: ViewName; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sparepart', label: 'Katalog Sparepart', icon: Package },
  { id: 'mesin', label: 'Mesin Industri', icon: Cog },
  { id: 'supplier', label: 'Supplier', icon: Truck },
  { id: 'transaksi', label: 'Transaksi Stok', icon: ArrowLeftRight },
]

export function Sidebar({ activeView, onViewChange, alertsCount }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-card h-screen sticky top-0">
      <div className="flex h-16 items-center gap-2 px-6 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wrench className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-bold leading-tight">SparePart Pro</div>
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

      <div className="px-3 py-4 border-t">
        <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          <div className="font-semibold text-foreground mb-1">PT. Manufaktur Nusantara</div>
          <div>Inventory Management System v1.0</div>
        </div>
      </div>
    </aside>
  )
}

export function MobileNav({ activeView, onViewChange, alertsCount }: SidebarProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card grid grid-cols-5">
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
            <Icon className="h-5 w-5" />
            <span className="truncate max-w-full px-1">{item.label.split(' ')[0]}</span>
            {item.id === 'sparepart' && alertsCount > 0 && (
              <span className="absolute top-1 right-1/4 h-2 w-2 rounded-full bg-destructive" />
            )}
          </button>
        )
      })}
    </div>
  )
}
