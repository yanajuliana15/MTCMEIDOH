import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// POST /api/export/[entity]
// Body: { filters?: { search?: string, kategoriId?: string, supplierId?: string, statusStok?: string, status?: string, tipe?: string } }
// Return: file .xlsx dengan styling
export async function POST(req: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  // Hanya Admin yang boleh export Excel
  const user = requireAdmin(req)
  if (!user) {
    return NextResponse.json({ error: 'Akses ditolak. Hanya Admin yang dapat export Excel.' }, { status: 403 })
  }

  const { entity } = await params
  let body: any = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const filters = body.filters || {}

  const wb = new ExcelJS.Workbook()
  wb.creator = 'MTC MEIDOH'
  wb.created = new Date()

  // Property info: tambah metadata di file properties
  wb.properties = {
    title: `Export ${entity} MTC MEIDOH`,
    subject: 'Inventory Management System',
    creator: user.nama,
    company: 'MTC MEIDOH',
  }

  if (entity === 'sparepart') {
    await buildSparepartSheet(wb, filters)
  } else if (entity === 'mesin') {
    await buildMesinSheet(wb, filters)
  } else if (entity === 'supplier') {
    await buildSupplierSheet(wb, filters)
  } else if (entity === 'transaksi') {
    await buildTransaksiSheet(wb, filters)
  } else {
    return NextResponse.json({ error: `Entity "${entity}" tidak didukung` }, { status: 400 })
  }

  const buffer = await wb.xlsx.writeBuffer()
  const date = new Date().toISOString().slice(0, 10)
  const filename = `${entity}-export-${date}.xlsx`

  return new NextResponse(buffer as any, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

// === Helper styling ===
const HEADER_FILL: Partial<ExcelJS.Fill> = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1F2937' }, // slate-900
}
const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 11,
  name: 'Calibri',
}
const BODY_FONT: Partial<ExcelJS.Font> = {
  size: 10,
  name: 'Calibri',
}
const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
}

interface ColumnDef {
  header: string
  key: string
  width: number
  align?: 'left' | 'center' | 'right'
  format?: string // Excel number format, misal: '#,##0' atau '"Rp"#,##0'
  statusColors?: Record<string, { fill: string; font: string }>
}

function styleSheet(ws: ExcelJS.Worksheet, columns: ColumnDef[], title: string, subtitle: string) {
  // Title bar di row 1 (merged)
  ws.mergeCells(1, 1, 1, columns.length)
  const titleCell = ws.getCell(1, 1)
  titleCell.value = title
  titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' }, name: 'Calibri' }
  titleCell.fill = {
    type: 'pattern', pattern: 'solid',
    fgColor: { argb: 'FF0F172A' }, // slate-950
  }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(1).height = 28

  // Subtitle di row 2 (merged) — info export
  ws.mergeCells(2, 1, 2, columns.length)
  const subCell = ws.getCell(2, 1)
  subCell.value = subtitle
  subCell.font = { italic: true, size: 9, color: { argb: 'FF6B7280' }, name: 'Calibri' }
  subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(2).height = 18

  // Header row di row 3
  const headerRow = ws.getRow(3)
  headerRow.height = 22
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = col.header
    cell.font = HEADER_FONT
    cell.fill = HEADER_FILL
    cell.alignment = { vertical: 'middle', horizontal: col.align || 'left', indent: col.align === 'left' ? 1 : 0 }
    cell.border = BORDER
  })

  // Define columns
  ws.columns = columns.map((c) => ({
    key: c.key,
    width: c.width,
    alignment: { vertical: 'middle', horizontal: c.align || 'left', indent: c.align === 'left' ? 1 : 0 },
  }))

  // Freeze panes: row 4 ke bawah bisa scroll, header tetap kelihatan
  ws.views = [{ state: 'frozen', ySplit: 3 }]

  // Auto filter di header
  ws.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: columns.length },
  }
}

function fillDataRow(ws: ExcelJS.Worksheet, rowIndex: number, data: Record<string, any>, columns: ColumnDef[]) {
  const row = ws.getRow(rowIndex)
  row.height = 18
  columns.forEach((col, idx) => {
    const cell = row.getCell(idx + 1)
    const value = data[col.key]
    cell.value = value !== null && value !== undefined && value !== '' ? value : ''
    cell.font = BODY_FONT
    cell.border = BORDER
    cell.alignment = { vertical: 'middle', horizontal: col.align || 'left', indent: col.align === 'left' ? 1 : 0 }
    if (col.format && typeof value === 'number') {
      cell.numFmt = col.format
    }
    // Status-based coloring
    if (col.statusColors && typeof value === 'string' && col.statusColors[value]) {
      const colors = col.statusColors[value]
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.fill } }
      cell.font = { ...BODY_FONT, bold: true, color: { argb: colors.font } }
    }
  })
}

