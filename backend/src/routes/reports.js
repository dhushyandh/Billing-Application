import express from 'express';
import mongoose from 'mongoose';
import '../models/Booking.js';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import Settings from '../models/Settings.js';
import { round2 } from '../utils/gstValidation.js';

const router = express.Router();

router.get('/dashboard', async (_req, res) => {
  try {
    const [invoices, customerCount, productCount, settings] = await Promise.all([
      Invoice.find({ status: { $ne: 'Cancelled' } }).sort({ invoiceDate: -1, createdAt: -1 }),
      Customer.countDocuments(),
      Product.countDocuments(),
      Settings.findOne(),
    ]);

    let totalRevenue = 0;
    let totalGst = 0;
    let pendingAmount = 0;
    let paidRevenue = 0;

    const monthlyMap = new Map();

    for (const inv of invoices) {
      const sign = inv.documentType === 'Credit Note' ? -1 : 1;
      const grand = sign * (inv.totals?.grandTotal || 0);
      const tax = sign * (inv.totals?.totalTax || 0);

      if (inv.documentType !== 'Proforma Invoice') {
        totalRevenue = round2(totalRevenue + grand);
        totalGst = round2(totalGst + tax);
      }

      if (inv.status === 'Pending') {
        pendingAmount = round2(pendingAmount + (inv.totals?.grandTotal || 0));
      } else if (inv.status === 'Paid') {
        paidRevenue = round2(paidRevenue + grand);
      }

      const d = new Date(inv.invoiceDate);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      const entry = monthlyMap.get(monthKey) || { monthKey, label, revenue: 0, gst: 0 };
      if (inv.documentType !== 'Proforma Invoice') {
        entry.revenue = round2(entry.revenue + grand);
        entry.gst = round2(entry.gst + tax);
      }
      monthlyMap.set(monthKey, entry);
    }

    const monthlyChart = Array.from(monthlyMap.values())
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(-6);

    res.json({
      companyName: settings?.name || 'IJAZ TRADERS',
      kpis: {
        totalRevenue,
        paidRevenue,
        totalGst,
        pendingAmount,
        totalInvoices: invoices.length,
        customerCount,
        productCount,
      },
      monthlyChart,
      recentInvoices: invoices.slice(0, 6),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function resolveDateRange(range, startDate, endDate) {
  const now = new Date();
  let start = null;
  let end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (range === 'today') {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
  } else if (range === '7d') {
    start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (range === '30d') {
    start = new Date(now);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  } else if (range === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  } else if (range === 'year') {
    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  } else if (range === 'custom' && (startDate || endDate)) {
    start = startDate ? new Date(startDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    if (endDate) {
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }
  } else {
    start = null;
    end = null;
  }

  return { start, end };
}

function getDateGroupFormat(granularity) {
  if (granularity === 'daily') return '%Y-%m-%d';
  if (granularity === 'weekly') return '%Y-W%V';
  if (granularity === 'yearly') return '%Y';
  return '%Y-%m';
}

router.get('/analytics', async (req, res) => {
  try {
    const { range = 'all', startDate, endDate, granularity = 'monthly' } = req.query;
    const { start, end } = resolveDateRange(range, startDate, endDate);
    const dateFmt = getDateGroupFormat(granularity);

    const invoiceDateMatch = {};
    if (start) invoiceDateMatch.$gte = start;
    if (end) invoiceDateMatch.$lte = end;
    const hasDateFilter = Object.keys(invoiceDateMatch).length > 0;

    const activeSalesMatch = {
      status: { $ne: 'Cancelled' },
      documentType: { $in: ['Tax Invoice', 'Credit Note'] },
      ...(hasDateFilter ? { invoiceDate: invoiceDateMatch } : {}),
    };

    const allInvoicesMatch = hasDateFilter ? { invoiceDate: invoiceDateMatch } : {};
    const bookingDateMatch = hasDateFilter ? { createdAt: invoiceDateMatch } : {};

    const [
      salesTrendRaw,
      revExpRaw,
      gstRaw,
      topProductsRaw,
      paymentMethodsRaw,
      invoiceStatsRaw,
      bookingTrendRaw,
    ] = await Promise.all([
      // 1. Sales Overview (Area Chart)
      Invoice.aggregate([
        { $match: activeSalesMatch },
        {
          $addFields: {
            sign: { $cond: [{ $eq: ['$documentType', 'Credit Note'] }, -1, 1] },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: dateFmt, date: '$invoiceDate' } },
            sales: { $sum: { $multiply: ['$sign', '$totals.grandTotal'] } },
            taxable: { $sum: { $multiply: ['$sign', '$totals.subtotalTaxable'] } },
            gst: { $sum: { $multiply: ['$sign', '$totals.totalTax'] } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 2. Revenue vs Expenses (Bar Chart) using Product.purchasePrice lookup
      Invoice.aggregate([
        { $match: activeSalesMatch },
        {
          $addFields: {
            sign: { $cond: [{ $eq: ['$documentType', 'Credit Note'] }, -1, 1] },
            period: { $dateToString: { format: dateFmt, date: '$invoiceDate' } },
          },
        },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'prod',
          },
        },
        {
          $addFields: {
            unitCost: {
              $ifNull: [{ $arrayElemAt: ['$prod.purchasePrice', 0] }, 0],
            },
          },
        },
        {
          $group: {
            _id: '$period',
            revenue: { $sum: { $multiply: ['$sign', '$items.lineTotal'] } },
            expenses: {
              $sum: { $multiply: ['$sign', '$items.quantity', '$unitCost'] },
            },
          },
        },
        {
          $project: {
            _id: 1,
            revenue: { $round: ['$revenue', 2] },
            expenses: { $round: ['$expenses', 2] },
            profit: { $round: [{ $subtract: ['$revenue', '$expenses'] }, 2] },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 3. GST Breakdown (Donut Chart)
      Invoice.aggregate([
        { $match: activeSalesMatch },
        {
          $addFields: {
            sign: { $cond: [{ $eq: ['$documentType', 'Credit Note'] }, -1, 1] },
          },
        },
        {
          $group: {
            _id: null,
            cgst: { $sum: { $multiply: ['$sign', '$totals.totalCgst'] } },
            sgst: { $sum: { $multiply: ['$sign', '$totals.totalSgst'] } },
            igst: { $sum: { $multiply: ['$sign', '$totals.totalIgst'] } },
          },
        },
      ]),

      // 4. Top Selling Products (Horizontal Bar Chart)
      Invoice.aggregate([
        { $match: activeSalesMatch },
        {
          $addFields: {
            sign: { $cond: [{ $eq: ['$documentType', 'Credit Note'] }, -1, 1] },
          },
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.description',
            quantity: { $sum: { $multiply: ['$sign', '$items.quantity'] } },
            revenue: { $sum: { $multiply: ['$sign', '$items.lineTotal'] } },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 6 },
      ]),

      // 5. Payment Methods (Donut Chart)
      Invoice.aggregate([
        { $match: { status: { $ne: 'Cancelled' }, ...allInvoicesMatch } },
        {
          $addFields: {
            rawMode: {
              $toUpper: { $ifNull: ['$dispatchDetails.modeOfPayment', 'CASH'] },
            },
          },
        },
        {
          $addFields: {
            method: {
              $switch: {
                branches: [
                  { case: { $regexMatch: { input: '$rawMode', regex: 'UPI' } }, then: 'UPI' },
                  {
                    case: { $regexMatch: { input: '$rawMode', regex: 'CREDIT' } },
                    then: 'Credit',
                  },
                  {
                    case: {
                      $regexMatch: { input: '$rawMode', regex: 'NEFT|RTGS|BANK|IMMEDIATE' },
                    },
                    then: 'Bank Transfer',
                  },
                ],
                default: 'Cash',
              },
            },
          },
        },
        {
          $group: {
            _id: '$method',
            amount: { $sum: '$totals.grandTotal' },
            count: { $sum: 1 },
          },
        },
      ]),

      // 6. Invoice Statistics (Bar Chart)
      Invoice.aggregate([
        { $match: allInvoicesMatch },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            amount: { $sum: '$totals.grandTotal' },
          },
        },
      ]),

      // 7. Booking Analytics (Line Chart) - avoids double-counting with invoice revenue
      mongoose.model('Booking').aggregate([
        { $match: bookingDateMatch },
        {
          $group: {
            _id: { $dateToString: { format: dateFmt, date: '$createdAt' } },
            incoming: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const gstDoc = gstRaw[0] || { cgst: 0, sgst: 0, igst: 0 };
    const gstBreakdown = [
      { name: 'CGST', value: round2(gstDoc.cgst) },
      { name: 'SGST', value: round2(gstDoc.sgst) },
      { name: 'IGST', value: round2(gstDoc.igst) },
    ].filter((g) => g.value > 0);

    const statusOrder = ['Paid', 'Pending', 'Draft', 'Cancelled'];
    const statMap = new Map(invoiceStatsRaw.map((s) => [s._id, s]));
    const invoiceStats = statusOrder.map((st) => ({
      status: st === 'Draft' ? 'Unpaid / Draft' : st,
      count: statMap.get(st)?.count || 0,
      amount: round2(statMap.get(st)?.amount || 0),
    }));

    res.json({
      salesOverview: salesTrendRaw.map((r) => ({
        period: r._id,
        sales: round2(r.sales),
        taxable: round2(r.taxable),
        gst: round2(r.gst),
      })),
      revenueVsExpenses: revExpRaw,
      gstBreakdown,
      topProducts: topProductsRaw.map((p) => ({
        name: p._id.length > 26 ? `${p._id.slice(0, 26)}…` : p._id,
        fullName: p._id,
        quantity: round2(p.quantity),
        revenue: round2(p.revenue),
      })),
      paymentMethods: paymentMethodsRaw.map((m) => ({
        name: m._id,
        value: round2(m.amount),
        count: m.count,
      })),
      invoiceStats,
      bookingAnalytics: bookingTrendRaw.map((b) => ({
        period: b._id,
        incoming: b.incoming,
        completed: b.completed,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/gst', async (req, res) => {
  try {
    const { startDate, endDate, documentType } = req.query;
    const filter = { status: { $ne: 'Cancelled' } };

    if (documentType && documentType !== 'All') {
      filter.documentType = documentType;
    } else {
      // By default GST report includes Tax Invoices & Credit Notes (optionally Proforma if requested)
      filter.documentType = { $in: ['Tax Invoice', 'Credit Note'] };
    }

    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.invoiceDate.$lte = end;
      }
    }

    const invoices = await Invoice.find(filter).sort({ invoiceDate: -1 });

    const summary = {
      invoiceCount: invoices.length,
      taxableValue: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      grandTotal: 0,
    };

    const hsnMap = new Map();
    const rateMap = new Map();
    const b2b = { count: 0, taxableValue: 0, totalTax: 0, grandTotal: 0 };
    const b2c = { count: 0, taxableValue: 0, totalTax: 0, grandTotal: 0 };

    for (const inv of invoices) {
      const sign = inv.documentType === 'Credit Note' ? -1 : 1;
      const t = inv.totals || {};

      summary.taxableValue = round2(summary.taxableValue + sign * (t.subtotalTaxable || 0));
      summary.cgst = round2(summary.cgst + sign * (t.totalCgst || 0));
      summary.sgst = round2(summary.sgst + sign * (t.totalSgst || 0));
      summary.igst = round2(summary.igst + sign * (t.totalIgst || 0));
      summary.totalTax = round2(summary.totalTax + sign * (t.totalTax || 0));
      summary.grandTotal = round2(summary.grandTotal + sign * (t.grandTotal || 0));

      const bucket = inv.buyer?.isRegistered ? b2b : b2c;
      bucket.count += 1;
      bucket.taxableValue = round2(bucket.taxableValue + sign * (t.subtotalTaxable || 0));
      bucket.totalTax = round2(bucket.totalTax + sign * (t.totalTax || 0));
      bucket.grandTotal = round2(bucket.grandTotal + sign * (t.grandTotal || 0));

      for (const h of inv.hsnSummary || []) {
        const hKey = `${h.hsnSac}__${h.gstRate}`;
        const existing = hsnMap.get(hKey) || {
          hsnSac: h.hsnSac,
          gstRate: h.gstRate,
          taxableValue: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          totalTaxAmount: 0,
        };
        existing.taxableValue = round2(existing.taxableValue + sign * h.taxableValue);
        existing.cgstAmount = round2(existing.cgstAmount + sign * h.cgstAmount);
        existing.sgstAmount = round2(existing.sgstAmount + sign * h.sgstAmount);
        existing.igstAmount = round2(existing.igstAmount + sign * h.igstAmount);
        existing.totalTaxAmount = round2(existing.totalTaxAmount + sign * h.totalTaxAmount);
        hsnMap.set(hKey, existing);

        const rKey = `${h.gstRate}%`;
        const rExisting = rateMap.get(rKey) || {
          rateLabel: rKey,
          gstRate: h.gstRate,
          taxableValue: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          totalTax: 0,
        };
        rExisting.taxableValue = round2(rExisting.taxableValue + sign * h.taxableValue);
        rExisting.cgst = round2(rExisting.cgst + sign * h.cgstAmount);
        rExisting.sgst = round2(rExisting.sgst + sign * h.sgstAmount);
        rExisting.igst = round2(rExisting.igst + sign * h.igstAmount);
        rExisting.totalTax = round2(rExisting.totalTax + sign * h.totalTaxAmount);
        rateMap.set(rKey, rExisting);
      }
    }

    res.json({
      summary,
      b2b,
      b2c,
      hsnBreakdown: Array.from(hsnMap.values()).sort((a, b) => a.hsnSac.localeCompare(b.hsnSac)),
      rateBreakdown: Array.from(rateMap.values()).sort((a, b) => a.gstRate - b.gstRate),
      invoices,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

