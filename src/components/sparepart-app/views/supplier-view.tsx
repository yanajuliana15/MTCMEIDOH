'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Supplier, User } from '@/lib/types'
import { ROLE_PERMISSIONS } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Search, Plus, Edit, Trash2, Truck, Phone, Mail, MapPin, User as UserIcon, Package } from 'lucide-react'
import { ExportImportButtons } from '@/components/sparepart-app/export-import-buttons'

export function SupplierView({ user }: { user: User }) {
  const perm = ROLE_PERMISSIONS[user.role]
  const [items, setItems] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingItem, setEditingItem] = useState<Supplier | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<Supplier | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/supplier?${params.toString()}`)
      if (!res.ok) throw new Error('Gagal memuat supplier')
      setItems(await res.json())
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search, toast])

  useEffect(() => {
    const t = setTimeout(loadData, 250)
    return () => clearTimeout(t)
  }, [loadData])

  const handleSave = async (formData: any) => {
    setSubmitting(true)
    try {
      const url = editingItem ? `/api/supplier/${editingItem.id}` : '/api/supplier'
      const method = editingItem ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Gagal menyimpan') }
      toast({ title: 'Berhasil', description: editingItem ? 'Supplier diperbarui' : 'Supplier ditambahkan' })
      setIsFormOpen(false); setEditingItem(null); loadData()
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
      const res = await fetch(`/api/supplier/${deleteItem.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus supplier')
      toast({ title: 'Berhasil', description: 'Supplier dihapus' })
      setDeleteItem(null); loadData()
    } catch (e: any) {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Supplier</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} supplier terdaftar</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportImportButtons
            entity="supplier"
            data={items.map((s, i) => ({
              no: i + 1,
              nama: s.nama,
              kontak: s.kontak || '',
              telepon: s.telepon || '',
              email: s.email || '',
              alamat: s.alamat || '',
              jumlahSparepart: s._count?.spareparts || 0,
            }))}
            columns={[
              { key: 'no', label: 'No' },
              { key: 'nama', label: 'Nama' },
              { key: 'kontak', label: 'Kontak' },
              { key: 'telepon', label: 'Telepon' },
              { key: 'email', label: 'Email' },
              { key: 'alamat', label: 'Alamat' },
              { key: 'jumlahSparepart', label: 'Jumlah Sparepart' },
            ]}
            meta={{
              title: 'MTC MEIDOH - Daftar Supplier',
              subtitle: `Diekspor: ${new Date().toLocaleString('id-ID')} | Jumlah: ${items.length} supplier`,
              summary: `TOTAL: ${items.length} supplier | Total Sparepart Dipasok: ${items.reduce((sum, s) => sum + (s._count?.spareparts || 0), 0)}`,
            }}
            showImport={perm.canEditSupplier}
            onImported={loadData}
          />
          {perm.canEditSupplier && (
            <Button onClick={() => { setEditingItem(null); setIsFormOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" /> Tambah Supplier
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari nama, kontak, atau email supplier..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
            <Truck className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Belum ada supplier</p>
            <p className="text-xs text-muted-foreground mt-1">Klik "Tambah Supplier" untuk memulai</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <Card key={s.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="rounded-md bg-muted p-2 shrink-0">
                      <Truck className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold leading-tight truncate">{s.nama}</h3>
                      {s.kontak && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <UserIcon className="h-3 w-3" /> {s.kontak}
                        </div>
                      )}
                    </div>
                  </div>
                  {s._count && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      <Package className="h-3 w-3 mr-1" /> {s._count.spareparts}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  {s.telepon && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {s.telepon}
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                      <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{s.email}</span>
                    </div>
                  )}
                  {s.alamat && (
                    <div className="flex items-start gap-1.5 text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0 mt-0.5" /> <span className="line-clamp-2">{s.alamat}</span>
                    </div>
                  )}
                </div>

                {perm.canEditSupplier && (
                  <div className="flex justify-end gap-1 pt-2 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingItem(s); setIsFormOpen(true) }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    {perm.canDeleteSupplier && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteItem(s)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SupplierForm
        key={editingItem?.id || 'new'}
        open={isFormOpen}
        onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingItem(null) }}
        editingItem={editingItem}
        onSubmit={handleSave}
        submitting={submitting}
      />

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              Supplier <strong>{deleteItem?.nama}</strong> akan dihapus. Sparepart yang terkait akan tetap ada namun kehilangan referensi supplier.
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

interface SupplierFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingItem: Supplier | null
  onSubmit: (data: any) => void
  submitting: boolean
}

function SupplierForm({ open, onOpenChange, editingItem, onSubmit, submitting }: SupplierFormProps) {
  const [form, setForm] = useState(() => {
    if (editingItem) {
      return {
        nama: editingItem.nama,
        kontak: editingItem.kontak || '',
        telepon: editingItem.telepon || '',
        email: editingItem.email || '',
        alamat: editingItem.alamat || '',
      }
    }
    return { nama: '', kontak: '', telepon: '', email: '', alamat: '' }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit Supplier' : 'Tambah Supplier Baru'}</DialogTitle>
          <DialogDescription>
            {editingItem ? 'Perbarui informasi supplier' : 'Daftarkan supplier sparepart baru'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="s-nama">Nama Supplier *</Label>
            <Input id="s-nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="PT. Berkat Teknik Industri" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="s-kontak">Kontak Person</Label>
              <Input id="s-kontak" value={form.kontak} onChange={(e) => setForm({ ...form, kontak: e.target.value })} placeholder="Budi Santoso" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-telepon">Telepon</Label>
              <Input id="s-telepon" value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} placeholder="021-5551234" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-email">Email</Label>
            <Input id="s-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="sales@supplier.co.id" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-alamat">Alamat</Label>
            <Textarea id="s-alamat" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Jl. Industri Raya No. 12, Jakarta" rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah Supplier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
