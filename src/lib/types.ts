// Tipe data untuk aplikasi sparepart mesin industri

export type UserRole = 'ADMIN' | 'OPERATOR' | 'GUDANG'
export type StatusMesin = 'Aktif' | 'Maintenance' | 'Berhenti'
export type TipeTransaksi = 'MASUK' | 'KELUAR'
export type StatusStok = 'aman' | 'menipis' | 'habis'

export interface User {
  userId: string
  nama: string
  username: string
  role: UserRole
}

export interface Kategori {
  id: string
  nama: string
  deskripsi?: string | null
  _count?: { spareparts: number }
}

export interface Mesin {
  id: string
  kode: string
  nama: string
  lokasi?: string | null
  manufaktur?: string | null
  tahunInstal?: number | null
  status: StatusMesin
  spareparts?: Array<{ sparepart: SparepartSimple }>
  createdAt: string
}

export interface SparepartSimple {
  id: string
  kode: string
  nama: string
  satuan: string
  stok: number
  stokMinimum: number
  hargaBeli: number
  hargaJual: number
}

export interface Sparepart extends SparepartSimple {
  kategoriId?: string | null
  kategori?: Kategori | null
  lokasiRak?: string | null
  catatan?: string | null
  gambar?: string | null
  mesin?: Array<{ mesin: Mesin }>
  transaksi?: TransaksiStok[]
  createdAt: string
  updatedAt: string
}

export interface TransaksiStok {
  id: string
  sparepartId: string
  sparepart?: SparepartSimple
  tipe: TipeTransaksi
  jumlah: number
  referensi?: string | null
  catatan?: string | null
  userId?: string | null
  tanggal: string
  createdAt: string
}

export interface DashboardData {
  totalSparepart: number
  totalMesin: number
  totalKategori: number
  stokMenipis: number
  stokHabis: number
  stokAman: number
  totalNilaiStok: number
  totalNilaiJual: number
  distribusiKategori: Array<{ nama: string; jumlah: number; nilai: number }>
  statusMesin: Array<{ status: string; jumlah: number }>
  recentTransaksi: Array<{
    id: string
    tipe: TipeTransaksi
    jumlah: number
    referensi?: string | null
    tanggal: string
    sparepart: { kode: string; nama: string; satuan: string }
  }>
}

export type ViewName = 'dashboard' | 'sparepart' | 'mesin' | 'transaksi'

// Permission matrix per role
export const ROLE_PERMISSIONS: Record<UserRole, {
  canEditSparepart: boolean
  canDeleteSparepart: boolean
  canEditMesin: boolean
  canDeleteMesin: boolean
  canTransaksiKeluar: boolean
  canTransaksiMasuk: boolean
}> = {
  ADMIN: {
    canEditSparepart: true,
    canDeleteSparepart: true,
    canEditMesin: true,
    canDeleteMesin: true,
    canTransaksiKeluar: true,
    canTransaksiMasuk: true,
  },
  GUDANG: {
    canEditSparepart: true,
    canDeleteSparepart: false,
    canEditMesin: false,
    canDeleteMesin: false,
    canTransaksiKeluar: true,
    canTransaksiMasuk: true,
  },
  OPERATOR: {
    canEditSparepart: false,
    canDeleteSparepart: false,
    canEditMesin: false,
    canDeleteMesin: false,
    canTransaksiKeluar: true,
    canTransaksiMasuk: false,
  },
}

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  OPERATOR: 'Operator',
  GUDANG: 'Staff Gudang',
}

export const ROLE_BADGE_COLOR: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
  OPERATOR: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  GUDANG: 'bg-amber-100 text-amber-700 border-amber-200',
}

export function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatRupiahShort(num: number): string {
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)} M`
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)} jt`
  if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)} rb`
  return `Rp ${num}`
}

export function formatTanggal(tgl: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(tgl))
}

export function formatTanggalShort(tgl: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(tgl))
}

export function formatTanggalCompact(tgl: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(tgl))
}

export function getStatusStok(stok: number, min: number): StatusStok {
  if (stok === 0) return 'habis'
  if (stok <= min) return 'menipis'
  return 'aman'
}
