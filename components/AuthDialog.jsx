'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loader2, Mail, Lock, User, FileText, CreditCard, Calendar, Image as ImageIcon, IndianRupee } from 'lucide-react'

export function AuthDialog({ open, onOpenChange, onAuthed, defaultTab = 'login' }) {
  const [tab, setTab] = useState(defaultTab)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [includePayment, setIncludePayment] = useState(false)
  const [utr, setUtr] = useState('')
  const [amount, setAmount] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))
  const [proof, setProof] = useState('')

  const onProofUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const r = new FileReader()
    r.onload = () => setProof(r.result)
    r.readAsDataURL(file)
  }

  const submit = async (mode) => {
    if (!email || !password) return toast.error('Enter email and password')
    setLoading(true)
    try {
      const url = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login'
      const payload = mode === 'signup'
        ? { email, password, name, payment: includePayment ? { utr, amount: Number(amount) || 0, date: payDate, proofImage: proof } : null }
        : { email, password }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      if (mode === 'signup' && data.role !== 'admin') {
        toast.success(`Account created! Awaiting admin approval.`, { duration: 4500 })
      } else {
        toast.success(mode === 'signup' ? `Welcome, ${data.name}!` : `Welcome back, ${data.name}!`)
      }
      onAuthed?.(data)
      onOpenChange(false)
      setEmail(''); setPassword(''); setName(''); setUtr(''); setAmount(''); setProof(''); setIncludePayment(false)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" onKeyDown={(e) => e.key === 'Enter' && submit('login')} />
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
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
            </div>

            <div className="rounded-lg border bg-slate-50 p-3 space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={includePayment} onChange={(e) => setIncludePayment(e.target.checked)} className="mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" />I have made a payment</div>
                  <div className="text-[11px] text-slate-500">Adds payment details to your registration for faster approval.</div>
                </div>
              </label>

              {includePayment && (
                <div className="space-y-2 pt-2 border-t">
                  <div>
                    <Label className="text-xs">UTR / Transaction ID</Label>
                    <Input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="e.g. UPI/12345678901" className="mt-1 text-sm h-8" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs flex items-center gap-1"><IndianRupee className="w-3 h-3" />Amount</Label>
                      <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="999" className="mt-1 text-sm h-8" />
                    </div>
                    <div>
                      <Label className="text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Date</Label>
                      <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="mt-1 text-sm h-8" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1"><ImageIcon className="w-3 h-3" />Payment screenshot (optional)</Label>
                    <div className="mt-1 flex items-center gap-2">
                      {proof ? (
                        <img src={proof} alt="proof" className="w-14 h-14 object-cover border rounded" />
                      ) : (
                        <div className="w-14 h-14 border-2 border-dashed rounded flex items-center justify-center text-slate-400"><ImageIcon className="w-5 h-5" /></div>
                      )}
                      <label className="cursor-pointer text-xs px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 transition">
                        Upload<input type="file" accept="image/*" onChange={onProofUpload} className="hidden" />
                      </label>
                      {proof && <button onClick={() => setProof('')} className="text-xs text-red-500 hover:underline">Remove</button>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button onClick={() => submit('signup')} disabled={loading} className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create account
            </Button>
            <p className="text-[11px] text-center text-slate-500">
              Free templates + downloads work immediately.<br />
              Premium templates, AI & save library unlock after admin approval.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
