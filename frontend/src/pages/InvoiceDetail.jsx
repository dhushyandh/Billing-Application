import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Pencil, FileCheck2 } from 'lucide-react';
import { api } from '../api/client.js';
import InvoicePreview from '../components/InvoicePreview.jsx';
import { downloadInvoicePDF } from '../utils/pdfGenerator.js';

export default function InvoiceDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get('autoprint') === '1';
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getInvoice(id)
      .then((inv) => {
        setInvoice(inv);
        if (autoPrint) {
          setTimeout(() => window.print(), 400);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, autoPrint]);

  if (loading) return <div className="py-12 text-center text-sm text-slate-500">Loading invoice...</div>;
  if (error) return <div className="p-4 text-sm text-rose-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="text-base font-bold text-slate-900">
              {invoice.documentType} #{invoice.invoiceNumber}
            </div>
            <div className="text-xs text-slate-500">
              {invoice.buyer?.name} · Status: {invoice.status}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {invoice.documentType === 'Proforma Invoice' && (
            <button
              onClick={() => navigate(`/invoices/new?convertFrom=${invoice._id}`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 cursor-pointer"
            >
              <FileCheck2 className="h-4 w-4" /> Convert to Tax Invoice
            </button>
          )}
          <Link
            to={`/invoices/${invoice._id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
          <button
            onClick={() => downloadInvoicePDF(invoice)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
          >
            <Download className="h-4 w-4" /> Download PDF
          </button>
        </div>
      </div>

      <InvoicePreview invoice={invoice} />
    </div>
  );
}