// Alternating row color untuk readability
function applyAlternatingRows(ws: ExcelJS.Worksheet, startRow: number, endRow: number, numCols: number) {
  for (let r = startRow; r <= endRow; r++) {
    const isEven = (r - startRow) % 2 === 1
    if (isEven) {
      for (let c = 1; c <= numCols; c++) {
        const cell = ws.getRow(r).getCell(c)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } } // slate-50
      }
    }
  }
}

// === SPAREPART ===
async function buildSparepartSheet(wb: ExcelJS.Workbook, filters: any) {
  const ws = wb.addWorksheet('Sparepart', {
    properties: { tabColor: { argb: 'FF0891B2' } },
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
  })

  const where: any = {}
  if (filters.search) {
    where.OR = [{ kode: { contains: filters.search } }, { nama: { contains: filters.search } }]
  }
  if (filters.kategoriId) where.kategoriId = filters.kategoriId
  if (filters.supplierId) where.supplierId = filters.supplierId

  let spareparts = await db.sparepart.findMany({
    where,
    include: { kategori: true, supplier: true, mesin: { include: { mesin: true } } },
    orderBy: { kode: 'asc' },
  })

  if (filters.statusStok === 'menipis') spareparts = spareparts.filter((s) => s.stok <= s.stokMinimum && s.stok > 0)
  else if (filters.statusStok === 'habis') spareparts = spareparts.filter((s) => s.stok === 0)
  else if (filters.statusStok === 'aman') spareparts = spareparts.filter((s) => s.stok > s.stokMinimum)

  const statusOf = (s: number, min: number) => (s === 0 ? 'Habis' : s <= min ? 'Menipis' : 'Aman')

  const columns: ColumnDef[] = [
    { header: 'Kode', key: 'kode', width: 18, align: 'left' },
    { header: 'Nama', key: 'nama', width: 32, align: 'left' },
    { header: 'Kategori', key: 'kategori', width: 18, align: 'left' },
    { header: 'Supplier', key: 'supplier', width: 28, align: 'left' },
    { header: 'Satuan', key: 'satuan', width: 10, align: 'center' },
    { header: 'Stok', key: 'stok', width: 10, align: 'right', format: '#,##0' },
    { header: 'Min. Stok', key: 'stokMinimum', width: 10, align: 'right', format: '#,##0' },
    { header: 'Status', key: 'status', width: 11, align: 'center', statusColors: {
      'Habis': { fill: 'FFFEE2E2', font: 'FFB91C1C' },
      'Menipis': { fill: 'FFFEF3C7', font: 'FFB45309' },
      'Aman': { fill: 'FFD1FAE5', font: 'FF047857' },
    } },
    { header: 'Harga Beli', key: 'hargaBeli', width: 14, align: 'right', format: '"Rp"#,##0' },
    { header: 'Harga Jual', key: 'hargaJual', width: 14, align: 'right', format: '"Rp"#,##0' },
    { header: 'Nilai Stok', key: 'nilaiStok', width: 16, align: 'right', format: '"Rp"#,##0' },
    { header: 'Lokasi Rak', key: 'lokasiRak', width: 12, align: 'left' },
    { header: 'Mesin Kompatibel', key: 'mesinKompatibel', width: 30, align: 'left' },
    { header: 'Catatan', key: 'catatan', width: 30, align: 'left' },
  ]

  styleSheet(ws, columns, 'MTC MEIDOH — Daftar Sparepart Mesin Industri',
    `Diekspor: ${new Date().toLocaleString('id-ID')} · ${spareparts.length} item · Filter: ${JSON.stringify(filters).replace(/[{}"]/g, '') || '-'}`)

  const startRow = 4
  spareparts.forEach((sp, i) => {
    const row = startRow + i
    fillDataRow(ws, row, {
      kode: sp.kode,
      nama: sp.nama,
      kategori: sp.kategori?.nama || '-',
      supplier: sp.supplier?.nama || '-',
      satuan: sp.satuan,
      stok: sp.stok,
      stokMinimum: sp.stokMinimum,
      status: statusOf(sp.stok, sp.stokMinimum),
      hargaBeli: sp.hargaBeli,
      hargaJual: sp.hargaJual,
      nilaiStok: sp.stok * sp.hargaBeli,
      lokasiRak: sp.lokasiRak || '-',
      mesinKompatibel: sp.mesin?.map((m) => m.mesin.kode).join(', ') || '-',
      catatan: sp.catatan || '-',
    }, columns)
  })

  // Summary row di bawah
  const summaryRow = startRow + spareparts.length + 1
  ws.mergeCells(summaryRow, 1, summaryRow, 5)
  const sumCell = ws.getCell(summaryRow, 1)
  sumCell.value = 'TOTAL'
  sumCell.font = { bold: true, size: 11, name: 'Calibri' }
  sumCell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 }
  sumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } }

  // Total stok (kolom 6 = stok)
  const sumStokCell = ws.getCell(summaryRow, 6)
  sumStokCell.value = spareparts.reduce((s, sp) => s + sp.stok, 0)
  sumStokCell.font = { bold: true, size: 11, name: 'Calibri' }
  sumStokCell.numFmt = '#,##0'
  sumStokCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } }
  sumStokCell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 }

  // Total nilai (kolom 11 = nilaiStok)
  const sumNilaiCell = ws.getCell(summaryRow, 11)
  sumNilaiCell.value = spareparts.reduce((s, sp) => s + sp.stok * sp.hargaBeli, 0)
  sumNilaiCell.font = { bold: true, size: 11, name: 'Calibri' }
  sumNilaiCell.numFmt = '"Rp"#,##0'
  sumNilaiCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } }
  sumNilaiCell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 }

  applyAlternatingRows(ws, startRow, startRow + spareparts.length - 1, columns.length)
}

