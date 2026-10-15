'use client'

import { useEffect, useState } from 'react'
import type { DashboardData, User } from '@/lib/types'
import { formatRupiah, formatTanggal } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, AlertTriangle, CheckCircle, XCircle, Cog, Truck, TrendingUp, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const PIE_COLORS = ['#16a34a', '#d97706', '#dc2626', '#0891b2', '#7c3aed', '#db2777']

interface DashboardViewProps {
  user: User
  onNavigate: (view: 'sparepart' | 'mesin' | 'supplier' | 'transaksi') => void
}

export function DashboardView({ user, onNavigate }: DashboardViewProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => { if (!r.ok) throw new Error('Gagal memuat dashboard'); return r.json() })
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse"><CardContent className="h-32" /></Card>
        ))}
      </div>
    )
  }
  if (error || !data) {
    return <div className="text-destructive">Error: {error || 'Data tidak tersedia'}</div>
  }

  const stokStatusData = [
    { name: 'Stok Aman', value: data.stokAman, color: '#16a34a' },
    { name: 'Stok Menipis', value: data.stokMenipis, color: '#d97706' },
    { name: 'Stok Habis', value: data.stokHabis, color: '#dc2626' },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Inventory</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selamat datang kembali, <span className="font-medium">{user.nama}</span>. Berikut ringkasan inventaris.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('sparepart')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Sparepart</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSparepart}</div>
            <p className="text-xs text-muted-foreground mt-1">{data.totalKategori} kategori aktif</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('mesin')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Mesin Industri</CardTitle>
            <Cog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalMesin}</div>
            <p className="text-xs text-muted-foreground mt-1">{data.totalSupplier} supplier terdaftar</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('supplier')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Supplier</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSupplier}</div>
            <p className="text-xs text-muted-foreground mt-1">Mitra penyedia part</p>
          </CardContent>
        </Card>
      </div>

      {/* Stok Status Alert Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{data.stokAman}</div>
              <div className="text-xs text-muted-foreground">Sparepart stok aman</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-amber-100 p-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{data.stokMenipis}</div>
              <div className="text-xs text-muted-foreground">Stok menipis — perlu restock</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-red-100 p-3">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{data.stokHabis}</div>
              <div className="text-xs text-muted-foreground">Stok habis — segera PO</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribusi Sparepart per Kategori</CardTitle>
            <CardDescription>Jumlah item per kategori</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.distribusiKategori} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="nama" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} interval={0} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number, n: string) => (n === 'nilai' ? formatRupiah(v) : v)}
                />
                <Bar dataKey="jumlah" name="Jumlah" fill="#0891b2" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Stok Sparepart</CardTitle>
            <CardDescription>Distribusi sparepart berdasarkan status stok</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stokStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%" cy="50%"
                  outerRadius={90} innerRadius={45}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                >
                  {stokStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Mesin & Recent Transaksi */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Mesin</CardTitle>
            <CardDescription>Distribusi status operasional mesin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.statusMesin.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data mesin</p>
            ) : (
              data.statusMesin.map((s) => {
                const pct = data.totalMesin > 0 ? (s.jumlah / data.totalMesin) * 100 : 0
                const color = s.status === 'Aktif' ? 'bg-green-500' : s.status === 'Maintenance' ? 'bg-amber-500' : 'bg-red-500'
                return (
                  <div key={s.status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{s.status}</span>
                      <span className="text-muted-foreground">{s.jumlah} unit</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Transaksi Stok Terbaru</CardTitle>
                <CardDescription>8 transaksi terakhir stok masuk / keluar</CardDescription>
              </div>
              <button onClick={() => onNavigate('transaksi')} className="text-xs text-primary font-medium">
                Lihat semua →
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentTransaksi.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada transaksi</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {data.recentTransaksi.map((t) => {
                  const isMasuk = t.tipe === 'MASUK'
                  return (
                    <div key={t.id} className="flex items-center gap-3 rounded-md border p-2.5 hover:bg-accent/50 transition-colors">
                      <div className={`rounded-full p-2 ${isMasuk ? 'bg-green-100' : 'bg-red-100'}`}>
                        {isMasuk ? <ArrowDownToLine className="h-4 w-4 text-green-600" /> : <ArrowUpFromLine className="h-4 w-4 text-red-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{t.sparepart.nama}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.sparepart.kode} · {formatTanggal(t.tanggal)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${isMasuk ? 'text-green-600' : 'text-red-600'}`}>
                          {isMasuk ? '+' : '−'}{t.jumlah} {t.sparepart.satuan}
                        </div>
                        {t.referensi && <div className="text-xs text-muted-foreground">{t.referensi}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
