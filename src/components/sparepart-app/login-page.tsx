'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Wrench, User as UserIcon, Lock, ArrowRight, Loader2 } from 'lucide-react'

interface LoginPageProps {
  onSuccess: (user: any) => void
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Login gagal')
      }
      toast({ title: 'Selamat datang', description: `Halo, ${data.user.nama}!` })
      onSuccess(data.user)
    } catch (err: any) {
      toast({ title: 'Login Gagal', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (u: string, p: string) => {
    setUsername(u)
    setPassword(p)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-cyan-600 via-cyan-700 to-slate-900">
      {/* Header dengan logo */}
      <div className="px-6 pt-16 pb-8 text-center text-white">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-white/15 backdrop-blur-md border border-white/20 shadow-xl mb-5">
          <Wrench className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">SparePart Pro</h1>
        <p className="text-sm text-cyan-100 mt-1">Manajemen Sparepart Mesin Industri</p>
      </div>

      {/* Card Form */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-6 shadow-2xl">
        <div className="max-w-sm mx-auto">
          <h2 className="text-lg font-bold mb-1">Masuk ke Akun</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Gunakan akun yang diberikan administrator
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-medium text-muted-foreground">USERNAME</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="pl-9 h-12 rounded-xl"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">PASSWORD</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="pl-9 h-12 rounded-xl"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-base shadow-lg shadow-cyan-600/30"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Memproses...</>
              ) : (
                <>Masuk <ArrowRight className="h-4 w-4 ml-2" /></>
              )}
            </Button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dashed"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-muted-foreground">Akun Demo (klik untuk isi)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <button
                type="button"
                onClick={() => fillDemo('admin', 'admin123')}
                className="flex flex-col items-center gap-1 rounded-xl border-2 border-purple-200 bg-purple-50 p-3 text-xs hover:bg-purple-100 transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm">A</div>
                <span className="font-semibold text-purple-700">Admin</span>
                <span className="text-[10px] text-muted-foreground">Full access</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('gudang', 'gudang123')}
                className="flex flex-col items-center gap-1 rounded-xl border-2 border-amber-200 bg-amber-50 p-3 text-xs hover:bg-amber-100 transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">G</div>
                <span className="font-semibold text-amber-700">Gudang</span>
                <span className="text-[10px] text-muted-foreground">Edit stok</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('operator', 'operator123')}
                className="flex flex-col items-center gap-1 rounded-xl border-2 border-cyan-200 bg-cyan-50 p-3 text-xs hover:bg-cyan-100 transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm">O</div>
                <span className="font-semibold text-cyan-700">Operator</span>
                <span className="text-[10px] text-muted-foreground">Stok keluar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white py-4 text-center">
        <p className="text-xs text-muted-foreground">© 2026 SparePart Pro · v1.0</p>
      </div>
    </div>
  )
}