// === MESIN ===
async function buildMesinSheet(wb: ExcelJS.Workbook, filters: any) {
  const ws = wb.addWorksheet('Mesin', {
    properties: { tabColor: { argb: 'FF10B981' } },
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
  })

  const where: any = {}
  if (filters.search) {
    where.OR = [{ kode: { contains: filters.search } }, { nama: { contains: filters.search } }, { manufaktur: { contains: filters.search } }]
  }
  if (filters.status) where.status = filters.status

  const mesins = await db.mesin.findMany({
    where,
    include: { spareparts: { include: { sparepart: true } } },
    orderBy: { kode: 'asc' },
  })

  const columns: ColumnDef[] = [
    { header: 'Kode', key: 'kode', width: 14, align: 'left' },
    { header: 'Nama', key: 'nama', width: 32, align: 'left' },
    { header: 'Manufaktur', key: 'manufaktur', width: 18, align: 'left' },
    { header: 'Lokasi', key: 'lokasi', width: 30, align: 'left' },
    { header: 'Tahun Instal', key: 'tahunInstal', width: 12, align: 'center' },
    { header: 'Status', key: 'status', width: 12, align: 'center', statusColors: {
      'Aktif': { fill: 'FFD1FAE5', font: 'FF047857' },
      'Maintenance': { fill: 'FFFEF3C7', font: 'FFB45309' },
      'Berhenti': { fill: 'FFFEE2E2', font: 'FFB91C1C' },
    } },
    { header: 'Jumlah Sparepart', key: 'jumlahPart', width: 16, align: 'center', format: '#,##0' },
    { header: 'Sparepart Kompatibel', key: 'sparepartList', width: 50, align: 'left' },
  ]

  styleSheet(ws, columns, 'MTC MEIDOH — Daftar Mesin Industri',
    `Diekspor: ${new Date().toLocaleString('id-ID')} · ${mesins.length} mesin`)

  const startRow = 4
  mesins.forEach((m, i) => {
    fillDataRow(ws, startRow + i, {
      kode: m.kode,
      nama: m.nama,
      manufaktur: m.manufaktur || '-',
      lokasi: m.lokasi || '-',
      tahunInstal: m.tahunInstal || '-',
      status: m.status,
      jumlahPart: m.spareparts?.length || 0,
      sparepartList: m.spareparts?.map((s) => s.sparepart.kode).join(', ') || '-',
    }, columns)
  })

  applyAlternatingRows(ws, startRow, startRow + mesins.length - 1, columns.length)
}

