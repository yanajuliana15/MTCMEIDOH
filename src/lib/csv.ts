// Helper untuk generate & parse CSV
// PENTING: Separator pakai TITIK KOMA (;) agar Excel Indonesia langsung recognize kolom
// (di locale Indonesia, koma dipakai sebagai pemisah desimal, jadi CSV dengan koma menyatu)

const CSV_SEPARATOR = ';'

interface CSVMeta {
  /** Judul utama (baris 1) */
  title?: string
  /** Info tambahan (baris 2) — tanggal export, jumlah data, filter aktif */
  subtitle?: string
  /** Baris ringkasan di akhir (misal: "TOTAL: 15 item | Total Stok: 280") */
  summary?: string
}

/**
 * Generate CSV string dari array of objects.
 *
 * Format CSV "report" yang enak dilihat di Excel:
 * - Baris 1: Judul (MTC MEIDOH - Export Sparepart)
 * - Baris 2: Info (Tanggal, jumlah data, filter)
 * - Baris 3: (kosong sebagai pemisah)
 * - Baris 4: Header kolom
 * - Baris 5+: Data
 * - Baris terakhir: (kosong) + Summary row
 *
 * Jika `meta` tidak diisi, generate CSV standard (header di baris 1).
 *
 * Separator: TITIK KOMA (;) — agar Excel Indonesia langsung pisah kolom dengan benar
 * Angka tetap sebagai number (tanpa thousand separator) agar Excel kenali.
 * Text yang mengandung titik koma/quote/newline di-escape otomatis.
 */
export function generateCSV<T extends Record<string, any>>(
  rows: T[],
  headers?: { key: keyof T; label: string }[],
  meta?: CSVMeta
): string {
  if (rows.length === 0 && !headers) return ''

  const cols = headers?.length
    ? headers
    : Object.keys(rows[0] || {}).map((k) => ({ key: k as keyof T, label: k }))

  const lines: string[] = []

  // Baris meta (judul + info) — hanya jika meta diisi
  if (meta?.title) {
    lines.push(escapeCSV(meta.title))
  }
  if (meta?.subtitle) {
    lines.push(escapeCSV(meta.subtitle))
  }
  if (meta?.title || meta?.subtitle) {
    lines.push('') // baris kosong sebagai pemisah
  }

  // Header row
  lines.push(cols.map((c) => escapeCSV(c.label)).join(CSV_SEPARATOR))

  // Data rows
  for (const row of rows) {
    lines.push(cols.map((c) => escapeCSV(formatValue(row[c.key]))).join(CSV_SEPARATOR))
  }

  // Summary row di akhir — hanya jika meta diisi
  if (meta?.summary) {
    lines.push('') // baris kosong sebelum summary
    lines.push(escapeCSV(meta.summary))
  }

  return lines.join('\r\n')
}

/**
 * Format nilai untuk CSV:
 * - Number: tetap angka (Excel akan kenali), TAPI tidak ada thousand separator
 *   agar Excel/LibreOffice pasti kenali sebagai number (bukan string)
 * - Date: konversi ke ISO string agar konsisten
 * - Null/undefined/empty: string kosong
 * - Object/Array: JSON stringify
 */
