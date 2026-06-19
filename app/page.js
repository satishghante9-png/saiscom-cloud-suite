'use client'

import { useState, useRef } from 'react'
import { TEMPLATES } from '@/lib/templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  FileText, Sparkles, Image as ImageIcon, Building2,
  Phone, Mail, Globe, MapPin, Hash, Loader2, FileImage, FileDown, Palette
} from 'lucide-react'

const defaultCompany = {
  businessName: 'Acme Consulting LLP',
  tagline: 'Strategy. Growth. Excellence.',
  ownerName: 'Mr. Rajiv Sharma, Managing Partner',
  gst: '27AAACA1234B1Z5',
  pan: 'AAACA1234B',
  cin: 'U74999MH2020LLP123456',
  regNo: 'LLP-2020/01234',
  email: 'hello@acmeconsulting.in',
  website: 'www.acmeconsulting.in',
  phone: '+91 98765 43210',
  whatsapp: '+91 98765 43210',
  address: '12th Floor, Tower B, Cyber Square, Andheri East, Mumbai \u2013 400093, India',
  logo: '',
}

const defaultLetter = `Dear Sir/Madam,

We hope this letter finds you well. We are pleased to share an update on our recent engagement and the next steps for the upcoming quarter.

Our team has reviewed the proposal in detail, and we are confident the outlined approach will deliver meaningful value to your organisation. We have included a tentative timeline and resource plan for your reference.

Please feel free to reach out should you require any clarifications. We look forward to your response and to continuing our productive association.

Sincerely,`

