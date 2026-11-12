import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  Receipt,
  Clock,
  FileText,
  ArrowRight,
  Package,
  AlertCircle,
  Plus,
  ClipboardList,
  BarChart3,
} from 'lucide-react';
import { api } from '../api/client.js';
import { formatINR, formatInvoiceDate } from '../utils/gst.js';
import AnalyticsSection from '../components/AnalyticsSection.jsx';

const STATUS_STYLE = {
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    const onUpdated = (e) => {
      if (e.detail?.name) {
        setData((prev) => (prev ? { ...prev, companyName: e.detail.name } : prev));
      }
    };
    window.addEventListener('settings-updated', onUpdated);
    return () => window.removeEventListener('settings-updated', onUpdated);
  }, []);

  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const { kpis, monthlyChart, recentInvoices } = data;
  const maxRev = Math.max(...(monthlyChart || []).map((m) => m.revenue), 1);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Header & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Sales overview &amp; GST summary for {data.companyName || 'IJAZ TRADERS'}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/bookings"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <ClipboardList className="h-3.5 w-3.5 text-indigo-600" /> Bookings
          </Link>
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <BarChart3 className="h-3.5 w-3.5 text-emerald-600" /> GST Reports
          </Link>
          {/* <Link
            to="/invoices/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs"
          >
            <Plus className="h-4 w-4" /> Create Invoice
          </Link> */}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Sales (Tax Inv.)</span>
            <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
              <IndianRupee className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            ₹ {formatINR(kpis.totalRevenue)}
          </div>
          <p className="mt-1 text-xs text-slate-500">Paid: ₹ {formatINR(kpis.paidRevenue)}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total GST Collected</span>
            <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <Receipt className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            ₹ {formatINR(kpis.totalGst)}
          </div>
          <p className="mt-1 text-xs text-slate-500">CGST + SGST + IGST</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Pending Amount</span>
            <span className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            ₹ {formatINR(kpis.pendingAmount)}
          </div>
          <p className="mt-1 text-xs text-slate-500">Awaiting payment</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Documents</span>
            <span className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
              <FileText className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{kpis.totalInvoices}</div>
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <Package className="h-3 w-3 text-slate-400" /> {kpis.productCount} Active Products
          </p>
        </div>
      </div>

      {/* Main Grid: Recent Invoices & Revenue Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Invoices</h2>
            <Link
              to="/invoices"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentInvoices.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">No invoices yet.</div>
            ) : (
              recentInvoices.map((inv) => (
                <Link
                  key={inv._id}
                  to={`/invoices/${inv._id}`}
                  className="flex items-center justify-between gap-3 py-3.5 hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{inv.invoiceNumber}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {inv.documentType}
                      </span>
                    </div>
                    <div className="truncate text-xs text-slate-500 mt-0.5">
                      {inv.buyer?.name} · {formatInvoiceDate(inv.invoiceDate)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        ₹ {formatINR(inv.totals?.grandTotal)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        GST: ₹ {formatINR(inv.totals?.totalTax)}
                      </div>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        STATUS_STYLE[inv.status] || STATUS_STYLE.Draft
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Revenue Overview</h2>
            <p className="text-xs text-slate-500 mt-0.5">Monthly Tax Invoice revenue</p>
          </div>

          <div className="mt-6 flex items-end gap-3 h-52 pt-4 border-b border-slate-200">
            {monthlyChart.length === 0 ? (
              <div className="w-full text-center text-sm text-slate-400 self-center">
                No tax invoice data yet.
              </div>
            ) : (
              monthlyChart.map((m) => {
                const heightPct = Math.max(8, Math.round((m.revenue / maxRev) * 100));
                return (
                  <div
                    key={m.monthKey}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                  >
                    <div className="text-[11px] font-semibold text-slate-600">
                      ₹{Math.round(m.revenue / 1000)}k
                    </div>
                    <div
                      className="w-full max-w-[44px] rounded-t-lg bg-indigo-600 transition-all hover:bg-indigo-700"
                      style={{ height: `${heightPct}%` }}
                      title={`Revenue: ₹${formatINR(m.revenue)} | GST: ₹${formatINR(m.gst)}`}
                    />
                  </div>
                );
              })
            )}
          </div>
          <div className="flex gap-3 pt-2">
            {monthlyChart.map((m) => (
              <div
                key={m.monthKey}
                className="flex-1 text-center text-xs font-medium text-slate-500"
              >
                {m.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MongoDB Aggregation Recharts Analytics */}
      <AnalyticsSection />
    </div>
  );
}
