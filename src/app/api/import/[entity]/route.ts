import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/import/[entity] — import data dari array of objects (JSON body)
// Body: { data: Record<string, string>[] }
// Akan di-skip bila kode/nama sudah ada (upsert-like behavior untuk create new only)
export async function POST(req: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  try {
    const { entity } = await params
    const body = await req.json()
    const { data } = body as { data: Record<string, string>[] }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Data CSV kosong atau tidak valid' }, { status: 400 })
    }

    let created = 0
    let skipped = 0
    const errors: string[] = []

    if (entity === 'sparepart') {
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const kode = (row.kode || row.Kode || '').trim()
        const nama = (row.nama || row.Nama || '').trim()
        if (!kode || !nama) {
          errors.push(`Baris ${i + 2}: kode/nama kosong, dilewati`)
          skipped++
          continue
        }
        const existing = await db.sparepart.findUnique({ where: { kode } })
        if (existing) { skipped++; continue }

        // Cari kategori & supplier by nama
        const kategoriNama = (row.kategori || row.Kategori || '').trim()
        const supplierNama = (row.supplier || row.Supplier || '').trim()
        let kategoriId: string | null = null
        let supplierId: string | null = null
        if (kategoriNama) {
          const k = await db.kategori.findFirst({ where: { nama: { contains: kategoriNama } } })
          if (k) kategoriId = k.id
        }
        if (supplierNama) {
          const s = await db.supplier.findFirst({ where: { nama: { contains: supplierNama } } })
          if (s) supplierId = s.id
        }

        await db.sparepart.create({
          data: {
            kode, nama,
            kategoriId, supplierId,
            satuan: (row.satuan || row.Satuan || 'pcs').trim(),
            stok: parseNum(row.stok ?? row.Stok, 0),
            stokMinimum: parseNum(row.stokMinimum ?? row['stok minimum'] ?? row['Min. Stok'] ?? row.minStok, 0),
            hargaBeli: parseNum(row.hargaBeli ?? row['harga beli'] ?? row['Harga Beli'], 0),
            hargaJual: parseNum(row.hargaJual ?? row['harga jual'] ?? row['Harga Jual'], 0),
            lokasiRak: (row.lokasiRak || row['lokasi rak'] || row['Lokasi Rak'] || '').trim() || null,
            catatan: (row.catatan || row.Catatan || '').trim() || null,
          },
        })
        created++
      }
    } else if (entity === 'mesin') {
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const kode = (row.kode || row.Kode || '').trim()
        const nama = (row.nama || row.Nama || '').trim()
        if (!kode || !nama) {
          errors.push(`Baris ${i + 2}: kode/nama kosong, dilewati`)
          skipped++
          continue
        }
        const existing = await db.mesin.findUnique({ where: { kode } })
        if (existing) { skipped++; continue }

        await db.mesin.create({
          data: {
            kode, nama,
            lokasi: (row.lokasi || row.Lokasi || '').trim() || null,
            manufaktur: (row.manufaktur || row.Manufaktur || '').trim() || null,
            tahunInstal: parseNum(row.tahunInstal || row['tahun instal'] || row['Tahun Instalasi'], new Date().getFullYear()) || null,
            status: (row.status || row.Status || 'Aktif').trim() as any,
          },
        })
        created++
      }
    } else if (entity === 'supplier') {
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const nama = (row.nama || row.Nama || '').trim()
        if (!nama) {
          errors.push(`Baris ${i + 2}: nama kosong, dilewati`)
          skipped++
          continue
        }
        // Cek duplikat nama (case insensitive untuk supplier karena tidak ada unique constraint)
        const existing = await db.supplier.findFirst({ where: { nama } })
        if (existing) { skipped++; continue }

        await db.supplier.create({
          data: {
            nama,
            kontak: (row.kontak || row.Kontak || '').trim() || null,
            telepon: (row.telepon || row.Telepon || '').trim() || null,
            email: (row.email || row.Email || '').trim() || null,
            alamat: (row.alamat || row.Alamat || '').trim() || null,
          },
        })
        created++
      }
    } else if (entity === 'transaksi') {
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const kodeSparepart = (row.kodeSparepart || row['kode sparepart'] || row.kode || row.Kode || '').trim()
        const tipe = (row.tipe || row.Tipe || '').trim().toUpperCase()
        const jumlah = parseNum(row.jumlah || row.Jumlah, 0)
        if (!kodeSparepart || !tipe || !jumlah) {
          errors.push(`Baris ${i + 2}: kode/tipe/jumlah tidak valid, dilewati`)
          skipped++
          continue
        }
        const sparepart = await db.sparepart.findUnique({ where: { kode: kodeSparepart } })
        if (!sparepart) {
          errors.push(`Baris ${i + 2}: sparepart dengan kode "${kodeSparepart}" tidak ditemukan`)
          skipped++
          continue
        }
        if (tipe !== 'MASUK' && tipe !== 'KELUAR') {
          errors.push(`Baris ${i + 2}: tipe harus MASUK/KELUAR`)
          skipped++
          continue
        }
        if (tipe === 'KELUAR' && jumlah > sparepart.stok) {
          errors.push(`Baris ${i + 2}: stok ${sparepart.kode} tidak cukup`)
          skipped++
          continue
        }

        const tglStr = (row.tanggal || row.Tanggal || '').trim()
        const tanggal = tglStr ? new Date(tglStr) : new Date()
        if (isNaN(tanggal.getTime())) {
          errors.push(`Baris ${i + 2}: tanggal tidak valid, pakai tanggal sekarang`)
        }

        await db.$transaction([
          db.transaksiStok.create({
            data: {
              sparepartId: sparepart.id, tipe, jumlah,
              referensi: (row.referensi || row.Referensi || '').trim() || null,
              catatan: (row.catatan || row.Catatan || '').trim() || null,
              tanggal: isNaN(tanggal.getTime()) ? new Date() : tanggal,
            },
          }),
          db.sparepart.update({
            where: { id: sparepart.id },
            data: { stok: tipe === 'MASUK' ? { increment: jumlah } : { decrement: jumlah } },
          }),
        ])
        created++
      }
    } else {
      return NextResponse.json({ error: `Entity "${entity}" tidak didukung` }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      errors: errors.slice(0, 10),
      totalErrors: errors.length,
    })
  } catch (error) {
    console.error('POST /api/import error:', error)
    return NextResponse.json({ error: 'Gagal import data' }, { status: 500 })
  }
}

function parseNum(val: any, defaultVal: number = 0): number {
  if (val === null || val === undefined || val === '') return defaultVal
  // Bersihkan format angka (hapus pemisah ribahasa seperti titik atau koma)
  const cleaned = String(val).replace(/[^0-9.-]/g, '')
  const num = Number(cleaned)
  return isNaN(num) ? defaultVal : num
}
