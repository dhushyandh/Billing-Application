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

export const GST_RATES = [0, 5, 12, 18, 28];
export const UNITS = ['NOS', 'SQFT', 'KGS', 'PCS', 'MTR', 'BOX', 'ROLL', 'SET', 'LTR', 'TON'];

export function round2(val) {
  const num = Number(val);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function formatINR(val) {
  const num = Number(val || 0);
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatInvoiceDate(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleDateString('en-GB', { month: 'short' });
  const yr = String(d.getFullYear()).slice(-2);
  return `${day}-${mon}-${yr}`;
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
      error: 'Invalid 15-char GSTIN format (e.g. 33BTNPM5744E1ZK).',
    };
  }
  const stateCode = clean.slice(0, 2);
  const stateName = INDIAN_STATES[stateCode];
  if (!stateName) {
    return { valid: false, error: `Unknown GSTIN state code "${stateCode}".` };
  }
  return { valid: true, gstin: clean, stateCode, stateName };
}

export function validateHSN(hsn) {
  const clean = String(hsn || '').trim();
  if (!/^\d{4,8}$/.test(clean)) {
    return { valid: false, error: 'HSN/SAC must be 4 to 8 digits.' };
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

export function computeInvoicePreview(items, sellerStateCode, buyerStateCode, autoRoundOff = true, manualRoundOff = 0) {
  const supplyType = sellerStateCode === buyerStateCode ? 'INTRA' : 'INTER';
  const hsnMap = new Map();

  const computedItems = items.map((item) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const gstRate = Math.max(0, Math.min(28, Number(item.gstRate) || 0));
    const discPct = Math.max(0, Math.min(100, Number(item.discountPercent) || 0));

    let rate = Number(item.rate) || 0;
    let rateInclTax = Number(item.rateInclTax) || 0;

    if (item.isTaxInclusive) {
      rate = round2(rateInclTax / (1 + gstRate / 100));
    } else {
      rate = round2(rate);
      rateInclTax = round2(rate * (1 + gstRate / 100));
    }

    const gross = round2(qty * rate);
    const discountAmount = round2((gross * discPct) / 100);
    const taxableValue = round2(gross - discountAmount);

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (supplyType === 'INTRA') {
      cgstRate = round2(gstRate / 2);
      sgstRate = round2(gstRate / 2);
      cgstAmount = round2((taxableValue * cgstRate) / 100);
      sgstAmount = round2((taxableValue * sgstRate) / 100);
    } else {
      igstRate = round2(gstRate);
      igstAmount = round2((taxableValue * igstRate) / 100);
    }

    const totalTax = round2(cgstAmount + sgstAmount + igstAmount);
    const lineTotal = round2(taxableValue + totalTax);

    if (item.hsnSac) {
      const hKey = `${item.hsnSac}__${gstRate}`;
      const existing = hsnMap.get(hKey) || {
        hsnSac: item.hsnSac,
        gstRate,
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
      hsnMap.set(hKey, existing);
    }

    return {
      ...item,
      rate,
      rateInclTax,
      discountAmount,
      taxableValue,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalTax,
      lineTotal,
    };
  });

  const subtotalTaxable = round2(computedItems.reduce((s, i) => s + i.taxableValue, 0));
  const totalDiscount = round2(computedItems.reduce((s, i) => s + i.discountAmount, 0));
  const totalCgst = round2(computedItems.reduce((s, i) => s + i.cgstAmount, 0));
  const totalSgst = round2(computedItems.reduce((s, i) => s + i.sgstAmount, 0));
  const totalIgst = round2(computedItems.reduce((s, i) => s + i.igstAmount, 0));
  const totalTax = round2(totalCgst + totalSgst + totalIgst);
  const preRoundTotal = round2(subtotalTaxable + totalTax);
  const roundOff = autoRoundOff
    ? round2(Math.round(preRoundTotal) - preRoundTotal)
    : round2(manualRoundOff);
  const grandTotal = round2(preRoundTotal + roundOff);

  return {
    supplyType,
    computedItems,
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
    },
    amountInWords: numberToIndianWords(grandTotal, false),
    taxAmountInWords: numberToIndianWords(totalTax, true),
  };
}

