import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Eye, Download, Pencil, Trash2, Plus, FileCheck2 } from 'lucide-react';
import { api } from '../api/client.js';
import { formatINR, formatInvoiceDate } from '../utils/gst.js';
import { downloadInvoicePDF } from '../utils/pdfGenerator.js';

const STATUS_BADGE = {
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

const DOC_TYPES = ['All', 'Tax Invoice', 'Proforma Invoice', 'Credit Note'];

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [documentType, setDocumentType] = useState('All');
  const [status, setStatus] = useState('All');
  const navigate = useNavigate();

  const load = async (q = search, doc = documentType, st = status) => {
    setLoading(true);
    setError('');
    try {
      const list = await api.getInvoices({ search: q, documentType: doc, status: st });
      setInvoices(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(search, documentType, status);
  }, [documentType, status]);

  const handleStatusChange = async (id, newStatus) => {
    await api.updateInvoiceStatus(id, newStatus);
    load();
  };

  const handleDelete = async (id, num) => {
    if (!window.confirm(`Delete invoice "${num}"?`)) return;
    await api.deleteInvoice(id);
    load();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoice History</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Search, print, download PDFs, or convert Proforma invoices into Tax Invoices.
          </p>
        </div>
        <Link
          to="/invoices/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 shadow-xs"
        >
          <Plus className="h-4 w-4" /> Create Invoice
        </Link>
      </div>

      {/* Clean Search & Filter Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                load(e.target.value, documentType, status);
              }}
              placeholder="Search by invoice #, buyer name, or GSTIN..."
              className="w-full text-sm outline-none bg-transparent"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="sm:w-44 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Draft">Draft</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {DOC_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setDocumentType(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                documentType === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'All' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Mobile Card View */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No invoices match your filters.
          </div>
        ) : (
          invoices.map((inv) => (
            <div
              key={inv._id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    to={`/invoices/${inv._id}`}
                    className="text-base font-bold text-indigo-600 hover:underline"
                  >
                    #{inv.invoiceNumber}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {inv.documentType} · {formatInvoiceDate(inv.invoiceDate)}
                  </div>
                </div>
                <select
                  value={inv.status}
                  onChange={(e) => handleStatusChange(inv._id, e.target.value)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    STATUS_BADGE[inv.status] || STATUS_BADGE.Draft
                  }`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Draft">Draft</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="text-sm font-semibold text-slate-900">{inv.buyer?.name}</div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                <div>
                  <div className="text-xs text-slate-500">
                    Taxable: ₹{formatINR(inv.totals?.subtotalTaxable)} · GST: ₹
                    {formatINR(inv.totals?.totalTax)}
                  </div>
                  <div className="text-base font-bold text-slate-900">
                    ₹ {formatINR(inv.totals?.grandTotal)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Link
                    to={`/invoices/${inv._id}`}
                    className="rounded-lg border border-slate-200 p-2 text-slate-600"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => downloadInvoicePDF(inv)}
                    className="rounded-lg border border-slate-200 p-2 text-indigo-600"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <Link
                    to={`/invoices/${inv._id}/edit`}
                    className="rounded-lg border border-slate-200 p-2 text-slate-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3.5">Invoice #</th>
              <th className="px-5 py-3.5">Date</th>
              <th className="px-5 py-3.5">Buyer</th>
              <th className="px-5 py-3.5">Type</th>
              <th className="px-5 py-3.5 text-right">Taxable</th>
              <th className="px-5 py-3.5 text-right">GST</th>
              <th className="px-5 py-3.5 text-right">Total</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-slate-500">
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-slate-500">
                  No invoices match your filters.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3.5 font-bold text-indigo-600">
                    <Link to={`/invoices/${inv._id}`} className="hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                    {formatInvoiceDate(inv.invoiceDate)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900">{inv.buyer?.name}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      {inv.buyer?.isRegistered ? inv.buyer?.gstin : 'Unregistered'}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 whitespace-nowrap">
                      {inv.documentType}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-700">
                    ₹ {formatINR(inv.totals?.subtotalTaxable)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-700">
                    ₹ {formatINR(inv.totals?.totalTax)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                    ₹ {formatINR(inv.totals?.grandTotal)}
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={inv.status}
                      onChange={(e) => handleStatusChange(inv._id, e.target.value)}
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold cursor-pointer ${
                        STATUS_BADGE[inv.status] || STATUS_BADGE.Draft
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Draft">Draft</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        to={`/invoices/${inv._id}`}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        title="View / Print"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => downloadInvoicePDF(inv)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {inv.documentType === 'Proforma Invoice' && (
                        <button
                          onClick={() => navigate(`/invoices/new?convertFrom=${inv._id}`)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 cursor-pointer"
                          title="Convert to Tax Invoice"
                        >
                          <FileCheck2 className="h-4 w-4" />
                        </button>
                      )}
                      <Link
                        to={`/invoices/${inv._id}/edit`}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(inv._id, inv.invoiceNumber)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                        title="Delete"
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
    </div>
  );
}
