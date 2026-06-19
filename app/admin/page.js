'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Shield, Users, CheckCircle2, XCircle, FileQuestion, Bell, Loader2, ArrowLeft,
  Mail, Calendar, IndianRupee, FileText, Eye, ExternalLink, Image as ImageIcon, Clock,
} from 'lucide-react'

const STATUS_META = {
  pending:         { label: 'Pending',       color: 'bg-amber-100 text-amber-800 border-amber-200',     icon: Clock },
  approved:        { label: 'Approved',      color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  rejected:        { label: 'Rejected',      color: 'bg-red-100 text-red-800 border-red-200',           icon: XCircle },
  docs_requested:  { label: 'Docs Requested', color: 'bg-violet-100 text-violet-800 border-violet-200', icon: FileQuestion },
}

function UserCard({ user, onSelect }) {
  const meta = STATUS_META[user.status] || STATUS_META.pending
  const Icon = meta.icon
  return (
    <Card className="p-4 hover:shadow-md transition cursor-pointer" onClick={() => onSelect(user)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              {(user.name || user.email).slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{user.name}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`${meta.color} gap-1`}><Icon className="w-3 h-3" />{meta.label}</Badge>
            {user.payment?.utr && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                <IndianRupee className="w-3 h-3" />₹{user.payment.amount || '?'}
              </Badge>
            )}
            {user.payment?.proofImage && (
              <Badge variant="outline" className="bg-slate-50 gap-1"><ImageIcon className="w-3 h-3" />Proof</Badge>
            )}
          </div>
        </div>
        <div className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString()}</div>
      </div>
    </Card>
  )
}

