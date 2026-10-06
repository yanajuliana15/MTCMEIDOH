// Helper untuk generate & parse CSV

/**
 * Generate CSV string dari array of objects.
 * - Header diambil dari keys pertama object (atau dari parameter `headers`)
 * - Nilai di-escape: bila mengandung koma, quote, atau newline → dibungkus quote
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
    cols.map((c) => escapeCSV(row[c.key] ?? '')).join(',')
  )
  return [headerLine, ...dataLines].join('\r\n')
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
 * Trigger download file CSV di browser
 */
export function downloadCSV(filename: string, csvContent: string) {
  // Tambah BOM agar Excel membaca UTF-8 dengan benar
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
