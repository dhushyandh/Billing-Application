import express from 'express';
import Customer from '../models/Customer.js';
import { INDIAN_STATES, validateGSTIN } from '../utils/gstValidation.js';

const router = express.Router();

function validateCustomerPayload(body) {
  const errors = [];
  if (!body.name || !String(body.name).trim()) {
    errors.push('Customer name is required.');
  }
  if (!body.address || !String(body.address).trim()) {
    errors.push('Customer address is required.');
  }

  const isRegistered = body.isRegistered !== false && Boolean(body.isRegistered || body.gstin);
  let gstin = '';
  let stateCode = String(body.stateCode || '').trim().padStart(2, '0');
  let stateName = '';

  if (isRegistered) {
    const check = validateGSTIN(body.gstin);
    if (!check.valid) {
      errors.push(check.error);
    } else {
      gstin = check.gstin;
      stateCode = check.stateCode;
      stateName = check.stateName;
    }
  } else {
    if (!INDIAN_STATES[stateCode]) {
      errors.push('Valid state is required for unregistered customer.');
    } else {
      stateName = INDIAN_STATES[stateCode];
    }
  }

  return {
    errors,
    data: {
      name: String(body.name || '').trim(),
      address: String(body.address || '').trim(),
      phone: String(body.phone || '').trim(),
      email: String(body.email || '').trim(),
      isRegistered,
      gstin,
      stateCode,
      stateName,
    },
  };
}

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      const rx = new RegExp(String(search).trim(), 'i');
      filter.$or = [{ name: rx }, { gstin: rx }, { phone: rx }, { stateName: rx }];
    }
    const customers = await Customer.find(filter).sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { errors, data } = validateCustomerPayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(' '), errors });
    }
    const customer = await Customer.create(data);
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { errors, data } = validateCustomerPayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(' '), errors });
    }
    const customer = await Customer.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });
    res.json({ message: 'Customer deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

