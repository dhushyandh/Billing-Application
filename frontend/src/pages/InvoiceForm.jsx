import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  Save,
  Search,
  Download,
  Printer,
  Package,
  CheckCircle2,
  X,
  FileText,
} from 'lucide-react';
import { api } from '../api/client.js';
import {
  GST_RATES,
  INDIAN_STATES,
  UNITS,
  computeInvoicePreview,
  formatINR,
  validateGSTIN,
  validateHSN,
} from '../utils/gst.js';
import { downloadInvoicePDF } from '../utils/pdfGenerator.js';

const EMPTY_ITEM = {
  productId: '',
  description: '',
  subDescription: '',
  hsnSac: '',
  quantity: 1,
  unit: 'NOS',
  rate: '',
  rateInclTax: '',
  isTaxInclusive: false,
  discountPercent: 0,
  gstRate: 18,
};

export default function InvoiceForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const convertFromId = searchParams.get('convertFrom');
  const bookingIdParam = searchParams.get('bookingId');
  const navigate = useNavigate();

  const productSearchRef = useRef(null);

  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState('');

  const [productQuery, setProductQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [documentType, setDocumentType] = useState('Tax Invoice');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [eWayBillNo, setEWayBillNo] = useState('');
  const [status, setStatus] = useState('Pending');

  const [buyer, setBuyer] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    isRegistered: false,
    gstin: '',
    stateCode: '33',
  });

  const [dispatchDetails, setDispatchDetails] = useState({
    modeOfPayment: 'Cash',
    buyersOrderNo: '',
    buyersOrderDate: '',
    dispatchedThrough: 'BY ROAD',
    destination: '',
    billOfLadingNo: '',
    motorVehicleNo: '',
    termsOfDelivery: '',
  });

  const [items, setItems] = useState([]);
  const [autoRoundOff, setAutoRoundOff] = useState(true);
  const [declaration, setDeclaration] = useState('');
  const [notes, setNotes] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [s, pList] = await Promise.all([api.getSettings(), api.getProducts()]);
        setSettings(s);
        setProducts(pList);
        setDeclaration(s.declaration || '');

        if (id) {
          const inv = await api.getInvoice(id);
          setDocumentType(inv.documentType);
          setInvoiceNumber(inv.invoiceNumber);
          setInvoiceDate(new Date(inv.invoiceDate).toISOString().slice(0, 10));
          setEWayBillNo(inv.eWayBillNo || '');
          setStatus(inv.status);
          setBuyer({
            name: inv.buyer?.name || '',
            address: inv.buyer?.address || '',
            phone: inv.buyer?.phone || '',
            email: inv.buyer?.email || '',
            isRegistered: Boolean(inv.buyer?.isRegistered),
            gstin: inv.buyer?.gstin || '',
            stateCode: inv.buyer?.stateCode || '33',
          });
          setDispatchDetails(inv.dispatchDetails || {});
          setItems(inv.items?.length ? inv.items : []);
          setAutoRoundOff(inv.totals?.autoRoundOff !== false);
          setNotes(inv.notes || '');
          if (inv.declaration) setDeclaration(inv.declaration);
        } else if (convertFromId) {
          const src = await api.getInvoice(convertFromId);
          const nextNum = await api.getNextInvoiceNumber('Tax Invoice');
          setDocumentType('Tax Invoice');
          setInvoiceNumber(nextNum.invoiceNumber);
          setBuyer({
            name: src.buyer?.name || '',
            address: src.buyer?.address || '',
            phone: src.buyer?.phone || '',
            email: src.buyer?.email || '',
            isRegistered: Boolean(src.buyer?.isRegistered),
            gstin: src.buyer?.gstin || '',
            stateCode: src.buyer?.stateCode || '33',
          });
          setDispatchDetails(src.dispatchDetails || {});
          setItems(src.items?.length ? src.items : []);
        } else if (bookingIdParam) {
          const [bk, nextNum] = await Promise.all([
            api.getBooking(bookingIdParam),
            api.getNextInvoiceNumber('Tax Invoice'),
          ]);
          setDocumentType('Tax Invoice');
          setInvoiceNumber(nextNum.invoiceNumber);
          setBuyer({
            name: bk.customer?.name || '',
            address: bk.customer?.address || '',
            phone: bk.customer?.phone || '',
            email: bk.customer?.email || '',
            isRegistered: Boolean(bk.customer?.isRegistered),
            gstin: bk.customer?.gstin || '',
            stateCode: bk.customer?.stateCode || '33',
          });
          setDispatchDetails((prev) => ({
            ...prev,
            referenceNoAndDate: `Booking ${bk.bookingId}`,
          }));
          setItems(
            bk.items?.length
              ? bk.items.map((it) => ({
                  productId: it.productId || '',
                  description: it.description,
                  subDescription: it.subDescription || '',
                  hsnSac: it.hsnSac,
                  quantity: it.quantity,
                  unit: it.unit,
                  rate: it.rate,
                  rateInclTax: it.rateInclTax,
                  isTaxInclusive: false,
                  discountPercent: 0,
                  gstRate: it.gstRate,
                }))
              : []
          );
        } else {
          const defType = s.numbering?.defaultInvoiceType || 'Tax Invoice';
          setDocumentType(defType);
          setAutoRoundOff(s.gstConfig?.autoRoundOff !== false);
          if (s.numbering?.defaultPaymentTerms) {
            setDispatchDetails((prev) => ({
              ...prev,
              modeOfPayment: s.numbering.defaultPaymentTerms,
            }));
          }
          if (s.gstConfig?.defaultPlaceOfSupply) {
            setBuyer((prev) => ({ ...prev, stateCode: s.gstConfig.defaultPlaceOfSupply }));
          }
          const nextNum = await api.getNextInvoiceNumber(defType);
          setInvoiceNumber(nextNum.invoiceNumber);
        }
      } catch (e) {
        setErrors([e.message]);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id, convertFromId, bookingIdParam]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        productSearchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const flashNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 2200);
  };

  const handleDocTypeChange = async (newType) => {
    setDocumentType(newType);
    if (!id) {
      try {
        const res = await api.getNextInvoiceNumber(newType);
        setInvoiceNumber(res.invoiceNumber);
      } catch {
        // ignore
      }
    }
  };

  const categories = useMemo(() => {
    const set = new Set(['All']);
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    return products.filter((p) => {
      const catOk = selectedCategory === 'All' || p.category === selectedCategory;
      const qOk =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.hsnSac?.includes(q);
      return catOk && qOk;
    });
  }, [products, selectedCategory, productQuery]);

  const addProductToInvoice = (p) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (it) =>
          (it.productId && it.productId === p._id) ||
          (!it.productId && it.description === p.name && it.hsnSac === p.hsnSac)
      );
      if (existingIdx !== -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: Number(next[existingIdx].quantity || 0) + 1,
        };
        return next;
      }
      return [
        ...prev,
        {
          productId: p._id,
          description: p.name,
          subDescription: p.subDescription || '',
          hsnSac: p.hsnSac,
          quantity: 1,
          unit: p.unit,
          rate: p.rate,
          rateInclTax: p.rateInclTax,
          isTaxInclusive: false,
          discountPercent: 0,
          gstRate: p.gstRate,
        },
      ];
    });
    flashNotice(`Added "${p.name}"`);
  };

  const handleProductSearchKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const q = productQuery.trim().toLowerCase();
    if (!q) return;
    const exact =
      products.find((p) => p.sku && p.sku.toLowerCase() === q) ||
      (filteredProducts.length === 1 ? filteredProducts[0] : null);
    if (exact) {
      addProductToInvoice(exact);
      setProductQuery('');
    }
  };

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const sellerStateCode = settings?.stateCode || '33';
  const preview = useMemo(
    () => computeInvoicePreview(items, sellerStateCode, buyer.stateCode || '33', autoRoundOff, 0),
    [items, sellerStateCode, buyer.stateCode, autoRoundOff]
  );

  const validateClient = () => {
    const errs = [];
    if (!invoiceNumber.trim()) errs.push('Invoice number is required.');
    if (!invoiceDate) errs.push('Invoice date is required.');
    if (!buyer.name.trim()) errs.push('Buyer name is required.');
    if (!buyer.address.trim()) errs.push('Billing address is required.');
    if (buyer.isRegistered) {
      const check = validateGSTIN(buyer.gstin);
      if (!check.valid) errs.push(`Buyer GSTIN: ${check.error}`);
    }
    if (items.length === 0) errs.push('Please add at least one product.');
    items.forEach((it, idx) => {
      const r = idx + 1;
      if (!it.description.trim()) errs.push(`Item ${r}: Description is required.`);
      const h = validateHSN(it.hsnSac);
      if (!h.valid) errs.push(`Item ${r}: ${h.error}`);
      if (!Number(it.quantity) || Number(it.quantity) <= 0) {
        errs.push(`Item ${r}: Quantity must be greater than 0.`);
      }
      if (!Number(it.rate) || Number(it.rate) <= 0) {
        errs.push(`Item ${r}: Price must be greater than 0.`);
      }
    });
    return errs;
  };

  const saveInvoice = async (mode) => {
    const clientErrs = validateClient();
    if (clientErrs.length > 0) {
      setErrors(clientErrs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors([]);
    setSaving(true);
    try {
      const payload = {
        documentType,
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        eWayBillNo,
        status: mode === 'draft' ? 'Draft' : status === 'Draft' ? 'Pending' : status,
        buyer,
        dispatchDetails,
        items,
        autoRoundOff,
        roundOff: preview.totals.roundOff,
        declaration,
        notes,
        ...(bookingIdParam ? { bookingId: bookingIdParam } : {}),
      };
      const saved = id
        ? await api.updateInvoice(id, payload)
        : await api.createInvoice(payload);

      if (mode === 'download') {
        downloadInvoicePDF(saved);
        navigate(`/invoices/${saved._id}`);
      } else if (mode === 'print') {
        navigate(`/invoices/${saved._id}?autoprint=1`);
      } else {
        navigate(`/invoices/${saved._id}`);
      }
    } catch (err) {
      setErrors(err.errors || [err.message]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading invoice builder...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Clean Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {id ? `Edit ${documentType}` : 'Create New Invoice'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Fill in buyer details, tap products to add them, and save or print.
          </p>
        </div>

        {/* Document Type Pills */}
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs self-start">
          {['Tax Invoice', 'Proforma Invoice', 'Credit Note'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleDocTypeChange(type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                documentType === type
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {notice}
        </div>
      )}

      {errors.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <div className="flex items-center gap-2 font-semibold mb-1.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Please check the following:
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* STEP 1: Invoice Details & Buyer Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="text-base font-bold text-slate-900">Invoice &amp; Buyer Details</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {preview.supplyType === 'INTRA' ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Invoice Number *
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Invoice Date *
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Mode
            </label>
            <select
              value={dispatchDetails.modeOfPayment || 'Cash'}
              onChange={(e) =>
                setDispatchDetails({ ...dispatchDetails, modeOfPayment: e.target.value })
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            >
              <option value="Cash">Cash</option>
              <option value="IMMEDIATE">Immediate</option>
              <option value="UPI">UPI</option>
              <option value="NEFT / RTGS">NEFT / RTGS</option>
              <option value="Credit">Credit</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Buyer / Business Name *
            </label>
            <input
              type="text"
              value={buyer.name}
              onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
              placeholder="e.g. Pattammalmani Traders"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mobile Number
            </label>
            <input
              type="tel"
              value={buyer.phone}
              onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
              placeholder="10-digit mobile number"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Billing Address *
          </label>
          <textarea
            rows={2}
            value={buyer.address}
            onChange={(e) => setBuyer({ ...buyer, address: e.target.value })}
            placeholder="Door No, Street, Area, City"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-56">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={buyer.isRegistered}
                onChange={(e) => setBuyer({ ...buyer, isRegistered: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              Buyer has GSTIN (B2B)
            </label>
          </div>

          {buyer.isRegistered && (
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Buyer GSTIN *
              </label>
              <input
                type="text"
                maxLength={15}
                value={buyer.gstin}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase();
                  setBuyer({
                    ...buyer,
                    gstin: v,
                    stateCode:
                      v.length >= 2 && INDIAN_STATES[v.slice(0, 2)]
                        ? v.slice(0, 2)
                        : buyer.stateCode,
                  });
                }}
                placeholder="33CEEPK1872G2ZN"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono uppercase focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              State (Place of Supply)
            </label>
            <select
              value={buyer.stateCode}
              onChange={(e) => setBuyer({ ...buyer, stateCode: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {Object.entries(INDIAN_STATES).map(([code, name]) => (
                <option key={code} value={code}>
                  {code} - {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* STEP 2: Pick Products from Catalogue */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h2 className="text-base font-bold text-slate-900">Select Products</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 flex-1 sm:w-64">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                ref={productSearchRef}
                type="text"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                onKeyDown={handleProductSearchKeyDown}
                placeholder="Search name, SKU, or scan (F2)..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((p) => (
            <button
              key={p._id}
              type="button"
              onClick={() => addProductToInvoice(p)}
              className="text-left rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-300 p-3.5 transition-all flex flex-col justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="h-12 w-12 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <Package className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                    {p.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {p.sku ? `${p.sku} · ` : ''}HSN {p.hsnSac}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/70 pt-2.5 w-full">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    ₹ {formatINR(p.rateInclTax || p.rate)}
                    <span className="text-xs font-normal text-slate-500"> / {p.unit}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{p.gstRate}% GST</div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white">
                  <Plus className="h-3.5 w-3.5" /> Add
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 3: Review Items & Totals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Items List */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Invoice Items ({items.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Custom Item
            </button>
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-400">
              Tap any product above to add it to this invoice.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => {
                const comp = preview.computedItems[idx] || {};
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {item.productId ? (
                          <>
                            <div className="text-sm font-bold text-slate-900">
                              {idx + 1}. {item.description}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              HSN: {item.hsnSac} · Unit: {item.unit} · {item.gstRate}% GST
                            </div>
                          </>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                              type="text"
                              placeholder="Item description *"
                              value={item.description}
                              onChange={(e) => updateItem(idx, { description: e.target.value })}
                              className="sm:col-span-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium"
                            />
                            <input
                              type="text"
                              maxLength={8}
                              placeholder="HSN/SAC *"
                              value={item.hsnSac}
                              onChange={(e) =>
                                updateItem(idx, { hsnSac: e.target.value.replace(/\D/g, '') })
                              }
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-mono"
                            />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Quantity ({item.unit})
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(idx, {
                                quantity: Math.max(1, Number(item.quantity || 1) - 1),
                              })
                            }
                            className="rounded-l-lg border border-slate-300 bg-white px-2 py-1.5 hover:bg-slate-100"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                            className="w-full border-y border-slate-300 bg-white px-2 py-1.5 text-center text-sm font-semibold outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(idx, { quantity: Number(item.quantity || 0) + 1 })
                            }
                            className="rounded-r-lg border border-slate-300 bg-white px-2 py-1.5 hover:bg-slate-100"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Rate (Excl. Tax)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.rate}
                          onChange={(e) =>
                            updateItem(idx, { rate: e.target.value, isTaxInclusive: false })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-right text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Discount %
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) => updateItem(idx, { discountPercent: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-right text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          GST %
                        </label>
                        <select
                          value={item.gstRate}
                          onChange={(e) => updateItem(idx, { gstRate: Number(e.target.value) })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
                        >
                          {GST_RATES.map((r) => (
                            <option key={r} value={r}>
                              {r}%
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-500">Line Total</div>
                        <div className="text-base font-bold text-slate-900">
                          ₹ {formatINR(comp.lineTotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary & Actions Card */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4 lg:sticky lg:top-20">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Bill Summary
          </h3>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value</span>
              <span className="font-semibold text-slate-900">
                ₹ {formatINR(preview.totals.subtotalTaxable)}
              </span>
            </div>

            {preview.supplyType === 'INTRA' ? (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>CGST</span>
                  <span>₹ {formatINR(preview.totals.totalCgst)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST</span>
                  <span>₹ {formatINR(preview.totals.totalSgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-slate-600">
                <span>IGST</span>
                <span>₹ {formatINR(preview.totals.totalIgst)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Round Off</span>
              <span>₹ {formatINR(preview.totals.roundOff)}</span>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-lg font-extrabold text-indigo-700">
              <span>Grand Total</span>
              <span>₹ {formatINR(preview.totals.grandTotal)}</span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 leading-relaxed">
              {preview.amountInWords}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMoreOptions(true)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <FileText className="h-3.5 w-3.5" /> Add Dispatch / Vehicle / Notes
          </button>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => saveInvoice('print')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 cursor-pointer disabled:opacity-50"
            >
              <Printer className="h-4 w-4" /> {saving ? 'Saving...' : 'Save & Print Invoice'}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => saveInvoice('download')}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> Save &amp; PDF
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => saveInvoice('draft')}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" /> Save Draft
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Dispatch & Notes Modal */}
      {showMoreOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">Dispatch &amp; Extra Details</h3>
              <button
                type="button"
                onClick={() => setShowMoreOptions(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                ['buyersOrderNo', "Buyer's Order No."],
                ['buyersOrderDate', "Buyer's Order Date"],
                ['dispatchedThrough', 'Dispatched through'],
                ['destination', 'Destination'],
                ['billOfLadingNo', 'Bill of Lading/LR-RR No.'],
                ['motorVehicleNo', 'Motor Vehicle No.'],
                ['termsOfDelivery', 'Terms of Delivery'],
                ['eWayBillNo', 'e-Way Bill No.'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block font-medium text-slate-700 mb-1">{label}</label>
                  <input
                    type="text"
                    value={key === 'eWayBillNo' ? eWayBillNo : dispatchDetails[key] || ''}
                    onChange={(e) =>
                      key === 'eWayBillNo'
                        ? setEWayBillNo(e.target.value)
                        : setDispatchDetails({ ...dispatchDetails, [key]: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Optional invoice notes..."
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowMoreOptions(false)}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
