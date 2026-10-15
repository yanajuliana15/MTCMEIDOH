'use client'

import { useEffect, useState, useCallback } from 'react'
import type { UserRecord, UserRole, User } from '@/lib/types'
import { ROLE_LABEL, ROLE_BADGE_COLOR, formatTanggalShort } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Search, Plus, Edit, Trash2, Users, User as UserIcon, Lock, ShieldCheck, X } from 'lucide-react'

const ROLE_ORDER: UserRole[] = ['SUPERADMIN', 'ADMIN', 'GUDANG', 'OPERATOR']

export function UserView({ user: currentUser }: { user: User }) {
  const [items, setItems] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all')
  const [editingItem, setEditingItem] = useState<UserRecord | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<UserRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal memuat user')
      }
      setItems(await res.json())
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSave = async (formData: any) => {
    setSubmitting(true)
    try {
      const url = editingItem ? `/api/user/${editingItem.id}` : '/api/user'
      const method = editingItem ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal menyimpan')
      }
      toast({
        title: 'Berhasil',
        description: editingItem
          ? `User "${formData.nama}" diperbarui`
          : `User baru "${formData.nama}" ditambahkan`,
      })
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
      const res = await fetch(`/api/user/${deleteItem.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal menghapus')
      }
      toast({ title: 'Berhasil', description: `User "${deleteItem.nama}" dihapus` })
      setDeleteItem(null); loadData()
    } catch (e: any) {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const stats = {
    superadmin: items.filter((u) => u.role === 'SUPERADMIN').length,
    admin: items.filter((u) => u.role === 'ADMIN').length,
    gudang: items.filter((u) => u.role === 'GUDANG').length,
    operator: items.filter((u) => u.role === 'OPERATOR').length,
  }

  const filtered = items.filter((u) => {
    const matchSearch = !search ||
      u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-purple-600" />
            Manajemen User
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} user terdaftar · {stats.superadmin} superadmin · {stats.admin} admin · {stats.gudang} gudang · {stats.operator} operator
          </p>
        </div>
        <Button onClick={() => { setEditingItem(null); setIsFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Tambah User
        </Button>
      </div>

      {/* Info banner */}
      <Card className="border-purple-200 bg-purple-50/50">
        <CardContent className="p-3 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
          <div className="text-xs text-purple-900">
            <strong>Hanya Superadmin</strong> yang dapat mengelola user.
            Superadmin terakhir tidak dapat dihapus atau diturunkan role-nya untuk mencegah system lockout.
            Password disimpan plain-text untuk demo (production harus pakai hash).
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterRole} onValueChange={(v) => setFilterRole(v as any)}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Filter role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="SUPERADMIN">Superadmin</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
                <SelectItem value="GUDANG">Staff Gudang</SelectItem>
                <SelectItem value="OPERATOR">Operator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="h-96 animate-pulse" /></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Tidak ada user ditemukan</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium hidden sm:table-cell">Username</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-center p-3 font-medium hidden md:table-cell">Transaksi</th>
                    <th className="text-left p-3 font-medium hidden lg:table-cell">Dibuat</th>
                    <th className="text-right p-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((u) => {
                    const isSelf = u.id === currentUser.id
                    return (
                      <tr key={u.id} className="hover:bg-accent/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                              u.role === 'SUPERADMIN' ? 'bg-purple-600' :
                              u.role === 'ADMIN' ? 'bg-slate-800' :
                              u.role === 'GUDANG' ? 'bg-amber-500' :
                              'bg-orange-500'
                            }`}>
                              {u.nama.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate flex items-center gap-1.5">
                                {u.nama}
                                {isSelf && <Badge variant="secondary" className="text-[9px] py-0 px-1">Anda</Badge>}
                              </div>
                              <div className="text-xs text-muted-foreground sm:hidden">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 hidden sm:table-cell">
                          <span className="font-mono text-xs">@{u.username}</span>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[10px] font-semibold ${ROLE_BADGE_COLOR[u.role]}`}>
                            {ROLE_LABEL[u.role]}
                          </Badge>
                        </td>
                        <td className="p-3 text-center hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">{u._count?.transaksi || 0}x</span>
                        </td>
                        <td className="p-3 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">{formatTanggalShort(u.createdAt)}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingItem(u); setIsFormOpen(true) }}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive disabled:opacity-30"
                              disabled={isSelf}
                              onClick={() => setDeleteItem(u)}
                              title={isSelf ? 'Tidak bisa hapus akun sendiri' : 'Hapus user'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <UserForm
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
            <AlertDialogTitle>Hapus User?</AlertDialogTitle>
            <AlertDialogDescription>
              User <strong>{deleteItem?.nama} (@{deleteItem?.username})</strong> akan dihapus permanen.
              Riwayat transaksi yang dicatat oleh user ini akan tetap ada (field userId menjadi null).
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

interface UserFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingItem: UserRecord | null
  onSubmit: (data: any) => void
  submitting: boolean
}

function UserForm({ open, onOpenChange, editingItem, onSubmit, submitting }: UserFormProps) {
  const [form, setForm] = useState(() => ({
    nama: editingItem?.nama || '',
    username: editingItem?.username || '',
    password: '',
    role: editingItem?.role || 'OPERATOR',
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit User' : 'Tambah User Baru'}</DialogTitle>
          <DialogDescription>
            {editingItem
              ? 'Perbarui informasi user. Kosongkan password jika tidak ingin mengubah.'
              : 'Daftarkan user baru dengan role tertentu'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="u-nama">Nama Lengkap *</Label>
            <Input id="u-nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Budi Santoso" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-username">Username *</Label>
            <Input id="u-username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="budi.santoso" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-password">
              Password {editingItem ? <span className="text-xs text-muted-foreground">(kosongkan jika tidak ubah)</span> : '*'}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="u-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingItem ? '••••••••' : 'Minimal 6 karakter'}
                required={!editingItem}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_ORDER.map((r) => (
                  <SelectItem key={r} value={r}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${
                        r === 'SUPERADMIN' ? 'bg-purple-500' :
                        r === 'ADMIN' ? 'bg-slate-700' :
                        r === 'GUDANG' ? 'bg-amber-500' :
                        'bg-orange-500'
                      }`} />
                      {ROLE_LABEL[r]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              {form.role === 'SUPERADMIN' && 'Akses penuh + kelola user. Tidak bisa dihapus jika superadmin terakhir.'}
              {form.role === 'ADMIN' && 'Akses penuh ke sparepart/mesin/supplier/transaksi + export Excel. Tidak bisa kelola user.'}
              {form.role === 'GUDANG' && 'Edit sparepart/supplier + transaksi masuk & keluar.'}
              {form.role === 'OPERATOR' && 'Hanya bisa catat transaksi stok keluar.'}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
