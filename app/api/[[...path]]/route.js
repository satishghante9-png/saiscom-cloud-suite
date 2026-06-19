import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'

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

async function callLLM(systemPrompt, userPrompt) {
  // Prefer user-provided OpenAI key for unlimited usage
  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey && openaiKey.startsWith('sk-')) {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
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

  // Fallback to Emergent gateway
  const emergentKey = process.env.EMERGENT_LLM_KEY
  const resp = await fetch('https://integrations.emergentagent.com/llm/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${emergentKey}`,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
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

    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'LetterHead Pro API' }))
    }

    if (route === '/ai/generate' && method === 'POST') {
      const body = await request.json()
      const { prompt, company = {}, tone = 'professional' } = body
      if (!prompt) return handleCORS(NextResponse.json({ error: 'prompt is required' }, { status: 400 }))
      const sys = `You are an expert business letter writer. Write a clear, ${tone}, well-structured letter body in plain prose. Do NOT include sender address, date, recipient address, header, footer, or contact info — only the letter content (salutation + paragraphs + closing line like 'Sincerely,'). Use the company context if provided to personalise tone and references. Avoid markdown. Use 3-6 short paragraphs.`
      const ctx = company && company.businessName ? `\n\nCompany context: ${JSON.stringify(company)}` : ''
      const text = await callLLM(sys, prompt + ctx)
      return handleCORS(NextResponse.json({ body: text }))
    }

    if (route === '/letterheads' && method === 'POST') {
      const body = await request.json()
      const doc = {
        id: body.id || uuidv4(),
        title: body.title || (body.company?.businessName ? `${body.company.businessName} — Letter` : 'Untitled Letterhead'),
        company: body.company || {},
        template: body.template || 'corporate-blue',
        letterBody: body.letterBody || '',
        signature: body.signature || '',
        createdAt: new Date(),
      }
      await db.collection('letterheads').updateOne({ id: doc.id }, { $set: doc }, { upsert: true })
      const { _id, ...clean } = doc
      return handleCORS(NextResponse.json(clean))
    }

    if (route === '/letterheads' && method === 'GET') {
      const items = await db.collection('letterheads').find({}).sort({ createdAt: -1 }).limit(50).toArray()
      return handleCORS(NextResponse.json(items.map(({ _id, ...rest }) => rest)))
    }

    const lhMatch = route.match(/^\/letterheads\/([^/]+)$/)
    if (lhMatch && method === 'GET') {
      const id = lhMatch[1]
      const item = await db.collection('letterheads').findOne({ id })
      if (!item) return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      const { _id, ...rest } = item
      return handleCORS(NextResponse.json(rest))
    }
    if (lhMatch && method === 'DELETE') {
      await db.collection('letterheads').deleteOne({ id: lhMatch[1] })
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
