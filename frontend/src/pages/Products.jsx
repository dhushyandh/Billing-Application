import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, AlertCircle } from 'lucide-react';
import { api } from '../api/client.js';
import { GST_RATES, UNITS, formatINR, round2, validateHSN } from '../utils/gst.js';

const EMPTY_FORM = {
  name: '',
  sku: '',
  subDescription: '',
  category: 'Fencing & Wire',
  description: '',
  imageUrl: '',
  hsnSac: '',
  unit: 'NOS',
  purchasePrice: '',
  rate: '',
  rateInclTax: '',
  isTaxInclusive: false,
  gstRate: 18,
  stockQty: 0,
  inStock: true,
  isVisibleOnStorefront: true,
  isFeatured: false,
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async (q = search) => {
    setLoading(true);
    try {
      setProducts(await api.getProducts(q));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      sku: p.sku || '',
      subDescription: p.subDescription || '',
      category: p.category || 'Fencing & Wire',
      description: p.description || '',
      imageUrl: p.imageUrl || '',
      hsnSac: p.hsnSac,
      unit: p.unit,
      purchasePrice: p.purchasePrice || '',
      rate: p.rate,
      rateInclTax: p.rateInclTax,
      isTaxInclusive: p.isTaxInclusive || false,
      gstRate: p.gstRate,
      stockQty: p.stockQty || 0,
      inStock: p.inStock !== false,
      isVisibleOnStorefront: p.isVisibleOnStorefront !== false,
      isFeatured: Boolean(p.isFeatured),
    });
    setError('');
    setModalOpen(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1000;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        setForm((prev) => ({ ...prev, imageUrl: canvas.toDataURL(mime, 0.85) }));
      };
      img.onerror = () => setForm((prev) => ({ ...prev, imageUrl: reader.result }));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const updatePricing = (patch) => {
    const next = { ...form, ...patch };
    const gst = Number(next.gstRate) || 0;
    if (next.isTaxInclusive) {
      const incl = Number(next.rateInclTax) || 0;
      next.rate = incl > 0 ? round2(incl / (1 + gst / 100)) : '';
    } else {
      const excl = Number(next.rate) || 0;
      next.rateInclTax = excl > 0 ? round2(excl * (1 + gst / 100)) : '';
    }
    setForm(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Product description is required.');
      return;
    }
    const hsnCheck = validateHSN(form.hsnSac);
    if (!hsnCheck.valid) {
      setError(hsnCheck.error);
      return;
    }
    const activeRate = form.isTaxInclusive ? Number(form.rateInclTax) : Number(form.rate);
    if (!Number.isFinite(activeRate) || activeRate <= 0) {
      setError('Rate must be greater than 0.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.updateProduct(editingId, form);
      } else {
        await api.createProduct(form);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete product "${name}"?`)) return;
    try {
      await api.deleteProduct(id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products &amp; Services</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage HSN/SAC codes, units, rates, stock, and storefront visibility.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer self-start shadow-xs"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xs">
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            load(e.target.value);
          }}
          placeholder="Search by product name, SKU, or HSN/SAC..."
          className="w-full text-sm outline-none bg-transparent"
        />
      </div>

      {/* Mobile Card View */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            No products found.
          </div>
        ) : (
          products.map((p) => (
            <div
              key={p._id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-12 w-12 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                      {p.unit}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 truncate">{p.name}</div>
                    <div className="text-xs text-slate-500">
                      {p.sku ? `${p.sku} · ` : ''}HSN {p.hsnSac} · {p.gstRate}% GST
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(p)}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p._id, p.name)}
                    className="rounded-lg border border-slate-200 p-1.5 text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                <div>
                  <span className="font-bold text-slate-900 text-sm">
                    ₹ {formatINR(p.rateInclTax)}
                  </span>{' '}
                  <span className="text-slate-500">/ {p.unit} (Incl. Tax)</span>
                </div>
                <span
                  className={`font-semibold ${
                    p.inStock !== false ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {p.stockQty ?? 0} {p.unit} · {p.inStock !== false ? 'In Stock' : 'Out'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category / HSN</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Rate (Excl.)</th>
              <th className="px-4 py-3 text-right">Rate (Incl.)</th>
              <th className="px-4 py-3 text-center">GST %</th>
              <th className="px-4 py-3 text-center">Storefront</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Loading products...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-10 w-10 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                          {p.unit}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          {p.sku && <span className="font-mono text-indigo-600">SKU: {p.sku}</span>}
                          {p.subDescription && <span className="italic">{p.subDescription}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-slate-700">{p.category || 'General'}</div>
                    <div className="font-mono text-[11px] text-slate-500">HSN: {p.hsnSac}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-medium text-slate-900">
                      {p.stockQty ?? 0} {p.unit}
                    </div>
                    <span
                      className={`text-[10px] font-semibold ${
                        p.inStock !== false ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {p.inStock !== false ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">₹ {formatINR(p.rate)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    ₹ {formatINR(p.rateInclTax)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      {p.gstRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          p.isVisibleOnStorefront !== false
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {p.isVisibleOnStorefront !== false ? 'Visible' : 'Hidden'}
                      </span>
                      {p.isFeatured && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id, p.name)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Product Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. TATA WIRON KNOTTED FENCE 5FEET"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    SKU / Barcode
                  </label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. TW-KF-5FT"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Sub-description / Packing Note
                </label>
                <input
                  type="text"
                  value={form.subDescription}
                  onChange={(e) => setForm({ ...form, subDescription: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. 17 ROLL"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    HSN / SAC Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.hsnSac}
                    onChange={(e) => setForm({ ...form, hsnSac: e.target.value.replace(/\D/g, '') })}
                    maxLength={8}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
                    placeholder="7217"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Unit *</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    GST Rate (%) *
                  </label>
                  <select
                    value={form.gstRate}
                    onChange={(e) => updatePricing({ gstRate: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {GST_RATES.map((r) => (
                      <option key={r} value={r}>
                        {r}%
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="taxIncl"
                  type="checkbox"
                  checked={form.isTaxInclusive}
                  onChange={(e) => updatePricing({ isTaxInclusive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="taxIncl" className="text-sm text-slate-700">
                  Enter Rate Inclusive of GST
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Purchase Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.purchasePrice}
                    onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Selling Rate (Excl. Tax)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    disabled={form.isTaxInclusive}
                    value={form.rate}
                    onChange={(e) => updatePricing({ rate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Selling Rate (Incl. Tax)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    disabled={!form.isTaxInclusive}
                    value={form.rateInclTax}
                    onChange={(e) => updatePricing({ rateInclTax: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* Storefront & Inventory Sync Fields */}
              <div className="border-t border-slate-200 pt-3 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Storefront &amp; Inventory Sync
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="e.g. Knotted Fencing"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Available Stock ({form.unit})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.stockQty}
                      onChange={(e) => setForm({ ...form, stockQty: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Storefront Description
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Customer-facing product specs & benefits..."
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Product Image URL
                    </label>
                    <input
                      type="text"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="https://... or upload below"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Or Upload Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.inStock}
                      onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                    />
                    In Stock
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isVisibleOnStorefront}
                      onChange={(e) =>
                        setForm({ ...form, isVisibleOnStorefront: e.target.checked })
                      }
                    />
                    Show on Storefront
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    />
                    Featured Product
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

