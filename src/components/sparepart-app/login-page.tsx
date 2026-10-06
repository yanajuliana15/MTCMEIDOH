'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Wrench, User as UserIcon, Lock, ArrowRight, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react'

interface LoginPageProps {
  onSuccess: (user: any) => void
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
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
      if (!res.ok) throw new Error(data.error || 'Login gagal')
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top decorative banner */}
      <div className="relative bg-slate-900 text-white overflow-hidden">
        {/* Industrial pattern */}
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }} />
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="absolute -left-10 top-20 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />

        <div className="relative px-6 pt-14 pb-10 max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">SparePart Pro</div>
              <div className="text-[11px] text-slate-400">Industrial Inventory</div>
            </div>
          </div>

          <h1 className="text-2xl font-bold leading-tight">
            Kelola sparepart<br />
            mesin industri<br />
            <span className="text-orange-400">dengan mudah.</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Pantau stok, transaksi, dan status mesin dalam satu aplikasi.
          </p>
        </div>

        {/* Curved bottom */}
        <svg className="absolute bottom-0 w-full" viewBox="0 0 375 30" preserveAspectRatio="none" style={{ height: 30 }}>
          <path d="M0,30 L0,15 Q187.5,-5 375,15 L375,30 Z" fill="rgb(248 250 252)" />
        </svg>
      </div>

      {/* Form Card */}
      <div className="flex-1 px-6 -mt-2">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <ShieldCheck className="h-4 w-4 text-orange-500" />
              <h2 className="text-base font-semibold text-slate-900">Masuk ke Akun</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-medium text-slate-600 uppercase tracking-wide">Username</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className="pl-9 h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-slate-600 uppercase tracking-wide">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="pl-9 pr-10 h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-md shadow-slate-900/20 transition-all"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...</>
                ) : (
                  <>Masuk <ArrowRight className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t border-dashed border-slate-200">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-2.5 text-center">
                Akun Demo · Klik untuk isi
              </p>
              <div className="grid grid-cols-3 gap-2">
                <DemoButton letter="A" name="Admin" desc="Full" color="slate" onClick={() => fillDemo('admin', 'admin123')} />
                <DemoButton letter="G" name="Gudang" desc="Stok" color="amber" onClick={() => fillDemo('gudang', 'gudang123')} />
                <DemoButton letter="O" name="Operator" desc="Keluar" color="orange" onClick={() => fillDemo('operator', 'operator123')} />
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-6">
            © 2026 SparePart Pro · v2.0
          </p>
        </div>
      </div>
    </div>
  )
}

function DemoButton({ letter, name, desc, color, onClick }: {
  letter: string
  name: string
  desc: string
  color: 'slate' | 'amber' | 'orange'
  onClick: () => void
}) {
  const colors = {
    slate: 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700',
    amber: 'border-amber-200 hover:border-amber-300 hover:bg-amber-50 text-amber-700',
    orange: 'border-orange-200 hover:border-orange-300 hover:bg-orange-50 text-orange-700',
  }
  const avatars = {
    slate: 'bg-slate-800',
    amber: 'bg-amber-500',
    orange: 'bg-orange-500',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border-2 bg-white p-2.5 transition-all active:scale-95 ${colors[color]}`}
    >
      <div className={`h-8 w-8 rounded-lg ${avatars[color]} text-white flex items-center justify-center font-bold text-xs`}>
        {letter}
      </div>
      <span className="text-[10px] font-semibold">{name}</span>
      <span className="text-[9px] opacity-70">{desc}</span>
    </button>
  )
}
