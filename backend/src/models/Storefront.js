import mongoose from 'mongoose';

const storefrontConfigSchema = new mongoose.Schema(
  {
    branding: {
      businessName: { type: String, default: 'IJAZ TRADERS' },
      tagline: { type: String, default: 'Quality Fencing, GI Wire & Hardware Solutions' },
      logoUrl: { type: String, default: '' },
      phone: { type: String, default: '9843988337' },
      whatsapp: { type: String, default: '9843988337' },
      email: { type: String, default: 'ijaztradersbvm@gmail.com' },
      address: {
        type: String,
        default:
          'NO. 49/4A/7A, N H MAIN ROAD, THIMMASAMUTHIRAM, KANCHEEPURAM, TN - 631502',
      },
    },
    theme: {
      primaryColor: { type: String, default: '#0f172a' },
      accentColor: { type: String, default: '#2563eb' },
      headerStyle: { type: String, enum: ['light', 'dark'], default: 'light' },
      layoutStyle: { type: String, enum: ['grid', 'compact'], default: 'grid' },
      borderRadius: { type: String, enum: ['rounded', 'sharp'], default: 'rounded' },
    },
    announcement: {
      enabled: { type: Boolean, default: true },
      text: {
        type: String,
        default: 'Bulk & Contractor Orders Available — GST Tax Invoice Provided on All Purchases!',
      },
      promoCode: { type: String, default: 'BULK10' },
      bgColor: { type: String, default: '#1e293b' },
    },
    navigation: [
      {
        label: { type: String, required: true },
        href: { type: String, required: true },
        visible: { type: Boolean, default: true },
      },
    ],
    hero: {
      enabled: { type: Boolean, default: true },
      badge: { type: String, default: 'Authorized Tata Wiron & VNC Dealer' },
      title: {
        type: String,
        default: 'Heavy-Duty Knotted Fencing, GI Wire & Posts for Every Terrain',
      },
      subtitle: {
        type: String,
        default:
          'Direct wholesale & retail supply from Kancheepuram with transparent GST billing and fast road dispatch across Tamil Nadu & South India.',
      },
      ctaText: { type: String, default: 'Browse Catalog' },
      ctaLink: { type: String, default: '#catalog' },
      imageUrl: { type: String, default: '' },
    },
    promos: [
      {
        id: String,
        title: String,
        subtitle: String,
        badge: String,
        bgColor: String,
        active: { type: Boolean, default: true },
      },
    ],
    sections: [
      {
        id: String,
        type: { type: String },
        title: String,
        subtitle: String,
        enabled: { type: Boolean, default: true },
      },
    ],
    about: {
      title: { type: String, default: 'Why Choose IJAZ TRADERS?' },
      description: {
        type: String,
        default:
          'Based in Kancheepuram, IJAZ TRADERS supplies genuine Tata Wiron knotted fences, VNC fencing posts, and GI wires with full GST compliance and reliable logistics.',
      },
      highlights: [
        {
          title: { type: String, default: '' },
          text: { type: String, default: '' },
        },
      ],
    },
  },
  { _id: false }
);

const storefrontSchema = new mongoose.Schema(
  {
    draft: { type: storefrontConfigSchema, default: () => ({}) },
    published: { type: storefrontConfigSchema, default: () => ({}) },
    lastPublishedAt: { type: Date, default: Date.now },
    hasUnpublishedChanges: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Storefront', storefrontSchema);
