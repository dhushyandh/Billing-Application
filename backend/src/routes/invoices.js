import express from 'express';
import Invoice from '../models/Invoice.js';
import Booking from '../models/Booking.js';
import Product from '../models/Product.js';
import Settings from '../models/Settings.js';
import { calculateAndValidateInvoice } from '../utils/gstValidation.js';

const router = express.Router();

async function generateUniqueInvoiceNumber(documentType, settings) {
  const numbering = settings?.numbering || {};
  let prefix = 'INV-';
  let nextNum = 373;

  if (documentType === 'Proforma Invoice') {
    prefix = numbering.proformaPrefix ?? '';
    nextNum = numbering.proformaNext ?? 373;
  } else if (documentType === 'Credit Note') {
    prefix = numbering.creditNotePrefix ?? 'CN-';
    nextNum = numbering.creditNoteNext ?? 1;
  } else {
    prefix = numbering.taxInvoicePrefix ?? 'INV-';
    nextNum = numbering.taxInvoiceNext ?? 373;
  }

  const formatCandidate = (num) => {
    if (numbering.includeFinancialYear && numbering.financialYear) {
      const cleanPrefix = prefix.replace(/[-/]+$/, '');
      const padded = String(num).padStart(3, '0');
      return cleanPrefix
        ? `${cleanPrefix}/${numbering.financialYear}/${padded}`
        : `${numbering.financialYear}/${padded}`;
    }
    return `${prefix}${num}`;
  };

  let candidate = formatCandidate(nextNum);
  while (await Invoice.exists({ invoiceNumber: candidate })) {
    nextNum += 1;
    candidate = formatCandidate(nextNum);
  }
  return { invoiceNumber: candidate, nextNum, prefix };
}

router.get('/next-number', async (req, res) => {
  try {
    const documentType = req.query.documentType || 'Tax Invoice';
    const settings = await Settings.findOne();
    const { invoiceNumber } = await generateUniqueInvoiceNumber(documentType, settings);
    res.json({ invoiceNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { search, documentType, status, startDate, endDate } = req.query;
    const filter = {};

    if (documentType && documentType !== 'All') {
      filter.documentType = documentType;
    }
    if (status && status !== 'All') {
      filter.status = status;
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
    if (search) {
      const rx = new RegExp(String(search).trim(), 'i');
      filter.$or = [
        { invoiceNumber: rx },
        { 'buyer.name': rx },
        { 'buyer.gstin': rx },
      ];
    }

    const invoices = await Invoice.find(filter).sort({ invoiceDate: -1, createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(400).json({ error: 'Seller settings are not configured.' });
    }

    const duplicate = await Invoice.exists({
      invoiceNumber: String(req.body.invoiceNumber || '').trim(),
    });
    if (duplicate) {
      return res.status(409).json({
        error: `Invoice number "${req.body.invoiceNumber}" already exists. Duplicate invoice numbers are not allowed.`,
      });
    }

    const result = calculateAndValidateInvoice(req.body, settings.toObject());
    if (!result.valid) {
      return res.status(400).json({
        error: result.errors.join(' '),
        errors: result.errors,
      });
    }

    let linkedBooking = null;
    if (req.body.bookingId) {
      linkedBooking = await Booking.findById(req.body.bookingId);
      if (!linkedBooking) {
        return res.status(404).json({ error: 'Referenced booking not found.' });
      }
      if (linkedBooking.invoiceId || (await Invoice.exists({ bookingId: linkedBooking._id }))) {
        return res.status(409).json({
          error: `An invoice (${linkedBooking.invoiceNumber || 'existing'}) has already been generated for booking ${linkedBooking.bookingId}. Duplicate invoices for the same booking are not allowed.`,
        });
      }
      result.data.bookingId = linkedBooking._id;
      result.data.bookingRef = linkedBooking.bookingId;
    }

    const invoice = await Invoice.create(result.data);

    if (linkedBooking) {
      linkedBooking.status = 'Completed';
      linkedBooking.invoiceId = invoice._id;
      linkedBooking.invoiceNumber = invoice.invoiceNumber;
      await linkedBooking.save();
    }

    // Sync inventory stock for Tax Invoices
    if (result.data.documentType === 'Tax Invoice') {
      for (const item of result.data.items) {
        if (item.productId) {
          const prod = await Product.findById(item.productId);
          if (prod && prod.stockQty > 0) {
            prod.stockQty = Math.max(0, prod.stockQty - item.quantity);
            if (prod.stockQty === 0) prod.inStock = false;
            await prod.save();
          }
        }
      }
    }

    // Advance sequential counter if applicable
    const numInfo = await generateUniqueInvoiceNumber(result.data.documentType, settings);
    if (result.data.documentType === 'Proforma Invoice') {
      settings.numbering.proformaNext = numInfo.nextNum;
    } else if (result.data.documentType === 'Credit Note') {
      settings.numbering.creditNoteNext = numInfo.nextNum;
    } else {
      settings.numbering.taxInvoiceNext = numInfo.nextNum;
    }
    await settings.save();

    res.status(201).json(invoice);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Duplicate invoice number is not allowed.' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(400).json({ error: 'Seller settings are not configured.' });
    }

    const duplicate = await Invoice.exists({
      _id: { $ne: req.params.id },
      invoiceNumber: String(req.body.invoiceNumber || '').trim(),
    });
    if (duplicate) {
      return res.status(409).json({
        error: `Invoice number "${req.body.invoiceNumber}" already exists.`,
      });
    }

    const result = calculateAndValidateInvoice(req.body, settings.toObject());
    if (!result.valid) {
      return res.status(400).json({
        error: result.errors.join(' '),
        errors: result.errors,
      });
    }

    const invoice = await Invoice.findByIdAndUpdate(req.params.id, result.data, {
      new: true,
      runValidators: true,
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const allowed = ['Draft', 'Pending', 'Paid', 'Cancelled'];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
    res.json({ message: 'Invoice deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

