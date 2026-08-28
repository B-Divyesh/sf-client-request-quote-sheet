import type { RequestSheet } from './types';

export const defaultSheet: RequestSheet = {
  version: 1,
  businessName: 'Northline Studio',
  heading: 'Services request',
  intro: 'Mark what you need and add any useful context. We will review this request and reply with a formal quote.',
  email: 'quotes@example.com',
  currency: 'USD',
  validityNote: 'Shown prices are estimates, not binding quotes. Timing and availability are confirmed after review.',
  items: [
    { id: 'brand-review', name: 'Brand review', description: 'A focused review with an annotated action list.', unit: 'review', price: 450 },
    { id: 'landing-page', name: 'Landing page', description: 'Copy, design and build for one responsive page.', unit: 'page', price: 1200 },
    { id: 'custom-support', name: 'Custom support', description: 'Describe the work below and we will price it.', unit: 'request', price: null },
  ],
  customClosing: '',
  referenceLabel: '',
  hideCredit: false,
};

export const currencies = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD'] as const;
