'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import type { Sparepart, Kategori, Supplier, Mesin, StatusStok } from '@/lib/types'
import { formatRupiah, formatTanggalShort, getStatusStok } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useToast } from '@/hooks/use-toast'
import { Search, Plus, Edit, Trash2, Package, Filter, AlertTriangle, X, Cog, ArrowLeftRight } from 'lucide-react'

interface SparepartViewProps {
  onNavigateTransaksi: () => void
  onAlertsChange?: (n: number) => void
}

export function SparepartView({ onNavigateTransaksi, onAlertsChange }: SparepartViewProps) {
  const [items, setItems] = useState<Sparepart[]>([])
  const [kategoriList, setKategoriList] = useState<Kategori[]>([])
  const [supplierList, setSupplierList] = useState<Supplier[]>([])
  const [mesinList, setMesinList] = useState<Mesin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('all')
  const [filterSupplier, setFilterSupplier] = useState('all')
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
      if (filterSupplier !== 'all') params.set('supplierId', filterSupplier)
      if (filterStatus !== 'all') params.set('statusStok', filterStatus)
      const [spRes, ktRes, supRes, msRes] = await Promise.all([
        fetch(`/api/sparepart?${params.toString()}`),
        fetch('/api/kategori'),
        fetch('/api/supplier'),
        fetch('/api/mesin'),
      ])
      if (!spRes.ok) throw new Error('Gagal memuat sparepart')
      const [sp, kt, sup, ms] = await Promise.all([spRes.json(), ktRes.json(), supRes.json(), msRes.json()])
      setItems(sp)
      setKategoriList(kt)
      setSupplierList(sup)
      setMesinList(ms)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [search, filterKategori, filterSupplier, filterStatus])

  useEffect(() => {
    const t = setTimeout(loadData, 250)
    return () => clearTimeout(t)
  }, [loadData])

  const alertsCount = useMemo(
    () => items.filter((i) => getStatusStok(i.stok, i.stokMinimum) !== 'aman').length,
    [items]
  )

  // Sinkronisasi alertsCount ke parent — gunakan ref agar tidak re-render infinite
  const onAlertsChangeRef = useRef(onAlertsChange)
  onAlertsChangeRef.current = onAlertsChange
  useEffect(() => {
    onAlertsChangeRef.current?.(alertsCount)
  }, [alertsCount])

  const handleSave = async (formData: FormData) => {
    setSubmitting(true)
    try {
      const payload: any = {
        kode: formData.kode,
        nama: formData.nama,
        kategoriId: formData.kategoriId || null,
        supplierId: formData.supplierId || null,
        satuan: formData.satuan,
        stokMinimum: Number(formData.stokMinimum) || 0,
        hargaBeli: Number(formData.hargaBeli) || 0,
        hargaJual: Number(formData.hargaJual) || 0,
        lokasiRak: formData.lokasiRak,
        catatan: formData.catatan,
        mesinIds: formData.mesinIds,
      }
      if (editingItem) {
        // Update
        const res = await fetch(`/api/sparepart/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Gagal mengupdate sparepart')
        }
        toast({ title: 'Berhasil', description: 'Sparepart berhasil diperbarui' })
      } else {
        // Create
        payload.stok = Number(formData.stok) || 0
        const res = await fetch('/api/sparepart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Gagal menambah sparepart')
        }
        toast({ title: 'Berhasil', description: 'Sparepart baru berhasil ditambahkan' })
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
      if (!res.ok) throw new Error('Gagal menghapus sparepart')
      toast({ title: 'Berhasil', description: 'Sparepart berhasil dihapus' })
      setDeleteItem(null)
      loadData()
    } catch (e: any) {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setFilterKategori('all')
    setFilterSupplier('all')
    setFilterStatus('all')
  }

  const hasActiveFilters = search || filterKategori !== 'all' || filterSupplier !== 'all' || filterStatus !== 'all'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Katalog Sparepart</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola inventaris {items.length} item sparepart mesin industri
            {alertsCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                <AlertTriangle className="h-3 w-3 mr-1" /> {alertsCount} butuh perhatian
              </Badge>
            )}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null)
            setIsFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Tambah Sparepart
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kode atau nama sparepart..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterKategori} onValueChange={setFilterKategori}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {kategoriList.map((k) => (
                  <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSupplier} onValueChange={setFilterSupplier}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Supplier</SelectItem>
                {supplierList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="aman">Stok Aman</SelectItem>
                <SelectItem value="menipis">Stok Menipis</SelectItem>
                <SelectItem value="habis">Stok Habis</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-40" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-destructive text-sm">Error: {error}</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Belum ada sparepart</p>
            <p className="text-xs text-muted-foreground mt-1">
              {hasActiveFilters ? 'Coba ubah filter pencarian' : 'Klik "Tambah Sparepart" untuk memulai'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const status = getStatusStok(item.stok, item.stokMinimum)
            return (
              <Card
                key={item.id}
                className="group hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
                onClick={() => setDetailItem(item)}
              >
                {status !== 'aman' && (
                  <div className={`absolute top-0 left-0 right-0 h-1 ${status === 'habis' ? 'bg-red-500' : 'bg-amber-500'}`} />
                )}
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">{item.kode}</Badge>
                        {status === 'habis' && <Badge variant="destructive" className="text-[10px]">Habis</Badge>}
                        {status === 'menipis' && <Badge className="bg-amber-500 text-[10px]">Menipis</Badge>}
                      </div>
                      <h3 className="text-sm font-semibold mt-1.5 leading-tight line-clamp-2">{item.nama}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Stok</div>
                      <div className={`font-semibold ${status === 'habis' ? 'text-red-600' : status === 'menipis' ? 'text-amber-600' : ''}`}>
                        {item.stok} {item.satuan}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Min. Stok</div>
                      <div className="font-semibold">{item.stokMinimum} {item.satuan}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Harga Beli</div>
                      <div className="font-semibold">{formatRupiah(item.hargaBeli)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Harga Jual</div>
                      <div className="font-semibold text-green-600">{formatRupiah(item.hargaJual)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {item.kategori ? (
                        <Badge variant="secondary" className="text-[10px]">{item.kategori.nama}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Tanpa kategori</span>
                      )}
                      {item.lokasiRak && (
                        <Badge variant="outline" className="text-[10px]">{item.lokasiRak}</Badge>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingItem(item)
                          setIsFormOpen(true)
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteItem(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Form Dialog */}
      <SparepartForm
        key={editingItem?.id || 'new'}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setEditingItem(null)
        }}
        editingItem={editingItem}
        kategoriList={kategoriList}
        supplierList={supplierList}
        mesinList={mesinList}
        onSubmit={handleSave}
        submitting={submitting}
      />

      {/* Detail Sheet */}
      <Sheet open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {detailItem && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left">{detailItem.nama}</SheetTitle>
                <SheetDescription className="text-left">{detailItem.kode}</SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Stok Saat Ini</div>
                    <div className="text-xl font-bold">{detailItem.stok} <span className="text-sm font-normal">{detailItem.satuan}</span></div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Stok Minimum</div>
                    <div className="text-xl font-bold">{detailItem.stokMinimum} <span className="text-sm font-normal">{detailItem.satuan}</span></div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Detail Sparepart</div>
                  <div className="space-y-2 text-sm">
                    <DetailRow label="Kategori" value={detailItem.kategori?.nama || '-'} />
                    <DetailRow label="Supplier" value={detailItem.supplier?.nama || '-'} />
                    <DetailRow label="Harga Beli" value={formatRupiah(detailItem.hargaBeli)} />
                    <DetailRow label="Harga Jual" value={formatRupiah(detailItem.hargaJual)} />
                    <DetailRow label="Lokasi Rak" value={detailItem.lokasiRak || '-'} />
                    <DetailRow label="Dibuat" value={formatTanggalShort(detailItem.createdAt)} />
                  </div>
                </div>

                {detailItem.catatan && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Catatan</div>
                    <div className="rounded-md bg-muted/50 p-3 text-sm">{detailItem.catatan}</div>
                  </div>
                )}

                {detailItem.mesin && detailItem.mesin.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      Kompatibel dengan {detailItem.mesin.length} Mesin
                    </div>
                    <div className="space-y-1.5">
                      {detailItem.mesin.map(({ mesin }) => (
                        <div key={mesin.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                          <Cog className="h-3.5 w-3.5 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{mesin.nama}</div>
                            <div className="text-xs text-muted-foreground">{mesin.kode} · {mesin.lokasi || '-'}</div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{mesin.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button variant="outline" className="w-full" onClick={() => {
                  setDetailItem(null)
                  onNavigateTransaksi()
                }}>
                  <ArrowLeftRight className="h-4 w-4 mr-2" /> Catat Transaksi Stok
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Sparepart?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Sparepart <strong>{deleteItem?.kode} - {deleteItem?.nama}</strong> beserta seluruh riwayat transaksinya akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {submitting ? 'Menghapus...' : 'Hapus Permanen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}

// === Form Sparepart ===
interface FormData {
  kode: string
  nama: string
  kategoriId: string
  supplierId: string
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
  supplierList: Supplier[]
  mesinList: Mesin[]
  onSubmit: (data: FormData) => void
  submitting: boolean
}

function SparepartForm({ open, onOpenChange, editingItem, kategoriList, supplierList, mesinList, onSubmit, submitting }: SparepartFormProps) {
  const defaultForm: FormData = {
    kode: '',
    nama: '',
    kategoriId: '',
    supplierId: '',
    satuan: 'pcs',
    stok: '0',
    stokMinimum: '0',
    hargaBeli: '0',
    hargaJual: '0',
    lokasiRak: '',
    catatan: '',
    mesinIds: [],
  }

  // Initialize form from editingItem (lazy init — only evaluated on mount)
  const [form, setForm] = useState<FormData>(() => {
    if (editingItem) {
      return {
        kode: editingItem.kode,
        nama: editingItem.nama,
        kategoriId: editingItem.kategoriId || '',
        supplierId: editingItem.supplierId || '',
        satuan: editingItem.satuan,
        stok: String(editingItem.stok),
        stokMinimum: String(editingItem.stokMinimum),
        hargaBeli: String(editingItem.hargaBeli),
        hargaJual: String(editingItem.hargaJual),
        lokasiRak: editingItem.lokasiRak || '',
        catatan: editingItem.catatan || '',
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
      mesinIds: f.mesinIds.includes(id)
        ? f.mesinIds.filter((m) => m !== id)
        : [...f.mesinIds, id],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit Sparepart' : 'Tambah Sparepart Baru'}</DialogTitle>
          <DialogDescription>
            {editingItem ? 'Perbarui informasi sparepart' : 'Lengkapi data sparepart mesin industri'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="kode">Kode Sparepart *</Label>
              <Input id="kode" value={form.kode} onChange={(e) => set('kode', e.target.value)} placeholder="SP-XXX-001" required disabled={!!editingItem} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="satuan">Satuan</Label>
              <Select value={form.satuan} onValueChange={(v) => set('satuan', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">pcs</SelectItem>
                  <SelectItem value="unit">unit</SelectItem>
                  <SelectItem value="set">set</SelectItem>
                  <SelectItem value="meter">meter</SelectItem>
                  <SelectItem value="liter">liter</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="box">box</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nama">Nama Sparepart *</Label>
            <Input id="nama" value={form.nama} onChange={(e) => set('nama', e.target.value)} placeholder="Bearing Deep Groove 6205 ZZ" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={form.kategoriId} onValueChange={(v) => set('kategoriId', v)}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {kategoriList.map((k) => (
                    <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select value={form.supplierId} onValueChange={(v) => set('supplierId', v)}>
                <SelectTrigger><SelectValue placeholder="Pilih supplier" /></SelectTrigger>
                <SelectContent>
                  {supplierList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label htmlFor="stok">{!editingItem ? 'Stok Awal' : 'Stok'}</Label>
              <Input id="stok" type="number" min="0" value={form.stok} onChange={(e) => set('stok', e.target.value)} disabled={!!editingItem} />
              {editingItem && <p className="text-[10px] text-muted-foreground">Ubah via transaksi</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stokMinimum">Min. Stok</Label>
              <Input id="stokMinimum" type="number" min="0" value={form.stokMinimum} onChange={(e) => set('stokMinimum', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hargaBeli">Harga Beli</Label>
              <Input id="hargaBeli" type="number" min="0" value={form.hargaBeli} onChange={(e) => set('hargaBeli', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hargaJual">Harga Jual</Label>
              <Input id="hargaJual" type="number" min="0" value={form.hargaJual} onChange={(e) => set('hargaJual', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lokasiRak">Lokasi Rak</Label>
            <Input id="lokasiRak" value={form.lokasiRak} onChange={(e) => set('lokasiRak', e.target.value)} placeholder="Rak A1-03" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan</Label>
            <Textarea id="catatan" value={form.catatan} onChange={(e) => set('catatan', e.target.value)} placeholder="Catatan tambahan..." rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Kompatibel dengan Mesin (Opsional)</Label>
            <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-1.5">
              {mesinList.length === 0 ? (
                <p className="text-xs text-muted-foreground">Belum ada mesin terdaftar</p>
              ) : (
                mesinList.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent/50 rounded px-2 py-1">
                    <input
                      type="checkbox"
                      checked={form.mesinIds.includes(m.id)}
                      onChange={() => toggleMesin(m.id)}
                      className="rounded"
                    />
                    <span className="flex-1 truncate">{m.nama}</span>
                    <Badge variant="outline" className="text-[10px]">{m.kode}</Badge>
                  </label>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah Sparepart'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
