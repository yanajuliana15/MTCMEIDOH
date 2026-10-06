'use client'

import { useEffect, useState } from 'react'
import type { ViewName, User } from '@/lib/types'
import { LoginPage } from '@/components/sparepart-app/login-page'
import { Sidebar, MobileNav } from '@/components/sparepart-app/sidebar'
import { DashboardView } from '@/components/sparepart-app/views/dashboard-view'
import { SparepartView } from '@/components/sparepart-app/views/sparepart-view'
import { MesinView } from '@/components/sparepart-app/views/mesin-view'
import { SupplierView } from '@/components/sparepart-app/views/supplier-view'
import { TransaksiView } from '@/components/sparepart-app/views/transaksi-view'
import { UserView } from '@/components/sparepart-app/views/user-view'

export function SparepartApp() {
  const [user, setUser] = useState<User | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [view, setView] = useState<ViewName>('dashboard')
  const [alertsCount, setAlertsCount] = useState(0)

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((data) => { if (data.user) setUser(data.user) })
      .catch(() => {})
      .finally(() => setCheckingAuth(false))
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    setUser(null)
    setView('dashboard')
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <LoginPage onSuccess={(u) => setUser(u)} />
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeView={view}
        onViewChange={setView}
        alertsCount={alertsCount}
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <MobileNav
          activeView={view}
          onViewChange={setView}
          alertsCount={alertsCount}
          user={user}
          onLogout={handleLogout}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {view === 'dashboard' && <DashboardView user={user} onNavigate={(v) => setView(v)} />}
          {view === 'sparepart' && (
            <SparepartView
              user={user}
              onNavigateTransaksi={() => setView('transaksi')}
              onAlertsChange={setAlertsCount}
            />
          )}
          {view === 'mesin' && <MesinView user={user} />}
          {view === 'supplier' && <SupplierView user={user} />}
          {view === 'transaksi' && <TransaksiView user={user} />}
          {view === 'users' && user.role === 'SUPERADMIN' && <UserView user={user} />}
        </main>
      </div>
    </div>
  )
}
