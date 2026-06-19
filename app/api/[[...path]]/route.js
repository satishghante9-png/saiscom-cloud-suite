import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const ADMIN_EMAIL = 'admin@saiscom.in'

let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
    await seedAdmin(db)
  }
  return db
}

async function seedAdmin(db) {
  const email = (process.env.ADMIN_EMAIL || ADMIN_EMAIL).toLowerCase().trim()
  // Hardcoded to bypass .env parsing issues with special chars like # and $
  const password = 'Shreya#$1'
  try {
    const hash = await bcrypt.hash(password, 10)
    const existing = await db.collection('users').findOne({ email })
    if (!existing) {
      await db.collection('users').insertOne({
        id: uuidv4(),
        email,
        name: process.env.ADMIN_NAME || 'Super Admin',
        passwordHash: hash,
        role: 'admin',
        status: 'approved',
        payment: null,
        docsRequest: null,
        adminNote: 'Auto-seeded super admin',
        createdAt: new Date(),
      })
      console.log(`[seedAdmin] Created admin: ${email}`)
    } else {
      // Always re-sync password, role and status to match env (idempotent)
      await db.collection('users').updateOne(
        { email },
        { $set: { passwordHash: hash, role: 'admin', status: 'approved', name: existing.name || process.env.ADMIN_NAME || 'Super Admin' } },
      )
      console.log(`[seedAdmin] Synced admin password & role: ${email}`)
    }
  } catch (e) {
    console.error('[seedAdmin] failed:', e.message)
  }
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'
const COOKIE_NAME = 'lp_token'

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '30d' })
}

function getTokenFromRequest(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const m = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
    if (!m) return null
    return jwt.verify(m[1], JWT_SECRET)
  } catch { return null }
}

async function getFullUserFromRequest(request, db) {
  const tok = getTokenFromRequest(request)
  if (!tok) return null
  const u = await db.collection('users').findOne({ id: tok.id })
  if (!u) return null
  const { passwordHash, _id, ...safe } = u
  return safe
}

function setAuthCookie(response, token) {
  response.headers.append('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; SameSite=Lax; Secure`)
  return response
}
function clearAuthCookie(response) {
  response.headers.append('Set-Cookie', `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`)
  return response
}

async function addNotification(db, { type, userId, userEmail, message }) {
  await db.collection('notifications').insertOne({
    id: uuidv4(), type, userId, userEmail, message, read: false, createdAt: new Date(),
  })
}

async function callLLM(systemPrompt, userPrompt) {
  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey && openaiKey.startsWith('sk-')) {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: 1500, temperature: 0.5 }),
    })
    if (!resp.ok) throw new Error(`OpenAI: ${await resp.text()}`)
    return (await resp.json()).choices?.[0]?.message?.content?.trim() || ''
  }
  const resp = await fetch('https://integrations.emergentagent.com/llm/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.EMERGENT_LLM_KEY}` },
    body: JSON.stringify({ model: 'claude-sonnet-4-5-20250929', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: 1500 }),
  })
  if (!resp.ok) throw new Error(`LLM: ${await resp.text()}`)
  return (await resp.json()).choices?.[0]?.message?.content?.trim() || ''
}

