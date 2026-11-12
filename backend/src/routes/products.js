import express from 'express';
import Product from '../models/Product.js';
import { round2, validateHSN } from '../utils/gstValidation.js';

const router = express.Router();

function validateProductPayload(body) {
  const errors = [];
  if (!body.name || !String(body.name).trim()) {
    errors.push('Product description / name is required.');
  }
  const hsnCheck = validateHSN(String(body.hsnSac || ''));
  if (!hsnCheck.valid) {
    errors.push(hsnCheck.error);
  }
  const unit = String(body.unit || '').trim().toUpperCase();
  if (!unit) {
    errors.push('Unit is required.');
  }
  const gstRate = Number(body.gstRate);
  if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 28) {
    errors.push('GST rate must be between 0% and 28%.');
  }
  const isTaxInclusive = Boolean(body.isTaxInclusive);
  let rate = Number(body.rate);
  let rateInclTax = Number(body.rateInclTax);

  if (isTaxInclusive) {
    if (!Number.isFinite(rateInclTax) || rateInclTax <= 0) {
      errors.push('Tax-inclusive rate must be greater than 0.');
    } else {
      rate = round2(rateInclTax / (1 + (Number.isFinite(gstRate) ? gstRate : 0) / 100));
      rateInclTax = round2(rateInclTax);
    }
  } else {
    if (!Number.isFinite(rate) || rate <= 0) {
      errors.push('Rate must be greater than 0.');
    } else {
      rate = round2(rate);
      rateInclTax = round2(rate * (1 + (Number.isFinite(gstRate) ? gstRate : 0) / 100));
    }
  }

  return {
    errors,
    data: {
      name: String(body.name || '').trim(),
      sku: String(body.sku || '').trim().toUpperCase(),
      subDescription: String(body.subDescription || '').trim(),
      hsnSac: hsnCheck.valid ? hsnCheck.hsnSac : '',
      unit: unit || 'NOS',
      purchasePrice: Number.isFinite(Number(body.purchasePrice))
        ? Math.max(0, round2(body.purchasePrice))
        : 0,
      rate: Number.isFinite(rate) ? rate : 0,
      rateInclTax: Number.isFinite(rateInclTax) ? rateInclTax : 0,
      isTaxInclusive,
      gstRate: Number.isFinite(gstRate) ? round2(gstRate) : 18,
      stockQty: Number.isFinite(Number(body.stockQty)) ? Math.max(0, Number(body.stockQty)) : 0,
      category: String(body.category || 'Fencing & Wire').trim(),
      description: String(body.description || '').trim(),
      imageUrl: String(body.imageUrl || '').trim(),
      isVisibleOnStorefront: body.isVisibleOnStorefront !== false,
      isFeatured: Boolean(body.isFeatured),
      inStock: body.inStock !== false,
    },
  };
}

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      const rx = new RegExp(String(search).trim(), 'i');
      filter.$or = [{ name: rx }, { sku: rx }, { hsnSac: rx }, { subDescription: rx }];
    }
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { errors, data } = validateProductPayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(' '), errors });
    }
    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { errors, data } = validateProductPayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(' '), errors });
    }
    const product = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

