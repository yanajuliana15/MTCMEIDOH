'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Sparepart, TransaksiStok, TipeTransaksi, User } from '@/lib/types'
import { formatRupiah, formatTanggalCompact, ROLE_PERMISSIONS } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { ArrowDownToLine, ArrowUpFromLine, Plus, History, TrendingDown, X } from 'lucide-react'

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
      setTransaksi(t)
      setSparepartList(sp)
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal membuat transaksi')
      }
      toast({
        title: 'Berhasil',
        description: `Transaksi ${formData.tipe === 'MASUK' ? 'stok masuk' : 'stok keluar'} dicatat`,
      })
      setIsFormOpen(false)
      loadData()
    } catch (e: any) {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const totalMasuk = transaksi.filter((t) => t.tipe === 'MASUK').reduce((s, t) => s + t.jumlah, 0)
  const totalKeluar = transaksi.filter((t) => t.tipe === 'KELUAR').reduce((s, t) => s + t.jumlah, 0)
  const netFlow = totalMasuk - totalKeluar

  const canAddTransaksi = perm.canTransaksiMasuk || perm.canTransaksiKeluar

  return (
    <div className="pb-24">
      {/* Stats summary - sticky */}
      <div className="sticky top-[57px] z-20 bg-white/95 backdrop-blur border-b">
        <div className="p-3 max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-emerald-50 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-700 mb-0.5">
                <ArrowDownToLine className="h-3 w-3" /> Masuk
              </div>
              <div className="text-lg font-bold text-emerald-700">+{totalMasuk}</div>
            </div>
            <div className="rounded-2xl bg-red-50 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-red-700 mb-0.5">
                <ArrowUpFromLine className="h-3 w-3" /> Keluar
              </div>
              <div className="text-lg font-bold text-red-700">−{totalKeluar}</div>
            </div>
            <div className="rounded-2xl bg-cyan-50 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-cyan-700 mb-0.5">
                <TrendingDown className="h-3 w-3" /> Net
              </div>
              <div className={`text-lg font-bold ${netFlow >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {netFlow >= 0 ? '+' : ''}{netFlow}
              </div>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'MASUK', label: 'Masuk' },
              { id: 'KELUAR', label: 'Keluar' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setFilterTipe(chip.id as any)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  filterTipe === chip.id ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-3 max-w-5xl mx-auto">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : transaksi.length === 0 ? (
          <div className="text-center py-16">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Belum ada transaksi</p>
            <p className="text-xs text-muted-foreground mt-1">Catat transaksi pertama Anda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transaksi.map((t) => {
              const isMasuk = t.tipe === 'MASUK'
              return (
                <Card
                  key={t.id}
                  className="border-0 shadow-sm rounded-2xl p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isMasuk ? 'bg-emerald-50' : 'bg-red-50'
                    }`}>
                      {isMasuk ? (
                        <ArrowDownToLine className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <ArrowUpFromLine className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-sm font-medium truncate">{t.sparepart?.nama}</span>
                        <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 h-3.5">{t.sparepart?.kode}</Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {formatTanggalCompact(t.tanggal)}
                        {t.referensi && ` · ${t.referensi}`}
                      </div>
                      {t.catatan && (
                        <div className="text-[10px] text-muted-foreground italic line-clamp-1 mt-0.5">"{t.catatan}"</div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-bold ${isMasuk ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isMasuk ? '+' : '−'}{t.jumlah}
                      </div>
                      <div className="text-[9px] text-muted-foreground">{t.sparepart?.satuan}</div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {canAddTransaksi && (
        <button
          onClick={() => setIsFormOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 z-30 h-14 w-14 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/40 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Catat Transaksi"
        >
          <Plus className="h-6 w-6" />
        </button>
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
  // Default tipe: jika operator hanya bisa KELUAR
  const defaultTipe: TipeTransaksi = perm.canTransaksiMasuk ? 'MASUK' : 'KELUAR'

  const [form, setForm] = useState(() => ({
    sparepartId: '',
    tipe: defaultTipe,
    jumlah: '',
    referensi: '',
    catatan: '',
    tanggal: new Date().toISOString().slice(0, 16),
  }))

  const selectedSparepart = sparepartList.find((s) => s.id === form.sparepartId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...form,
      tanggal: form.tanggal ? new Date(form.tanggal).toISOString() : undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Catat Transaksi Stok</DialogTitle>
          <DialogDescription>Transaksi akan langsung mengupdate stok</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Sparepart *</Label>
            <Select value={form.sparepartId} onValueChange={(v) => setForm({ ...form, sparepartId: v })} required>
              <SelectTrigger className="h-10"><SelectValue placeholder="Pilih sparepart" /></SelectTrigger>
              <SelectContent>
                {sparepartList.map((sp) => (
                  <SelectItem key={sp.id} value={sp.id}>
                    {sp.kode} · {sp.nama} (Stok: {sp.stok} {sp.satuan})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSparepart && (
              <div className="rounded-xl bg-slate-50 p-2.5 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stok saat ini</span>
                  <span className="font-semibold">{selectedSparepart.stok} {selectedSparepart.satuan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stok minimum</span>
                  <span className="font-semibold">{selectedSparepart.stokMinimum} {selectedSparepart.satuan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nilai/unit</span>
                  <span className="font-semibold">{formatRupiah(selectedSparepart.hargaBeli)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tipe Transaksi *</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!perm.canTransaksiMasuk}
                onClick={() => setForm({ ...form, tipe: 'MASUK' })}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  form.tipe === 'MASUK' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'hover:bg-accent'
                }`}
              >
                <ArrowDownToLine className="h-5 w-5" />
                Stok Masuk
              </button>
              <button
                type="button"
                disabled={!perm.canTransaksiKeluar}
                onClick={() => setForm({ ...form, tipe: 'KELUAR' })}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  form.tipe === 'KELUAR' ? 'border-red-500 bg-red-50 text-red-700' : 'hover:bg-accent'
                }`}
              >
                <ArrowUpFromLine className="h-5 w-5" />
                Stok Keluar
              </button>
            </div>
            {userRole === 'OPERATOR' && (
              <p className="text-[10px] text-muted-foreground">Operator hanya dapat mencatat stok keluar</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Jumlah *</Label>
              <Input
                type="number"
                min="1"
                value={form.jumlah}
                onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
                placeholder="10"
                required
                className="h-10"
              />
              {selectedSparepart && form.tipe === 'KELUAR' && Number(form.jumlah) > selectedSparepart.stok && (
                <p className="text-[10px] text-destructive">Melebihi stok ({selectedSparepart.stok})</p>
              )}
              {selectedSparepart && <p className="text-[10px] text-muted-foreground">Satuan: {selectedSparepart.satuan}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tanggal</Label>
              <Input
                type="datetime-local"
                value={form.tanggal}
                onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Referensi</Label>
            <Input
              value={form.referensi}
              onChange={(e) => setForm({ ...form, referensi: e.target.value })}
              placeholder={form.tipe === 'MASUK' ? 'PO-2025-001' : 'WO-2025-045'}
              className="h-10"
            />
            <p className="text-[10px] text-muted-foreground">Nomor PO (masuk) atau Work Order (keluar)</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Catatan</Label>
            <Textarea
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
              placeholder="Catatan tambahan..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Batal</Button>
            <Button type="submit" disabled={submitting} className="bg-cyan-600 hover:bg-cyan-700">
              {submitting ? 'Menyimpan...' : 'Catat'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