async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    if (route === '/' && method === 'GET') return handleCORS(NextResponse.json({ message: 'LetterHead Pro API' }))

    // ====================== AUTH ======================
    if (route === '/auth/signup' && method === 'POST') {
      const { email, password, name, payment = {} } = await request.json()
      if (!email || !password) return handleCORS(NextResponse.json({ error: 'Email and password required' }, { status: 400 }))
      if (password.length < 6) return handleCORS(NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 }))
      const emailLower = email.toLowerCase().trim()
      const existing = await db.collection('users').findOne({ email: emailLower })
      if (existing) return handleCORS(NextResponse.json({ error: 'Email already registered' }, { status: 409 }))
      const isAdmin = emailLower === ADMIN_EMAIL.toLowerCase()
      const hash = await bcrypt.hash(password, 10)
      const user = {
        id: uuidv4(),
        email: emailLower,
        name: (name || emailLower.split('@')[0]).trim(),
        passwordHash: hash,
        role: isAdmin ? 'admin' : 'user',
        status: isAdmin ? 'approved' : 'pending',
        payment: payment && (payment.utr || payment.proofImage) ? { ...payment, submittedAt: new Date() } : null,
        docsRequest: null,
        adminNote: '',
        createdAt: new Date(),
      }
      await db.collection('users').insertOne(user)
      if (!isAdmin) {
        await addNotification(db, {
          type: 'new_registration', userId: user.id, userEmail: user.email,
          message: `New registration: ${user.name} (${user.email})${user.payment?.utr ? ` · UTR: ${user.payment.utr}` : ''}`,
        })
      }
      const token = signToken(user)
      const res = NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role, status: user.status })
      return handleCORS(setAuthCookie(res, token))
    }

    if (route === '/auth/login' && method === 'POST') {
      const { email, password } = await request.json()
      if (!email || !password) return handleCORS(NextResponse.json({ error: 'Email and password required' }, { status: 400 }))
      const user = await db.collection('users').findOne({ email: email.toLowerCase().trim() })
      if (!user) return handleCORS(NextResponse.json({ error: 'Invalid email or password' }, { status: 401 }))
      const ok = await bcrypt.compare(password, user.passwordHash)
      if (!ok) return handleCORS(NextResponse.json({ error: 'Invalid email or password' }, { status: 401 }))
      if (user.status === 'rejected') {
        return handleCORS(NextResponse.json({ error: 'Your account has been rejected. Please contact support.' }, { status: 403 }))
      }
      const token = signToken(user)
      const res = NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role || 'user', status: user.status })
      return handleCORS(setAuthCookie(res, token))
    }

    if (route === '/auth/logout' && method === 'POST') {
      return handleCORS(clearAuthCookie(NextResponse.json({ ok: true })))
    }

    if (route === '/auth/me' && method === 'GET') {
      const u = await getFullUserFromRequest(request, db)
      if (!u) return handleCORS(NextResponse.json({ user: null }))
      return handleCORS(NextResponse.json({ user: u }))
    }

    // User submits requested docs
    if (route === '/user/upload-docs' && method === 'POST') {
      const me = await getFullUserFromRequest(request, db)
      if (!me) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const { documents = [], note = '' } = await request.json()
      const newDocs = (me.docsRequest?.documents || []).concat(
        documents.map(d => ({ id: uuidv4(), name: d.name, dataUri: d.dataUri, uploadedAt: new Date() })),
      )
      const updated = {
        ...(me.docsRequest || {}),
        documents: newDocs,
        userNote: note,
        submittedAt: new Date(),
      }
      await db.collection('users').updateOne(
        { id: me.id },
        { $set: { docsRequest: updated, status: 'pending' } },
      )
      await addNotification(db, {
        type: 'docs_uploaded', userId: me.id, userEmail: me.email,
        message: `${me.name} (${me.email}) uploaded ${documents.length} document(s) for review`,
      })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // ====================== AI ======================
    if (route === '/ai/generate' && method === 'POST') {
      const me = await getFullUserFromRequest(request, db)
      if (!me || me.status !== 'approved') {
        return handleCORS(NextResponse.json({ error: 'AI is a premium feature. Please log in with an approved account.' }, { status: 402 }))
      }
      const body = await request.json()
      const { prompt, company = {}, tone = 'professional' } = body
      if (!prompt) return handleCORS(NextResponse.json({ error: 'prompt is required' }, { status: 400 }))
      const sys = `You are an expert business letter writer. Write a clear, ${tone}, well-structured letter body in plain prose. Do NOT include sender address, date, recipient address, header, footer, or contact info — only the letter content (salutation + paragraphs + closing line like 'Sincerely,'). Use the company context if provided. Avoid markdown. Use 3-6 short paragraphs.`
      const ctx = company && company.businessName ? `\n\nCompany context: ${JSON.stringify(company)}` : ''
      const text = await callLLM(sys, prompt + ctx)
      return handleCORS(NextResponse.json({ body: text }))
    }

    // ====================== LETTERHEADS ======================
    if (route === '/letterheads' && method === 'POST') {
      const me = await getFullUserFromRequest(request, db)
      if (!me) return handleCORS(NextResponse.json({ error: 'Please log in to save letterheads' }, { status: 401 }))
      if (me.status !== 'approved') return handleCORS(NextResponse.json({ error: 'Saving is a premium feature. Awaiting admin approval.' }, { status: 402 }))
      const body = await request.json()
      const doc = {
        id: body.id || uuidv4(),
        userId: me.id,
        title: body.title || (body.company?.businessName ? `${body.company.businessName} — Letter` : 'Untitled Letterhead'),
        company: body.company || {},
        template: body.template || 'corporate-blue',
        letterBody: body.letterBody || '',
        signature: body.signature || '',
        letterMeta: body.letterMeta || {},
        updatedAt: new Date(),
      }
      const existing = await db.collection('letterheads').findOne({ id: doc.id })
      if (existing) {
        if (existing.userId && existing.userId !== me.id) return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
        await db.collection('letterheads').updateOne({ id: doc.id }, { $set: doc })
      } else {
        doc.createdAt = new Date()
        await db.collection('letterheads').insertOne(doc)
      }
      const { _id, ...clean } = doc
      return handleCORS(NextResponse.json(clean))
    }

    if (route === '/letterheads' && method === 'GET') {
      const me = await getFullUserFromRequest(request, db)
      if (!me) return handleCORS(NextResponse.json([]))
      const items = await db.collection('letterheads').find({ userId: me.id }).sort({ updatedAt: -1, createdAt: -1 }).limit(100).toArray()
      return handleCORS(NextResponse.json(items.map(({ _id, ...rest }) => rest)))
    }

    const lhMatch = route.match(/^\/letterheads\/([^/]+)$/)
    if (lhMatch && method === 'GET') {
      const me = await getFullUserFromRequest(request, db)
      if (!me) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const item = await db.collection('letterheads').findOne({ id: lhMatch[1], userId: me.id })
      if (!item) return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      const { _id, ...rest } = item
      return handleCORS(NextResponse.json(rest))
    }
    if (lhMatch && method === 'DELETE') {
      const me = await getFullUserFromRequest(request, db)
      if (!me) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      await db.collection('letterheads').deleteOne({ id: lhMatch[1], userId: me.id })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // ====================== ADMIN ======================
    async function requireAdmin() {
      const me = await getFullUserFromRequest(request, db)
      if (!me || me.role !== 'admin') return null
      return me
    }

    if (route === '/admin/stats' && method === 'GET') {
      const admin = await requireAdmin()
      if (!admin) return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      const [pending, approved, rejected, docs_requested, total, unreadNotif, totalLetterheads] = await Promise.all([
        db.collection('users').countDocuments({ status: 'pending' }),
        db.collection('users').countDocuments({ status: 'approved' }),
        db.collection('users').countDocuments({ status: 'rejected' }),
        db.collection('users').countDocuments({ status: 'docs_requested' }),
        db.collection('users').countDocuments({}),
        db.collection('notifications').countDocuments({ read: false }),
        db.collection('letterheads').countDocuments({}),
      ])
      return handleCORS(NextResponse.json({ pending, approved, rejected, docs_requested, total, unreadNotif, totalLetterheads }))
    }

    if (route === '/admin/users' && method === 'GET') {
      const admin = await requireAdmin()
      if (!admin) return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      const { searchParams } = new URL(request.url)
      const statusFilter = searchParams.get('status')
      const query = statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {}
      const users = await db.collection('users').find(query).sort({ createdAt: -1 }).limit(200).toArray()
      return handleCORS(NextResponse.json(users.map(({ _id, passwordHash, ...rest }) => rest)))
    }

    const adminUserMatch = route.match(/^\/admin\/users\/([^/]+)$/)
    if (adminUserMatch && method === 'GET') {
      const admin = await requireAdmin()
      if (!admin) return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      const u = await db.collection('users').findOne({ id: adminUserMatch[1] })
      if (!u) return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      const { _id, passwordHash, ...safe } = u
      return handleCORS(NextResponse.json(safe))
    }

    const actionMatch = route.match(/^\/admin\/users\/([^/]+)\/(approve|reject|request-docs)$/)
    if (actionMatch && method === 'POST') {
      const admin = await requireAdmin()
      if (!admin) return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      const [, userId, action] = actionMatch
      const target = await db.collection('users').findOne({ id: userId })
      if (!target) return handleCORS(NextResponse.json({ error: 'User not found' }, { status: 404 }))
      const { adminNote = '', message = '' } = await request.json().catch(() => ({}))
      const update = { reviewedAt: new Date(), reviewedBy: admin.id, adminNote }
      let notifMsg = ''
      if (action === 'approve') {
        update.status = 'approved'
        notifMsg = `Approved ${target.name} (${target.email})`
      } else if (action === 'reject') {
        update.status = 'rejected'
        notifMsg = `Rejected ${target.name} (${target.email})`
      } else if (action === 'request-docs') {
        update.status = 'docs_requested'
        update.docsRequest = {
          message: message || 'Please upload the requested documents.',
          requestedAt: new Date(),
          documents: target.docsRequest?.documents || [],
        }
        notifMsg = `Requested documents from ${target.name} (${target.email})`
      }
      await db.collection('users').updateOne({ id: userId }, { $set: update })
      await addNotification(db, { type: `admin_${action}`, userId, userEmail: target.email, message: notifMsg })
      return handleCORS(NextResponse.json({ ok: true, status: update.status }))
    }

    if (route === '/admin/notifications' && method === 'GET') {
      const admin = await requireAdmin()
      if (!admin) return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      const items = await db.collection('notifications').find({}).sort({ createdAt: -1 }).limit(50).toArray()
      return handleCORS(NextResponse.json(items.map(({ _id, ...rest }) => rest)))
    }

    if (route === '/admin/notifications/mark-read' && method === 'POST') {
      const admin = await requireAdmin()
      if (!admin) return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      await db.collection('notifications').updateMany({ read: false }, { $set: { read: true } })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
