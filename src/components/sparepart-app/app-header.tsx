'use client'

import { useState } from 'react'
import type { User } from '@/lib/types'
import { ROLE_LABEL, ROLE_BADGE_COLOR } from '@/lib/types'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { LogOut, ChevronDown, Wrench } from 'lucide-react'

interface AppHeaderProps {
  user: User
  onLogout: () => void
}

export function AppHeader({ user, onLogout }: AppHeaderProps) {
  const [confirmLogout, setConfirmLogout] = useState(false)
  const initials = user.nama.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="px-4 py-2.5 flex items-center justify-between gap-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
              <Wrench className="h-4.5 w-4.5 text-orange-400" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold leading-tight text-slate-900 truncate">SparePart Pro</div>
              <div className="text-[10px] text-slate-500 leading-tight">Industrial Inventory</div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors px-1.5 py-1 pr-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center text-[11px] font-bold">
                  {initials}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold leading-tight text-slate-900">{user.nama}</div>
                  <div className="text-[10px] text-slate-500 leading-tight">{ROLE_LABEL[user.role]}</div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <div className="px-2.5 py-2">
                <div className="text-sm font-semibold text-slate-900">{user.nama}</div>
                <div className="text-xs text-slate-500">@{user.username}</div>
                <span className={`inline-flex mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${ROLE_BADGE_COLOR[user.role]}`}>
                  {ROLE_LABEL[user.role]}
                </span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setConfirmLogout(true)} className="text-red-600 focus:text-red-600 rounded-md mx-1">
                <LogOut className="h-4 w-4 mr-2" /> Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari aplikasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan keluar dari akun <strong>{user.nama}</strong>. Silakan login kembali untuk mengakses aplikasi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={onLogout} className="bg-slate-900 hover:bg-slate-800 rounded-lg">
              Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
