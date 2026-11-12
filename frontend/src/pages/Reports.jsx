import { useEffect, useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { api } from '../api/client.js';
import { formatINR, formatInvoiceDate } from '../utils/gst.js';

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [documentType, setDocumentType] = useState('All');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getGstReport({ startDate, endDate, documentType });
      setReport(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [documentType]);

  const exportCsv = () => {
    if (!report?.invoices?.length) return;
    const headers = [
      'Invoice No',
      'Date',
      'Document Type',
      'Buyer Name',
      'Buyer GSTIN',
      'Supply Type',
      'Taxable Value',
      'CGST',
      'SGST',
      'IGST',
      'Total Tax',
      'Grand Total',
    ];
    const rows = report.invoices.map((inv) => [
      inv.invoiceNumber,
      formatInvoiceDate(inv.invoiceDate),
      inv.documentType,
      `"${(inv.buyer?.name || '').replace(/"/g, '""')}"`,
      inv.buyer?.gstin || 'Unregistered',
      inv.supplyType,
      inv.totals?.subtotalTaxable,
      inv.totals?.totalCgst,
      inv.totals?.totalSgst,
      inv.totals?.totalIgst,
      inv.totals?.totalTax,
      inv.totals?.grandTotal,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IJAZ_TRADERS_GST_Report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const s = report?.summary || {};

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">GST Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Taxable value, CGST, SGST, IGST, and HSN/SAC summaries for GSTR filing.
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!report?.invoices?.length}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 cursor-pointer self-start shadow-xs"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Document Scope</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
          >
            <option value="All">Tax Invoices + Credit Notes</option>
            <option value="Tax Invoice">Tax Invoice Only</option>
            <option value="Credit Note">Credit Note Only</option>
            <option value="Proforma Invoice">Proforma Invoice Only</option>
          </select>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer"
        >
          <Filter className="h-4 w-4" /> Apply Filter
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Calculating GST report...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            {[
              ['Taxable Value', s.taxableValue, 'text-slate-900'],
              ['CGST', s.cgst, 'text-blue-700'],
              ['SGST', s.sgst, 'text-blue-700'],
              ['IGST', s.igst, 'text-indigo-700'],
              ['Total GST', s.totalTax, 'text-emerald-700'],
              ['Invoice Total', s.grandTotal, 'text-slate-900'],
            ].map(([label, val, color]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
              >
                <div className="text-xs font-medium text-slate-500">{label}</div>
                <div className={`mt-1.5 text-lg font-bold ${color}`}>₹ {formatINR(val)}</div>
              </div>
            ))}
          </div>

          {/* B2B vs B2C & Rate Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">B2B vs B2C Summary</h2>
              <table className="w-full text-sm text-left">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2">Segment</th>
                    <th className="py-2 text-right">Count</th>
                    <th className="py-2 text-right">Taxable (₹)</th>
                    <th className="py-2 text-right">Tax (₹)</th>
                    <th className="py-2 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 font-medium">B2B (Registered GSTIN)</td>
                    <td className="py-2.5 text-right">{report.b2b?.count || 0}</td>
                    <td className="py-2.5 text-right">{formatINR(report.b2b?.taxableValue)}</td>
                    <td className="py-2.5 text-right">{formatINR(report.b2b?.totalTax)}</td>
                    <td className="py-2.5 text-right font-semibold">
                      {formatINR(report.b2b?.grandTotal)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium">B2C (Unregistered)</td>
                    <td className="py-2.5 text-right">{report.b2c?.count || 0}</td>
                    <td className="py-2.5 text-right">{formatINR(report.b2c?.taxableValue)}</td>
                    <td className="py-2.5 text-right">{formatINR(report.b2c?.totalTax)}</td>
                    <td className="py-2.5 text-right font-semibold">
                      {formatINR(report.b2c?.grandTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Rate-wise GST Breakdown</h2>
              <table className="w-full text-sm text-left">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2">GST Slab</th>
                    <th className="py-2 text-right">Taxable (₹)</th>
                    <th className="py-2 text-right">CGST (₹)</th>
                    <th className="py-2 text-right">SGST (₹)</th>
                    <th className="py-2 text-right">IGST (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(report.rateBreakdown || []).map((r) => (
                    <tr key={r.rateLabel}>
                      <td className="py-2 font-semibold">{r.rateLabel}</td>
                      <td className="py-2 text-right">{formatINR(r.taxableValue)}</td>
                      <td className="py-2 text-right">{formatINR(r.cgst)}</td>
                      <td className="py-2 text-right">{formatINR(r.sgst)}</td>
                      <td className="py-2 text-right">{formatINR(r.igst)}</td>
                    </tr>
                  ))}
                  {(!report.rateBreakdown || report.rateBreakdown.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No records in range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* HSN/SAC Summary */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">HSN/SAC Summary</h2>
            <table className="w-full text-sm text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">HSN/SAC</th>
                  <th className="px-3 py-2 text-right">GST Rate</th>
                  <th className="px-3 py-2 text-right">Taxable Value (₹)</th>
                  <th className="px-3 py-2 text-right">CGST (₹)</th>
                  <th className="px-3 py-2 text-right">SGST (₹)</th>
                  <th className="px-3 py-2 text-right">IGST (₹)</th>
                  <th className="px-3 py-2 text-right">Total Tax (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(report.hsnBreakdown || []).map((h, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-mono font-medium">{h.hsnSac}</td>
                    <td className="px-3 py-2 text-right">{h.gstRate}%</td>
                    <td className="px-3 py-2 text-right">{formatINR(h.taxableValue)}</td>
                    <td className="px-3 py-2 text-right">{formatINR(h.cgstAmount)}</td>
                    <td className="px-3 py-2 text-right">{formatINR(h.sgstAmount)}</td>
                    <td className="px-3 py-2 text-right">{formatINR(h.igstAmount)}</td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {formatINR(h.totalTaxAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

