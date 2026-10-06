'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Sparepart, TransaksiStok, TipeTransaksi, User } from '@/lib/types'
import { formatRupiah, formatTanggal, ROLE_PERMISSIONS } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { ArrowDownToLine, ArrowUpFromLine, Plus, History, TrendingDown } from 'lucide-react'
import { ExportImportButtons } from '@/components/sparepart-app/export-import-buttons'

export function TransaksiView({ user }: { user: User }) {
  const perm = ROLE_PERMISSIONS[user.role]
  const [transaksi, setTransaksi] = useState<TransaksiStok[]>([])
  const [sparepartList, setSparepartList] = useState<Sparepart[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTipe, setFilterTipe] = useState<'all' | TipeTransaksi>('all')
  const [filterSparepart, setFilterSparepart] = useState('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterTipe !== 'all') params.set('tipe', filterTipe)
      if (filterSparepart !== 'all') params.set('sparepartId', filterSparepart)
      const [tRes, spRes] = await Promise.all([
        fetch(`/api/transaksi?${params.toString()}`),
        fetch('/api/sparepart'),
      ])
      const [t, sp] = await Promise.all([tRes.json(), spRes.json()])
      setTransaksi(t); setSparepartList(sp)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [filterTipe, filterSparepart, toast])

  useEffect(() => {
    const t = setTimeout(loadData, 250)
    return () => clearTimeout(t)
  }, [loadData])

  const handleSave = async (formData: any) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/transaksi', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Gagal') }
      toast({ title: 'Berhasil', description: `Transaksi ${formData.tipe === 'MASUK' ? 'stok masuk' : 'stok keluar'} dicatat` })
      setIsFormOpen(false); loadData()
    } catch (e: any) {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const totalMasuk = transaksi.filter((t) => t.tipe === 'MASUK').reduce((s, t) => s + t.jumlah, 0)
  const totalKeluar = transaksi.filter((t) => t.tipe === 'KELUAR').reduce((s, t) => s + t.jumlah, 0)

  const canAddTransaksi = perm.canTransaksiMasuk || perm.canTransaksiKeluar

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transaksi Stok</h1>
          <p className="text-sm text-muted-foreground mt-1">Riwayat {transaksi.length} transaksi stok masuk/keluar</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportImportButtons
            entity="transaksi"
            data={transaksi.map((t) => ({
              tanggal: new Date(t.tanggal).toISOString().slice(0, 16),
              kodeSparepart: t.sparepart?.kode || '',
              namaSparepart: t.sparepart?.nama || '',
              tipe: t.tipe,
              jumlah: String(t.jumlah),
              satuan: t.sparepart?.satuan || '',
              referensi: t.referensi || '',
              catatan: t.catatan || '',
            }))}
            columns={[
              { key: 'tanggal', label: 'tanggal' },
              { key: 'kodeSparepart', label: 'kodeSparepart' },
              { key: 'tipe', label: 'tipe' },
              { key: 'jumlah', label: 'jumlah' },
              { key: 'referensi', label: 'referensi' },
              { key: 'catatan', label: 'catatan' },
            ]}
            filters={{ tipe: filterTipe !== 'all' ? filterTipe : undefined }}
            showImport={canAddTransaksi}
            canExportExcel={perm.canExportExcel}
            onImported={loadData}
          />
          {canAddTransaksi && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Catat Transaksi
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-green-100 p-3">
              <ArrowDownToLine className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Stok Masuk</div>
              <div className="text-xl font-bold">{totalMasuk} unit</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-red-100 p-3">
              <ArrowUpFromLine className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Stok Keluar</div>
              <div className="text-xl font-bold">{totalKeluar} unit</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-muted p-3">
              <TrendingDown className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Net Flow</div>
              <div className={`text-xl font-bold ${totalMasuk - totalKeluar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalMasuk - totalKeluar >= 0 ? '+' : ''}{totalMasuk - totalKeluar} unit
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <Select value={filterTipe} onValueChange={(v) => setFilterTipe(v as any)}>
              <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Tipe Transaksi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="MASUK">Stok Masuk</SelectItem>
                <SelectItem value="KELUAR">Stok Keluar</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSparepart} onValueChange={setFilterSparepart}>
              <SelectTrigger className="w-full md:flex-1"><SelectValue placeholder="Filter per sparepart" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Sparepart</SelectItem>
                {sparepartList.map((sp) => (
                  <SelectItem key={sp.id} value={sp.id}>{sp.kode} · {sp.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="h-96 animate-pulse" /></Card>
      ) : transaksi.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <History className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Belum ada transaksi</p>
            <p className="text-xs text-muted-foreground mt-1">Catat transaksi pertama untuk mulai melacak pergerakan stok</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat Transaksi</CardTitle>
            <CardDescription>{transaksi.length} transaksi terbaru</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {transaksi.map((t) => {
                const isMasuk = t.tipe === 'MASUK'
                return (
                  <div key={t.id} className="flex items-start gap-3 rounded-md border p-3 hover:bg-accent/50 transition-colors">
                    <div className={`rounded-full p-2 shrink-0 ${isMasuk ? 'bg-green-100' : 'bg-red-100'}`}>
                      {isMasuk ? <ArrowDownToLine className="h-4 w-4 text-green-600" /> : <ArrowUpFromLine className="h-4 w-4 text-red-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">{t.sparepart?.nama}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{t.sparepart?.kode}</Badge>
                        <Badge variant={isMasuk ? 'default' : 'destructive'} className="text-[10px]">
                          {isMasuk ? 'MASUK' : 'KELUAR'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTanggal(t.tanggal)}
                        {t.referensi && ` · Ref: ${t.referensi}`}
                      </div>
                      {t.catatan && <div className="text-xs text-muted-foreground mt-1 italic line-clamp-1">{t.catatan}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-bold ${isMasuk ? 'text-green-600' : 'text-red-600'}`}>
                        {isMasuk ? '+' : '−'}{t.jumlah}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{t.sparepart?.satuan}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <TransaksiForm
        key={isFormOpen ? 'open' : 'closed'}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        sparepartList={sparepartList}
        onSubmit={handleSave}
        submitting={submitting}
        userRole={user.role}
      />
    </div>
  )
}

