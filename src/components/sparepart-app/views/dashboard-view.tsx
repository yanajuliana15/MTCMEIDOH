'use client'

import { useEffect, useState } from 'react'
import type { DashboardData, User } from '@/lib/types'
import { formatRupiah, formatRupiahShort, formatTanggalCompact } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Package, AlertTriangle, CheckCircle, XCircle, Cog, ArrowDownToLine, ArrowUpFromLine, TrendingUp, Wallet, Boxes, Activity } from 'lucide-react'

interface DashboardViewProps {
  user: User
  onNavigate: (view: 'sparepart' | 'mesin' | 'transaksi') => void
}

export function DashboardView({ user, onNavigate }: DashboardViewProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 19 ? 'Selamat sore' : 'Selamat malam'

  if (loading || !data) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      {/* Greeting Card */}
      <Card className="border-0 bg-gradient-to-br from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-600/20 overflow-hidden">
        <div className="p-5 relative">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative">
            <p className="text-cyan-100 text-sm">{greeting},</p>
            <h1 className="text-xl font-bold">{user.nama} 👋</h1>
            <p className="text-xs text-cyan-100 mt-1">Berikut ringkasan inventaris hari ini</p>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-xs text-cyan-100 flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5" /> Nilai Inventory
                </div>
                <div className="text-2xl font-bold mt-0.5">{formatRupiah(data.totalNilaiStok)}</div>
                <div className="text-[11px] text-cyan-100 mt-0.5">
                  Potensi jual: {formatRupiahShort(data.totalNilaiJual)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-cyan-100">Profit Margin</div>
                <div className="text-lg font-bold text-emerald-200">
                  +{formatRupiahShort(data.totalNilaiJual - data.totalNilaiStok)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Package}
          label="Total Sparepart"
          value={String(data.totalSparepart)}
          subtitle={`${data.totalKategori} kategori`}
          color="cyan"
          onClick={() => onNavigate('sparepart')}
        />
        <StatCard
          icon={Cog}
          label="Mesin Aktif"
          value={String(data.totalMesin)}
          subtitle={`${data.statusMesin.find(s => s.status === 'Aktif')?.jumlah || 0} unit beroperasi`}
          color="violet"
          onClick={() => onNavigate('mesin')}
        />
        <StatCard
          icon={AlertTriangle}
          label="Stok Menipis"
          value={String(data.stokMenipis)}
          subtitle="Perlu segera restock"
          color="amber"
          onClick={() => onNavigate('sparepart')}
        />
        <StatCard
          icon={XCircle}
          label="Stok Habis"
          value={String(data.stokHabis)}
          subtitle="Wajib PO sekarang"
          color="red"
          onClick={() => onNavigate('sparepart')}
        />
      </div>

      {/* Stok Status Card */}
      <Card className="border-0 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-50 flex items-center justify-center">
              <Boxes className="h-4 w-4 text-cyan-600" />
            </div>
            <h2 className="text-sm font-semibold">Status Stok</h2>
          </div>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="space-y-2.5">
          <StatusBar label="Stok Aman" value={data.stokAman} total={data.totalSparepart} color="emerald" />
          <StatusBar label="Stok Menipis" value={data.stokMenipis} total={data.totalSparepart} color="amber" />
          <StatusBar label="Stok Habis" value={data.stokHabis} total={data.totalSparepart} color="red" />
        </div>
      </Card>

      {/* Distribusi Kategori */}
      <Card className="border-0 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <Boxes className="h-4 w-4 text-violet-600" />
            </div>
            <h2 className="text-sm font-semibold">Distribusi per Kategori</h2>
          </div>
        </div>
        <div className="space-y-2">
          {data.distribusiKategori.slice(0, 5).map((k) => {
            const pct = data.totalSparepart > 0 ? (k.jumlah / data.totalSparepart) * 100 : 0
            return (
              <div key={k.nama}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{k.nama}</span>
                  <span className="text-muted-foreground">{k.jumlah} item · {formatRupiahShort(k.nilai)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Status Mesin */}
      {data.statusMesin.length > 0 && (
        <Card className="border-0 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Cog className="h-4 w-4 text-emerald-600" />
              </div>
              <h2 className="text-sm font-semibold">Status Mesin</h2>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {data.statusMesin.map((s) => {
              const colors: Record<string, string> = {
                'Aktif': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                'Maintenance': 'bg-amber-50 text-amber-700 border-amber-200',
                'Berhenti': 'bg-red-50 text-red-700 border-red-200',
              }
              return (
                <div key={s.status} className={`rounded-xl border p-3 text-center ${colors[s.status] || 'bg-slate-50'}`}>
                  <div className="text-2xl font-bold">{s.jumlah}</div>
                  <div className="text-[10px] font-medium uppercase tracking-wide">{s.status}</div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Recent Transaksi */}
      <Card className="border-0 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-50 flex items-center justify-center">
              <Activity className="h-4 w-4 text-cyan-600" />
            </div>
            <h2 className="text-sm font-semibold">Transaksi Terbaru</h2>
          </div>
          <button onClick={() => onNavigate('transaksi')} className="text-xs text-cyan-600 font-medium">
            Lihat semua →
          </button>
        </div>

        {data.recentTransaksi.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Belum ada transaksi</p>
        ) : (
          <div className="space-y-2">
            {data.recentTransaksi.slice(0, 5).map((t) => {
              const isMasuk = t.tipe === 'MASUK'
              return (
                <div key={t.id} className="flex items-center gap-3 py-2">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${isMasuk ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    {isMasuk ? <ArrowDownToLine className="h-4 w-4 text-emerald-600" /> : <ArrowUpFromLine className="h-4 w-4 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.sparepart.nama}</div>
                    <div className="text-[11px] text-muted-foreground">{formatTanggalCompact(t.tanggal)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${isMasuk ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isMasuk ? '+' : '−'}{t.jumlah}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{t.sparepart.satuan}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function StatCard({
  icon: Icon, label, value, subtitle, color, onClick,
}: {
  icon: any
  label: string
  value: string
  subtitle: string
  color: 'cyan' | 'violet' | 'amber' | 'red'
  onClick?: () => void
}) {
  const colors = {
    cyan: 'bg-cyan-50 text-cyan-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  }
  return (
    <Card
      className="border-0 shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] transition-transform"
      onClick={onClick}
    >
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-2 ${colors[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{subtitle}</div>
    </Card>
  )
}

function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: 'emerald' | 'amber' | 'red' }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  const colors = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value} item ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full ${colors[color]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
