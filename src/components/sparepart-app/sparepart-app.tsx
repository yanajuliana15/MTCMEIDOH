'use client'

import { useState } from 'react'
import type { ViewName } from '@/lib/types'
import { Sidebar, MobileNav } from '@/components/sparepart-app/sidebar'
import { DashboardView } from '@/components/sparepart-app/views/dashboard-view'
import { SparepartView } from '@/components/sparepart-app/views/sparepart-view'
import { MesinView } from '@/components/sparepart-app/views/mesin-view'
import { SupplierView } from '@/components/sparepart-app/views/supplier-view'
import { TransaksiView } from '@/components/sparepart-app/views/transaksi-view'

export function SparepartApp() {
  const [view, setView] = useState<ViewName>('dashboard')
  const [alertsCount, setAlertsCount] = useState(0)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeView={view} onViewChange={setView} alertsCount={alertsCount} />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {view === 'dashboard' && <DashboardView />}
          {view === 'sparepart' && (
            <SparepartView
              onNavigateTransaksi={() => setView('transaksi')}
              onAlertsChange={setAlertsCount}
            />
          )}
          {view === 'mesin' && <MesinView />}
          {view === 'supplier' && <SupplierView />}
          {view === 'transaksi' && <TransaksiView />}
        </main>
      </div>

      <MobileNav activeView={view} onViewChange={setView} alertsCount={alertsCount} />
    </div>
  )
}
