export const INDIAN_STATES = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (Old)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

export const ALLOWED_GST_RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28];

export function round2(val) {
  const num = Number(val);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function validateGSTIN(gstin) {
  if (!gstin || typeof gstin !== 'string') {
    return { valid: false, error: 'GSTIN is required.' };
  }
  const clean = gstin.trim().toUpperCase();
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!regex.test(clean)) {
    return {
      valid: false,
      error: `Invalid GSTIN format "${clean}". Expected 15-character format (e.g. 33BTNPM5744E1ZK).`,
    };
  }
  const stateCode = clean.slice(0, 2);
  const stateName = INDIAN_STATES[stateCode];
  if (!stateName) {
    return {
      valid: false,
      error: `Invalid GSTIN state code "${stateCode}".`,
    };
  }
  return { valid: true, gstin: clean, stateCode, stateName };
}

export function validateHSN(hsn) {
  if (!hsn || typeof hsn !== 'string') {
    return { valid: false, error: 'HSN/SAC code is required.' };
  }
  const clean = hsn.trim();
  if (!/^\d{4,8}$/.test(clean)) {
    return {
      valid: false,
      error: `Invalid HSN/SAC code "${clean}". Must be 4 to 8 numeric digits.`,
    };
  }
  return { valid: true, hsnSac: clean };
}

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitsToWords(n) {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`.trim();
}

function integerToIndianWords(num) {
  if (num === 0) return 'Zero';
  let n = Math.floor(Math.abs(num));
  const parts = [];

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  if (crore > 0) parts.push(`${integerToIndianWords(crore)} Crore`);

  const lakh = Math.floor(n / 100000);
  n %= 100000;
  if (lakh > 0) parts.push(`${twoDigitsToWords(lakh)} Lakh`);

  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (thousand > 0) parts.push(`${twoDigitsToWords(thousand)} Thousand`);

  const hundred = Math.floor(n / 100);
  n %= 100;
  if (hundred > 0) parts.push(`${ONES[hundred]} Hundred`);

  if (n > 0) parts.push(twoDigitsToWords(n));

  return parts.join(' ').trim();
}

export function numberToIndianWords(amount, includePaise = true) {
  const rounded = round2(Math.abs(amount));
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  let result = `INR ${integerToIndianWords(rupees)}`;
  if (includePaise && paise > 0) {
    result += ` and ${twoDigitsToWords(paise)} paise`;
  }
  return `${result} Only`;
}

export function calculateAndValidateInvoice(payload, seller) {
  const errors = [];

  // 1. Validate Seller GSTIN
  const sellerGstinCheck = validateGSTIN(seller?.gstin);
  if (!sellerGstinCheck.valid) {
    errors.push(`Seller GSTIN error: ${sellerGstinCheck.error}`);
  }
  const sellerStateCode = sellerGstinCheck.valid
    ? sellerGstinCheck.stateCode
    : seller?.stateCode || '33';

  // 2. Document Type & Number
  const allowedDocTypes = ['Tax Invoice', 'Proforma Invoice', 'Credit Note'];
  if (!allowedDocTypes.includes(payload.documentType)) {
    errors.push(`Invalid document type. Must be one of: ${allowedDocTypes.join(', ')}.`);
  }
  if (!payload.invoiceNumber || !String(payload.invoiceNumber).trim()) {
    errors.push('Invoice number is required.');
  }
  if (!payload.invoiceDate || Number.isNaN(new Date(payload.invoiceDate).getTime())) {
    errors.push('Valid invoice date is required.');
  }

  // 3. Validate Buyer
  const buyer = payload.buyer || {};
  if (!buyer.name || !String(buyer.name).trim()) {
    errors.push('Customer / Buyer name is required.');
  }
  if (!buyer.address || !String(buyer.address).trim()) {
    errors.push('Customer / Buyer address is required.');
  }

  let buyerStateCode = String(buyer.stateCode || '').trim().padStart(2, '0');
  let buyerGstin = buyer.gstin ? String(buyer.gstin).trim().toUpperCase() : '';
  const isRegistered = Boolean(buyer.isRegistered || buyerGstin.length > 0);

  if (isRegistered) {
    const buyerCheck = validateGSTIN(buyerGstin);
    if (!buyerCheck.valid) {
      errors.push(`Buyer GSTIN error: ${buyerCheck.error}`);
    } else {
      buyerGstin = buyerCheck.gstin;
      if (buyerStateCode && buyerStateCode !== '00' && buyerStateCode !== buyerCheck.stateCode) {
        errors.push(
          `Buyer state code (${buyerStateCode}) does not match GSTIN state code (${buyerCheck.stateCode}).`
        );
      }
      buyerStateCode = buyerCheck.stateCode;
    }
  } else {
    if (!INDIAN_STATES[buyerStateCode]) {
      errors.push(`Valid buyer state code is required (got "${buyerStateCode}").`);
    }
  }

  const buyerStateName = INDIAN_STATES[buyerStateCode] || buyer.stateName || '';
  const supplyType = sellerStateCode === buyerStateCode ? 'INTRA' : 'INTER';

  // 4. Validate Items & Compute Calculations
  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  if (rawItems.length === 0) {
    errors.push('At least one line item is required.');
  }

  const computedItems = [];
  const hsnMap = new Map();

  rawItems.forEach((item, idx) => {
    const row = idx + 1;
    const description = String(item.description || '').trim();
    if (!description) {
      errors.push(`Row ${row}: Product description is required.`);
    }

    const hsnCheck = validateHSN(String(item.hsnSac || ''));
    if (!hsnCheck.valid) {
      errors.push(`Row ${row}: ${hsnCheck.error}`);
    }

    const unit = String(item.unit || '').trim().toUpperCase();
    if (!unit) {
      errors.push(`Row ${row}: Unit is required (e.g. NOS, SQFT, KGS).`);
    }

    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.push(`Row ${row}: Quantity must be greater than 0.`);
    }

    const gstRate = Number(item.gstRate);
    if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 28) {
      errors.push(`Row ${row}: GST rate must be between 0% and 28%.`);
    }

    const discountPercent = Number(item.discountPercent || 0);
    if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      errors.push(`Row ${row}: Discount percentage must be between 0 and 100.`);
    }

    let rate = Number(item.rate);
    let rateInclTax = Number(item.rateInclTax);

    if (item.isTaxInclusive && Number.isFinite(rateInclTax) && rateInclTax > 0) {
      rate = round2(rateInclTax / (1 + (Number.isFinite(gstRate) ? gstRate : 0) / 100));
    } else if (Number.isFinite(rate) && rate > 0) {
      rate = round2(rate);
      if (!Number.isFinite(rateInclTax) || rateInclTax <= 0) {
        rateInclTax = round2(rate * (1 + (Number.isFinite(gstRate) ? gstRate : 0) / 100));
      } else {
        rateInclTax = round2(rateInclTax);
      }
    } else {
      errors.push(`Row ${row}: Rate must be greater than 0.`);
    }

    const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
    const validRate = Number.isFinite(rate) && rate > 0 ? rate : 0;
    const validGst = Number.isFinite(gstRate) && gstRate >= 0 ? gstRate : 0;
    const validDisc = Number.isFinite(discountPercent) && discountPercent >= 0 ? discountPercent : 0;

    const grossAmount = round2(qty * validRate);
    const discountAmount = round2((grossAmount * validDisc) / 100);
    const taxableValue = round2(grossAmount - discountAmount);

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (supplyType === 'INTRA') {
      cgstRate = round2(validGst / 2);
      sgstRate = round2(validGst / 2);
      cgstAmount = round2((taxableValue * cgstRate) / 100);
      sgstAmount = round2((taxableValue * sgstRate) / 100);
    } else {
      igstRate = round2(validGst);
      igstAmount = round2((taxableValue * igstRate) / 100);
    }

    const totalTax = round2(cgstAmount + sgstAmount + igstAmount);
    const lineTotal = round2(taxableValue + totalTax);

    computedItems.push({
      productId: item.productId || undefined,
      description,
      subDescription: String(item.subDescription || '').trim(),
      hsnSac: hsnCheck.valid ? hsnCheck.hsnSac : String(item.hsnSac || '').trim(),
      quantity: qty,
      unit: unit || 'NOS',
      rateInclTax: Number.isFinite(rateInclTax) ? round2(rateInclTax) : 0,
      rate: validRate,
      isTaxInclusive: Boolean(item.isTaxInclusive),
      discountPercent: round2(validDisc),
      discountAmount,
      taxableValue,
      gstRate: round2(validGst),
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalTax,
      lineTotal,
    });

    const hsnKey = `${hsnCheck.valid ? hsnCheck.hsnSac : item.hsnSac}__${validGst}`;
    const existing = hsnMap.get(hsnKey) || {
      hsnSac: hsnCheck.valid ? hsnCheck.hsnSac : String(item.hsnSac || '').trim(),
      gstRate: round2(validGst),
      taxableValue: 0,
      cgstRate,
      cgstAmount: 0,
      sgstRate,
      sgstAmount: 0,
      igstRate,
      igstAmount: 0,
      totalTaxAmount: 0,
    };
    existing.taxableValue = round2(existing.taxableValue + taxableValue);
    existing.cgstAmount = round2(existing.cgstAmount + cgstAmount);
    existing.sgstAmount = round2(existing.sgstAmount + sgstAmount);
    existing.igstAmount = round2(existing.igstAmount + igstAmount);
    existing.totalTaxAmount = round2(existing.totalTaxAmount + totalTax);
    hsnMap.set(hsnKey, existing);
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const subtotalTaxable = round2(computedItems.reduce((acc, i) => acc + i.taxableValue, 0));
  const totalDiscount = round2(computedItems.reduce((acc, i) => acc + i.discountAmount, 0));
  const totalCgst = round2(computedItems.reduce((acc, i) => acc + i.cgstAmount, 0));
  const totalSgst = round2(computedItems.reduce((acc, i) => acc + i.sgstAmount, 0));
  const totalIgst = round2(computedItems.reduce((acc, i) => acc + i.igstAmount, 0));
  const totalTax = round2(totalCgst + totalSgst + totalIgst);
  const preRoundTotal = round2(subtotalTaxable + totalTax);

  const autoRoundOff = payload.autoRoundOff !== false;
  const roundOff = autoRoundOff
    ? round2(Math.round(preRoundTotal) - preRoundTotal)
    : round2(payload.roundOff || 0);

  const grandTotal = round2(preRoundTotal + roundOff);
  if (grandTotal < 0) {
    return { valid: false, errors: ['Grand total cannot be negative.'] };
  }

  return {
    valid: true,
    data: {
      documentType: payload.documentType,
      invoiceNumber: String(payload.invoiceNumber).trim(),
      invoiceDate: new Date(payload.invoiceDate),
      eWayBillNo: String(payload.eWayBillNo || '').trim(),
      status: payload.status || 'Pending',
      supplyType,
      seller: {
        name: seller.name,
        address: seller.address,
        gstin: sellerGstinCheck.gstin,
        stateName: sellerGstinCheck.stateName,
        stateCode: sellerGstinCheck.stateCode,
        contact: seller.contact,
        email: seller.email,
        logoUrl: seller.logoUrl || '',
        signatureUrl: seller.appearance?.signatureUrl || '',
        showLogo: seller.appearance?.showLogo !== false,
        showBankDetails: seller.appearance?.showBankDetails !== false,
        termsAndConditions: seller.appearance?.termsAndConditions || '',
        bankDetails: seller.bankDetails,
      },
      buyer: {
        customerId: buyer.customerId || undefined,
        name: String(buyer.name).trim(),
        address: String(buyer.address).trim(),
        phone: String(buyer.phone || '').trim(),
        email: String(buyer.email || '').trim(),
        isRegistered,
        gstin: buyerGstin,
        stateName: buyerStateName,
        stateCode: buyerStateCode,
      },
      dispatchDetails: {
        deliveryNote: String(payload.dispatchDetails?.deliveryNote || '').trim(),
        modeOfPayment: String(payload.dispatchDetails?.modeOfPayment || 'IMMEDIATE').trim(),
        referenceNoAndDate: String(payload.dispatchDetails?.referenceNoAndDate || '').trim(),
        otherReferences: String(payload.dispatchDetails?.otherReferences || '').trim(),
        buyersOrderNo: String(payload.dispatchDetails?.buyersOrderNo || '').trim(),
        buyersOrderDate: String(payload.dispatchDetails?.buyersOrderDate || '').trim(),
        dispatchDocNo: String(payload.dispatchDetails?.dispatchDocNo || '').trim(),
        deliveryNoteDate: String(payload.dispatchDetails?.deliveryNoteDate || '').trim(),
        dispatchedThrough: String(payload.dispatchDetails?.dispatchedThrough || '').trim(),
        destination: String(payload.dispatchDetails?.destination || '').trim(),
        billOfLadingNo: String(payload.dispatchDetails?.billOfLadingNo || '').trim(),
        motorVehicleNo: String(payload.dispatchDetails?.motorVehicleNo || '').trim(),
        termsOfDelivery: String(payload.dispatchDetails?.termsOfDelivery || '').trim(),
      },
      items: computedItems,
      hsnSummary: Array.from(hsnMap.values()),
      totals: {
        subtotalTaxable,
        totalDiscount,
        totalCgst,
        totalSgst,
        totalIgst,
        totalTax,
        roundOff,
        grandTotal,
        autoRoundOff,
      },
      amountInWords: numberToIndianWords(grandTotal, false),
      taxAmountInWords: numberToIndianWords(totalTax, true),
      declaration:
        payload.declaration ||
        seller.declaration ||
        'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
      notes: String(payload.notes || '').trim(),
    },
  };
}

