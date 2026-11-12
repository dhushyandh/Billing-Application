import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { AlertCircle, Calendar, RefreshCw } from 'lucide-react';
import { api } from '../api/client.js';
import { formatINR } from '../utils/gst.js';

const RANGE_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
  { id: 'custom', label: 'Custom' },
];

const GRANULARITY_OPTIONS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

const GST_COLORS = ['#4f46e5', '#3b82f6', '#8b5cf6'];
const PAY_COLORS = ['#4f46e5', '#10b981', '#3b82f6', '#f59e0b'];

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex-1 min-h-[260px] w-full">{children}</div>
    </div>
  );
}

function EmptyState({ message = 'No data available for the selected date range.' }) {
  return (
    <div className="h-[260px] flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-xs text-slate-400 text-center px-4">
      {message}
    </div>
  );
}

const CurrencyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs space-y-1">
      {label && <div className="font-bold text-slate-900 mb-1">{label}</div>}
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            {entry.name}:
          </span>
          <span className="font-bold text-slate-900">
            {entry.dataKey === 'quantity' ||
            entry.dataKey === 'count' ||
            entry.dataKey === 'incoming' ||
            entry.dataKey === 'completed'
              ? entry.value
              : `₹ ${formatINR(entry.value)}`}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsSection() {
  const [range, setRange] = useState('all');
  const [granularity, setGranularity] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAnalytics({
        range,
        granularity,
        ...(range === 'custom' ? { startDate, endDate } : {}),
      });
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (range === 'custom' && !startDate && !endDate) return;
    load();
  }, [range, granularity, startDate, endDate]);

  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 mr-1">
              <Calendar className="h-3.5 w-3.5 text-indigo-600" /> Period:
            </span>
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRange(opt.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  range === opt.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1">View:</span>
            {GRANULARITY_OPTIONS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGranularity(g.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  granularity === g.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {range === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-600">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-600">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5"
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </span>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1 rounded-lg bg-white border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-80 rounded-2xl border border-slate-200 bg-white p-5 animate-pulse"
            >
              <div className="h-4 w-40 rounded bg-slate-200 mb-2" />
              <div className="h-3 w-56 rounded bg-slate-100 mb-6" />
              <div className="h-52 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* 1. Sales Overview – Area Chart */}
          <ChartCard
            title="Sales Overview"
            subtitle="Taxable & total sales trend (excludes cancelled invoices)"
            className="lg:col-span-6"
          >
            {data.salesOverview.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data.salesOverview}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Total Sales"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="taxable"
                    name="Taxable Value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* 2. Revenue vs Expenses – Bar Chart */}
          <ChartCard
            title="Revenue vs Expenses & Profit"
            subtitle="Revenue compared against product purchase cost & net profit"
            className="lg:col-span-6"
          >
            {data.revenueVsExpenses.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.revenueVsExpenses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* 3. GST Breakdown – Donut Chart */}
          <ChartCard
            title="GST Breakdown"
            subtitle="CGST, SGST, and IGST collected"
            className="lg:col-span-4"
          >
            {data.gstBreakdown.length === 0 ? (
              <EmptyState message="No GST collected in selected period." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data.gstBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={4}
                  >
                    {data.gstBreakdown.map((_, idx) => (
                      <Cell key={idx} fill={GST_COLORS[idx % GST_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* 4. Top Selling Products – Horizontal Bar Chart */}
          <ChartCard
            title="Top Selling Products"
            subtitle="Ranked by total sales revenue"
            className="lg:col-span-8"
          >
            {data.topProducts.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.topProducts} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fontSize: 11, fill: '#334155' }}
                  />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Revenue (₹)" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* 5. Payment Methods – Donut Chart */}
          <ChartCard
            title="Payment Methods"
            subtitle="Cash, UPI, Bank Transfer & Credit distribution"
            className="lg:col-span-4"
          >
            {data.paymentMethods.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data.paymentMethods}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={4}
                  >
                    {data.paymentMethods.map((_, idx) => (
                      <Cell key={idx} fill={PAY_COLORS[idx % PAY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* 6. Invoice Statistics – Bar Chart */}
          <ChartCard
            title="Invoice Statistics"
            subtitle="Paid, Pending, Unpaid/Draft & Cancelled counts"
            className="lg:col-span-4"
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.invoiceStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip content={<CurrencyTooltip />} />
                <Bar dataKey="count" name="Invoices" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 7. Booking Analytics – Line Chart */}
          <ChartCard
            title="Booking Analytics"
            subtitle="Incoming storefront bookings vs completed orders"
            className="lg:col-span-4"
          >
            {data.bookingAnalytics.length === 0 ? (
              <EmptyState message="No bookings in selected period." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.bookingAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="incoming"
                    name="Incoming Bookings"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    name="Completed Orders"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      ) : null}
    </div>
  );
}

