// Helper untuk generate & parse CSV

/**
 * Generate CSV string dari array of objects.
 * - Header diambil dari parameter `headers` (label)
 * - Nilai di-escape: bila mengandung koma, quote, atau newline → dibungkus quote
 * - Angka diformat dengan separator ribuan (titik) untuk readabilitas di Excel
 * - Tidak ada BOM di sini (BOM ditambahkan saat download)
 */
export function generateCSV<T extends Record<string, any>>(
  rows: T[],
  headers?: { key: keyof T; label: string }[]
): string {
  if (rows.length === 0 && !headers) return ''

  const cols = headers?.length
    ? headers
    : Object.keys(rows[0] || {}).map((k) => ({ key: k as keyof T, label: k }))

  const headerLine = cols.map((c) => escapeCSV(c.label)).join(',')
  const dataLines = rows.map((row) =>
    cols.map((c) => escapeCSV(formatValue(row[c.key]))).join(',')
  )
  return [headerLine, ...dataLines].join('\r\n')
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
  // Bila mengandung karakter special, bungkus dengan quote dan escape quote internal
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Parse CSV string menjadi array of objects.
 * - Baris pertama dianggap header
 * - Mendukung quote escaping & newline dalam field (bila field di-quote)
 */
export function parseCSV(text: string): Record<string, string>[] {
  // Normalisasi line ending
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rows = splitCSVLines(normalized)
  if (rows.length < 2) return []

  const headers = rows[0].map((h) => h.trim())
  const result: Record<string, string>[] = []

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i]
    // Skip baris kosong
    if (cells.length === 1 && cells[0] === '') continue
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => {
      obj[h] = (cells[idx] ?? '').trim()
    })
    result.push(obj)
  }
  return result
}

// Split CSV text menjadi array of array cells (mendukung quoted fields dengan newline)
function splitCSVLines(text: string): string[][] {
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
      } else if (char === ',') {
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
