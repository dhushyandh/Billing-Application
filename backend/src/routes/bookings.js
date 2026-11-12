import express from 'express';
import Booking from '../models/Booking.js';
import Product from '../models/Product.js';
import Invoice from '../models/Invoice.js';
import { INDIAN_STATES, round2, validateGSTIN } from '../utils/gstValidation.js';

const router = express.Router();

async function generateNextBookingId() {
  const count = await Booking.countDocuments();
  let num = 1001 + count;
  let candidate = `BK-${num}`;
  while (await Booking.exists({ bookingId: candidate })) {
    num += 1;
    candidate = `BK-${num}`;
  }
  return candidate;
}

// Public: Submit customer pre-booking from storefront
router.post('/', async (req, res) => {
  try {
    const { customer = {}, items = [], notes = '' } = req.body;
    const errors = [];

    if (!customer.name || !String(customer.name).trim()) {
      errors.push('Customer name is required.');
    }
    const cleanPhone = String(customer.phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      errors.push('Valid 10-digit mobile number is required.');
    }
    if (!customer.address || !String(customer.address).trim()) {
      errors.push('Delivery address is required.');
    }

    let isRegistered = false;
    let gstin = '';
    let stateCode = String(customer.stateCode || '33').padStart(2, '0');
    let stateName = INDIAN_STATES[stateCode] || 'Tamil Nadu';

    if (customer.gstin && String(customer.gstin).trim()) {
      const check = validateGSTIN(customer.gstin);
      if (!check.valid) {
        errors.push(check.error);
      } else {
        isRegistered = true;
        gstin = check.gstin;
        stateCode = check.stateCode;
        stateName = check.stateName;
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      errors.push('Please select at least one product.');
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(' '), errors });
    }

    const bookingItems = [];
    let estimatedTotal = 0;

    for (const reqItem of items) {
      const prod = await Product.findById(reqItem.productId);
      if (!prod) {
        return res.status(400).json({ error: 'One of the selected products no longer exists.' });
      }
      if (prod.inStock === false) {
        return res.status(400).json({ error: `"${prod.name}" is currently out of stock.` });
      }
      const qty = Number(reqItem.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        return res.status(400).json({ error: `Invalid quantity for "${prod.name}".` });
      }
      const unitIncl = prod.rateInclTax || round2(prod.rate * (1 + prod.gstRate / 100));
      const lineTotal = round2(qty * unitIncl);
      estimatedTotal = round2(estimatedTotal + lineTotal);

      bookingItems.push({
        productId: prod._id,
        description: prod.name,
        subDescription: prod.subDescription || '',
        hsnSac: prod.hsnSac,
        unit: prod.unit,
        quantity: qty,
        rate: prod.rate,
        rateInclTax: unitIncl,
        gstRate: prod.gstRate,
        lineTotal,
      });
    }

    const bookingId = await generateNextBookingId();
    const booking = await Booking.create({
      bookingId,
      customer: {
        name: String(customer.name).trim(),
        phone: cleanPhone.slice(-10),
        email: String(customer.email || '').trim(),
        address: String(customer.address).trim(),
        isRegistered,
        gstin,
        stateCode,
        stateName,
      },
      items: bookingItems,
      estimatedTotal,
      notes: String(notes || '').trim(),
      status: 'Pending',
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Customer lookup by EITHER Booking ID OR Mobile Number
router.post('/lookup', async (req, res) => {
  try {
    const rawQuery = String(req.body.query || '').trim();
    const rawBookingId = String(req.body.bookingId || '').trim().toUpperCase();
    const rawPhone = String(req.body.phone || '').replace(/\D/g, '').slice(-10);

    let bookingId = rawBookingId;
    let phone = rawPhone;

    if (!bookingId && !phone && rawQuery) {
      const digits = rawQuery.replace(/\D/g, '');
      if (/^BK-/i.test(rawQuery)) {
        bookingId = rawQuery.toUpperCase();
      } else if (digits.length >= 10) {
        phone = digits.slice(-10);
      } else {
        bookingId = rawQuery.toUpperCase();
      }
    }

    if (!bookingId && phone.length < 10) {
      return res.status(400).json({
        error: 'Please enter either a Booking ID (e.g. BK-1001) or a 10-digit Mobile Number.',
      });
    }

    const filter = bookingId ? { bookingId } : { 'customer.phone': phone };
    const bookings = await Booking.find(filter).sort({ createdAt: -1 });

    if (bookings.length === 0) {
      return res.status(404).json({
        error: bookingId
          ? `No booking found with Booking ID "${bookingId}".`
          : `No bookings found for mobile number "${phone}".`,
      });
    }

    const results = await Promise.all(
      bookings.map(async (booking) => {
        const invoice = booking.invoiceId ? await Invoice.findById(booking.invoiceId) : null;
        return { booking, invoice };
      })
    );

    res.json({
      booking: results[0].booking,
      invoice: results[0].invoice,
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: List & search bookings
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (search) {
      const rx = new RegExp(String(search).trim(), 'i');
      filter.$or = [
        { bookingId: rx },
        { 'customer.name': rx },
        { 'customer.phone': rx },
        { invoiceNumber: rx },
      ];
    }
    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get single booking
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update booking status
router.patch('/:id/status', async (req, res) => {
  try {
    const allowed = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ error: 'Invalid booking status.' });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    if (booking.invoiceId && req.body.status === 'Cancelled') {
      return res.status(400).json({
        error: `Cannot cancel booking ${booking.bookingId} because Invoice ${booking.invoiceNumber} is already generated.`,
      });
    }

    booking.status = req.body.status;
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

