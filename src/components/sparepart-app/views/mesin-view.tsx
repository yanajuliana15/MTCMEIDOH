'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Mesin, Sparepart, User } from '@/lib/types'
import { formatTanggalShort, ROLE_PERMISSIONS } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Search, Plus, Edit, Trash2, Cog, MapPin, Calendar, Factory, Package, X, ChevronRight } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  'Aktif': 'bg-emerald-500',
  'Maintenance': 'bg-amber-500',
  'Berhenti': 'bg-red-500',
}

const STATUS_BG: Record<string, string> = {
  'Aktif': 'bg-emerald-50 text-emerald-700',
  'Maintenance': 'bg-amber-50 text-amber-700',
  'Berhenti': 'bg-red-50 text-red-700',
}

export function MesinView({ user }: { user: User }) {
  const perm = ROLE_PERMISSIONS[user.role]
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
      const url = editingItem ? `/api/mesin/${editingItem.id}` : '/api/mesin'
      const method = editingItem ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal menyimpan mesin')
      }
      toast({ title: 'Berhasil', description: editingItem ? 'Mesin diperbarui' : 'Mesin baru ditambahkan' })
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
      toast({ title: 'Berhasil', description: 'Mesin dihapus' })
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
    <div className="pb-24">
      {/* Search Header */}
      <div className="sticky top-[57px] z-20 bg-white/95 backdrop-blur border-b">
        <div className="p-3 max-w-5xl mx-auto space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari mesin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-slate-50 border-slate-200"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'Semua', count: items.length },
              { id: 'Aktif', label: 'Aktif', count: stats.aktif },
              { id: 'Maintenance', label: 'Maintenance', count: stats.maintenance },
              { id: 'Berhenti', label: 'Berhenti', count: stats.berhenti },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setFilterStatus(chip.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filterStatus === chip.id ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {chip.label} ({chip.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="p-3 space-y-2 max-w-5xl mx-auto">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Cog className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Belum ada mesin</p>
          </div>
        ) : (
          items.map((m) => (
            <Card
              key={m.id}
              className="border-0 shadow-sm rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99] transition-transform"
              onClick={() => setDetailItem(m)}
            >
              <div className="flex items-center gap-3 p-3">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${STATUS_BG[m.status] || 'bg-slate-50'}`}>
                  <Cog className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Badge variant="outline" className="font-mono text-[9px] py-0 px-1.5 h-4">{m.kode}</Badge>
                    <div className="flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[m.status]}`} />
                      <span className="text-[10px] text-muted-foreground">{m.status}</span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold truncate">{m.nama}</div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                    {m.manufaktur && <span className="truncate">{m.manufaktur}</span>}
                    {m.lokasi && <><span>·</span><span className="truncate">{m.lokasi}</span></>}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold">{m.spareparts?.length || 0}</div>
                  <div className="text-[9px] text-muted-foreground">part</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </Card>
          ))
        )}
      </div>

      {perm.canEditMesin && (
        <button
          onClick={() => { setEditingItem(null); setIsFormOpen(true) }}
          className="fixed bottom-20 md:bottom-6 right-4 z-30 h-14 w-14 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/40 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Tambah Mesin"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <MesinForm
        key={editingItem?.id || 'new'}
        open={isFormOpen}
        onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingItem(null) }}
        editingItem={editingItem}
        sparepartList={sparepartList}
        onSubmit={handleSave}
        submitting={submitting}
      />

      <Sheet open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
          {detailItem && (
            <MesinDetail
              item={detailItem}
              onClose={() => setDetailItem(null)}
              onEdit={perm.canEditMesin ? () => {
                setDetailItem(null)
                setEditingItem(detailItem)
                setIsFormOpen(true)
              } : undefined}
            />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mesin?</AlertDialogTitle>
            <AlertDialogDescription>
              Mesin <strong>{deleteItem?.kode} - {deleteItem?.nama}</strong> akan dihapus beserta relasi sparepart-nya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting} className="bg-destructive hover:bg-destructive/90">
              {submitting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function MesinDetail({ item, onClose, onEdit }: { item: Mesin; onClose: () => void; onEdit?: () => void }) {
  return (
    <>
      <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 text-white p-5">
        <div className="flex items-center justify-between mb-3">
          <Badge className="bg-white/20 text-white border-0 font-mono text-[10px]">{item.kode}</Badge>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <h2 className="text-lg font-bold leading-tight">{item.nama}</h2>
        <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded-full bg-white/20 text-xs">
          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[item.status]}`} />
          {item.status}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-[10px] text-muted-foreground uppercase">Tahun Instalasi</div>
            <div className="text-base font-bold">{item.tahunInstal || '-'}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-[10px] text-muted-foreground uppercase">Total Sparepart</div>
            <div className="text-base font-bold">{item.spareparts?.length || 0}</div>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Informasi</div>
          <div className="space-y-2 text-sm">
            <Row label="Manufaktur" value={item.manufaktur || '-'} icon={Factory} />
            <Row label="Lokasi" value={item.lokasi || '-'} icon={MapPin} />
            <Row label="Dibuat" value={formatTanggalShort(item.createdAt)} icon={Calendar} />
          </div>
        </div>

        {item.spareparts && item.spareparts.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Sparepart Kompatibel ({item.spareparts.length})
            </div>
            <div className="space-y-1.5">
              {item.spareparts.map(({ sparepart: sp }) => (
                <div key={sp.id} className="flex items-center gap-2 rounded-xl border p-2.5 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{sp.nama}</div>
                    <div className="text-[10px] text-muted-foreground">{sp.kode}</div>
                  </div>
                  <Badge variant="outline" className="text-[9px]">{sp.stok} {sp.satuan}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {onEdit && (
          <Button className="w-full rounded-xl h-11 bg-cyan-600 hover:bg-cyan-700" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" /> Edit Mesin
          </Button>
        )}
      </div>
    </>
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

function MesinForm({ open, onOpenChange, editingItem, sparepartList, onSubmit, submitting }: any) {
  const [form, setForm] = useState(() => {
    if (editingItem) {
      return {
        kode: editingItem.kode, nama: editingItem.nama,
        lokasi: editingItem.lokasi || '', manufaktur: editingItem.manufaktur || '',
        tahunInstal: editingItem.tahunInstal ? String(editingItem.tahunInstal) : '',
        status: editingItem.status,
        sparepartIds: editingItem.spareparts?.map((s: any) => s.sparepart.id) || [],
      }
    }
    return { kode: '', nama: '', lokasi: '', manufaktur: '', tahunInstal: '', status: 'Aktif', sparepartIds: [] as string[] }
  })

  const toggleSparepart = (id: string) => {
    setForm((f: any) => ({
      ...f,
      sparepartIds: f.sparepartIds.includes(id) ? f.sparepartIds.filter((x: string) => x !== id) : [...f.sparepartIds, id],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit Mesin' : 'Tambah Mesin'}</DialogTitle>
          <DialogDescription>{editingItem ? 'Perbarui informasi mesin' : 'Daftarkan mesin baru'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Kode *</Label>
              <Input value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} placeholder="MCH-001" required disabled={!!editingItem} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Berhenti">Berhenti</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Nama Mesin *</Label>
            <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Pompa Sentrifugal 1A" required className="h-10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Manufaktur</Label>
              <Input value={form.manufaktur} onChange={(e) => setForm({ ...form, manufaktur: e.target.value })} placeholder="Grundfos" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tahun Instalasi</Label>
              <Input type="number" min="1900" max="2099" value={form.tahunInstal} onChange={(e) => setForm({ ...form, tahunInstal: e.target.value })} placeholder="2019" className="h-10" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Lokasi</Label>
            <Input value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} placeholder="Pabrik A - Pump Station" className="h-10" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Sparepart Kompatibel</Label>
            <div className="border rounded-xl p-2 max-h-32 overflow-y-auto space-y-1">
              {sparepartList.map((sp: Sparepart) => (
                <label key={sp.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent/50 rounded-lg px-2 py-1">
                  <input type="checkbox" checked={form.sparepartIds.includes(sp.id)} onChange={() => toggleSparepart(sp.id)} className="rounded" />
                  <span className="flex-1 truncate">{sp.nama}</span>
                  <Badge variant="outline" className="text-[9px]">{sp.kode}</Badge>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Batal</Button>
            <Button type="submit" disabled={submitting} className="bg-cyan-600 hover:bg-cyan-700">
              {submitting ? 'Menyimpan...' : editingItem ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