// === SUPPLIER ===
async function buildSupplierSheet(wb: ExcelJS.Workbook, filters: any) {
  const ws = wb.addWorksheet('Supplier', {
    properties: { tabColor: { argb: 'FF8B5CF6' } },
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
  })

  const where: any = {}
  if (filters.search) {
    where.OR = [{ nama: { contains: filters.search } }, { kontak: { contains: filters.search } }, { email: { contains: filters.search } }]
  }

  const suppliers = await db.supplier.findMany({
    where,
    include: { _count: { select: { spareparts: true } } },
    orderBy: { nama: 'asc' },
  })

  const columns: ColumnDef[] = [
    { header: 'No', key: 'no', width: 6, align: 'center', format: '0' },
    { header: 'Nama Supplier', key: 'nama', width: 32, align: 'left' },
    { header: 'Kontak Person', key: 'kontak', width: 20, align: 'left' },
    { header: 'Telepon', key: 'telepon', width: 16, align: 'left' },
    { header: 'Email', key: 'email', width: 30, align: 'left' },
    { header: 'Alamat', key: 'alamat', width: 45, align: 'left' },
    { header: 'Jumlah Sparepart', key: 'jumlahPart', width: 16, align: 'center', format: '#,##0' },
  ]

  styleSheet(ws, columns, 'MTC MEIDOH — Daftar Supplier',
    `Diekspor: ${new Date().toLocaleString('id-ID')} · ${suppliers.length} supplier`)

  const startRow = 4
  suppliers.forEach((s, i) => {
    fillDataRow(ws, startRow + i, {
      no: i + 1,
      nama: s.nama,
      kontak: s.kontak || '-',
      telepon: s.telepon || '-',
      email: s.email || '-',
      alamat: s.alamat || '-',
      jumlahPart: s._count?.spareparts || 0,
    }, columns)
  })

  applyAlternatingRows(ws, startRow, startRow + suppliers.length - 1, columns.length)
}

// === TRANSAKSI ===
async function buildTransaksiSheet(wb: ExcelJS.Workbook, filters: any) {
  const ws = wb.addWorksheet('Transaksi', {
    properties: { tabColor: { argb: 'FFF59E0B' } },
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
  })

  const where: any = {}
  if (filters.tipe) where.tipe = filters.tipe

  const transaksi = await db.transaksiStok.findMany({
    where,
    include: { sparepart: true },
    orderBy: { tanggal: 'desc' },
    take: 500, // batasi 500 transaksi terbaru
  })

  const columns: ColumnDef[] = [
    { header: 'No', key: 'no', width: 6, align: 'center', format: '0' },
    { header: 'Tanggal', key: 'tanggal', width: 18, align: 'center' },
    { header: 'Kode Sparepart', key: 'kodeSparepart', width: 18, align: 'left' },
    { header: 'Nama Sparepart', key: 'namaSparepart', width: 32, align: 'left' },
    { header: 'Tipe', key: 'tipe', width: 10, align: 'center', statusColors: {
      'MASUK': { fill: 'FFD1FAE5', font: 'FF047857' },
      'KELUAR': { fill: 'FFFEE2E2', font: 'FFB91C1C' },
    } },
    { header: 'Jumlah', key: 'jumlah', width: 10, align: 'right', format: '#,##0' },
    { header: 'Satuan', key: 'satuan', width: 10, align: 'center' },
    { header: 'Referensi', key: 'referensi', width: 16, align: 'left' },
    { header: 'Catatan', key: 'catatan', width: 35, align: 'left' },
  ]

  styleSheet(ws, columns, 'MTC MEIDOH — Riwayat Transaksi Stok',
    `Diekspor: ${new Date().toLocaleString('id-ID')} · ${transaksi.length} transaksi`)

  const startRow = 4
  let totalMasuk = 0
  let totalKeluar = 0
  transaksi.forEach((t, i) => {
    if (t.tipe === 'MASUK') totalMasuk += t.jumlah
    else totalKeluar += t.jumlah
    fillDataRow(ws, startRow + i, {
      no: i + 1,
      tanggal: new Date(t.tanggal).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
      kodeSparepart: t.sparepart?.kode || '-',
      namaSparepart: t.sparepart?.nama || '-',
      tipe: t.tipe,
      jumlah: t.jumlah,
      satuan: t.sparepart?.satuan || '-',
      referensi: t.referensi || '-',
      catatan: t.catatan || '-',
    }, columns)
  })

  // Summary row
  const summaryRow = startRow + transaksi.length + 1
  ws.mergeCells(summaryRow, 1, summaryRow, 5)
  const sumCell = ws.getCell(summaryRow, 1)
  sumCell.value = `TOTAL — Masuk: ${totalMasuk}  ·  Keluar: ${totalKeluar}  ·  Net: ${totalMasuk - totalKeluar}`
  sumCell.font = { bold: true, size: 11, name: 'Calibri' }
  sumCell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 }
  sumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } }
  for (let c = 1; c <= columns.length; c++) {
    const cell = ws.getCell(summaryRow, c)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } }
  }

  applyAlternatingRows(ws, startRow, startRow + transaksi.length - 1, columns.length)
}
