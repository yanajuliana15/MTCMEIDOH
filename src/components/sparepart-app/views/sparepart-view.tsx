'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import type { Sparepart, Kategori, Mesin, StatusStok, User } from '@/lib/types'
import { formatRupiah, formatTanggalShort, getStatusStok, ROLE_PERMISSIONS } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useToast } from '@/hooks/use-toast'
import { Search, Plus, Edit, Trash2, Package, X, Cog, ArrowLeftRight, ChevronRight, Layers } from 'lucide-react'

interface SparepartViewProps {
  user: User
  onNavigateTransaksi: () => void
  onAlertsChange?: (n: number) => void
}

export function SparepartView({ user, onNavigateTransaksi, onAlertsChange }: SparepartViewProps) {
  const perm = ROLE_PERMISSIONS[user.role]
  const [items, setItems] = useState<Sparepart[]>([])
  const [kategoriList, setKategoriList] = useState<Kategori[]>([])
  const [mesinList, setMesinList] = useState<Mesin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('all')
  const [filterStatus, setFilterStatus] = useState<'all' | StatusStok>('all')
  const [detailItem, setDetailItem] = useState<Sparepart | null>(null)
  const [editingItem, setEditingItem] = useState<Sparepart | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<Sparepart | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterKategori !== 'all') params.set('kategoriId', filterKategori)
      if (filterStatus !== 'all') params.set('statusStok', filterStatus)
      const [spRes, ktRes, msRes] = await Promise.all([
        fetch(`/api/sparepart?${params.toString()}`),
        fetch('/api/kategori'),
        fetch('/api/mesin'),
      ])
      if (!spRes.ok) throw new Error('Gagal memuat sparepart')
      const [sp, kt, ms] = await Promise.all([spRes.json(), ktRes.json(), msRes.json()])
      setItems(sp)
      setKategoriList(kt)
      setMesinList(ms)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [search, filterKategori, filterStatus])

  useEffect(() => {
    const t = setTimeout(loadData, 250)
    return () => clearTimeout(t)
  }, [loadData])

  const alertsCount = useMemo(
    () => items.filter((i) => getStatusStok(i.stok, i.stokMinimum) !== 'aman').length,
    [items]
  )
  const onAlertsChangeRef = useRef(onAlertsChange)
  onAlertsChangeRef.current = onAlertsChange
  useEffect(() => {
    onAlertsChangeRef.current?.(alertsCount)
  }, [alertsCount])

  const handleSave = async (formData: FormData) => {
    setSubmitting(true)
    try {
      const payload: any = {
        kode: formData.kode, nama: formData.nama,
        kategoriId: formData.kategoriId || null,
        satuan: formData.satuan,
        stokMinimum: Number(formData.stokMinimum) || 0,
        hargaBeli: Number(formData.hargaBeli) || 0,
        hargaJual: Number(formData.hargaJual) || 0,
        lokasiRak: formData.lokasiRak, catatan: formData.catatan,
        mesinIds: formData.mesinIds,
      }
      if (editingItem) {
        const res = await fetch(`/api/sparepart/${editingItem.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Gagal update') }
        toast({ title: 'Berhasil', description: 'Sparepart diperbarui' })
      } else {
        payload.stok = Number(formData.stok) || 0
        const res = await fetch('/api/sparepart', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Gagal tambah') }
        toast({ title: 'Berhasil', description: 'Sparepart ditambahkan' })
      }
      setIsFormOpen(false)
      setEditingItem(null)
      loadData()
    } catch (e: any) {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/sparepart/${deleteItem.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal hapus')
      toast({ title: 'Berhasil', description: 'Sparepart dihapus' })
      setDeleteItem(null)
      loadData()
    } catch (e: any) {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const clearFilters = () => { setSearch(''); setFilterKategori('all'); setFilterStatus('all') }
  const hasActiveFilters = search || filterKategori !== 'all' || filterStatus !== 'all'

  const statusChips: Array<{ id: 'all' | StatusStok; label: string; count: number }> = [
    { id: 'all', label: 'Semua', count: items.length },
    { id: 'habis', label: 'Habis', count: items.filter((i) => getStatusStok(i.stok, i.stokMinimum) === 'habis').length },
    { id: 'menipis', label: 'Menipis', count: items.filter((i) => getStatusStok(i.stok, i.stokMinimum) === 'menipis').length },
    { id: 'aman', label: 'Aman', count: items.filter((i) => getStatusStok(i.stok, i.stokMinimum) === 'aman').length },
  ]

  return (
    <div className="pb-24">
      {/* Search Header */}
      <div className="sticky top-[53px] z-20 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="p-3 max-w-5xl mx-auto space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari sparepart..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 h-10 rounded-xl bg-slate-50 border-slate-200"
            />
            {hasActiveFilters && (
              <button onClick={clearFilters} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {statusChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setFilterStatus(chip.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  filterStatus === chip.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {chip.label} <span className="opacity-70">({chip.count})</span>
              </button>
            ))}
            <Select value={filterKategori} onValueChange={setFilterKategori}>
              <SelectTrigger className="shrink-0 h-7 w-auto rounded-full px-3 py-0 text-xs border-slate-200 bg-slate-50">
                <Layers className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {kategoriList.map((k) => (
                  <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="p-3 space-y-2 max-w-5xl mx-auto">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-red-600 text-sm text-center py-8">Error: {error}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">Tidak ada sparepart</p>
            <p className="text-xs text-slate-400 mt-1">
              {hasActiveFilters ? 'Coba ubah filter' : 'Klik tombol + untuk menambah'}
            </p>
          </div>
        ) : (
          items.map((item) => {
            const status = getStatusStok(item.stok, item.stokMinimum)
            const styles = {
              habis: { icon: 'bg-red-50 text-red-600', dot: 'bg-red-500', label: 'Habis', labelColor: 'text-red-600 bg-red-50' },
              menipis: { icon: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500', label: 'Menipis', labelColor: 'text-amber-600 bg-amber-50' },
              aman: { icon: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500', label: 'Aman', labelColor: 'text-emerald-600 bg-emerald-50' },
            }[status]
            return (
              <Card
                key={item.id}
                className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden cursor-pointer hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.99]"
                onClick={() => setDetailItem(item)}
              >
                <div className="flex items-center gap-3 p-3">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${styles.icon}`}>
                    <Package className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Badge variant="outline" className="font-mono text-[9px] py-0 px-1.5 h-4 border-slate-200 text-slate-500">{item.kode}</Badge>
                      {item.kategori && (
                        <span className="text-[10px] text-slate-400 truncate">{item.kategori.nama}</span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 truncate">{item.nama}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0 rounded ${styles.labelColor}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                        {item.stok} {item.satuan}
                      </span>
                      <span className="text-[10px] text-slate-400">min. {item.stokMinimum}</span>
                      {item.lokasiRak && (
                        <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-4 bg-slate-100 text-slate-600">{item.lokasiRak}</Badge>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* FAB */}
      {perm.canEditSparepart && (
        <button
          onClick={() => { setEditingItem(null); setIsFormOpen(true) }}
          className="fixed bottom-20 md:bottom-6 right-4 z-30 h-12 w-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/30 flex items-center justify-center active:scale-95 transition-all"
          aria-label="Tambah Sparepart"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}

      <SparepartForm
        key={editingItem?.id || 'new'}
        open={isFormOpen}
        onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingItem(null) }}
        editingItem={editingItem}
        kategoriList={kategoriList}
        mesinList={mesinList}
        onSubmit={handleSave}
        submitting={submitting}
      />

      <Sheet open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
          {detailItem && (
            <DetailPanel
              item={detailItem}
              onClose={() => setDetailItem(null)}
              onEdit={perm.canEditSparepart ? () => {
                setDetailItem(null)
                setEditingItem(detailItem)
                setIsFormOpen(true)
              } : undefined}
              onTransaksi={() => { setDetailItem(null); onNavigateTransaksi() }}
            />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Sparepart?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteItem?.kode} - {deleteItem?.nama}</strong> beserta seluruh riwayat transaksinya akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting} className="bg-red-600 hover:bg-red-700 rounded-lg">
              {submitting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function DetailPanel({ item, onClose, onEdit, onTransaksi }: {
  item: Sparepart
  onClose: () => void
  onEdit?: () => void
  onTransaksi: () => void
}) {
  const status = getStatusStok(item.stok, item.stokMinimum)
  const headerStyles = {
    habis: { bg: 'bg-red-500', label: 'Stok Habis', sub: 'Segera lakukan PO' },
    menipis: { bg: 'bg-amber-500', label: 'Stok Menipis', sub: 'Perlu segera restock' },
    aman: { bg: 'bg-emerald-500', label: 'Stok Aman', sub: 'Stok mencukupi' },
  }[status]

  return (
    <>
      {/* Header dark slate */}
      <div className="bg-slate-900 text-white p-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '16px 16px',
        }} />
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange-500/20 blur-2xl" />

        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-white/10 text-white border-0 font-mono text-[10px] hover:bg-white/10">{item.kode}</Badge>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-lg font-bold leading-tight">{item.nama}</h2>
          {item.kategori && <p className="text-xs text-slate-400 mt-1">{item.kategori.nama}</p>}

          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Stok Saat Ini</div>
              <div className="text-3xl font-bold">{item.stok} <span className="text-base font-normal text-slate-300">{item.satuan}</span></div>
              <div className="text-[11px] text-slate-400 mt-0.5">Min: {item.stokMinimum} {item.satuan}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${headerStyles.bg}`} />
              <span className="text-xs font-medium">{headerStyles.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Harga Beli</div>
            <div className="text-base font-bold text-slate-900">{formatRupiah(item.hargaBeli)}</div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3">
            <div className="text-[10px] text-emerald-700 uppercase tracking-wider">Harga Jual</div>
            <div className="text-base font-bold text-emerald-700">{formatRupiah(item.hargaJual)}</div>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Informasi</div>
          <div className="space-y-2 text-sm">
            <DetailRow label="Lokasi Rak" value={item.lokasiRak || '-'} />
            <DetailRow label="Dibuat" value={formatTanggalShort(item.createdAt)} />
          </div>
        </div>

        {item.catatan && (
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Catatan</div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-900">{item.catatan}</div>
          </div>
        )}

        {item.mesin && item.mesin.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Kompatibel dengan {item.mesin.length} Mesin
            </div>
            <div className="space-y-1.5">
              {item.mesin.map(({ mesin }) => (
                <div key={mesin.id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5 text-sm">
                  <Cog className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">{mesin.nama}</div>
                    <div className="text-[10px] text-slate-500">{mesin.kode} · {mesin.lokasi || '-'}</div>
                  </div>
                  <Badge variant="outline" className="text-[9px]">{mesin.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="outline" className="rounded-xl h-11 border-slate-200" onClick={onTransaksi}>
            <ArrowLeftRight className="h-4 w-4 mr-2" /> Transaksi
          </Button>
          {onEdit && (
            <Button className="rounded-xl h-11 bg-slate-900 hover:bg-slate-800" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right">{value}</span>
    </div>
  )
}

interface FormData {
  kode: string
  nama: string
  kategoriId: string
  satuan: string
  stok: string
  stokMinimum: string
  hargaBeli: string
  hargaJual: string
  lokasiRak: string
  catatan: string
  mesinIds: string[]
}

interface SparepartFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingItem: Sparepart | null
  kategoriList: Kategori[]
  mesinList: Mesin[]
  onSubmit: (data: FormData) => void
  submitting: boolean
}

function SparepartForm({ open, onOpenChange, editingItem, kategoriList, mesinList, onSubmit, submitting }: SparepartFormProps) {
  const defaultForm: FormData = {
    kode: '', nama: '', kategoriId: '', satuan: 'pcs',
    stok: '0', stokMinimum: '0', hargaBeli: '0', hargaJual: '0',
    lokasiRak: '', catatan: '', mesinIds: [],
  }

  const [form, setForm] = useState<FormData>(() => {
    if (editingItem) {
      return {
        kode: editingItem.kode, nama: editingItem.nama,
        kategoriId: editingItem.kategoriId || '',
        satuan: editingItem.satuan,
        stok: String(editingItem.stok), stokMinimum: String(editingItem.stokMinimum),
        hargaBeli: String(editingItem.hargaBeli), hargaJual: String(editingItem.hargaJual),
        lokasiRak: editingItem.lokasiRak || '', catatan: editingItem.catatan || '',
        mesinIds: editingItem.mesin?.map((m) => m.mesin.id) || [],
      }
    }
    return defaultForm
  })

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  const toggleMesin = (id: string) => {
    setForm((f) => ({
      ...f,
      mesinIds: f.mesinIds.includes(id) ? f.mesinIds.filter((m) => m !== id) : [...f.mesinIds, id],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit Sparepart' : 'Tambah Sparepart'}</DialogTitle>
          <DialogDescription>
            {editingItem ? 'Perbarui informasi sparepart' : 'Lengkapi data sparepart baru'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="kode" className="text-xs">Kode *</Label>
              <Input id="kode" value={form.kode} onChange={(e) => set('kode', e.target.value)} placeholder="SP-XXX-001" required disabled={!!editingItem} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="satuan" className="text-xs">Satuan</Label>
              <Select value={form.satuan} onValueChange={(v) => set('satuan', v)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">pcs</SelectItem>
                  <SelectItem value="unit">unit</SelectItem>
                  <SelectItem value="set">set</SelectItem>
                  <SelectItem value="meter">meter</SelectItem>
                  <SelectItem value="liter">liter</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nama" className="text-xs">Nama Sparepart *</Label>
            <Input id="nama" value={form.nama} onChange={(e) => set('nama', e.target.value)} placeholder="Bearing 6205 ZZ" required className="h-10" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Kategori</Label>
            <Select value={form.kategoriId} onValueChange={(v) => set('kategoriId', v)}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
              <SelectContent>
                {kategoriList.map((k) => (
                  <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="stok" className="text-xs">{!editingItem ? 'Stok Awal' : 'Stok'}</Label>
              <Input id="stok" type="number" min="0" value={form.stok} onChange={(e) => set('stok', e.target.value)} disabled={!!editingItem} className="h-10" />
              {editingItem && <p className="text-[10px] text-slate-500">Ubah via transaksi</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stokMinimum" className="text-xs">Min. Stok</Label>
              <Input id="stokMinimum" type="number" min="0" value={form.stokMinimum} onChange={(e) => set('stokMinimum', e.target.value)} className="h-10" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="hargaBeli" className="text-xs">Harga Beli</Label>
              <Input id="hargaBeli" type="number" min="0" value={form.hargaBeli} onChange={(e) => set('hargaBeli', e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hargaJual" className="text-xs">Harga Jual</Label>
              <Input id="hargaJual" type="number" min="0" value={form.hargaJual} onChange={(e) => set('hargaJual', e.target.value)} className="h-10" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lokasiRak" className="text-xs">Lokasi Rak</Label>
            <Input id="lokasiRak" value={form.lokasiRak} onChange={(e) => set('lokasiRak', e.target.value)} placeholder="A1-03" className="h-10" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="catatan" className="text-xs">Catatan</Label>
            <Textarea id="catatan" value={form.catatan} onChange={(e) => set('catatan', e.target.value)} placeholder="Catatan tambahan..." rows={2} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Kompatibel dengan Mesin (Opsional)</Label>
            <div className="border border-slate-200 rounded-xl p-2 max-h-32 overflow-y-auto space-y-1">
              {mesinList.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1">
                  <input
                    type="checkbox"
                    checked={form.mesinIds.includes(m.id)}
                    onChange={() => toggleMesin(m.id)}
                    className="rounded"
                  />
                  <span className="flex-1 truncate text-slate-700">{m.nama}</span>
                  <Badge variant="outline" className="text-[9px]">{m.kode}</Badge>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Batal</Button>
            <Button type="submit" disabled={submitting} className="bg-slate-900 hover:bg-slate-800 rounded-lg">
              {submitting ? 'Menyimpan...' : editingItem ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