function UserDetail({ user, open, onClose, onAction }) {
  const [actionLoading, setActionLoading] = useState(false)
  const [docMessage, setDocMessage] = useState('Please upload your GST certificate and PAN card.')
  const [adminNote, setAdminNote] = useState('')
  const [confirmReject, setConfirmReject] = useState(false)

  if (!user) return null
  const meta = STATUS_META[user.status] || STATUS_META.pending

  const doAction = async (action, extra = {}) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminNote, ...extra }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      const labels = { approve: 'Approved', reject: 'Rejected', 'request-docs': 'Documents requested' }
      toast.success(`${labels[action]} \u2014 ${user.name}`)
      onAction?.()
      onClose()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setActionLoading(false)
      setConfirmReject(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold">
              {(user.name || user.email).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div>{user.name}</div>
              <div className="text-xs text-slate-500 font-normal">{user.email}</div>
            </div>
            <Badge variant="outline" className={`${meta.color} ml-auto`}>{meta.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Account */}
          <section>
            <h3 className="font-semibold text-sm mb-2 text-slate-700">Account</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-slate-500">User ID:</span> <span className="font-mono">{user.id.slice(0, 8)}</span></div>
              <div><span className="text-slate-500">Joined:</span> {new Date(user.createdAt).toLocaleString()}</div>
              <div><span className="text-slate-500">Role:</span> {user.role || 'user'}</div>
              {user.reviewedAt && <div><span className="text-slate-500">Last reviewed:</span> {new Date(user.reviewedAt).toLocaleString()}</div>}
            </div>
          </section>

          {/* Payment */}
          <section>
            <h3 className="font-semibold text-sm mb-2 text-slate-700 flex items-center gap-2"><IndianRupee className="w-4 h-4" />Payment</h3>
            {!user.payment ? (
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">No payment details submitted yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg">
                <div><span className="text-slate-500">UTR / Txn ID:</span> <span className="font-mono">{user.payment.utr || '—'}</span></div>
                <div><span className="text-slate-500">Amount:</span> <span className="font-semibold">₹{user.payment.amount || 0}</span></div>
                <div><span className="text-slate-500">Date:</span> {user.payment.date || '—'}</div>
                <div><span className="text-slate-500">Submitted:</span> {user.payment.submittedAt ? new Date(user.payment.submittedAt).toLocaleString() : '—'}</div>
                {user.payment.proofImage && (
                  <div className="col-span-full">
                    <div className="text-slate-500 mb-1">Payment proof</div>
                    <a href={user.payment.proofImage} target="_blank" rel="noreferrer">
                      <img src={user.payment.proofImage} alt="proof" className="max-h-64 border rounded bg-white" />
                    </a>
                    <div className="text-[10px] text-slate-400 mt-1">Click image to open full-size</div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Documents */}
          {user.docsRequest && (
            <section>
              <h3 className="font-semibold text-sm mb-2 text-slate-700 flex items-center gap-2"><FileQuestion className="w-4 h-4" />Documents Requested</h3>
              <div className="text-xs bg-violet-50 border border-violet-200 p-3 rounded-lg space-y-2">
                <div><span className="text-slate-500">Message to user:</span> <span className="italic">{user.docsRequest.message}</span></div>
                {user.docsRequest.requestedAt && <div className="text-slate-500">Requested: {new Date(user.docsRequest.requestedAt).toLocaleString()}</div>}
                {user.docsRequest.userNote && <div><span className="text-slate-500">User note:</span> {user.docsRequest.userNote}</div>}
                {(user.docsRequest.documents || []).length > 0 && (
                  <div className="pt-2">
                    <div className="text-slate-500 mb-1">Uploaded files ({user.docsRequest.documents.length}):</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {user.docsRequest.documents.map((d) => (
                        <a key={d.id} href={d.dataUri} target="_blank" rel="noreferrer" className="border rounded p-2 bg-white hover:shadow text-[11px] flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 shrink-0 text-violet-600" />
                          <span className="truncate">{d.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Admin note */}
          <section>
            <h3 className="font-semibold text-sm mb-2 text-slate-700">Internal Note (optional)</h3>
            <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} placeholder="e.g. Payment verified via HDFC NEFT ref 12345" className="text-xs" />
          </section>

          {/* Request-docs panel */}
          <section>
            <h3 className="font-semibold text-sm mb-2 text-slate-700 flex items-center gap-2"><FileQuestion className="w-4 h-4" />Request Additional Documents</h3>
            <Textarea value={docMessage} onChange={(e) => setDocMessage(e.target.value)} rows={2} className="text-xs" placeholder="Message shown to the user explaining what to upload..." />
            <Button variant="outline" size="sm" className="mt-2 gap-2" disabled={actionLoading} onClick={() => doAction('request-docs', { message: docMessage })}>
              <FileQuestion className="w-4 h-4" /> Send Request
            </Button>
          </section>
        </div>

        <DialogFooter className="flex gap-2 flex-wrap justify-end pt-4 border-t">
          {confirmReject ? (
            <>
              <Button variant="outline" onClick={() => setConfirmReject(false)} disabled={actionLoading}>Cancel</Button>
              <Button variant="destructive" disabled={actionLoading} onClick={() => doAction('reject')}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Confirm Reject
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="text-red-600 gap-2" onClick={() => setConfirmReject(true)} disabled={actionLoading}>
                <XCircle className="w-4 h-4" /> Reject
              </Button>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading} onClick={() => doAction('approve')}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Approve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-5 h-5 text-white" /></div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </div>
    </Card>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [me, setMe] = useState(undefined) // undefined = loading
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [notifs, setNotifs] = useState([])
  const [tab, setTab] = useState('users')

  // Auth check
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setMe(d.user))
      .catch(() => setMe(null))
  }, [])

  const loadAll = () => {
    fetch('/api/admin/stats', { credentials: 'include' }).then(r => r.ok ? r.json() : null).then(setStats).catch(() => {})
    fetch(`/api/admin/users?status=${statusFilter}`, { credentials: 'include' }).then(r => r.ok ? r.json() : []).then(d => setUsers(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/admin/notifications', { credentials: 'include' }).then(r => r.ok ? r.json() : []).then(d => setNotifs(Array.isArray(d) ? d : [])).catch(() => {})
  }

  useEffect(() => {
    if (me?.role === 'admin') loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, statusFilter])

  const markAllRead = async () => {
    await fetch('/api/admin/notifications/mark-read', { method: 'POST', credentials: 'include' })
    loadAll()
    toast.success('Marked all as read')
  }

  if (me === undefined) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
  }
  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md">
          <Shield className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <div className="text-lg font-semibold">Admin login required</div>
          <div className="text-sm text-slate-500 mb-4">Please log in with an admin account.</div>
          <Button onClick={() => router.push('/')}>Go to login</Button>
        </Card>
      </div>
    )
  }
  if (me.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md">
          <Shield className="w-12 h-12 mx-auto text-red-300 mb-3" />
          <div className="text-lg font-semibold">Access denied</div>
          <div className="text-sm text-slate-500 mb-4">You do not have permission to access the admin panel.</div>
          <Button onClick={() => router.push('/')}>Back to app</Button>
        </Card>
      </div>
    )
  }

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return (u.name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s) || (u.payment?.utr || '').toLowerCase().includes(s)
  })
  const unreadCount = notifs.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="sticky top-0 z-30 backdrop-blur-lg bg-white/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="gap-2"><ArrowLeft className="w-4 h-4" /> App</Button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">Admin Panel</div>
              <div className="text-xs text-slate-500 leading-tight">LetterHead Pro</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">{me.name}</div>
            <div className="text-xs text-slate-500">{me.email}</div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatCard icon={Clock}        label="Pending"        value={stats.pending}        color="bg-amber-500" />
            <StatCard icon={FileQuestion} label="Docs requested" value={stats.docs_requested} color="bg-violet-500" />
            <StatCard icon={CheckCircle2} label="Approved"       value={stats.approved}       color="bg-emerald-500" />
            <StatCard icon={XCircle}      label="Rejected"       value={stats.rejected}       color="bg-red-500" />
            <StatCard icon={Users}        label="Total users"    value={stats.total}          color="bg-blue-500" />
            <StatCard icon={FileText}     label="Letterheads"    value={stats.totalLetterheads} color="bg-indigo-500" />
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" />Users</TabsTrigger>
            <TabsTrigger value="notifs" className="gap-2">
              <Bell className="w-4 h-4" />Notifications
              {unreadCount > 0 && <Badge className="ml-1 bg-red-500 text-white">{unreadCount}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex gap-1 flex-wrap">
                {['pending', 'docs_requested', 'approved', 'rejected', 'all'].map((s) => (
                  <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
                    {s === 'all' ? 'All' : STATUS_META[s]?.label || s}
                  </Button>
                ))}
              </div>
              <Input placeholder="Search by name, email or UTR..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-9" />
            </div>
            {filteredUsers.length === 0 ? (
              <Card className="p-12 text-center text-slate-500 text-sm">No users match the current filter.</Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredUsers.map((u) => <UserCard key={u.id} user={u} onSelect={setSelectedUser} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifs" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">Most recent first ({notifs.length} total)</div>
              {unreadCount > 0 && <Button variant="outline" size="sm" onClick={markAllRead}>Mark all read</Button>}
            </div>
            {notifs.length === 0 ? (
              <Card className="p-12 text-center text-slate-500 text-sm">No notifications yet.</Card>
            ) : (
              <Card className="divide-y">
                {notifs.map((n) => (
                  <div key={n.id} className={`p-3 flex items-start gap-3 ${!n.read ? 'bg-blue-50/40' : ''}`}>
                    <div className={`w-2 h-2 rounded-full mt-2 ${!n.read ? 'bg-blue-500' : 'bg-slate-300'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">{n.message}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{new Date(n.createdAt).toLocaleString()} · {n.type}</div>
                    </div>
                    {n.userId && (
                      <Button variant="ghost" size="sm" onClick={async () => {
                        const r = await fetch(`/api/admin/users/${n.userId}`, { credentials: 'include' })
                        if (r.ok) setSelectedUser(await r.json())
                      }}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <UserDetail user={selectedUser} open={!!selectedUser} onClose={() => setSelectedUser(null)} onAction={loadAll} />
    </div>
  )
}