interface TransaksiFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sparepartList: Sparepart[]
  onSubmit: (data: any) => void
  submitting: boolean
  userRole: 'ADMIN' | 'OPERATOR' | 'GUDANG'
}

function TransaksiForm({ open, onOpenChange, sparepartList, onSubmit, submitting, userRole }: TransaksiFormProps) {
  const perm = ROLE_PERMISSIONS[userRole]
  const defaultTipe: TipeTransaksi = perm.canTransaksiMasuk ? 'MASUK' : 'KELUAR'

  const [form, setForm] = useState(() => ({
    sparepartId: '', tipe: defaultTipe, jumlah: '', referensi: '', catatan: '',
    tanggal: new Date().toISOString().slice(0, 16),
  }))

  const selectedSparepart = sparepartList.find((s) => s.id === form.sparepartId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ ...form, tanggal: form.tanggal ? new Date(form.tanggal).toISOString() : undefined })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Catat Transaksi Stok</DialogTitle>
          <DialogDescription>Transaksi akan langsung memperbarui stok sparepart</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="t-sparepart">Sparepart *</Label>
            <Select value={form.sparepartId} onValueChange={(v) => setForm({ ...form, sparepartId: v })} required>
              <SelectTrigger><SelectValue placeholder="Pilih sparepart" /></SelectTrigger>
              <SelectContent>
                {sparepartList.map((sp) => (
                  <SelectItem key={sp.id} value={sp.id}>
                    {sp.kode} · {sp.nama} (Stok: {sp.stok} {sp.satuan})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSparepart && (
              <div className="rounded-md bg-muted/50 p-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stok saat ini</span>
                  <span className="font-semibold">{selectedSparepart.stok} {selectedSparepart.satuan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stok minimum</span>
                  <span className="font-semibold">{selectedSparepart.stokMinimum} {selectedSparepart.satuan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nilai/unit (Beli)</span>
                  <span className="font-semibold">{formatRupiah(selectedSparepart.hargaBeli)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipe Transaksi *</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!perm.canTransaksiMasuk}
                  onClick={() => setForm({ ...form, tipe: 'MASUK' })}
                  className={`flex flex-col items-center gap-1 rounded-md border p-3 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    form.tipe === 'MASUK' ? 'border-green-500 bg-green-50 text-green-700' : 'hover:bg-accent'
                  }`}
                >
                  <ArrowDownToLine className="h-5 w-5" />
                  Stok Masuk
                </button>
                <button
                  type="button"
                  disabled={!perm.canTransaksiKeluar}
                  onClick={() => setForm({ ...form, tipe: 'KELUAR' })}
                  className={`flex flex-col items-center gap-1 rounded-md border p-3 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    form.tipe === 'KELUAR' ? 'border-red-500 bg-red-50 text-red-700' : 'hover:bg-accent'
                  }`}
                >
                  <ArrowUpFromLine className="h-5 w-5" />
                  Stok Keluar
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-jumlah">Jumlah *</Label>
              <Input
                id="t-jumlah" type="number" min="1" value={form.jumlah}
                onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
                placeholder="10" required
              />
              {selectedSparepart && form.tipe === 'KELUAR' && Number(form.jumlah) > selectedSparepart.stok && (
                <p className="text-xs text-destructive">Jumlah melebihi stok tersedia ({selectedSparepart.stok})</p>
              )}
              {selectedSparepart && <p className="text-[10px] text-muted-foreground">Satuan: {selectedSparepart.satuan}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-tanggal">Tanggal</Label>
            <Input
              id="t-tanggal" type="datetime-local" value={form.tanggal}
              onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-referensi">Referensi</Label>
            <Input
              id="t-referensi" value={form.referensi}
              onChange={(e) => setForm({ ...form, referensi: e.target.value })}
              placeholder={form.tipe === 'MASUK' ? 'PO-2025-001' : 'WO-2025-045'}
            />
            <p className="text-[10px] text-muted-foreground">
              Nomor Purchase Order (untuk masuk) atau Work Order (untuk keluar)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-catatan">Catatan</Label>
            <Textarea
              id="t-catatan" value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
              placeholder="Catatan tambahan..." rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Catat Transaksi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
