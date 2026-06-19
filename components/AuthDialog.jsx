'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2, Mail, Lock, User, FileText } from 'lucide-react'

export function AuthDialog({ open, onOpenChange, onAuthed, defaultTab = 'login' }) {
  const [tab, setTab] = useState(defaultTab)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const submit = async (mode) => {
    if (!email || !password) return toast.error('Enter email and password')
    setLoading(true)
    try {
      const url = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login'
      const payload = mode === 'signup' ? { email, password, name } : { email, password }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success(mode === 'signup' ? `Welcome, ${data.name}!` : `Welcome back, ${data.name}!`)
      onAuthed?.(data)
      onOpenChange(false)
      setEmail(''); setPassword(''); setName('')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            Welcome to LetterHead Pro
          </DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Log in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-3 mt-4">
            <div>
              <Label className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" />Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Lock className="w-3 h-3" />Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" className="mt-1" onKeyDown={(e) => e.key === 'Enter' && submit('login')} />
            </div>
            <Button onClick={() => submit('login')} disabled={loading} className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Log in
            </Button>
            <p className="text-xs text-center text-slate-500">No account? <button className="text-blue-600 underline" onClick={() => setTab('signup')}>Sign up</button></p>
          </TabsContent>

          <TabsContent value="signup" className="space-y-3 mt-4">
            <div>
              <Label className="text-xs flex items-center gap-1"><User className="w-3 h-3" />Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" />Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Lock className="w-3 h-3" />Password (min 6 chars)</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" className="mt-1" onKeyDown={(e) => e.key === 'Enter' && submit('signup')} />
            </div>
            <Button onClick={() => submit('signup')} disabled={loading} className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create account
            </Button>
            <p className="text-xs text-center text-slate-500">Already have an account? <button className="text-blue-600 underline" onClick={() => setTab('login')}>Log in</button></p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
