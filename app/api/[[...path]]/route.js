import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
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
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' })
}

function getUserFromRequest(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const m = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
    if (!m) return null
    const decoded = jwt.verify(m[1], JWT_SECRET)
    return decoded
  } catch {
    return null
  }
}

function setAuthCookie(response, token) {
  // 30 days
  response.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; SameSite=Lax; Secure`,
  )
  return response
}

function clearAuthCookie(response) {
  response.headers.append('Set-Cookie', `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`)
  return response
}

async function callLLM(systemPrompt, userPrompt) {
  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey && openaiKey.startsWith('sk-')) {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        max_tokens: 1500,
        temperature: 0.5,
      }),
    })
    if (!resp.ok) {
      const errText = await resp.text()
      throw new Error(`OpenAI: ${errText}`)
    }
    const data = await resp.json()
    return data.choices?.[0]?.message?.content?.trim() || ''
  }
  const emergentKey = process.env.EMERGENT_LLM_KEY
  const resp = await fetch('https://integrations.emergentagent.com/llm/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${emergentKey}` },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      max_tokens: 1500,
    }),
  })
  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`LLM: ${errText}`)
  }
  const data = await resp.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()
    const currentUser = getUserFromRequest(request)

    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'LetterHead Pro API' }))
    }

    // ===== AUTH =====
    if (route === '/auth/signup' && method === 'POST') {
      const { email, password, name } = await request.json()
      if (!email || !password) return handleCORS(NextResponse.json({ error: 'Email and password required' }, { status: 400 }))
      if (password.length < 6) return handleCORS(NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 }))
      const emailLower = email.toLowerCase().trim()
      const existing = await db.collection('users').findOne({ email: emailLower })
      if (existing) return handleCORS(NextResponse.json({ error: 'Email already registered' }, { status: 409 }))
      const hash = await bcrypt.hash(password, 10)
      const user = { id: uuidv4(), email: emailLower, name: (name || emailLower.split('@')[0]).trim(), passwordHash: hash, createdAt: new Date() }
      await db.collection('users').insertOne(user)
      const token = signToken(user)
      const res = NextResponse.json({ id: user.id, email: user.email, name: user.name })
      return handleCORS(setAuthCookie(res, token))
    }

    if (route === '/auth/login' && method === 'POST') {
      const { email, password } = await request.json()
      if (!email || !password) return handleCORS(NextResponse.json({ error: 'Email and password required' }, { status: 400 }))
      const user = await db.collection('users').findOne({ email: email.toLowerCase().trim() })
      if (!user) return handleCORS(NextResponse.json({ error: 'Invalid email or password' }, { status: 401 }))
      const ok = await bcrypt.compare(password, user.passwordHash)
      if (!ok) return handleCORS(NextResponse.json({ error: 'Invalid email or password' }, { status: 401 }))
      const token = signToken(user)
      const res = NextResponse.json({ id: user.id, email: user.email, name: user.name })
      return handleCORS(setAuthCookie(res, token))
    }

    if (route === '/auth/logout' && method === 'POST') {
      const res = NextResponse.json({ ok: true })
      return handleCORS(clearAuthCookie(res))
    }

    if (route === '/auth/me' && method === 'GET') {
      if (!currentUser) return handleCORS(NextResponse.json({ user: null }))
      return handleCORS(NextResponse.json({ user: { id: currentUser.id, email: currentUser.email, name: currentUser.name } }))
    }

    // ===== AI =====
    if (route === '/ai/generate' && method === 'POST') {
      const body = await request.json()
      const { prompt, company = {}, tone = 'professional' } = body
      if (!prompt) return handleCORS(NextResponse.json({ error: 'prompt is required' }, { status: 400 }))
      const sys = `You are an expert business letter writer. Write a clear, ${tone}, well-structured letter body in plain prose. Do NOT include sender address, date, recipient address, header, footer, or contact info \u2014 only the letter content (salutation + paragraphs + closing line like 'Sincerely,'). Use the company context if provided. Avoid markdown. Use 3-6 short paragraphs.`
      const ctx = company && company.businessName ? `\n\nCompany context: ${JSON.stringify(company)}` : ''
      const text = await callLLM(sys, prompt + ctx)
      return handleCORS(NextResponse.json({ body: text }))
    }

    // ===== LETTERHEADS (user-scoped if logged in) =====
    if (route === '/letterheads' && method === 'POST') {
      if (!currentUser) return handleCORS(NextResponse.json({ error: 'Please log in to save letterheads' }, { status: 401 }))
      const body = await request.json()
      const doc = {
        id: body.id || uuidv4(),
        userId: currentUser.id,
        title: body.title || (body.company?.businessName ? `${body.company.businessName} \u2014 Letter` : 'Untitled Letterhead'),
        company: body.company || {},
        template: body.template || 'corporate-blue',
        letterBody: body.letterBody || '',
        signature: body.signature || '',
        updatedAt: new Date(),
      }
      const existing = await db.collection('letterheads').findOne({ id: doc.id })
      if (existing) {
        if (existing.userId && existing.userId !== currentUser.id) return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
        await db.collection('letterheads').updateOne({ id: doc.id }, { $set: doc })
      } else {
        doc.createdAt = new Date()
        await db.collection('letterheads').insertOne(doc)
      }
      const { _id, ...clean } = doc
      return handleCORS(NextResponse.json(clean))
    }

    if (route === '/letterheads' && method === 'GET') {
      if (!currentUser) return handleCORS(NextResponse.json([]))
      const items = await db.collection('letterheads').find({ userId: currentUser.id }).sort({ updatedAt: -1, createdAt: -1 }).limit(100).toArray()
      return handleCORS(NextResponse.json(items.map(({ _id, ...rest }) => rest)))
    }

    const lhMatch = route.match(/^\/letterheads\/([^/]+)$/)
    if (lhMatch && method === 'GET') {
      if (!currentUser) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const item = await db.collection('letterheads').findOne({ id: lhMatch[1], userId: currentUser.id })
      if (!item) return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      const { _id, ...rest } = item
      return handleCORS(NextResponse.json(rest))
    }
    if (lhMatch && method === 'DELETE') {
      if (!currentUser) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      await db.collection('letterheads').deleteOne({ id: lhMatch[1], userId: currentUser.id })
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
