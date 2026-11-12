import express from 'express';
import Settings from '../models/Settings.js';
import { validateGSTIN } from '../utils/gstValidation.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const {
      name,
      address,
      gstin,
      contact,
      email,
      logoUrl,
      bankDetails,
      declaration,
      numbering,
      gstConfig,
      appearance,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Company Name is required.' });
    }
    if (!address || !String(address).trim()) {
      return res.status(400).json({ error: 'Business Address is required.' });
    }
    if (!contact || !String(contact).trim()) {
      return res.status(400).json({ error: 'Contact Number is required.' });
    }

    const gstinCheck = validateGSTIN(gstin);
    if (!gstinCheck.valid) {
      return res.status(400).json({ error: gstinCheck.error });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    settings.name = String(name).trim();
    settings.address = String(address).trim();
    settings.gstin = gstinCheck.gstin;
    settings.stateCode = gstinCheck.stateCode;
    settings.stateName = gstinCheck.stateName;
    settings.contact = String(contact).trim();
    if (email !== undefined) settings.email = String(email).trim();
    if (logoUrl !== undefined) settings.logoUrl = String(logoUrl);

    if (bankDetails) {
      const branchName = String(bankDetails.branchName || '').trim();
      const ifscCode = String(bankDetails.ifscCode || '').trim().toUpperCase();
      const computedBranchIfsc =
        branchName && ifscCode
          ? `${branchName} & ${ifscCode}`
          : bankDetails.branchAndIfsc || branchName || ifscCode || '';
      settings.bankDetails = {
        ...settings.bankDetails?.toObject?.(),
        ...bankDetails,
        branchName,
        ifscCode,
        branchAndIfsc: computedBranchIfsc,
      };
    }

    if (declaration !== undefined) settings.declaration = declaration;
    if (numbering) {
      settings.numbering = { ...settings.numbering?.toObject?.(), ...numbering };
    }
    if (gstConfig) {
      settings.gstConfig = { ...settings.gstConfig?.toObject?.(), ...gstConfig };
    }
    if (appearance) {
      settings.appearance = { ...settings.appearance?.toObject?.(), ...appearance };
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
