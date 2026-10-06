'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Factory, User as UserIcon, Lock, ArrowRight, Loader2 } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-primary text-primary-foreground mb-3">
            <Factory className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">MTC MEIDOH</h1>
          <p className="text-sm text-muted-foreground mt-1">Manajemen Sparepart Mesin Industri</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Masuk ke Akun</CardTitle>
            <CardDescription>Gunakan akun yang diberikan administrator</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className="pl-9"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="pl-9"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...</>
                ) : (
                  <>Masuk <ArrowRight className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t">
              <p className="text-xs text-center text-muted-foreground mb-3">Akun Demo (klik untuk isi)</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <DemoBtn letter="S" name="Superadmin" desc="Full + Users" onClick={() => fillDemo('superadmin', 'super123')} />
                <DemoBtn letter="A" name="Admin" desc="Full access" onClick={() => fillDemo('admin', 'admin123')} />
                <DemoBtn letter="G" name="Gudang" desc="Edit stok" onClick={() => fillDemo('gudang', 'gudang123')} />
                <DemoBtn letter="O" name="Operator" desc="Stok keluar" onClick={() => fillDemo('operator', 'operator123')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">© 2026 MTC MEIDOH · v1.0</p>
      </div>
    </div>
  )
}

function DemoBtn({ letter, name, desc, onClick }: { letter: string; name: string; desc: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-lg border bg-card p-2 hover:bg-accent transition-colors"
    >
      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
        {letter}
      </div>
      <span className="text-xs font-medium">{name}</span>
      <span className="text-[10px] text-muted-foreground">{desc}</span>
    </button>
  )
}
