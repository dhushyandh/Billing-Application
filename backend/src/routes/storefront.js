import express from 'express';
import Storefront from '../models/Storefront.js';
import Product from '../models/Product.js';

const router = express.Router();

export function getDefaultStorefrontConfig() {
  return {
    branding: {
      businessName: 'IJAZ TRADERS',
      tagline: 'Quality Fencing, GI Wire & Hardware Solutions',
      logoUrl: '',
      phone: '9843988337',
      whatsapp: '9843988337',
      email: 'ijaztradersbvm@gmail.com',
      address: 'NO. 49/4A/7A, N H MAIN ROAD, THIMMASAMUTHIRAM, KANCHEEPURAM, TN - 631502',
    },
    theme: {
      primaryColor: '#0f172a',
      accentColor: '#2563eb',
      headerStyle: 'light',
      layoutStyle: 'grid',
      borderRadius: 'rounded',
    },
    announcement: {
      enabled: true,
      text: 'Bulk & Contractor Orders Available — GST Tax Invoice Provided on All Purchases!',
      promoCode: 'BULK10',
      bgColor: '#1e293b',
    },
    navigation: [
      { label: 'Featured', href: '#featured', visible: true },
      { label: 'Catalog', href: '#catalog', visible: true },
      { label: 'About Us', href: '#about', visible: true },
      { label: 'Contact', href: '#contact', visible: true },
    ],
    hero: {
      enabled: true,
      badge: 'Authorized Tata Wiron & VNC Dealer',
      title: 'Heavy-Duty Knotted Fencing, GI Wire & Posts for Every Terrain',
      subtitle:
        'Direct wholesale & retail supply from Kancheepuram with transparent GST billing and fast road dispatch across Tamil Nadu & South India.',
      ctaText: 'Browse Catalog',
      ctaLink: '#catalog',
      imageUrl: '',
    },
    promos: [
      {
        id: 'promo-1',
        title: 'Farm & Estate Fencing Bundles',
        subtitle: 'Special contractor pricing on 10+ rolls of Tata Wiron Knotted Fence.',
        badge: 'WHOLESALE',
        bgColor: '#eff6ff',
        active: true,
      },
      {
        id: 'promo-2',
        title: '100% GST Input Tax Credit',
        subtitle: 'Instant B2B Tax Invoice with verified HSN/SAC breakdown on every order.',
        badge: 'B2B READY',
        bgColor: '#ecfdf5',
        active: true,
      },
    ],
    sections: [
      {
        id: 'sec-featured',
        type: 'featured',
        title: 'Featured Products',
        subtitle: 'Top-selling fencing materials & GI wires ready for immediate dispatch.',
        enabled: true,
      },
      {
        id: 'sec-catalog',
        type: 'catalog',
        title: 'Product Catalog',
        subtitle: 'Live stock & GST-compliant pricing synchronized with our billing system.',
        enabled: true,
      },
      {
        id: 'sec-about',
        type: 'about',
        title: 'Why Choose IJAZ TRADERS?',
        subtitle: 'Trusted fencing & hardware supplier in Kancheepuram.',
        enabled: true,
      },
      {
        id: 'sec-contact',
        type: 'contact',
        title: 'Get a Quote or Visit Us',
        subtitle: 'Reach out for bulk pricing, transport quotes, or custom lengths.',
        enabled: true,
      },
    ],
    about: {
      title: 'Why Choose IJAZ TRADERS?',
      description:
        'Based in Kancheepuram, IJAZ TRADERS supplies genuine Tata Wiron knotted fences, VNC fencing posts, and GI wires with full GST compliance and reliable logistics.',
      highlights: [
        { title: '100% Genuine Material', text: 'Direct sourcing from Tata Wiron & VNC.' },
        { title: 'GST Compliant Billing', text: 'Proper HSN/SAC & B2B Tax Invoices.' },
        { title: 'Fast Road Dispatch', text: 'Timely delivery across Tamil Nadu & neighboring states.' },
      ],
    },
  };
}

async function ensureStorefront() {
  let doc = await Storefront.findOne();
  if (!doc) {
    const def = getDefaultStorefrontConfig();
    doc = await Storefront.create({
      draft: def,
      published: def,
      lastPublishedAt: new Date(),
      hasUnpublishedChanges: false,
    });
  }
  return doc;
}

router.get('/admin', async (_req, res) => {
  try {
    const doc = await ensureStorefront();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/draft', async (req, res) => {
  try {
    const doc = await ensureStorefront();
    doc.draft = req.body;
    doc.hasUnpublishedChanges = true;
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/publish', async (req, res) => {
  try {
    const doc = await ensureStorefront();
    if (req.body && Object.keys(req.body).length > 0) {
      doc.draft = req.body;
    }
    doc.published = doc.draft;
    doc.lastPublishedAt = new Date();
    doc.hasUnpublishedChanges = false;
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/revert', async (_req, res) => {
  try {
    const doc = await ensureStorefront();
    doc.draft = doc.published;
    doc.hasUnpublishedChanges = false;
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/public', async (req, res) => {
  try {
    const doc = await ensureStorefront();
    const isDraftPreview = req.query.preview === 'draft';
    const config = isDraftPreview ? doc.draft : doc.published;
    const products = await Product.find({ isVisibleOnStorefront: { $ne: false } }).sort({
      isFeatured: -1,
      createdAt: -1,
    });
    res.json({
      config,
      products,
      isDraftPreview,
      lastPublishedAt: doc.lastPublishedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

