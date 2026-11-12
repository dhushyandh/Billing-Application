import { useEffect, useState } from 'react';
import {
  Save,
  AlertCircle,
  CheckCircle2,
  Building2,
  Landmark,
  FileText,
  Percent,
  Paintbrush,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../api/client.js';
import { GST_RATES, INDIAN_STATES, validateGSTIN } from '../utils/gst.js';

function SectionCard({ title, subtitle, badge, icon: Icon, open, onToggle, children }) {
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
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
              {badge && (
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-indigo-700">
                  {badge}
                </span>
              )}
            </div>
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

export default function Settings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [openCards, setOpenCards] = useState({
    company: true,
    bank: true,
    invoice: false,
    gst: false,
    appearance: false,
  });

  useEffect(() => {
    api
      .getSettings()
      .then((s) => {
        setForm({
          ...s,
          bankDetails: s.bankDetails || {},
          numbering: s.numbering || {},
          gstConfig: s.gstConfig || {},
          appearance: s.appearance || { showLogo: true, showBankDetails: true },
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleCard = (key) => {
    setOpenCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleImageUpload = (e, onDone, maxWidth = 800) => {
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

  const handleGstinChange = (val) => {
    const clean = val.toUpperCase();
    const check = validateGSTIN(clean);
    setForm((prev) => ({
      ...prev,
      gstin: clean,
      stateCode: check.valid ? check.stateCode : prev.stateCode,
      stateName: check.valid ? check.stateName : prev.stateName,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSavedMsg('');

    if (!form.name?.trim()) return setError('Company Name is required.');
    if (!form.contact?.trim()) return setError('Contact Number is required.');
    if (!form.address?.trim()) return setError('Business Address is required.');

    const check = validateGSTIN(form.gstin);
    if (!check.valid) return setError(check.error);

    setSaving(true);
    try {
      const updated = await api.updateSettings(form);
      setForm(updated);
      window.dispatchEvent(new CustomEvent('settings-updated', { detail: updated }));
      setSavedMsg('All company & GST settings saved and applied to invoices.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading settings...</div>;
  }

  const gstinCheck = form.gstin ? validateGSTIN(form.gstin) : null;
  const numCfg = form.numbering || {};
  const previewInvNo = numCfg.includeFinancialYear
    ? `${(numCfg.taxInvoicePrefix || 'INV').replace(/[-/]+$/, '')}/${numCfg.financialYear || '2026-27'}/${String(numCfg.taxInvoiceNext || 1).padStart(3, '0')}`
    : `${numCfg.taxInvoicePrefix || 'INV-'}${numCfg.taxInvoiceNext || 373}`;

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-5 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company &amp; GST Settings</h1>
          <p className="text-sm text-slate-500">
            Configure your business profile, bank details, invoice numbering, GST rules, and
            branding.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
        >
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {savedMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      {/* 1. COMPANY PROFILE */}
      <SectionCard
        title="Company Profile"
        subtitle="Business details, GSTIN, address, contact, and logo."
        badge="Essential"
        icon={Building2}
        open={openCards.company}
        onToggle={() => toggleCard('company')}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Company Name *
            </label>
            <input
              type="text"
              required
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              GSTIN / UIN *
            </label>
            <input
              type="text"
              required
              maxLength={15}
              value={form.gstin || ''}
              onChange={(e) => handleGstinChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono uppercase focus:border-indigo-500 focus:outline-none"
            />
            {gstinCheck && (
              <div
                className={`mt-1 text-xs flex items-center gap-1 ${
                  gstinCheck.valid ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {gstinCheck.valid ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified: {gstinCheck.stateName} (Code{' '}
                    {gstinCheck.stateCode})
                  </>
                ) : (
                  gstinCheck.error
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contact Number *
            </label>
            <input
              type="text"
              required
              value={form.contact || ''}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">State *</label>
            <select
              value={form.stateCode || '33'}
              onChange={(e) =>
                setForm({
                  ...form,
                  stateCode: e.target.value,
                  stateName: INDIAN_STATES[e.target.value] || '',
                })
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm bg-slate-50"
            >
              {Object.entries(INDIAN_STATES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              State Code (Auto-detected)
            </label>
            <input
              type="text"
              readOnly
              value={form.stateCode || ''}
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm font-mono text-slate-700"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Business Address *
          </label>
          <textarea
            rows={3}
            required
            value={form.address || ''}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-700">Company Logo (Recommended)</div>
            <p className="text-xs text-slate-500">Displayed on printed &amp; PDF invoices.</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleImageUpload(e, (url) => setForm({ ...form, logoUrl: url }), 500)
              }
              className="pt-1 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700"
            />
          </div>
          {form.logoUrl && (
            <div className="flex items-center gap-3">
              <img
                src={form.logoUrl}
                alt="Company Logo"
                className="h-14 w-14 rounded-xl object-contain bg-white border border-slate-200 p-1"
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, logoUrl: '' })}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </SectionCard>

      {/* 2. BANK DETAILS */}
      <SectionCard
        title="Bank Details"
        subtitle="Bank account and payment information printed on invoices."
        icon={Landmark}
        open={openCards.bank}
        onToggle={() => toggleCard('bank')}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            ['accountHolderName', 'Account Holder Name'],
            ['bankName', 'Bank Name'],
            ['accountNo', 'Account Number'],
            ['branchName', 'Branch Name'],
            ['ifscCode', 'IFSC Code'],
            ['swiftCode', 'SWIFT Code (Optional)'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
              <input
                type="text"
                value={form.bankDetails?.[key] || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bankDetails: { ...form.bankDetails, [key]: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 3. INVOICE CONFIGURATION */}
      <SectionCard
        title="Invoice Configuration"
        subtitle="Invoice numbering, financial year, currency, and default payment terms."
        icon={FileText}
        open={openCards.invoice}
        onToggle={() => toggleCard('invoice')}
      >
        <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-3 flex items-center justify-between text-xs">
          <span className="font-medium text-indigo-800">Next Tax Invoice Number Preview:</span>
          <span className="font-mono font-bold text-sm text-indigo-900">{previewInvNo}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tax Invoice Prefix
            </label>
            <input
              type="text"
              value={numCfg.taxInvoicePrefix ?? 'INV-'}
              onChange={(e) =>
                setForm({
                  ...form,
                  numbering: { ...numCfg, taxInvoicePrefix: e.target.value },
                })
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Next Invoice Number
            </label>
            <input
              type="number"
              min="1"
              value={numCfg.taxInvoiceNext ?? 373}
              onChange={(e) =>
                setForm({
                  ...form,
                  numbering: { ...numCfg, taxInvoiceNext: Number(e.target.value) },
                })
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Financial Year
            </label>
            <input
              type="text"
              value={numCfg.financialYear ?? '2026-27'}
              onChange={(e) =>
                setForm({
                  ...form,
                  numbering: { ...numCfg, financialYear: e.target.value },
                })
              }
              placeholder="2026-27"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Default Invoice Type
            </label>
            <select
              value={numCfg.defaultInvoiceType || 'Tax Invoice'}
              onChange={(e) =>
                setForm({
                  ...form,
                  numbering: { ...numCfg, defaultInvoiceType: e.target.value },
                })
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
            >
              <option value="Tax Invoice">Tax Invoice</option>
              <option value="Proforma Invoice">Proforma Invoice</option>
              <option value="Credit Note">Credit Note</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Default Payment Terms
            </label>
            <select
              value={numCfg.defaultPaymentTerms || 'IMMEDIATE'}
              onChange={(e) =>
                setForm({
                  ...form,
                  numbering: { ...numCfg, defaultPaymentTerms: e.target.value },
                })
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
            >
              <option value="IMMEDIATE">IMMEDIATE</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="NEFT / RTGS">NEFT / RTGS</option>
              <option value="Net 15 Days">Net 15 Days</option>
              <option value="Net 30 Days">Net 30 Days</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Default Currency
            </label>
            <input
              type="text"
              value={numCfg.currency || 'INR'}
              onChange={(e) =>
                setForm({
                  ...form,
                  numbering: { ...numCfg, currency: e.target.value.toUpperCase() },
                })
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-1">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={numCfg.autoSequential !== false}
              onChange={(e) =>
                setForm({
                  ...form,
                  numbering: { ...numCfg, autoSequential: e.target.checked },
                })
              }
            />
            Automatic Sequential Numbering
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(numCfg.includeFinancialYear)}
              onChange={(e) =>
                setForm({
                  ...form,
                  numbering: { ...numCfg, includeFinancialYear: e.target.checked },
                })
              }
            />
            Include Financial Year (e.g. INV/2026-27/001)
          </label>
        </div>
      </SectionCard>

      {/* 4. GST CONFIGURATION */}
      <SectionCard
        title="GST Configuration"
        subtitle="Default GST rates, tax calculation method, place of supply, and round-off."
        icon={Percent}
        open={openCards.gst}
        onToggle={() => toggleCard('gst')}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Default GST Rate
            </label>
            <select
              value={form.gstConfig?.defaultGstRate ?? 18}
              onChange={(e) =>
                setForm({
                  ...form,
                  gstConfig: { ...form.gstConfig, defaultGstRate: Number(e.target.value) },
                })
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
            >
              {GST_RATES.map((r) => (
                <option key={r} value={r}>
                  {r}%
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Default Place of Supply
            </label>
            <select
              value={form.gstConfig?.defaultPlaceOfSupply || form.stateCode || '33'}
              onChange={(e) =>
                setForm({
                  ...form,
                  gstConfig: { ...form.gstConfig, defaultPlaceOfSupply: e.target.value },
                })
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
            >
              {Object.entries(INDIAN_STATES).map(([code, name]) => (
                <option key={code} value={code}>
                  {code} - {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              GST Calculation Method
            </label>
            <select
              value={form.gstConfig?.calculationMethod || 'exclusive'}
              onChange={(e) =>
                setForm({
                  ...form,
                  gstConfig: { ...form.gstConfig, calculationMethod: e.target.value },
                })
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
            >
              <option value="exclusive">Tax Exclusive (Base Rate + GST)</option>
              <option value="inclusive">Tax Inclusive (MRP includes GST)</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600 flex flex-wrap gap-4 justify-between items-center">
          <div>
            <strong>Intra-State Tax:</strong> CGST + SGST (50% / 50%) &nbsp;|&nbsp;{' '}
            <strong>Inter-State Tax:</strong> IGST (100%)
          </div>
          <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={form.gstConfig?.autoRoundOff !== false}
              onChange={(e) =>
                setForm({
                  ...form,
                  gstConfig: { ...form.gstConfig, autoRoundOff: e.target.checked },
                })
              }
            />
            Auto Round-Off to Nearest Rupee
          </label>
        </div>
      </SectionCard>

      {/* 5. INVOICE APPEARANCE */}
      <SectionCard
        title="Invoice Appearance"
        subtitle="Authorised signature, footer declaration, terms & conditions, and visibility toggles."
        icon={Paintbrush}
        open={openCards.appearance}
        onToggle={() => toggleCard('appearance')}
      >
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.appearance?.showLogo !== false}
              onChange={(e) =>
                setForm({
                  ...form,
                  appearance: { ...form.appearance, showLogo: e.target.checked },
                })
              }
            />
            Show Company Logo on Invoice
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.appearance?.showBankDetails !== false}
              onChange={(e) =>
                setForm({
                  ...form,
                  appearance: { ...form.appearance, showBankDetails: e.target.checked },
                })
              }
            />
            Show Bank Details on Invoice
          </label>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-700">
              Authorised Signature Image (Optional)
            </div>
            <p className="text-xs text-slate-500">
              Printed in the bottom-right signature box of every invoice.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleImageUpload(
                  e,
                  (url) =>
                    setForm({
                      ...form,
                      appearance: { ...form.appearance, signatureUrl: url },
                    }),
                  400
                )
              }
              className="pt-1 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700"
            />
          </div>
          {form.appearance?.signatureUrl && (
            <div className="flex items-center gap-3">
              <img
                src={form.appearance.signatureUrl}
                alt="Authorised Signature"
                className="h-14 w-32 rounded-lg object-contain bg-white border border-slate-200 p-1"
              />
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    appearance: { ...form.appearance, signatureUrl: '' },
                  })
                }
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Invoice Footer / Declaration
          </label>
          <textarea
            rows={2}
            value={form.declaration || ''}
            onChange={(e) => setForm({ ...form, declaration: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Default Terms &amp; Conditions
          </label>
          <textarea
            rows={2}
            value={form.appearance?.termsAndConditions || ''}
            onChange={(e) =>
              setForm({
                ...form,
                appearance: { ...form.appearance, termsAndConditions: e.target.value },
              })
            }
            placeholder="e.g. Goods once sold will not be taken back. Subject to Kancheepuram jurisdiction."
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
          />
        </div>
      </SectionCard>

      {/* Sticky Bottom Save Bar */}
      <div className="fixed bottom-4 left-0 right-0 z-20 px-4 pointer-events-none lg:pl-68">
        <div className="max-w-5xl mx-auto flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-4 w-4" /> {saving ? 'Saving Settings...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </form>
  );
}
