import { useMemo, useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Search,
  CheckCircle2,
  Package,
  Sparkles,
  MessageCircle,
  X,
  Menu,
  ShoppingBag,
  FileSearch,
  Download,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api/client.js';
import { INDIAN_STATES, formatINR, round2 } from '../utils/gst.js';
import { downloadInvoicePDF } from '../utils/pdfGenerator.js';

export default function StorefrontRenderer({ config, products = [], isPreview = false }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeProduct, setActiveProduct] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pre-booking cart & modals
  const [cart, setCart] = useState([]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    address: '',
    gstin: '',
    stateCode: '33',
    notes: '',
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [createdBooking, setCreatedBooking] = useState(null);

  // Customer invoice lookup modal
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupResult, setLookupResult] = useState(null);

  const addToCart = (product, e) => {
    if (e) e.stopPropagation();
    if (product.inStock === false) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.product._id === product._id);
      if (existing) {
        return prev.map((c) =>
          c.product._id === product._id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQty = (id, qty) => {
    const val = Number(qty);
    if (!Number.isFinite(val) || val <= 0) {
      setCart((prev) => prev.filter((c) => c.product._id !== id));
      return;
    }
    setCart((prev) => prev.map((c) => (c.product._id === id ? { ...c, quantity: val } : c)));
  };

  const cartTotal = useMemo(
    () =>
      round2(
        cart.reduce(
          (sum, c) => sum + c.quantity * (c.product.rateInclTax || c.product.rate || 0),
          0
        )
      ),
    [cart]
  );

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (isPreview) return;
    setBookingError('');
    setBookingSubmitting(true);
    try {
      const res = await api.createBooking({
        customer: {
          name: bookingForm.name,
          phone: bookingForm.phone,
          address: bookingForm.address,
          gstin: bookingForm.gstin,
          stateCode: bookingForm.stateCode,
        },
        items: cart.map((c) => ({ productId: c.product._id, quantity: c.quantity })),
        notes: bookingForm.notes,
      });
      setCreatedBooking(res);
      setCart([]);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleLookupSubmit = async (e) => {
    e.preventDefault();
    setLookupError('');
    setLookupResult(null);
    setLookupLoading(true);
    try {
      const res = await api.lookupBooking({ query: lookupQuery });
      setLookupResult(res);
    } catch (err) {
      setLookupError(err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  if (!config) return null;

  const {
    branding = {},
    theme = {},
    announcement = {},
    navigation = [],
    hero = {},
    promos = [],
    sections = [],
    about = {},
  } = config;

  const primaryColor = theme.primaryColor || '#0f172a';
  const accentColor = theme.accentColor || '#2563eb';
  const isDarkHeader = theme.headerStyle === 'dark';
  const radiusClass = theme.borderRadius === 'sharp' ? 'rounded-none' : 'rounded-xl';
  const btnRadiusClass = theme.borderRadius === 'sharp' ? 'rounded-none' : 'rounded-lg';

  const categories = useMemo(() => {
    const set = new Set(['All']);
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const featuredProducts = useMemo(
    () => products.filter((p) => p.isFeatured),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = search.trim().toLowerCase();
      const matchQ =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.hsnSac?.includes(q);
      return matchCat && matchQ;
    });
  }, [products, selectedCategory, search]);

  const ProductCard = ({ p }) => (
    <div
      onClick={() => setActiveProduct(p)}
      className={`group cursor-pointer border border-slate-200 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col ${radiusClass}`}
    >
      <div className="relative h-44 bg-slate-100 overflow-hidden flex items-center justify-center">
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <Package className="h-10 w-10 mb-1 opacity-60" />
            <span className="text-[11px] font-medium uppercase tracking-wider">
              {p.category || 'Hardware'}
            </span>
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {p.isFeatured && (
            <span
              className="px-2 py-0.5 text-[10px] font-bold uppercase text-white rounded-full shadow-xs"
              style={{ backgroundColor: accentColor }}
            >
              Featured
            </span>
          )}
        </div>
        <span
          className={`absolute top-2.5 right-2.5 px-2 py-0.5 text-[10px] font-semibold rounded-full ${
            p.inStock !== false
              ? 'bg-emerald-500 text-white'
              : 'bg-rose-500 text-white'
          }`}
        >
          {p.inStock !== false ? 'In Stock' : 'Out of Stock'}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span>{p.category || 'Fencing & Wire'}</span>
            <span className="font-mono">HSN {p.hsnSac}</span>
          </div>
          <h3 className="font-bold text-slate-900 text-sm line-clamp-2">{p.name}</h3>
          {p.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-end justify-between">
          <div>
            <div className="text-base font-bold text-slate-900">
              ₹ {formatINR(p.rateInclTax || p.rate)}
              <span className="text-xs font-normal text-slate-500"> / {p.unit}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Excl. GST: ₹ {formatINR(p.rate)} (+{p.gstRate}% GST)
            </div>
          </div>
          <span
            onClick={(e) => {
              if (p.inStock === false) return;
              addToCart(p, e);
            }}
            className={`px-3 py-1.5 text-xs font-semibold text-white ${btnRadiusClass} ${
              p.inStock === false ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'
            }`}
            style={{ backgroundColor: primaryColor }}
          >
            {p.inStock === false ? 'Out of Stock' : '+ Book'}
          </span>
        </div>
      </div>
    </div>
  );

  const whatsappNum = String(branding.whatsapp || branding.phone || '').replace(/\D/g, '');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Announcement Bar */}
      {announcement.enabled && (
        <div
          className="px-4 py-2 text-center text-xs font-medium text-white flex flex-wrap items-center justify-center gap-2"
          style={{ backgroundColor: announcement.bgColor || primaryColor }}
        >
          <span>{announcement.text}</span>
          {announcement.promoCode && (
            <span className="rounded bg-white/20 px-2 py-0.5 font-mono text-[11px] font-bold">
              CODE: {announcement.promoCode}
            </span>
          )}
        </div>
      )}

      {/* Storefront Header */}
      <header
        className={`sticky top-0 z-30 border-b ${
          isDarkHeader
            ? 'bg-slate-900 text-white border-slate-800'
            : 'bg-white text-slate-900 border-slate-200'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.businessName}
                className="h-10 w-10 rounded-lg object-contain bg-white p-0.5 border border-slate-200"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                style={{ backgroundColor: accentColor }}
              >
                {(branding.businessName || 'IT').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-bold text-base tracking-tight leading-tight">
                {branding.businessName || 'IJAZ TRADERS'}
              </div>
              <div
                className={`text-[11px] ${
                  isDarkHeader ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {branding.tagline}
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navigation
              .filter((n) => n.visible !== false)
              .map((n, idx) => (
                <a
                  key={idx}
                  href={isPreview ? undefined : n.href}
                  onClick={(e) => isPreview && e.preventDefault()}
                  className="hover:opacity-75 transition-opacity"
                >
                  {n.label}
                </a>
              ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLookupOpen(true);
                setLookupError('');
                setLookupResult(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border cursor-pointer ${btnRadiusClass} ${
                isDarkHeader
                  ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileSearch className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Track / Invoice</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setBookingModalOpen(true);
                setCreatedBooking(null);
                setBookingError('');
              }}
              className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white cursor-pointer ${btnRadiusClass}`}
              style={{ backgroundColor: accentColor }}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Book ({cart.reduce((s, c) => s + c.quantity, 0)})</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-slate-300/40"
              aria-label="Toggle navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/20 px-4 py-3 space-y-2 text-sm">
            {navigation
              .filter((n) => n.visible !== false)
              .map((n, idx) => (
                <a
                  key={idx}
                  href={isPreview ? undefined : n.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1 font-medium"
                >
                  {n.label}
                </a>
              ))}
          </div>
        )}
      </header>

      {/* Hero Section */}
      {hero.enabled !== false && (
        <section
          className="relative overflow-hidden text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {hero.imageUrl && (
            <img
              src={hero.imageUrl}
              alt="Hero Banner"
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
          )}
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
            <div className="max-w-2xl space-y-4">
              {hero.badge && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  <Sparkles className="h-3.5 w-3.5" /> {hero.badge}
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                {hero.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                {hero.subtitle}
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                {hero.ctaText && (
                  <a
                    href={isPreview ? undefined : hero.ctaLink || '#catalog'}
                    className={`inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white shadow-sm ${btnRadiusClass}`}
                    style={{ backgroundColor: accentColor }}
                  >
                    {hero.ctaText}
                  </a>
                )}
                {whatsappNum && (
                  <a
                    href={`https://wa.me/91${whatsappNum}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-xs ${btnRadiusClass}`}
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp Quote
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Promotional Offers */}
      {promos.some((p) => p.active !== false) && (
        <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pt-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {promos
              .filter((p) => p.active !== false)
              .map((promo, i) => (
                <div
                  key={promo.id || i}
                  className={`border border-slate-200 p-5 flex items-start justify-between gap-4 ${radiusClass}`}
                  style={{ backgroundColor: promo.bgColor || '#eff6ff' }}
                >
                  <div>
                    {promo.badge && (
                      <span
                        className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase text-white mb-2"
                        style={{ backgroundColor: accentColor }}
                      >
                        {promo.badge}
                      </span>
                    )}
                    <h3 className="font-bold text-slate-900 text-base">{promo.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">{promo.subtitle}</p>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Dynamic Sections */}
      <div className="flex-1">
        {sections
          .filter((s) => s.enabled !== false)
          .map((sec) => {
            if (sec.type === 'featured') {
              if (featuredProducts.length === 0) return null;
              return (
                <section
                  key={sec.id}
                  id="featured"
                  className="mx-auto max-w-7xl px-4 sm:px-6 py-10"
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">{sec.title}</h2>
                    {sec.subtitle && <p className="text-sm text-slate-500 mt-1">{sec.subtitle}</p>}
                  </div>
                  <div
                    className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${
                      theme.layoutStyle === 'compact' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
                    }`}
                  >
                    {featuredProducts.map((p) => (
                      <ProductCard key={p._id} p={p} />
                    ))}
                  </div>
                </section>
              );
            }

            if (sec.type === 'catalog') {
              return (
                <section
                  key={sec.id}
                  id="catalog"
                  className="mx-auto max-w-7xl px-4 sm:px-6 py-10"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{sec.title}</h2>
                      {sec.subtitle && (
                        <p className="text-sm text-slate-500 mt-1">{sec.subtitle}</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                      <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 w-full sm:w-64">
                        <Search className="h-4 w-4 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search products or HSN..."
                          className="text-sm outline-none bg-transparent w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${btnRadiusClass} ${
                          selectedCategory === cat
                            ? 'text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                        style={
                          selectedCategory === cat ? { backgroundColor: accentColor } : undefined
                        }
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                      No products match your search.
                    </div>
                  ) : (
                    <div
                      className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${
                        theme.layoutStyle === 'compact' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
                      }`}
                    >
                      {filteredProducts.map((p) => (
                        <ProductCard key={p._id} p={p} />
                      ))}
                    </div>
                  )}
                </section>
              );
            }

            if (sec.type === 'about') {
              return (
                <section key={sec.id} id="about" className="bg-white border-y border-slate-200 py-12">
                  <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="max-w-2xl mb-8">
                      <h2 className="text-2xl font-bold text-slate-900">
                        {about.title || sec.title}
                      </h2>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                        {about.description}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                      {(about.highlights || []).map((h, idx) => (
                        <div
                          key={idx}
                          className={`border border-slate-200 bg-slate-50 p-5 ${radiusClass}`}
                        >
                          <CheckCircle2
                            className="h-5 w-5 mb-2"
                            style={{ color: accentColor }}
                          />
                          <h3 className="font-bold text-slate-900 text-sm">{h.title}</h3>
                          <p className="text-xs text-slate-600 mt-1">{h.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );
            }

            if (sec.type === 'contact') {
              return (
                <section
                  key={sec.id}
                  id="contact"
                  className="mx-auto max-w-7xl px-4 sm:px-6 py-12"
                >
                  <div
                    className={`p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6 ${radiusClass}`}
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div className="space-y-2 max-w-xl">
                      <h2 className="text-2xl font-bold">{sec.title}</h2>
                      <p className="text-sm text-slate-300">{sec.subtitle}</p>
                      <div className="pt-2 space-y-1.5 text-xs text-slate-200">
                        {branding.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{branding.address}</span>
                          </div>
                        )}
                        {branding.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 shrink-0" />
                            <span>{branding.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 shrink-0">
                      {branding.phone && (
                        <a
                          href={`tel:${branding.phone}`}
                          className={`inline-flex items-center gap-2 bg-white text-slate-900 px-5 py-2.5 text-sm font-bold ${btnRadiusClass}`}
                        >
                          <Phone className="h-4 w-4" /> Call Now
                        </a>
                      )}
                      {whatsappNum && (
                        <a
                          href={`https://wa.me/91${whatsappNum}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white ${btnRadiusClass}`}
                          style={{ backgroundColor: accentColor }}
                        >
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </section>
              );
            }

            return null;
          })}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {branding.businessName || 'IJAZ TRADERS'}. All rights reserved.
      </footer>

      {/* Product Detail & Enquiry Modal */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                  {activeProduct.category || 'Product'} · HSN {activeProduct.hsnSac}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{activeProduct.name}</h3>
              </div>
              <button
                onClick={() => setActiveProduct(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {activeProduct.imageUrl && (
              <img
                src={activeProduct.imageUrl}
                alt={activeProduct.name}
                className="h-48 w-full rounded-xl object-cover border border-slate-200"
              />
            )}

            <p className="text-sm text-slate-600">
              {activeProduct.description || activeProduct.subDescription || 'Available for retail and bulk contractor orders with full GST invoice.'}
            </p>

            <div className="rounded-xl bg-slate-50 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Price (Incl. {activeProduct.gstRate}% GST)</div>
                <div className="text-xl font-bold text-slate-900">
                  ₹ {formatINR(activeProduct.rateInclTax || activeProduct.rate)} / {activeProduct.unit}
                </div>
                <div className="text-xs text-slate-500">
                  Base Rate: ₹ {formatINR(activeProduct.rate)}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-xs font-bold ${
                    activeProduct.inStock !== false ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {activeProduct.inStock !== false ? 'In Stock' : 'Out of Stock'}
                </div>
                <div className="text-xs text-slate-500">
                  Avail: {activeProduct.stockQty ?? 0} {activeProduct.unit}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {activeProduct.inStock !== false && (
                <button
                  type="button"
                  onClick={() => {
                    addToCart(activeProduct);
                    setActiveProduct(null);
                    setBookingModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  <ShoppingBag className="h-4 w-4" /> Add to Pre-Booking
                </button>
              )}
              {whatsappNum && (
                <a
                  href={`https://wa.me/91${whatsappNum}?text=${encodeURIComponent(
                    `Hello ${branding.businessName}, I would like a quote for: ${activeProduct.name} (HSN: ${activeProduct.hsnSac})`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
              <button
                onClick={() => setActiveProduct(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Booking Order Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {createdBooking ? 'Pre-Booking Confirmed!' : 'Submit Pre-Booking Order'}
              </h3>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createdBooking ? (
              <div className="space-y-4 text-center py-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                <div>
                  <div className="text-sm text-slate-600">Your Booking ID</div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">
                    {createdBooking.bookingId}
                  </div>
                </div>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Save this Booking ID along with your mobile number ({createdBooking.customer?.phone}).
                  Once our billing team generates your GST invoice, you can download it anytime using{' '}
                  <strong>Track / Invoice</strong>.
                </p>
                <button
                  onClick={() => setBookingModalOpen(false)}
                  className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">
                Your pre-booking bag is empty. Click <strong>+ Book</strong> on any product to add it.
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {bookingError && (
                  <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cart.map(({ product, quantity }) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{product.name}</div>
                        <div className="text-slate-500">
                          ₹ {formatINR(product.rateInclTax || product.rate)} / {product.unit}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateCartQty(product._id, quantity - 1)}
                          className="rounded border border-slate-300 p-1 hover:bg-slate-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => updateCartQty(product._id, e.target.value)}
                          className="w-14 rounded border border-slate-300 px-1.5 py-1 text-center font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => updateCartQty(product._id, quantity + 1)}
                          className="rounded border border-slate-300 p-1 hover:bg-slate-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCartQty(product._id, 0)}
                          className="text-rose-500 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-slate-50 px-3 py-2 flex justify-between text-sm font-bold text-slate-900">
                  <span>Estimated Total (Incl. GST)</span>
                  <span>₹ {formatINR(cartTotal)}</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Your Name / Business *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookingForm.name}
                      onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mobile Number (10 digits) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="9843988337"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={bookingForm.address}
                    onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      GSTIN (Optional for B2B Invoice)
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={bookingForm.gstin}
                      onChange={(e) => {
                        const v = e.target.value.toUpperCase();
                        setBookingForm({
                          ...bookingForm,
                          gstin: v,
                          stateCode:
                            v.length >= 2 && INDIAN_STATES[v.slice(0, 2)]
                              ? v.slice(0, 2)
                              : bookingForm.stateCode,
                        });
                      }}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase"
                      placeholder="33CEEPK1872G2ZN"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
                    <select
                      value={bookingForm.stateCode}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, stateCode: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      {Object.entries(INDIAN_STATES).map(([code, name]) => (
                        <option key={code} value={code}>
                          {code} - {name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Notes / Preferred Delivery Date
                  </label>
                  <input
                    type="text"
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingModalOpen(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingSubmitting || isPreview}
                    className="rounded-lg px-5 py-2 text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                    style={{ backgroundColor: accentColor }}
                  >
                    {bookingSubmitting ? 'Submitting...' : 'Confirm Pre-Booking'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Track Booking / Secure Invoice Download Modal */}
      {lookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                Track Booking &amp; Download GST Invoice
              </h3>
              <button
                onClick={() => setLookupOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleLookupSubmit} className="space-y-3">
              {lookupError && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{lookupError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Booking ID <span className="text-slate-400">or</span> 10-Digit Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="e.g. BK-1001 or 9876543210"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={lookupLoading}
                className="w-full rounded-lg py-2 text-sm font-semibold text-white cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                {lookupLoading ? 'Checking...' : 'Check Booking & Invoice'}
              </button>
            </form>

            {lookupResult && (
              <div className="border-t border-slate-200 pt-4 space-y-3 max-h-80 overflow-y-auto">
                {(lookupResult.results || [{ booking: lookupResult.booking, invoice: lookupResult.invoice }]).map(
                  ({ booking, invoice }) => (
                    <div
                      key={booking._id}
                      className="rounded-xl border border-slate-200 p-3 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            {booking.bookingId} — {booking.customer?.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            Mobile: {booking.customer?.phone} · Est. Total: ₹{' '}
                            {formatINR(booking.estimatedTotal)}
                          </div>
                        </div>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {booking.status}
                        </span>
                      </div>

                      {invoice ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold text-emerald-800">
                              GST Invoice Ready: #{invoice.invoiceNumber}
                            </div>
                            <div className="text-xs text-emerald-700">
                              Grand Total: ₹ {formatINR(invoice.totals?.grandTotal)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => downloadInvoicePDF(invoice)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" /> Download PDF
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
                          Status: <strong>{booking.status}</strong>. Your GST invoice will appear
                          here for PDF download once finalized.
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

