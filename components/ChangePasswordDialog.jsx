'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Lock, KeyRound, CheckCircle2 } from 'lucide-react'

export function ChangePasswordDialog({ open, onOpenChange }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
  }

  const submit = async () => {
    if (!currentPassword || !newPassword) return toast.error('Fill all fields')
    if (newPassword.length < 6) return toast.error('New password must be at least 6 characters')
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match')
    if (newPassword === currentPassword) return toast.error('New password must differ from current')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Password changed successfully', { icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" /> })
      reset()
      onOpenChange(false)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            Change Password
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs flex items-center gap-1"><Lock className="w-3 h-3" />Current Password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="mt-1" autoFocus />
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1"><Lock className="w-3 h-3" />New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1"><Lock className="w-3 h-3" />Confirm New Password</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" className="mt-1" onKeyDown={(e) => e.key === 'Enter' && submit()} />
            {confirmPassword && newPassword !== confirmPassword && (
              <div className="text-[11px] text-red-600 mt-1">Passwords do not match</div>
            )}
            {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
              <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Passwords match</div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={submit} disabled={loading} className="bg-amber-600 hover:bg-amber-700 gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Update Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
