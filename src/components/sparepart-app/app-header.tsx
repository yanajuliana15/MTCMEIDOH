'use client'

import { useState } from 'react'
import type { User } from '@/lib/types'
import { ROLE_LABEL, ROLE_BADGE_COLOR } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { LogOut, ChevronDown, Wrench, User as UserIcon } from 'lucide-react'

interface AppHeaderProps {
  user: User
  onLogout: () => void
}

export function AppHeader({ user, onLogout }: AppHeaderProps) {
  const [confirmLogout, setConfirmLogout] = useState(false)
  const initials = user.nama.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <>
      <header className="sticky top-0 z-30 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-md">
        <div className="px-4 py-3 flex items-center justify-between gap-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Wrench className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold leading-tight truncate">SparePart Pro</div>
              <div className="text-[10px] text-cyan-100 leading-tight">Manajemen Inventaris</div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 transition-colors px-2 py-1 pr-3">
                <div className="h-7 w-7 rounded-full bg-white text-cyan-700 flex items-center justify-center text-xs font-bold">
                  {initials}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold leading-tight">{user.nama}</div>
                  <div className="text-[10px] text-cyan-100 leading-tight">{ROLE_LABEL[user.role]}</div>
                </div>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-2">
                <div className="text-sm font-semibold">{user.nama}</div>
                <div className="text-xs text-muted-foreground">@{user.username}</div>
                <span className={`inline-flex mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${ROLE_BADGE_COLOR[user.role]}`}>
                  {ROLE_LABEL[user.role]}
                </span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setConfirmLogout(true)} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" /> Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari aplikasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan keluar dari akun <strong>{user.nama}</strong>. Silakan login kembali untuk mengakses aplikasi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={onLogout} className="bg-cyan-600 hover:bg-cyan-700">
              Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
