'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { downloadCSV, parseCSV, readCSVFile, generateCSV } from '@/lib/csv'
import { Download, Upload, MoreVertical, FileSpreadsheet, Loader2, AlertCircle, FileDown } from 'lucide-react'

interface ExportImportButtonsProps<T extends Record<string, any>> {
  entity: 'sparepart' | 'mesin' | 'supplier' | 'transaksi'
  data: T[]
  /** Definisi kolom untuk export CSV */
  columns: { key: keyof T; label: string }[]
  /** Label tombol utama (default: "Export/Import") */
  label?: string
  /** Hanya tampilkan bila true (misal permission check) */
  showImport?: boolean
  /** Filter aktif yang akan dikirim ke API export Excel */
  filters?: Record<string, any>
  /** Bila true, tampilkan menu Export Excel (khusus Admin) */
  canExportExcel?: boolean
  /** Callback setelah import berhasil */
  onImported?: () => void
}

export function ExportImportButtons<T extends Record<string, any>>({
  entity, data, columns, label = 'Export', showImport = true, filters, canExportExcel = false, onImported,
}: ExportImportButtonsProps<T>) {
  const [importOpen, setImportOpen] = useState(false)
  const [importData, setImportData] = useState<Record<string, string>[] | null>(null)
  const [importFilename, setImportFilename] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleExport = () => {
    if (data.length === 0) {
      toast({ title: 'Tidak ada data', description: 'Tidak ada data untuk diekspor', variant: 'destructive' })
      return
    }
    const csv = generateCSV(data, columns)
    const date = new Date().toISOString().slice(0, 10)
    downloadCSV(`${entity}-export-${date}.csv`, csv)
    toast({ title: 'Export berhasil', description: `${data.length} baris diekspor ke CSV` })
  }

  const handleExportExcel = async () => {
    if (data.length === 0) {
      toast({ title: 'Tidak ada data', description: 'Tidak ada data untuk diekspor', variant: 'destructive' })
      return
    }
    setExportingExcel(true)
    try {
      const res = await fetch(`/api/export/${entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: filters || {} }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Gagal export Excel' }))
        throw new Error(err.error || 'Gagal export Excel')
      }
      // Download file xlsx dari response
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const date = new Date().toISOString().slice(0, 10)
      link.download = `${entity}-export-${date}.xlsx`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast({ title: 'Export Excel berhasil', description: `${data.length} baris diekspor ke Excel (styled)` })
    } catch (err: any) {
      toast({ title: 'Export Excel gagal', description: err.message, variant: 'destructive' })
    } finally {
      setExportingExcel(false)
    }
  }

  const handleDownloadTemplate = () => {
    // Buat CSV kosong dengan hanya header
    const sampleRow: Record<string, string> = {}
    columns.forEach((c) => { sampleRow[c.label] = '' })
    const csv = generateCSV([sampleRow], columns)
    downloadCSV(`template-${entity}.csv`, csv)
    toast({ title: 'Template diunduh', description: 'Isi template CSV sesuai format, lalu upload' })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await readCSVFile(file)
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        toast({ title: 'CSV kosong', description: 'File CSV tidak berisi data', variant: 'destructive' })
        return
      }
      setImportData(parsed)
      setImportFilename(file.name)
      setImportOpen(true)
    } catch (err: any) {
      toast({ title: 'Gagal membaca file', description: err.message, variant: 'destructive' })
    } finally {
      // Reset input agar bisa upload file yang sama lagi
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleImport = async () => {
    if (!importData) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/import/${entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: importData }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Gagal import')

      toast({
        title: 'Import selesai',
        description: `${result.created} ditambahkan, ${result.skipped} dilewati${result.totalErrors > 0 ? `, ${result.totalErrors} error` : ''}`,
      })
      if (result.totalErrors > 0) {
        console.log('Detail error import:', result.errors)
      }
      setImportOpen(false)
      setImportData(null)
      onImported?.()
    } catch (err: any) {
      toast({ title: 'Import gagal', description: err.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={handleExport} className="cursor-pointer">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </DropdownMenuItem>
          {canExportExcel && (
            <DropdownMenuItem
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="cursor-pointer"
            >
              {exportingExcel ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              Export Excel
              <Badge variant="secondary" className="ml-auto text-[9px] px-1.5 py-0">Admin</Badge>
            </DropdownMenuItem>
          )}
          {showImport && (
            <>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" /> Import CSV
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onClick={handleDownloadTemplate} className="cursor-pointer">
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Unduh Template
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Import preview dialog */}
      <Dialog open={importOpen} onOpenChange={(open) => {
        setImportOpen(open)
        if (!open) { setImportData(null); setImportFilename('') }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Data {entity}</DialogTitle>
            <DialogDescription>
              File: <span className="font-medium">{importFilename}</span> · {importData?.length || 0} baris terdeteksi
            </DialogDescription>
          </DialogHeader>

          {importData && importData.length > 0 && (
            <div className="space-y-3">
              <div className="rounded-md bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700 flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  Data dengan kode/nama yang sudah ada akan <strong>dilewati</strong> (tidak diupdate).
                  Untuk transaksi: stok sparepart akan otomatis terupdate.
                </div>
              </div>

              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted px-3 py-2 text-xs font-medium">Preview (5 baris pertama)</div>
                <div className="max-h-48 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/30 sticky top-0">
                      <tr>
                        {Object.keys(importData[0]).slice(0, 5).map((h) => (
                          <th key={h} className="text-left p-2 font-medium border-b">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          {Object.keys(importData[0]).slice(0, 5).map((h) => (
                            <td key={h} className="p-2 max-w-[120px] truncate">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportOpen(false); setImportData(null) }} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={handleImport} disabled={submitting || !importData?.length}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Mengimpor...</>
              ) : (
                <>Import {importData?.length || 0} baris</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
