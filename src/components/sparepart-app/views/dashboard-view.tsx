'use client'

import { useEffect, useState } from 'react'
import type { DashboardData, User } from '@/lib/types'
import { formatRupiah, formatRupiahShort, formatTanggalCompact } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Package, AlertTriangle, CheckCircle2, XCircle, Cog, ArrowDownToLine, ArrowUpFromLine, Wallet, TrendingUp, Boxes, Activity, ChevronRight } from 'lucide-react'

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
      <div className="p-4 space-y-3 animate-pulse">
        <div className="h-40 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Hero Header - Dark with Orange Accent */}
      <div className="relative bg-slate-900 text-white overflow-hidden">
        {/* Industrial dot pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '16px 16px',
        }} />
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />

        <div className="relative p-5 max-w-5xl mx-auto">
          {/* Greeting */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs text-slate-400">{greeting},</p>
              <h1 className="text-xl font-bold leading-tight">{user.nama}</h1>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Status Sistem</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-emerald-300">Online</span>
              </div>
            </div>
          </div>

          {/* Total Inventory Value - Big Number */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-[11px] text-slate-300 uppercase tracking-wider font-medium">Nilai Inventory</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-300 text-[11px] font-medium">
                <TrendingUp className="h-3 w-3" />
                +{formatRupiahShort(data.totalNilaiJual - data.totalNilaiStok)}
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight">{formatRupiah(data.totalNilaiStok)}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Potensi jual: {formatRupiahShort(data.totalNilaiJual)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 grid grid-cols-2 gap-3 max-w-5xl mx-auto">
        <QuickStat
          icon={Package}
          label="Total Sparepart"
          value={data.totalSparepart}
          subtitle={`${data.totalKategori} kategori`}
          color="orange"
          onClick={() => onNavigate('sparepart')}
        />
        <QuickStat
          icon={Cog}
          label="Mesin Aktif"
          value={data.totalMesin}
          subtitle={`${data.statusMesin.find(s => s.status === 'Aktif')?.jumlah || 0} unit operasi`}
          color="slate"
          onClick={() => onNavigate('mesin')}
        />
        <QuickStat
          icon={AlertTriangle}
          label="Stok Menipis"
          value={data.stokMenipis}
          subtitle="Perlu restock"
          color="amber"
          onClick={() => onNavigate('sparepart')}
        />
        <QuickStat
          icon={XCircle}
          label="Stok Habis"
          value={data.stokHabis}
          subtitle="Segera PO"
          color="red"
          onClick={() => onNavigate('sparepart')}
        />
      </div>

      {/* Stok Status Card */}
      <div className="px-4 max-w-5xl mx-auto">
        <Card className="border border-slate-200 shadow-sm rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-orange-50 flex items-center justify-center">
                <Boxes className="h-3.5 w-3.5 text-orange-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Status Stok</h2>
            </div>
            <span className="text-[10px] text-slate-400">{data.totalSparepart} item</span>
          </div>

          <div className="space-y-3">
            <StatusBar label="Stok Aman" value={data.stokAman} total={data.totalSparepart} color="emerald" icon={CheckCircle2} />
            <StatusBar label="Stok Menipis" value={data.stokMenipis} total={data.totalSparepart} color="amber" icon={AlertTriangle} />
            <StatusBar label="Stok Habis" value={data.stokHabis} total={data.totalSparepart} color="red" icon={XCircle} />
          </div>
        </Card>
      </div>

      {/* Distribusi Kategori */}
      <div className="px-4 max-w-5xl mx-auto">
        <Card className="border border-slate-200 shadow-sm rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center">
                <Boxes className="h-3.5 w-3.5 text-slate-700" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Distribusi Kategori</h2>
            </div>
          </div>
          <div className="space-y-2.5">
            {data.distribusiKategori.slice(0, 5).map((k, idx) => {
              const pct = data.totalSparepart > 0 ? (k.jumlah / data.totalSparepart) * 100 : 0
              const colors = ['bg-orange-500', 'bg-amber-500', 'bg-slate-700', 'bg-emerald-500', 'bg-rose-500']
              return (
                <div key={k.nama}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{k.nama}</span>
                    <span className="text-slate-500">{k.jumlah} · {formatRupiahShort(k.nilai)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Status Mesin */}
      {data.statusMesin.length > 0 && (
        <div className="px-4 max-w-5xl mx-auto">
          <Card className="border border-slate-200 shadow-sm rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Cog className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Status Mesin</h2>
              </div>
              <button onClick={() => onNavigate('mesin')} className="text-[11px] text-orange-600 font-medium flex items-center gap-0.5">
                Lihat <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {data.statusMesin.map((s) => {
                const styles: Record<string, { bg: string; text: string; ring: string }> = {
                  'Aktif': { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-100' },
                  'Maintenance': { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-100' },
                  'Berhenti': { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-100' },
                }
                const style = styles[s.status] || styles['Aktif']
                return (
                  <div key={s.status} className={`rounded-xl ${style.bg} ring-1 ${style.ring} p-3 text-center`}>
                    <div className={`text-2xl font-bold ${style.text}`}>{s.jumlah}</div>
                    <div className={`text-[10px] font-medium uppercase tracking-wide ${style.text}`}>{s.status}</div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Recent Transaksi */}
      <div className="px-4 pb-4 max-w-5xl mx-auto">
        <Card className="border border-slate-200 shadow-sm rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-slate-900 flex items-center justify-center">
                <Activity className="h-3.5 w-3.5 text-orange-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Transaksi Terbaru</h2>
            </div>
            <button onClick={() => onNavigate('transaksi')} className="text-[11px] text-orange-600 font-medium flex items-center gap-0.5">
              Semua <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {data.recentTransaksi.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Belum ada transaksi</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentTransaksi.slice(0, 5).map((t) => {
                const isMasuk = t.tipe === 'MASUK'
                return (
                  <div key={t.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isMasuk ? 'bg-emerald-50' : 'bg-red-50'
                    }`}>
                      {isMasuk
                        ? <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-600" />
                        : <ArrowUpFromLine className="h-3.5 w-3.5 text-red-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">{t.sparepart.nama}</div>
                      <div className="text-[10px] text-slate-500">{formatTanggalCompact(t.tanggal)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-bold ${isMasuk ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isMasuk ? '+' : '−'}{t.jumlah}
                      </div>
                      <div className="text-[9px] text-slate-400">{t.sparepart.satuan}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function QuickStat({
  icon: Icon, label, value, subtitle, color, onClick,
}: {
  icon: any
  label: string
  value: number
  subtitle: string
  color: 'orange' | 'slate' | 'amber' | 'red'
  onClick?: () => void
}) {
  const colors = {
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'hover:border-orange-200' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'hover:border-slate-300' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'hover:border-amber-200' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'hover:border-red-200' },
  }
  return (
    <Card
      className={`border border-slate-200 shadow-sm rounded-2xl p-3.5 cursor-pointer transition-all active:scale-[0.98] ${colors[color].border}`}
      onClick={onClick}
    >
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${colors[color].bg}`}>
        <Icon className={`h-4 w-4 ${colors[color].text}`} />
      </div>
      <div className="text-xl font-bold text-slate-900 leading-none">{value}</div>
      <div className="text-[11px] font-medium text-slate-700 mt-1">{label}</div>
      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{subtitle}</div>
    </Card>
  )
}

function StatusBar({ label, value, total, color, icon: Icon }: {
  label: string
  value: number
  total: number
  color: 'emerald' | 'amber' | 'red'
  icon: any
}) {
  const pct = total > 0 ? (value / total) * 100 : 0
  const colors = {
    emerald: { bar: 'bg-emerald-500', text: 'text-emerald-600', icon: 'text-emerald-500' },
    amber: { bar: 'bg-amber-500', text: 'text-amber-600', icon: 'text-amber-500' },
    red: { bar: 'bg-red-500', text: 'text-red-600', icon: 'text-red-500' },
  }
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-medium text-slate-700 flex items-center gap-1.5">
          <Icon className={`h-3 w-3 ${colors[color].icon}`} />
          {label}
        </span>
        <span className="text-slate-500">{value} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full ${colors[color].bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
