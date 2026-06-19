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

async function callClaude(systemPrompt, userPrompt) {
  const apiKey = process.env.EMERGENT_LLM_KEY
  if (!apiKey) throw new Error('EMERGENT_LLM_KEY not set')

  // Emergent universal key uses the Emergent LLM gateway (OpenAI-compatible)
  const resp = await fetch('https://integrations.emergentagent.com/llm/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
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
    console.error('LLM error', resp.status, errText)
    // Fallback: try Anthropic-style endpoint
    const resp2 = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })
    if (!resp2.ok) {
      const errText2 = await resp2.text()
      console.error('Anthropic direct error', resp2.status, errText2)
      throw new Error(`LLM call failed: ${errText2}`)
    }
    const data2 = await resp2.json()
    return (data2.content || []).map(c => c.text || '').join('\n').trim()
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

    // AI: generate letter body
    if (route === '/ai/generate' && method === 'POST') {
      const body = await request.json()
      const { prompt, company = {}, tone = 'professional' } = body
      if (!prompt) {
        return handleCORS(NextResponse.json({ error: 'prompt is required' }, { status: 400 }))
      }
      const sys = `You are an expert business letter writer. Write a clear, ${tone}, well-structured letter body in plain prose. Do NOT include sender address, date, recipient address, or signatures — only the letter content (salutation + paragraphs + closing line like 'Sincerely,'). Keep it concise (3-5 short paragraphs). Use the company context if provided.`
      const ctx = company && company.businessName ? `\n\nCompany context: ${JSON.stringify(company)}` : ''
      const text = await callClaude(sys, prompt + ctx)
      return handleCORS(NextResponse.json({ body: text }))
    }

    // Save letterhead
    if (route === '/letterheads' && method === 'POST') {
      const body = await request.json()
      const doc = {
        id: uuidv4(),
        title: body.title || 'Untitled Letterhead',
        company: body.company || {},
        template: body.template || 'corporate-blue',
        letterBody: body.letterBody || '',
        createdAt: new Date(),
      }
      await db.collection('letterheads').insertOne(doc)
      return handleCORS(NextResponse.json(doc))
    }

    if (route === '/letterheads' && method === 'GET') {
      const items = await db.collection('letterheads').find({}).sort({ createdAt: -1 }).limit(50).toArray()
      const cleaned = items.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
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
