'use client'

import { cn } from '@/lib/utils'
import type { ViewName } from '@/lib/types'
import { Home, Package, Cog, ArrowLeftRight } from 'lucide-react'

interface BottomTabBarProps {
  activeView: ViewName
  onViewChange: (view: ViewName) => void
  alertsCount: number
}

const tabs: Array<{ id: ViewName; label: string; icon: typeof Home }> = [
  { id: 'dashboard', label: 'Beranda', icon: Home },
  { id: 'sparepart', label: 'Part', icon: Package },
  { id: 'mesin', label: 'Mesin', icon: Cog },
  { id: 'transaksi', label: 'Riwayat', icon: ArrowLeftRight },
]

export function BottomTabBar({ activeView, onViewChange, alertsCount }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200">
      <div className="grid grid-cols-4 max-w-5xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeView === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 py-2.5 transition-all',
                active ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-9 rounded-full bg-orange-500" />
              )}
              <div className="relative">
                <Icon
                  className={cn('h-5 w-5 transition-transform', active && 'scale-110')}
                  strokeWidth={active ? 2.5 : 2}
                />
                {tab.id === 'sparepart' && alertsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                    {alertsCount}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px]', active ? 'font-semibold' : 'font-medium')}>{tab.label}</span>
            </button>
          )
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-white" />
    </nav>
  )
}
