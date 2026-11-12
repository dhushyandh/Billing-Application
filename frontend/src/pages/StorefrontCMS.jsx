import { useEffect, useState } from 'react';
import {
  Save,
  Rocket,
  RotateCcw,
  ExternalLink,
  Monitor,
  Smartphone,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Store,
  Palette,
  Image as ImageIcon,
  Layers,
  Package,
  ChevronDown,
  ChevronUp,
  Pencil,
} from 'lucide-react';
import { api } from '../api/client.js';
import { formatINR } from '../utils/gst.js';
import StorefrontRenderer from '../components/StorefrontRenderer.jsx';

function CmsCard({ title, subtitle, icon: Icon, open, onToggle, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
        )}
      </button>
      {open && <div className="border-t border-slate-100 p-5 sm:p-6 space-y-4">{children}</div>}
    </div>
  );
}

export default function StorefrontCMS() {
  const [draft, setDraft] = useState(null);
  const [products, setProducts] = useState([]);
  const [hasUnpublished, setHasUnpublished] = useState(false);
  const [lastPublishedAt, setLastPublishedAt] = useState(null);
  const [mode, setMode] = useState('edit'); // 'edit' | 'preview'
  const [viewport, setViewport] = useState('desktop');
  const [openCards, setOpenCards] = useState({
    branding: true,
    hero: true,
    theme: false,
    sections: false,
    products: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sf, prods] = await Promise.all([api.getStorefrontAdmin(), api.getProducts()]);
      setDraft(sf.draft);
      setHasUnpublished(sf.hasUnpublishedChanges);
      setLastPublishedAt(sf.lastPublishedAt);
      setProducts(prods);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const toggleCard = (key) => {
    setOpenCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateDraft = (patch) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setHasUnpublished(true);
  };

  const handleFileToBase64 = (e, onDone, maxWidth = 1600) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        onDone(canvas.toDataURL(mime, 0.85));
      };
      img.onerror = () => onDone(reader.result);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.saveStorefrontDraft(draft);
      setDraft(res.draft);
      setHasUnpublished(res.hasUnpublishedChanges);
      showToast('Draft saved! Switch to Live Preview or Publish Live.');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.publishStorefront(draft);
      setDraft(res.draft);
      setHasUnpublished(false);
      setLastPublishedAt(res.lastPublishedAt);
      showToast('Storefront published live!');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = async () => {
    if (!window.confirm('Discard unpublished draft changes and revert to live website?')) return;
    setSaving(true);
    try {
      const res = await api.revertStorefront();
      setDraft(res.draft);
      setHasUnpublished(false);
      showToast('Reverted to live published website.');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const moveSection = (idx, dir) => {
    const next = [...(draft.sections || [])];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    updateDraft({ sections: next });
  };

  const toggleProductField = async (p, field) => {
    const updated = { ...p, [field]: !p[field] };
    await api.updateProduct(p._id, updated);
    setProducts((prev) => prev.map((x) => (x._id === p._id ? updated : x)));
    showToast(`Updated "${p.name}".`);
  };

  if (loading || !draft) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">Loading Storefront CMS...</div>
    );
  }

  const visibleStoreProducts = products.filter((p) => p.isVisibleOnStorefront !== false);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">Storefront CMS</h1>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                hasUnpublished
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {hasUnpublished ? 'Draft Pending' : 'Live'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Edit your public store content below, preview it, and publish instantly.
            {lastPublishedAt && (
              <span className="ml-2 text-xs text-slate-400">
                (Last published: {new Date(lastPublishedAt).toLocaleString()})
              </span>
            )}
          </p>
        </div>

        {/* Clean Edit / Preview Switcher + Live Store Link */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer ${
                mode === 'edit' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Content
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer ${
                mode === 'preview'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="h-3.5 w-3.5" /> Live Preview
            </button>
          </div>

          <a
            href="/store"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open Live Store
          </a>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {toast}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {mode === 'edit' ? (
        <div className="space-y-4">
          {/* 1. BUSINESS & LOGO */}
          <CmsCard
            title="Business & Logo"
            subtitle="Store name, tagline, logo image, phone, WhatsApp, and address."
            icon={Store}
            open={openCards.branding}
            onToggle={() => toggleCard('branding')}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Business Name
                </label>
                <input
                  type="text"
                  value={draft.branding?.businessName || ''}
                  onChange={(e) =>
                    updateDraft({
                      branding: { ...draft.branding, businessName: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={draft.branding?.tagline || ''}
                  onChange={(e) =>
                    updateDraft({
                      branding: { ...draft.branding, tagline: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={draft.branding?.phone || ''}
                  onChange={(e) =>
                    updateDraft({ branding: { ...draft.branding, phone: e.target.value } })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  value={draft.branding?.whatsapp || ''}
                  onChange={(e) =>
                    updateDraft({ branding: { ...draft.branding, whatsapp: e.target.value } })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={draft.branding?.email || ''}
                  onChange={(e) =>
                    updateDraft({ branding: { ...draft.branding, email: e.target.value } })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Shop Address
                </label>
                <input
                  type="text"
                  value={draft.branding?.address || ''}
                  onChange={(e) =>
                    updateDraft({ branding: { ...draft.branding, address: e.target.value } })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-700">Website Logo</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileToBase64(
                      e,
                      (url) => updateDraft({ branding: { ...draft.branding, logoUrl: url } }),
                      600
                    )
                  }
                  className="text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700"
                />
              </div>
              {draft.branding?.logoUrl && (
                <div className="flex items-center gap-3">
                  <img
                    src={draft.branding.logoUrl}
                    alt="Logo"
                    className="h-12 w-12 rounded-lg object-contain bg-white border border-slate-200 p-1"
                  />
                  <button
                    type="button"
                    onClick={() => updateDraft({ branding: { ...draft.branding, logoUrl: '' } })}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </CmsCard>

          {/* 2. BANNER & OFFERS */}
          <CmsCard
            title="Homepage Banner & Promotional Offers"
            subtitle="Hero headline, background banner image, and special offer cards."
            icon={ImageIcon}
            open={openCards.hero}
            onToggle={() => toggleCard('hero')}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Hero Banner</span>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.hero?.enabled !== false}
                  onChange={(e) =>
                    updateDraft({ hero: { ...draft.hero, enabled: e.target.checked } })
                  }
                />
                Show Hero Banner
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Top Badge
                </label>
                <input
                  type="text"
                  value={draft.hero?.badge || ''}
                  onChange={(e) =>
                    updateDraft({ hero: { ...draft.hero, badge: e.target.value } })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Button Text
                </label>
                <input
                  type="text"
                  value={draft.hero?.ctaText || ''}
                  onChange={(e) =>
                    updateDraft({ hero: { ...draft.hero, ctaText: e.target.value } })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Main Headline
              </label>
              <input
                type="text"
                value={draft.hero?.title || ''}
                onChange={(e) => updateDraft({ hero: { ...draft.hero, title: e.target.value } })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Subtitle Description
              </label>
              <textarea
                rows={2}
                value={draft.hero?.subtitle || ''}
                onChange={(e) =>
                  updateDraft({ hero: { ...draft.hero, subtitle: e.target.value } })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Banner Background Image</span>
                {draft.hero?.imageUrl && (
                  <button
                    type="button"
                    onClick={() => updateDraft({ hero: { ...draft.hero, imageUrl: '' } })}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Remove Image
                  </button>
                )}
              </div>
              {draft.hero?.imageUrl && (
                <img
                  src={draft.hero.imageUrl}
                  alt="Banner preview"
                  className="h-32 w-full rounded-xl object-cover border border-slate-200"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleFileToBase64(e, (url) =>
                    updateDraft({ hero: { ...draft.hero, imageUrl: url } })
                  )
                }
                className="w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700"
              />
            </div>

            {/* Promotional Offers */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Promotional Offer Cards</span>
                <button
                  type="button"
                  onClick={() =>
                    updateDraft({
                      promos: [
                        ...(draft.promos || []),
                        {
                          id: `promo-${Date.now()}`,
                          title: 'New Special Offer',
                          subtitle: 'Describe the offer here...',
                          badge: 'OFFER',
                          bgColor: '#eff6ff',
                          active: true,
                        },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Offer
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(draft.promos || []).map((promo, i) => (
                  <div
                    key={promo.id || i}
                    className="rounded-xl border border-slate-200 p-3.5 space-y-2 bg-slate-50"
                  >
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={promo.active !== false}
                          onChange={(e) => {
                            const next = [...draft.promos];
                            next[i] = { ...promo, active: e.target.checked };
                            updateDraft({ promos: next });
                          }}
                        />
                        Active
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft({
                            promos: draft.promos.filter((_, idx) => idx !== i),
                          })
                        }
                        className="text-rose-500 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={promo.title}
                      onChange={(e) => {
                        const next = [...draft.promos];
                        next[i] = { ...promo, title: e.target.value };
                        updateDraft({ promos: next });
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold"
                    />
                    <input
                      type="text"
                      value={promo.subtitle}
                      onChange={(e) => {
                        const next = [...draft.promos];
                        next[i] = { ...promo, subtitle: e.target.value };
                        updateDraft({ promos: next });
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CmsCard>

          {/* 3. COLORS & MENU */}
          <CmsCard
            title="Colors, Layout & Navigation"
            subtitle="Brand colors, header style, announcement bar, and top menu links."
            icon={Palette}
            open={openCards.theme}
            onToggle={() => toggleCard('theme')}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Primary Color
                </label>
                <input
                  type="color"
                  value={draft.theme?.primaryColor || '#0f172a'}
                  onChange={(e) =>
                    updateDraft({ theme: { ...draft.theme, primaryColor: e.target.value } })
                  }
                  className="h-10 w-full rounded-xl border border-slate-300 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Button / Accent Color
                </label>
                <input
                  type="color"
                  value={draft.theme?.accentColor || '#2563eb'}
                  onChange={(e) =>
                    updateDraft({ theme: { ...draft.theme, accentColor: e.target.value } })
                  }
                  className="h-10 w-full rounded-xl border border-slate-300 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Header Style
                </label>
                <select
                  value={draft.theme?.headerStyle || 'light'}
                  onChange={(e) =>
                    updateDraft({ theme: { ...draft.theme, headerStyle: e.target.value } })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="light">White</option>
                  <option value="dark">Dark Navy</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Product Grid
                </label>
                <select
                  value={draft.theme?.layoutStyle || 'grid'}
                  onChange={(e) =>
                    updateDraft({ theme: { ...draft.theme, layoutStyle: e.target.value } })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="grid">3 Columns</option>
                  <option value="compact">4 Columns</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Top Announcement Bar</span>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.announcement?.enabled !== false}
                    onChange={(e) =>
                      updateDraft({
                        announcement: { ...draft.announcement, enabled: e.target.checked },
                      })
                    }
                  />
                  Show Announcement
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  value={draft.announcement?.text || ''}
                  onChange={(e) =>
                    updateDraft({
                      announcement: { ...draft.announcement, text: e.target.value },
                    })
                  }
                  placeholder="Announcement message..."
                  className="sm:col-span-2 rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
                <input
                  type="text"
                  value={draft.announcement?.promoCode || ''}
                  onChange={(e) =>
                    updateDraft({
                      announcement: { ...draft.announcement, promoCode: e.target.value },
                    })
                  }
                  placeholder="Promo Code"
                  className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
                />
              </div>
            </div>
          </CmsCard>

          {/* 4. PAGE SECTIONS */}
          <CmsCard
            title="Homepage Sections"
            subtitle="Turn sections on or off, edit headings, or change their order."
            icon={Layers}
            open={openCards.sections}
            onToggle={() => toggleCard('sections')}
          >
            <div className="space-y-3">
              {(draft.sections || []).map((sec, idx) => (
                <div
                  key={sec.id}
                  className="rounded-xl border border-slate-200 p-4 space-y-2.5 bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sec.enabled !== false}
                        onChange={(e) => {
                          const next = [...draft.sections];
                          next[idx] = { ...sec, enabled: e.target.checked };
                          updateDraft({ sections: next });
                        }}
                      />
                      <span className="uppercase rounded bg-indigo-100 text-indigo-700 px-2 py-0.5 text-[10px]">
                        {sec.type}
                      </span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSection(idx, -1)}
                        className="rounded-lg border border-slate-300 bg-white p-1.5 hover:bg-slate-100"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(idx, 1)}
                        className="rounded-lg border border-slate-300 bg-white p-1.5 hover:bg-slate-100"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => {
                        const next = [...draft.sections];
                        next[idx] = { ...sec, title: e.target.value };
                        updateDraft({ sections: next });
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold"
                    />
                    <input
                      type="text"
                      value={sec.subtitle || ''}
                      onChange={(e) => {
                        const next = [...draft.sections];
                        next[idx] = { ...sec, subtitle: e.target.value };
                        updateDraft({ sections: next });
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CmsCard>

          {/* 5. STORE PRODUCTS */}
          <CmsCard
            title="Storefront Products"
            subtitle="Synced with your billing catalogue. Toggle visibility, featured badge, or stock."
            icon={Package}
            open={openCards.products}
            onToggle={() => toggleCard('products')}
          >
            <div className="space-y-2.5">
              {products.map((p) => (
                <div
                  key={p._id}
                  className="rounded-xl border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-500">
                      ₹ {formatINR(p.rateInclTax || p.rate)} / {p.unit} · Stock: {p.stockQty ?? 0}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleProductField(p, 'isVisibleOnStorefront')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                        p.isVisibleOnStorefront !== false
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p.isVisibleOnStorefront !== false ? 'Visible' : 'Hidden'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleProductField(p, 'isFeatured')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                        p.isFeatured
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      Featured
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleProductField(p, 'inStock')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                        p.inStock !== false
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {p.inStock !== false ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CmsCard>
        </div>
      ) : (
        /* Full-Page Live Preview (No inner scrollbar!) */
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5">
            <span className="text-xs font-bold text-slate-700">Draft Preview</span>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium cursor-pointer ${
                  viewport === 'desktop'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setViewport('mobile')}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium cursor-pointer ${
                  viewport === 'mobile'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" /> Mobile
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <div
              className={`bg-white shadow-xl border border-slate-200 overflow-hidden transition-all ${
                viewport === 'mobile' ? 'w-full max-w-[390px] rounded-2xl' : 'w-full rounded-xl'
              }`}
            >
              <StorefrontRenderer config={draft} products={visibleStoreProducts} isPreview />
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-4 left-0 right-0 z-20 px-4 pointer-events-none lg:pl-68">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-end gap-2">
          {hasUnpublished && (
            <button
              type="button"
              onClick={handleRevert}
              disabled={saving}
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-md hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Discard
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-md hover:bg-slate-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" /> Save Draft
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={saving}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
          >
            <Rocket className="h-4 w-4" /> {saving ? 'Publishing...' : 'Publish Live'}
          </button>
        </div>
      </div>
    </div>
  );
}
