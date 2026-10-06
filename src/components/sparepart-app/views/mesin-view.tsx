'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Mesin, Sparepart, Kategori } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Search, Plus, Edit, Trash2, Cog, MapPin, Calendar, Factory, Package } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  'Aktif': 'bg-green-100 text-green-800 border-green-200',
  'Maintenance': 'bg-amber-100 text-amber-800 border-amber-200',
  'Berhenti': 'bg-red-100 text-red-800 border-red-200',
}

export function MesinView() {
  const [items, setItems] = useState<Mesin[]>([])
  const [sparepartList, setSparepartList] = useState<Sparepart[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [detailItem, setDetailItem] = useState<Mesin | null>(null)
  const [editingItem, setEditingItem] = useState<Mesin | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<Mesin | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      const [msRes, spRes] = await Promise.all([
        fetch(`/api/mesin?${params.toString()}`),
        fetch('/api/sparepart'),
      ])
      const [ms, sp] = await Promise.all([msRes.json(), spRes.json()])
      setItems(ms)
      setSparepartList(sp)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus, toast])

  useEffect(() => {
    const t = setTimeout(loadData, 250)
    return () => clearTimeout(t)
  }, [loadData])

  const handleSave = async (formData: any) => {
    setSubmitting(true)
    try {
      const payload = {
        kode: formData.kode,
        nama: formData.nama,
        lokasi: formData.lokasi,
        manufaktur: formData.manufaktur,
        tahunInstal: formData.tahunInstal ? Number(formData.tahunInstal) : null,
        status: formData.status,
        sparepartIds: formData.sparepartIds,
      }
      const url = editingItem ? `/api/mesin/${editingItem.id}` : '/api/mesin'
      const method = editingItem ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal menyimpan mesin')
      }
      toast({
        title: 'Berhasil',
        description: editingItem ? 'Mesin berhasil diperbarui' : 'Mesin baru berhasil ditambahkan',
      })
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
      const res = await fetch(`/api/mesin/${deleteItem.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus mesin')
      toast({ title: 'Berhasil', description: 'Mesin berhasil dihapus' })
      setDeleteItem(null)
      loadData()
    } catch (e: any) {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const stats = {
    aktif: items.filter((i) => i.status === 'Aktif').length,
    maintenance: items.filter((i) => i.status === 'Maintenance').length,
    berhenti: items.filter((i) => i.status === 'Berhenti').length,
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mesin Industri</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} mesin terdaftar · {stats.aktif} aktif · {stats.maintenance} maintenance · {stats.berhenti} berhenti
          </p>
        </div>
        <Button onClick={() => { setEditingItem(null); setIsFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Tambah Mesin
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kode, nama, atau manufaktur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Aktif">Aktif</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Berhenti">Berhenti</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="h-48" /></Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Cog className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Belum ada mesin terdaftar</p>
            <p className="text-xs text-muted-foreground mt-1">Klik "Tambah Mesin" untuk memulai</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <Card
              key={m.id}
              className="group hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setDetailItem(m)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-muted p-2">
                      <Cog className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <Badge variant="outline" className="font-mono text-[10px]">{m.kode}</Badge>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {m.manufaktur || 'Tanpa manufaktur'}
                      </div>
                    </div>
                  </div>
                  <Badge className={`text-[10px] ${STATUS_COLORS[m.status]}`} variant="outline">
                    {m.status}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-semibold leading-tight">{m.nama}</h3>
                </div>

                <div className="space-y-1.5 text-xs">
                  {m.lokasi && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {m.lokasi}
                    </div>
                  )}
                  {m.tahunInstal && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3 w-3" /> Dipasang {m.tahunInstal}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Package className="h-3 w-3" />
                    {m.spareparts?.length || 0} sparepart kompatibel
                  </div>
                </div>

                <div className="flex justify-end gap-1 pt-2 border-t opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingItem(m); setIsFormOpen(true) }}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteItem(m)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form */}
      <MesinForm
        key={editingItem?.id || 'new'}
        open={isFormOpen}
        onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingItem(null) }}
        editingItem={editingItem}
        sparepartList={sparepartList}
        onSubmit={handleSave}
        submitting={submitting}
      />

      {/* Detail */}
      <Sheet open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {detailItem && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left">{detailItem.nama}</SheetTitle>
                <SheetDescription className="text-left flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">{detailItem.kode}</Badge>
                  <Badge className={`text-[10px] ${STATUS_COLORS[detailItem.status]}`} variant="outline">{detailItem.status}</Badge>
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Tahun Instalasi</div>
                    <div className="text-lg font-bold">{detailItem.tahunInstal || '-'}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Jumlah Sparepart</div>
                    <div className="text-lg font-bold">{detailItem.spareparts?.length || 0}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Detail Mesin</div>
                  <div className="space-y-2 text-sm">
                    <Row label="Manufaktur" value={detailItem.manufaktur || '-'} icon={Factory} />
                    <Row label="Lokasi" value={detailItem.lokasi || '-'} icon={MapPin} />
                  </div>
                </div>

                {detailItem.spareparts && detailItem.spareparts.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      Daftar Sparepart Kompatibel
                    </div>
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {detailItem.spareparts.map(({ sparepart: sp }) => (
                        <div key={sp.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{sp.nama}</div>
                            <div className="text-xs text-muted-foreground">{sp.kode}</div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{sp.stok} {sp.satuan}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mesin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Mesin <strong>{deleteItem?.kode} - {deleteItem?.nama}</strong> akan dihapus beserta relasi kompatibilitas sparepart-nya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting} className="bg-destructive hover:bg-destructive/90">
              {submitting ? 'Menghapus...' : 'Hapus Permanen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Row({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}

interface MesinFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingItem: Mesin | null
  sparepartList: Sparepart[]
  onSubmit: (data: any) => void
  submitting: boolean
}

function MesinForm({ open, onOpenChange, editingItem, sparepartList, onSubmit, submitting }: MesinFormProps) {
  const [form, setForm] = useState(() => {
    if (editingItem) {
      return {
        kode: editingItem.kode,
        nama: editingItem.nama,
        lokasi: editingItem.lokasi || '',
        manufaktur: editingItem.manufaktur || '',
        tahunInstal: editingItem.tahunInstal ? String(editingItem.tahunInstal) : '',
        status: editingItem.status,
        sparepartIds: editingItem.spareparts?.map((s) => s.sparepart.id) || [],
      }
    }
    return { kode: '', nama: '', lokasi: '', manufaktur: '', tahunInstal: '', status: 'Aktif', sparepartIds: [] as string[] }
  })

  const toggleSparepart = (id: string) => {
    setForm((f) => ({
      ...f,
      sparepartIds: f.sparepartIds.includes(id)
        ? f.sparepartIds.filter((x) => x !== id)
        : [...f.sparepartIds, id],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit Mesin' : 'Tambah Mesin Baru'}</DialogTitle>
          <DialogDescription>
            {editingItem ? 'Perbarui informasi mesin industri' : 'Daftarkan mesin industri baru'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="m-kode">Kode Mesin *</Label>
              <Input id="m-kode" value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} placeholder="MCH-001" required disabled={!!editingItem} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-status">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Berhenti">Berhenti</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="m-nama">Nama Mesin *</Label>
            <Input id="m-nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Pompa Sentrifugal Sentral 1A" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="m-manufaktur">Manufaktur</Label>
              <Input id="m-manufaktur" value={form.manufaktur} onChange={(e) => setForm({ ...form, manufaktur: e.target.value })} placeholder="Grundfos" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-tahun">Tahun Instalasi</Label>
              <Input id="m-tahun" type="number" min="1900" max="2099" value={form.tahunInstal} onChange={(e) => setForm({ ...form, tahunInstal: e.target.value })} placeholder="2019" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="m-lokasi">Lokasi</Label>
            <Input id="m-lokasi" value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} placeholder="Pabrik A - Pump Station 1" />
          </div>

          <div className="space-y-2">
            <Label>Sparepart Kompatibel</Label>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-1.5">
              {sparepartList.length === 0 ? (
                <p className="text-xs text-muted-foreground">Belum ada sparepart terdaftar</p>
              ) : (
                sparepartList.map((sp) => (
                  <label key={sp.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent/50 rounded px-2 py-1">
                    <input type="checkbox" checked={form.sparepartIds.includes(sp.id)} onChange={() => toggleSparepart(sp.id)} className="rounded" />
                    <span className="flex-1 truncate">{sp.nama}</span>
                    <Badge variant="outline" className="text-[10px]">{sp.kode}</Badge>
                  </label>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah Mesin'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