function LetterheadPreview({ company, template, letterBody, refEl }) {
  const t = template
  const headerBg =
    t.headerStyle === 'gradient'
      ? `linear-gradient(135deg, ${t.primary} 0%, ${t.accent} 100%)`
      : t.primary

  return (
    <div
      ref={refEl}
      id="letterhead-canvas"
      style={{
        width: '794px',
        minHeight: '1123px',
        background: '#ffffff',
        fontFamily: t.font === 'Georgia' ? 'Georgia, serif' : 'Inter, system-ui, sans-serif',
        color: '#111827',
        margin: '0 auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {t.headerStyle === 'minimal' && (
        <div style={{ padding: '40px 56px 24px', borderBottom: `3px solid ${t.accent}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {company.logo && <img src={company.logo} alt="logo" style={{ height: 56, width: 56, objectFit: 'contain' }} />}
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: t.primary, letterSpacing: '-0.02em' }}>{company.businessName}</div>
              {company.tagline && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{company.tagline}</div>}
            </div>
          </div>
        </div>
      )}

      {(t.headerStyle === 'gradient' || t.headerStyle === 'classic') && (
        <div
          style={{
            background: headerBg,
            color: '#ffffff',
            padding: '32px 56px',
            borderBottom: t.headerStyle === 'classic' ? `6px double ${t.accent}` : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              {company.logo && <img src={company.logo} alt="logo" style={{ height: 68, width: 68, objectFit: 'contain', background: '#fff', borderRadius: 8, padding: 6 }} />}
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em' }}>{company.businessName}</div>
                {company.tagline && <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4, fontStyle: 'italic' }}>{company.tagline}</div>}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, lineHeight: 1.6, opacity: 0.95 }}>
              {company.regNo && <div>Reg: {company.regNo}</div>}
              {company.cin && <div>CIN: {company.cin}</div>}
              {company.gst && <div>GST: {company.gst}</div>}
            </div>
          </div>
        </div>
      )}

      {t.headerStyle === 'doubleBorder' && (
        <div style={{ padding: '36px 56px 20px', borderTop: `8px solid ${t.primary}`, borderBottom: `2px solid ${t.accent}` }}>
          <div style={{ textAlign: 'center' }}>
            {company.logo && <img src={company.logo} alt="logo" style={{ height: 64, objectFit: 'contain', marginBottom: 10 }} />}
            <div style={{ fontSize: 32, fontWeight: 700, color: t.primary, letterSpacing: '0.02em' }}>{company.businessName}</div>
            {company.tagline && <div style={{ fontSize: 13, color: t.accent, marginTop: 6, fontStyle: 'italic' }}>{company.tagline}</div>}
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 8 }}>
              {[company.regNo && `Reg: ${company.regNo}`, company.gst && `GSTIN: ${company.gst}`, company.pan && `PAN: ${company.pan}`].filter(Boolean).join('  |  ')}
            </div>
          </div>
        </div>
      )}

      {t.headerStyle === 'sideBar' && (
        <div style={{ display: 'flex' }}>
          <div style={{ width: 14, background: `linear-gradient(180deg, ${t.primary}, ${t.accent})` }} />
          <div style={{ flex: 1, padding: '36px 56px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              {company.logo && <img src={company.logo} alt="logo" style={{ height: 64, objectFit: 'contain' }} />}
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: t.primary }}>{company.businessName}</div>
                {company.tagline && <div style={{ fontSize: 13, color: t.accent, marginTop: 4 }}>{company.tagline}</div>}
                {company.ownerName && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{company.ownerName}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '20px 56px 0', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151' }}>
        <div>Ref: ___________________</div>
        <div>Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      </div>

      <div
        style={{
          padding: '28px 56px 40px',
          fontSize: 14,
          lineHeight: 1.75,
          whiteSpace: 'pre-wrap',
          minHeight: 520,
          color: '#1f2937',
        }}
      >
        {letterBody}
      </div>

      <div style={{ padding: '0 56px 24px', fontSize: 13, color: '#1f2937' }}>
        <div style={{ marginTop: 32, fontWeight: 600 }}>For {company.businessName}</div>
        <div style={{ marginTop: 48, borderTop: '1px solid #d1d5db', width: 220, paddingTop: 6, fontSize: 12 }}>
          {company.ownerName || 'Authorised Signatory'}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: t.headerStyle === 'minimal' ? '#f9fafb' : t.primary,
          color: t.headerStyle === 'minimal' ? '#374151' : '#ffffff',
          padding: '14px 56px',
          fontSize: 11,
          borderTop: t.headerStyle === 'minimal' ? `3px solid ${t.accent}` : 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          {company.address && (
            <div style={{ maxWidth: '55%' }}>
              <span style={{ fontWeight: 700 }}>{'\u25CF '}</span>{company.address}
            </div>
          )}
          <div style={{ textAlign: 'right', lineHeight: 1.7 }}>
            {company.phone && <div>Tel: {company.phone}</div>}
            {company.email && <div>{company.email}</div>}
            {company.website && <div>{company.website}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, icon }) {
  return (
    <div>
      <Label className="text-xs flex items-center gap-1">{icon}{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 text-sm h-8" />
    </div>
  )
}

function App() {
  const [company, setCompany] = useState(defaultCompany)
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id)
  const [letterBody, setLetterBody] = useState(defaultLetter)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const previewRef = useRef(null)

  const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0]
  const updateCompany = (k, v) => setCompany((c) => ({ ...c, [k]: v }))

  const onLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateCompany('logo', reader.result)
    reader.readAsDataURL(file)
  }

  const generateAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Describe the letter you want to generate')
      return
    }
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, company, tone: 'professional' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI failed')
      setLetterBody(data.body)
      toast.success('Letter generated!')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setAiLoading(false)
    }
  }

  const downloadPDF = async () => {
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const node = previewRef.current
      if (!node) return
      const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight)
      pdf.save(`${company.businessName.replace(/\s+/g, '_')}_letterhead.pdf`)
      toast.success('PDF downloaded')
    } catch (e) {
      toast.error('Export failed: ' + e.message)
    } finally {
      setExporting(false)
    }
  }

  const downloadPNG = async () => {
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const node = previewRef.current
      const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.download = `${company.businessName.replace(/\s+/g, '_')}_letterhead.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('PNG downloaded')
    } catch (e) {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100">
      <header className="sticky top-0 z-30 backdrop-blur-lg bg-white/70 border-b border-slate-200/60">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight text-slate-900">LetterHead Pro</div>
              <div className="text-xs text-slate-500 leading-tight">Create professional letterheads in minutes</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={downloadPNG} disabled={exporting} className="gap-2">
              <FileImage className="w-4 h-4" /> PNG
            </Button>
            <Button onClick={downloadPDF} disabled={exporting} className="gap-2 bg-blue-600 hover:bg-blue-700">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              Download PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 py-6 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3">
          <Card className="p-0 overflow-hidden border-slate-200/70 shadow-sm">
            <Tabs defaultValue="company" className="w-full">
              <TabsList className="w-full rounded-none border-b bg-slate-50/50 h-11">
                <TabsTrigger value="company" className="flex-1 gap-1.5"><Building2 className="w-3.5 h-3.5" />Profile</TabsTrigger>
                <TabsTrigger value="design" className="flex-1 gap-1.5"><Palette className="w-3.5 h-3.5" />Design</TabsTrigger>
                <TabsTrigger value="ai" className="flex-1 gap-1.5"><Sparkles className="w-3.5 h-3.5" />AI</TabsTrigger>
              </TabsList>

              <TabsContent value="company" className="m-0">
                <ScrollArea className="h-[calc(100vh-180px)]">
                  <div className="p-4 space-y-3">
                    <div>
                      <Label className="text-xs">Logo</Label>
                      <div className="mt-1 flex items-center gap-3">
                        {company.logo ? (
                          <img src={company.logo} alt="logo" className="w-14 h-14 object-contain border rounded-lg bg-white" />
                        ) : (
                          <div className="w-14 h-14 border-2 border-dashed rounded-lg flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <label className="cursor-pointer text-xs px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 transition">
                          Upload
                          <input type="file" accept="image/*" onChange={onLogoUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                    <Separator />
                    <Field label="Business Name" value={company.businessName} onChange={(v) => updateCompany('businessName', v)} />
                    <Field label="Tagline" value={company.tagline} onChange={(v) => updateCompany('tagline', v)} />
                    <Field label="Owner / Authorised Signatory" value={company.ownerName} onChange={(v) => updateCompany('ownerName', v)} />
                    <Separator />
                    <Field icon={<Hash className="w-3 h-3" />} label="GSTIN" value={company.gst} onChange={(v) => updateCompany('gst', v)} />
                    <Field icon={<Hash className="w-3 h-3" />} label="PAN" value={company.pan} onChange={(v) => updateCompany('pan', v)} />
                    <Field icon={<Hash className="w-3 h-3" />} label="CIN" value={company.cin} onChange={(v) => updateCompany('cin', v)} />
                    <Field icon={<Hash className="w-3 h-3" />} label="Registration No." value={company.regNo} onChange={(v) => updateCompany('regNo', v)} />
                    <Separator />
                    <Field icon={<Phone className="w-3 h-3" />} label="Phone" value={company.phone} onChange={(v) => updateCompany('phone', v)} />
                    <Field icon={<Mail className="w-3 h-3" />} label="Email" value={company.email} onChange={(v) => updateCompany('email', v)} />
                    <Field icon={<Globe className="w-3 h-3" />} label="Website" value={company.website} onChange={(v) => updateCompany('website', v)} />
                    <div>
                      <Label className="text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />Address</Label>
                      <Textarea
                        value={company.address}
                        onChange={(e) => updateCompany('address', e.target.value)}
                        className="mt-1 text-xs"
                        rows={3}
                      />
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="design" className="m-0">
                <ScrollArea className="h-[calc(100vh-180px)]">
                  <div className="p-4 space-y-3">
                    <div className="text-xs text-slate-500 mb-2">Pick a template style</div>
                    <div className="grid grid-cols-1 gap-2">
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTemplateId(t.id)}
                          className={`text-left p-3 rounded-lg border-2 transition ${templateId === t.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-10 rounded" style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.accent})` }} />
                            <div>
                              <div className="font-semibold text-sm">{t.name}</div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wide">{t.category}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="ai" className="m-0">
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">AI Letter Writer</div>
                      <div className="text-xs text-slate-500">Powered by Claude Sonnet 4.5</div>
                    </div>
                  </div>
                  <Textarea
                    placeholder={'e.g. Write a formal letter to a client confirming the engagement for FY 2025-26 GST filings and outline next steps.'}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={6}
                    className="text-sm"
                  />
                  <Button onClick={generateAI} disabled={aiLoading} className="w-full gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700">
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {aiLoading ? 'Generating...' : 'Generate Letter Body'}
                  </Button>
                  <div className="text-[11px] text-slate-500">Tip: Mention recipient, purpose & tone. The AI uses your company profile as context.</div>
                  <Separator />
                  <div className="space-y-1">
                    <div className="text-xs font-semibold mb-1">Quick prompts</div>
                    {[
                      'Client engagement confirmation letter for GST advisory services',
                      'NOC letter for a vendor partnership',
                      'Appointment letter for a new employee joining as Senior Consultant',
                      'Formal request for proposal extension',
                    ].map((q) => (
                      <button key={q} onClick={() => setAiPrompt(q)} className="block w-full text-left text-xs p-2 rounded hover:bg-slate-100 text-slate-600">
                        {'\u2192 '}{q}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <Card className="p-6 bg-slate-100/60 border-slate-200/70 overflow-auto">
            <div className="text-xs text-slate-500 mb-3 flex items-center justify-between">
              <span>Live preview — A4 size</span>
              <span className="font-mono">{template.name}</span>
            </div>
            <div className="flex justify-center" style={{ transform: 'scale(0.78)', transformOrigin: 'top center', marginBottom: '-220px' }}>
              <LetterheadPreview company={company} template={template} letterBody={letterBody} refEl={previewRef} />
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-3">
          <Card className="p-4 border-slate-200/70 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Letter Body</Label>
              <div className="text-xs text-slate-500">{letterBody.length} chars</div>
            </div>
            <Textarea
              value={letterBody}
              onChange={(e) => setLetterBody(e.target.value)}
              rows={28}
              className="text-sm font-mono leading-relaxed"
              placeholder="Type your letter content here, or use AI to generate it..."
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => setLetterBody(defaultLetter)}>Reset</Button>
              <Button variant="outline" size="sm" onClick={() => setLetterBody('')}>Clear</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default App
