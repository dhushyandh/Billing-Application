import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, RefreshCw, FilePlus2, Eye, Phone, MapPin } from 'lucide-react';
import { api } from '../api/client.js';
import { formatINR, formatInvoiceDate } from '../utils/gst.js';

const STATUS_STYLE = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const load = async (q = search, st = status) => {
    setLoading(true);
    try {
      const list = await api.getBookings({ search: q, status: st });
      setBookings(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(search, status);
    const timer = setInterval(() => {
      api.getBookings({ search, status }).then(setBookings).catch(() => {});
    }, 15000);
    return () => clearInterval(timer);
  }, [status]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updated = await api.updateBookingStatus(id, newStatus);
      setBookings((prev) => prev.map((b) => (b._id === id ? updated : b)));
      if (selected?._id === id) setSelected(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Pre-Bookings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Incoming storefront orders ready for one-click GST billing.
          </p>
        </div>
        <button
          onClick={() => load()}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer self-start"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Search & Status Pills */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              load(e.target.value, status);
            }}
            placeholder="Search by Booking ID (BK-1001), customer name, or mobile number..."
            className="w-full text-sm outline-none bg-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatus(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                status === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'All' ? 'All Bookings' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table & Detail Split */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
        <div className="lg:col-span-7 space-y-3">
          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                Loading bookings...
              </div>
            ) : bookings.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                No bookings found.
              </div>
            ) : (
              bookings.map((b) => (
                <div
                  key={b._id}
                  onClick={() => setSelected(b)}
                  className={`rounded-xl border p-4 shadow-2xs space-y-2.5 cursor-pointer ${
                    selected?._id === b._id
                      ? 'border-indigo-400 bg-indigo-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">{b.bookingId}</div>
                      <div className="text-xs text-slate-500">
                        {formatInvoiceDate(b.createdAt)} · {b.customer?.phone}
                      </div>
                    </div>
                    <select
                      value={b.status}
                      disabled={Boolean(b.invoiceId)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStatusChange(b._id, e.target.value)}
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_STYLE[b.status] || STATUS_STYLE.Pending
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{b.customer?.name}</div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="text-base font-bold text-slate-900">
                      ₹ {formatINR(b.estimatedTotal)}
                    </span>
                    <div onClick={(e) => e.stopPropagation()}>
                      {b.invoiceId ? (
                        <Link
                          to={`/invoices/${b.invoiceId}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                        >
                          <Eye className="h-3.5 w-3.5" /> {b.invoiceNumber}
                        </Link>
                      ) : b.status !== 'Cancelled' ? (
                        <button
                          onClick={() => navigate(`/invoices/new?bookingId=${b._id}`)}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          <FilePlus2 className="h-3.5 w-3.5" /> Bill Now
                        </button>
                      ) : null}
                    </div>
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
                <th className="px-4 py-3">Booking ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 text-right">Est. Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Billing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading bookings...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr
                    key={b._id}
                    onClick={() => setSelected(b)}
                    className={`cursor-pointer hover:bg-slate-50 ${
                      selected?._id === b._id ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{b.bookingId}</div>
                      <div className="text-[11px] text-slate-400">
                        {formatInvoiceDate(b.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{b.customer?.name}</div>
                      <div className="text-xs text-slate-500">{b.customer?.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      ₹ {formatINR(b.estimatedTotal)}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={b.status}
                        disabled={Boolean(b.invoiceId)}
                        onChange={(e) => handleStatusChange(b._id, e.target.value)}
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_STYLE[b.status] || STATUS_STYLE.Pending
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {b.invoiceId ? (
                        <Link
                          to={`/invoices/${b.invoiceId}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          <Eye className="h-3.5 w-3.5" /> {b.invoiceNumber}
                        </Link>
                      ) : b.status === 'Cancelled' ? (
                        <span className="text-xs text-slate-400">Cancelled</span>
                      ) : (
                        <button
                          onClick={() => navigate(`/invoices/new?bookingId=${b._id}`)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                        >
                          <FilePlus2 className="h-3.5 w-3.5" /> Bill
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Selected Booking Detail Card */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          {!selected ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Select a booking row to review customer &amp; product details.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                    Booking Details
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">{selected.bookingId}</h2>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    STATUS_STYLE[selected.status]
                  }`}
                >
                  {selected.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="font-bold text-sm text-slate-900">{selected.customer?.name}</div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> {selected.customer?.phone}
                </div>
                <div className="flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span>{selected.customer?.address}</span>
                </div>
                {selected.customer?.isRegistered && (
                  <div className="font-mono text-[11px] text-blue-700 pt-1">
                    GSTIN: {selected.customer.gstin} ({selected.customer.stateName})
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs font-semibold uppercase text-slate-500 mb-2">
                  Requested Products
                </div>
                <div className="space-y-2">
                  {(selected.items || []).map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 p-2.5 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{it.description}</div>
                        <div className="text-[11px] text-slate-500">
                          {it.quantity} {it.unit} × ₹{formatINR(it.rateInclTax)} (Incl. {it.gstRate}% GST)
                        </div>
                      </div>
                      <div className="font-bold text-slate-900 shrink-0">
                        ₹ {formatINR(it.lineTotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selected.notes && (
                <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
                  <span className="font-semibold">Customer Note:</span> {selected.notes}
                </div>
              )}

              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Estimated Total</div>
                  <div className="text-lg font-bold text-slate-900">
                    ₹ {formatINR(selected.estimatedTotal)}
                  </div>
                </div>
                {selected.invoiceId ? (
                  <Link
                    to={`/invoices/${selected.invoiceId}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <Eye className="h-4 w-4" /> View Invoice {selected.invoiceNumber}
                  </Link>
                ) : selected.status !== 'Cancelled' ? (
                  <button
                    onClick={() => navigate(`/invoices/new?bookingId=${selected._id}`)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                  >
                    <FilePlus2 className="h-4 w-4" /> Review &amp; Generate Invoice
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

