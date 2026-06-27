'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import {
  Loader2, Save, Plus, Trash2, Image as ImageIcon, Eye, ChevronUp, ChevronDown,
  X, ExternalLink,
} from 'lucide-react'

const HIGHLIGHT_OPTS = ['', 'Most Popular', 'Best Value', 'Recommended']
const BILLING_OPTS = ['Monthly', 'Quarterly', 'Yearly', 'Lifetime']
const COLOR_OPTS = ['blue', 'indigo', 'emerald', 'amber', 'rose', 'slate']
const CURRENCY_OPTS = ['\u20B9', '$', '\u20AC', '\u00A3']
const ICON_OPTS = ['FileText', 'Sparkles', 'FileDown', 'Save', 'PenLine', 'Shield']

export function SiteContentEditor() {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('pricing')

  useEffect(() => {
    fetch('/api/site-content', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setContent(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !content) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
  }

  const update = (path, value) => {
    const next = JSON.parse(JSON.stringify(content))
    const keys = path.split('.')
    let cur = next
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]]
    cur[keys[keys.length - 1]] = value
    setContent(next)
  }

  const updateList = (listKey, idx, key, value) => {
    const list = [...content[listKey]]
    list[idx] = { ...list[idx], [key]: value }
    setContent({ ...content, [listKey]: list })
  }

  const removeFromList = (listKey, idx) => {
    const list = content[listKey].filter((_, i) => i !== idx)
    setContent({ ...content, [listKey]: list })
  }

  const movePlan = (idx, dir) => {
    const list = [...content.pricingPlans]
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= list.length) return
    ;[list[idx], list[newIdx]] = [list[newIdx], list[idx]]
    // Re-number displayOrder
    list.forEach((p, i) => { p.displayOrder = i + 1 })
    setContent({ ...content, pricingPlans: list })
  }

  const addPlan = () => {
    const next = [...content.pricingPlans, {
      id: uuidv4(),
      enabled: true, visible: true, displayOrder: content.pricingPlans.length + 1,
      name: 'New Plan', price: 999, billingPeriod: 'Monthly',
      features: ['Feature 1', 'Feature 2'], highlight: '',
      buttonText: 'Subscribe Now', buttonLink: '/builder', buttonColor: 'blue',
      razorpayPlanId: '',
    }]
    setContent({ ...content, pricingPlans: next })
  }

  const addFeature = () => {
    const next = [...(content.features || []), { id: uuidv4(), icon: 'FileText', title: 'New Feature', description: '...' }]
    setContent({ ...content, features: next })
  }

  const uploadHeroImage = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const r = new FileReader()
    r.onload = () => update('hero.image', r.result)
    r.readAsDataURL(file)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/site-content', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(content),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success('Site content saved')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-sm text-slate-500">Last updated: {content.updatedAt ? new Date(content.updatedAt).toLocaleString() : 'Never'}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open('/', '_blank')} className="gap-2">
            <Eye className="w-4 h-4" /> Preview <ExternalLink className="w-3 h-3" />
          </Button>
          <Button onClick={save} disabled={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pricing">Pricing Plans</TabsTrigger>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="footer">Footer & General</TabsTrigger>
        </TabsList>

        {/* PRICING */}
        <TabsContent value="pricing" className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-500">{content.pricingPlans.length} plan(s) configured</div>
            <Button onClick={addPlan} size="sm" variant="outline" className="gap-1"><Plus className="w-4 h-4" /> Add Plan</Button>
          </div>
          {content.pricingPlans.map((plan, idx) => (
            <Card key={plan.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => movePlan(idx, -1)} disabled={idx === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => movePlan(idx, 1)} disabled={idx === content.pricingPlans.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                  </div>
                  <div>
                    <div className="font-semibold">{plan.name} <Badge variant="outline" className="ml-2 text-xs">Order {plan.displayOrder || idx + 1}</Badge></div>
                    <div className="text-xs text-slate-500">{content.currency || '\u20B9'}{plan.price} / {plan.billingPeriod}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <Switch checked={plan.visible !== false} onCheckedChange={(v) => updateList('pricingPlans', idx, 'visible', v)} />
                    Show
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <Switch checked={plan.enabled !== false} onCheckedChange={(v) => updateList('pricingPlans', idx, 'enabled', v)} />
                    Enable button
                  </label>
                  <button onClick={() => removeFromList('pricingPlans', idx)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Plan Name</Label>
                  <Input value={plan.name} onChange={(e) => updateList('pricingPlans', idx, 'name', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Price</Label>
                  <Input type="number" value={plan.price} onChange={(e) => updateList('pricingPlans', idx, 'price', Number(e.target.value))} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Billing Period</Label>
                  <select value={plan.billingPeriod} onChange={(e) => updateList('pricingPlans', idx, 'billingPeriod', e.target.value)} className="mt-1 h-8 text-sm w-full rounded border px-2">
                    {BILLING_OPTS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Highlight Badge</Label>
                  <select value={plan.highlight} onChange={(e) => updateList('pricingPlans', idx, 'highlight', e.target.value)} className="mt-1 h-8 text-sm w-full rounded border px-2">
                    {HIGHLIGHT_OPTS.map((o) => <option key={o} value={o}>{o || 'None'}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Button Text</Label>
                  <Input value={plan.buttonText} onChange={(e) => updateList('pricingPlans', idx, 'buttonText', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Button Link</Label>
                  <Input value={plan.buttonLink} onChange={(e) => updateList('pricingPlans', idx, 'buttonLink', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Button Color</Label>
                  <div className="mt-1 flex gap-1.5 flex-wrap">
                    {COLOR_OPTS.map((c) => (
                      <button key={c} onClick={() => updateList('pricingPlans', idx, 'buttonColor', c)} className={`w-7 h-7 rounded-md border-2 ${plan.buttonColor === c ? 'border-slate-900' : 'border-transparent'} ${ {blue:'bg-blue-600',indigo:'bg-indigo-600',emerald:'bg-emerald-600',amber:'bg-amber-500',rose:'bg-rose-600',slate:'bg-slate-900'}[c] }`} />
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Razorpay Plan ID</Label>
                  <Input value={plan.razorpayPlanId || ''} onChange={(e) => updateList('pricingPlans', idx, 'razorpayPlanId', e.target.value)} placeholder="plan_xxx" className="mt-1 h-8 text-sm font-mono" />
                </div>
                <div className="md:col-span-3">
                  <Label className="text-xs">Features (one per line)</Label>
                  <Textarea value={(plan.features || []).join('\n')} onChange={(e) => updateList('pricingPlans', idx, 'features', e.target.value.split('\n').filter(Boolean))} className="mt-1 text-sm font-mono" rows={Math.max(4, (plan.features || []).length + 1)} />
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* HERO */}
        <TabsContent value="hero" className="space-y-4 mt-4">
          <Card className="p-4 space-y-3">
            <div>
              <Label className="text-xs">Hero Title</Label>
              <Input value={content.hero?.title || ''} onChange={(e) => update('hero.title', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Hero Subtitle</Label>
              <Textarea value={content.hero?.subtitle || ''} onChange={(e) => update('hero.subtitle', e.target.value)} rows={3} className="mt-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="font-semibold text-sm">Primary CTA</div>
                <Input value={content.hero?.ctaPrimary?.text || ''} onChange={(e) => update('hero.ctaPrimary.text', e.target.value)} placeholder="Button text" className="h-8 text-sm" />
                <Input value={content.hero?.ctaPrimary?.link || ''} onChange={(e) => update('hero.ctaPrimary.link', e.target.value)} placeholder="/builder" className="h-8 text-sm" />
                <label className="flex items-center gap-2 text-xs"><Switch checked={content.hero?.ctaPrimary?.enabled !== false} onCheckedChange={(v) => update('hero.ctaPrimary.enabled', v)} /> Show button</label>
              </div>
              <div className="space-y-2">
                <div className="font-semibold text-sm">Secondary CTA</div>
                <Input value={content.hero?.ctaSecondary?.text || ''} onChange={(e) => update('hero.ctaSecondary.text', e.target.value)} placeholder="Button text" className="h-8 text-sm" />
                <Input value={content.hero?.ctaSecondary?.link || ''} onChange={(e) => update('hero.ctaSecondary.link', e.target.value)} placeholder="/builder?login=1" className="h-8 text-sm" />
                <label className="flex items-center gap-2 text-xs"><Switch checked={content.hero?.ctaSecondary?.enabled !== false} onCheckedChange={(v) => update('hero.ctaSecondary.enabled', v)} /> Show button</label>
              </div>
            </div>
            <Separator />
            <div>
              <Label className="text-xs">Hero Image (optional \u2014 replaces the mock letterhead)</Label>
              <div className="mt-1 flex items-center gap-3">
                {content.hero?.image ? (
                  <img src={content.hero.image} alt="hero" className="w-24 h-32 object-cover border rounded-lg" />
                ) : (
                  <div className="w-24 h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-slate-400"><ImageIcon className="w-6 h-6" /></div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer text-xs px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 inline-block">
                    Upload <input type="file" accept="image/*" onChange={uploadHeroImage} className="hidden" />
                  </label>
                  {content.hero?.image && <button onClick={() => update('hero.image', '')} className="text-xs text-red-500 hover:underline text-left">Remove image</button>}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* FEATURES */}
        <TabsContent value="features" className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-500">{(content.features || []).length} feature(s)</div>
            <Button onClick={addFeature} size="sm" variant="outline" className="gap-1"><Plus className="w-4 h-4" /> Add Feature</Button>
          </div>
          {(content.features || []).map((feat, idx) => (
            <Card key={feat.id || idx} className="p-3 grid grid-cols-12 gap-3 items-start">
              <div className="col-span-12 md:col-span-2">
                <Label className="text-xs">Icon</Label>
                <select value={feat.icon} onChange={(e) => updateList('features', idx, 'icon', e.target.value)} className="mt-1 h-8 text-sm w-full rounded border px-2">
                  {ICON_OPTS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="col-span-12 md:col-span-3">
                <Label className="text-xs">Title</Label>
                <Input value={feat.title} onChange={(e) => updateList('features', idx, 'title', e.target.value)} className="mt-1 h-8 text-sm" />
              </div>
              <div className="col-span-11 md:col-span-6">
                <Label className="text-xs">Description</Label>
                <Input value={feat.description} onChange={(e) => updateList('features', idx, 'description', e.target.value)} className="mt-1 h-8 text-sm" />
              </div>
              <div className="col-span-1 flex justify-end pt-5">
                <button onClick={() => removeFromList('features', idx)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* FOOTER */}
        <TabsContent value="footer" className="space-y-4 mt-4">
          <Card className="p-4 space-y-3">
            <div>
              <Label className="text-xs">Currency</Label>
              <div className="mt-1 flex gap-2">
                {CURRENCY_OPTS.map((c) => (
                  <button key={c} onClick={() => update('currency', c)} className={`w-12 h-9 rounded-md border-2 font-semibold ${content.currency === c ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'}`}>{c}</button>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <Label className="text-xs">Footer Tagline</Label>
              <Input value={content.footer?.tagline || ''} onChange={(e) => update('footer.tagline', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Copyright Text</Label>
              <Input value={content.footer?.copyright || ''} onChange={(e) => update('footer.copyright', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Contact Email</Label>
              <Input value={content.footer?.email || ''} onChange={(e) => update('footer.email', e.target.value)} className="mt-1" />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
