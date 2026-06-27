// Default site content - seeded into DB on first request, then editable from admin panel.
import { v4 as uuidv4 } from 'uuid'

export const DEFAULT_SITE_CONTENT = {
  id: 'main',
  currency: '\u20B9', // ₹
  hero: {
    title: 'LETTERHEAD PRO',
    subtitle: 'Design beautiful, brand-perfect letterheads in minutes. 14 premium templates, AI letter writer, and instant PDF download.',
    image: '', // optional dataURI / URL
    ctaPrimary: { text: 'Start Free Trial', link: '/builder', enabled: true },
    ctaSecondary: { text: 'Login', link: '/builder?login=1', enabled: true },
  },
  features: [
    { id: uuidv4(), icon: 'FileText',    title: '14+ Premium Templates',  description: 'Industry-specific designs for CAs, lawyers, doctors, NGOs and more' },
    { id: uuidv4(), icon: 'Sparkles',    title: 'AI Letter Writer',       description: 'Generate professional letter bodies in seconds with GPT-4o' },
    { id: uuidv4(), icon: 'FileDown',    title: 'Instant PDF / PNG',      description: 'High-resolution multi-page exports ready for print' },
    { id: uuidv4(), icon: 'Save',        title: 'Cloud Library',          description: 'Save unlimited letterheads, edit and reuse anytime' },
    { id: uuidv4(), icon: 'PenLine',     title: 'Digital Signature',      description: 'Upload your signature and seal once, reuse on all documents' },
    { id: uuidv4(), icon: 'Shield',      title: 'Secure & Private',       description: 'Bank-grade encryption. Your branding stays yours.' },
  ],
  pricingPlans: [
    {
      id: 'plan_starter',
      enabled: true, visible: true, displayOrder: 1,
      name: 'Starter Plan',
      price: 299,
      billingPeriod: 'Monthly',
      features: ['Unlimited Letterheads', 'GST Invoices', 'Quotations', 'PDF Download', 'Company Logo'],
      highlight: '',
      buttonText: 'Subscribe Now',
      buttonLink: '/builder',
      buttonColor: 'blue',
      razorpayPlanId: '',
    },
    {
      id: 'plan_professional',
      enabled: true, visible: true, displayOrder: 2,
      name: 'Professional Plan',
      price: 499,
      billingPeriod: 'Monthly',
      features: ['Everything in Starter', 'Premium Templates', 'Digital Signature', 'QR Code', 'Cloud Storage', 'Priority Support'],
      highlight: 'Most Popular',
      buttonText: 'Subscribe Now',
      buttonLink: '/builder',
      buttonColor: 'indigo',
      razorpayPlanId: '',
    },
    {
      id: 'plan_business',
      enabled: true, visible: true, displayOrder: 3,
      name: 'Business Plan',
      price: 799,
      billingPeriod: 'Monthly',
      features: ['Everything in Professional', 'Unlimited Documents', 'AI Content Assistant', 'Team Access', 'Premium Support'],
      highlight: 'Best Value',
      buttonText: 'Subscribe Now',
      buttonLink: '/builder',
      buttonColor: 'emerald',
      razorpayPlanId: '',
    },
  ],
  footer: {
    tagline: 'Create Professional Letterheads in Minutes',
    copyright: '\u00A9 2025 LetterHead Pro. All rights reserved.',
    email: 'support@saiscom.in',
  },
  updatedAt: new Date(),
}