function formatValue(value: any): any {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'number') {
    // Pastikan angka dengan presisi penuh, tanpa separator
    return value
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return value
}

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // Bila mengandung karakter special (titik koma, quote, newline), bungkus dengan quote
  if (new RegExp(`["${CSV_SEPARATOR}\r\n]`).test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Parse CSV string menjadi array of objects.
 *
 * Smart parser:
 * - Auto-detect separator: titik koma (;) atau koma (,)
 * - Skip baris meta (judul, info, baris kosong) di atas header
 * - Deteksi baris header: baris yang punya >= 3 field valid (bukan baris info/summary)
 * - Skip baris summary di bawah (baris yang dimulai dengan "TOTAL" atau "Ringkasan")
 * - Mendukung quote escaping & newline dalam field (bila field di-quote)
 */
export function parseCSV(text: string): Record<string, string>[] {
  // Normalisasi line ending
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  let allRows = splitCSVLines(normalized, ';') // coba titik koma dulu

  // Auto-detect separator: kalau semua baris cuma punya 1 field dengan titik koma,
  // kemungkinan CSV pakai koma → re-parse dengan koma
  const sampleRow = allRows.find((r) => r.length > 1 || (r[0] && r[0].includes(',')))
  if (sampleRow && sampleRow.length === 1 && sampleRow[0].includes(',')) {
    allRows = splitCSVLines(normalized, ',')
  }

  if (allRows.length < 2) return []

  // Cari baris header: baris yang punya >= 3 field non-kosong
  // dan bukan baris yang dimulai dengan keyword meta/summary
  let headerRowIndex = -1
  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i]
    const nonEmptyCells = row.filter((c) => c.trim() !== '')
    // Skip baris kosong
    if (nonEmptyCells.length === 0) continue
    // Skip baris summary (TOTAL, Ringkasan, dll)
    const firstCell = (row[0] || '').trim().toUpperCase()
    if (firstCell.startsWith('TOTAL') || firstCell.startsWith('RINGKASAN') || firstCell.startsWith('SUMMARY')) continue
    // Skip baris meta (judul) — biasanya 1 cell panjang, atau berisi "MTC MEIDOH"
    if (i === 0 && nonEmptyCells.length === 1) continue
    // Skip baris subtitle (Tanggal:, Jumlah:, Filter:, Diekspor:)
    if (nonEmptyCells.length <= 2 && (firstCell.includes('TANGGAL') || firstCell.includes('JUMLAH') || firstCell.includes('FILTER') || firstCell.includes('DIEKSPOR') || firstCell.includes('|'))) continue
    // Kandidat header: punya >= 3 field
    if (nonEmptyCells.length >= 3) {
      headerRowIndex = i
      break
    }
  }

  // Fallback: kalau tidak ketemu, pakai baris pertama sebagai header
  if (headerRowIndex === -1) headerRowIndex = 0

  const headers = allRows[headerRowIndex].map((h) => h.trim())
  const result: Record<string, string>[] = []

  for (let i = headerRowIndex + 1; i < allRows.length; i++) {
    const cells = allRows[i]
    // Skip baris kosong
    if (cells.length === 1 && cells[0] === '') continue
    // Skip baris summary
    const firstCell = (cells[0] || '').trim().toUpperCase()
    if (firstCell.startsWith('TOTAL') || firstCell.startsWith('RINGKASAN') || firstCell.startsWith('SUMMARY')) continue

    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => {
      obj[h] = (cells[idx] ?? '').trim()
    })
    result.push(obj)
  }
  return result
}

// Split CSV text menjadi array of array cells (mendukung quoted fields dengan newline)
function splitCSVLines(text: string, separator: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          currentField += '"'
          i += 2
          continue
        } else {
          inQuotes = false
          i++
          continue
        }
      } else {
        currentField += char
        i++
        continue
      }
    } else {
      if (char === '"') {
        inQuotes = true
        i++
        continue
      } else if (char === separator) {
        currentRow.push(currentField)
        currentField = ''
        i++
        continue
      } else if (char === '\n') {
        currentRow.push(currentField)
        currentField = ''
        rows.push(currentRow)
        currentRow = []
        i++
        continue
      } else {
        currentField += char
        i++
        continue
      }
    }
  }
  // Field terakhir
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField)
    rows.push(currentRow)
  }
  return rows
}

/**
 * Trigger download file CSV di browser.
 * Tambah BOM UTF-8 agar Excel membaca karakter khusus (Indonesia) dengan benar.
 */
export function downloadCSV(filename: string, csvContent: string) {
  // Tambah BOM (Byte Order Mark) UTF-8: \uFEFF
  // Ini penting agar Excel/LibreOffice kenali encoding UTF-8 dan tampilkan karakter
  // Indonesia (seperti é, ñ, dll) dengan benar, bukan mojibake.
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Baca file CSV dari input type=file
 */
export function readCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = (e) => reject(e)
    reader.readAsText(file, 'utf-8')
  })
}
