'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText, Sparkles, FileDown, Save, PenLine, Shield, Check, ArrowRight,
  Star, Zap, Crown, Loader2,
} from 'lucide-react'

const ICON_MAP = {
  FileText, Sparkles, FileDown, Save, PenLine, Shield,
}

const BUTTON_COLORS = {
  blue:    'bg-blue-600 hover:bg-blue-700 text-white',
  indigo:  'bg-indigo-600 hover:bg-indigo-700 text-white',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  amber:   'bg-amber-500 hover:bg-amber-600 text-white',
  rose:    'bg-rose-600 hover:bg-rose-700 text-white',
  slate:   'bg-slate-900 hover:bg-slate-800 text-white',
}

const HIGHLIGHT_STYLES = {
  'Most Popular': { ring: 'ring-2 ring-indigo-500', badge: 'bg-indigo-600', icon: Star },
  'Best Value':   { ring: 'ring-2 ring-emerald-500', badge: 'bg-emerald-600', icon: Crown },
  'Recommended':  { ring: 'ring-2 ring-blue-500', badge: 'bg-blue-600', icon: Zap },
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.55, ease: 'easeOut' } }),
}

function PricingCard({ plan, currency, index }) {
  const router = useRouter()
  const highlight = HIGHLIGHT_STYLES[plan.highlight]
  const Icon = highlight?.icon
  const colorClass = BUTTON_COLORS[plan.buttonColor] || BUTTON_COLORS.blue

  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={fadeUp}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className={`relative bg-white rounded-2xl shadow-lg ${highlight?.ring || 'ring-1 ring-slate-200'} p-7 flex flex-col ${plan.highlight ? 'lg:scale-105' : ''}`}
    >
      {plan.highlight && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${highlight.badge} text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-md`}>
          {Icon && <Icon className="w-3 h-3" />} {plan.highlight}
        </div>
      )}
      <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-4xl font-extrabold text-slate-900">{currency}{plan.price}</span>
        <span className="text-sm text-slate-500">/ {plan.billingPeriod?.toLowerCase() || 'month'}</span>
      </div>
      <ul className="mt-6 space-y-3 flex-1">
        {(plan.features || []).map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button
        onClick={() => router.push(plan.buttonLink || '/builder')}
        disabled={!plan.enabled}
        className={`mt-7 w-full h-11 gap-2 ${colorClass} font-semibold`}
      >
        {plan.buttonText || 'Subscribe Now'} <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/site-content')
      .then((r) => r.json())
      .then((d) => setContent(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }
  if (!content) return null

  const visiblePlans = (content.pricingPlans || [])
    .filter((p) => p.visible !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white text-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 backdrop-blur-lg bg-white/80 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div className="font-bold text-base">LetterHead Pro</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push(content.hero?.ctaSecondary?.link || '/builder')}>Login</Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push(content.hero?.ctaPrimary?.link || '/builder')}>
              Start Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Decorative blurs */}
        <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-5 py-16 md:py-24 grid lg:grid-cols-2 gap-10 items-center relative">
          <div>
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 mb-5 px-3 py-1">✨ Trusted by 1,000+ businesses</Badge>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent"
            >
              {content.hero?.title || 'LETTERHEAD PRO'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mt-5 text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed"
            >
              {content.hero?.subtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              {content.hero?.ctaPrimary?.enabled !== false && (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg shadow-blue-500/40 h-12 px-6 gap-2"
                  onClick={() => router.push(content.hero?.ctaPrimary?.link || '/builder')}
                >
                  {content.hero?.ctaPrimary?.text || 'Start Free Trial'} <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              {content.hero?.ctaSecondary?.enabled !== false && (
                <Button size="lg" variant="outline" className="h-12 px-6 border-slate-300" onClick={() => router.push(content.hero?.ctaSecondary?.link || '/builder')}>
                  {content.hero?.ctaSecondary?.text || 'Login'}
                </Button>
              )}
            </motion.div>
            <div className="mt-7 flex items-center gap-5 text-xs text-slate-500">
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> No credit card</div>
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> Cancel anytime</div>
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> India-focused (GST/PAN/CIN)</div>
            </div>
          </div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            {content.hero?.image ? (
              <img src={content.hero.image} alt="Hero" className="rounded-xl shadow-2xl w-full" />
            ) : (
              <div className="relative aspect-[3/4] rounded-2xl shadow-2xl shadow-blue-900/20 overflow-hidden bg-white border border-slate-200">
                <div className="h-1/4 bg-gradient-to-br from-blue-700 to-indigo-800 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur" />
                    <div>
                      <div className="text-xl font-bold">Acme Consulting LLP</div>
                      <div className="text-xs opacity-80 italic">Strategy. Growth. Excellence.</div>
                    </div>
                  </div>
                </div>
                <div className="p-7 space-y-3">
                  <div className="flex justify-between text-[10px] text-slate-500"><span>Ref: ACL/25-26/0042</span><span>15 August 2025</span></div>
                  <div className="space-y-2 pt-3">
                    <div className="h-2 bg-slate-200 rounded w-3/4" />
                    <div className="h-2 bg-slate-200 rounded w-full" />
                    <div className="h-2 bg-slate-200 rounded w-5/6" />
                    <div className="h-2 bg-slate-200 rounded w-full" />
                    <div className="h-2 bg-slate-200 rounded w-2/3" />
                  </div>
                  <div className="pt-6">
                    <div className="h-2 bg-slate-300 rounded w-1/3" />
                    <div className="h-px bg-slate-300 mt-12 w-2/5" />
                    <div className="h-2 bg-slate-200 rounded w-1/4 mt-1" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-br from-blue-700 to-indigo-800" />
              </div>
            )}
            {/* Float chip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -left-4 top-1/4 bg-white shadow-xl rounded-xl p-3 flex items-center gap-2 border"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-bold">AI Writer</div>
                <div className="text-[10px] text-slate-500">Powered by GPT-4o</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="absolute -right-4 bottom-1/4 bg-white shadow-xl rounded-xl p-3 flex items-center gap-2 border"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <FileDown className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-bold">PDF / PNG</div>
                <div className="text-[10px] text-slate-500">Multi-page export</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 bg-slate-50/80 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-5">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Features</div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900">Everything you need to look professional</h2>
            <p className="text-slate-600 mt-4">Stop fiddling with Word and Canva. Generate brand-perfect documents in seconds.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(content.features || []).map((feat, i) => {
              const Icon = ICON_MAP[feat.icon] || FileText
              return (
                <motion.div
                  key={feat.id}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-50px' }}
                  variants={fadeUp}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow shadow-blue-500/30">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5">{feat.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feat.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-5">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Pricing</div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900">Plans for every business</h2>
            <p className="text-slate-600 mt-4">Start free — upgrade when you're ready. Cancel anytime.</p>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch">
            {visiblePlans.map((p, i) => <PricingCard key={p.id} plan={p} currency={content.currency || '\u20B9'} index={i} />)}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="py-12 md:py-20 bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="max-w-5xl mx-auto px-5 text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-3xl md:text-4xl font-extrabold mb-3">
            Ready to ditch boring Word templates?
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="text-blue-100 mb-6">
            Create your first professional letterhead in under 2 minutes.
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}>
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 h-12 px-8 gap-2 font-semibold" onClick={() => router.push('/builder')}>
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-10">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-bold text-white">LetterHead Pro</div>
                <div className="text-xs text-slate-400">{content.footer?.tagline}</div>
              </div>
            </div>
            <div className="text-xs text-slate-400 text-center md:text-right">
              <div>{content.footer?.copyright}</div>
              {content.footer?.email && <div>Contact: <a href={`mailto:${content.footer.email}`} className="hover:text-white">{content.footer.email}</a></div>}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
