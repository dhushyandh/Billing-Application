import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: 'IJAZ TRADERS' },
    address: {
      type: String,
      required: true,
      default:
        'NO. 49/4A/7A, N H MAIN ROAD, GOVERNMENT SCHOOL,\nTHIMMASAMUTHIRAM, KANCHEEPURAM,\nKANCHEEPURAM DT- 631502',
    },
    gstin: { type: String, required: true, default: '33BTNPM5744E1ZK' },
    stateName: { type: String, required: true, default: 'Tamil Nadu' },
    stateCode: { type: String, required: true, default: '33' },
    contact: { type: String, required: true, default: '9843988337' },
    email: { type: String, default: 'ijaztradersbvm@gmail.com' },
    logoUrl: { type: String, default: '' },
    bankDetails: {
      accountHolderName: { type: String, default: 'IJAZ TRADERS' },
      bankName: { type: String, default: 'AXIS BANK' },
      accountNo: { type: String, default: '923020047217197' },
      branchName: { type: String, default: 'KANCHIPURAM' },
      ifscCode: { type: String, default: 'UTIB0000534' },
      branchAndIfsc: { type: String, default: 'KANCHIPURAM & UTIB0000534' },
      swiftCode: { type: String, default: '' },
    },
    declaration: {
      type: String,
      default:
        'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    },
    numbering: {
      taxInvoicePrefix: { type: String, default: 'INV-' },
      taxInvoiceNext: { type: Number, default: 373 },
      proformaPrefix: { type: String, default: '' },
      proformaNext: { type: Number, default: 373 },
      creditNotePrefix: { type: String, default: 'CN-' },
      creditNoteNext: { type: Number, default: 1 },
      financialYear: { type: String, default: '2026-27' },
      includeFinancialYear: { type: Boolean, default: false },
      defaultInvoiceType: { type: String, default: 'Tax Invoice' },
      defaultPaymentTerms: { type: String, default: 'IMMEDIATE' },
      currency: { type: String, default: 'INR' },
      autoSequential: { type: Boolean, default: true },
    },
    gstConfig: {
      defaultGstRate: { type: Number, default: 18 },
      defaultPlaceOfSupply: { type: String, default: '33' },
      calculationMethod: {
        type: String,
        enum: ['exclusive', 'inclusive'],
        default: 'exclusive',
      },
      autoRoundOff: { type: Boolean, default: true },
    },
    appearance: {
      signatureUrl: { type: String, default: '' },
      showLogo: { type: Boolean, default: true },
      showBankDetails: { type: Boolean, default: true },
      termsAndConditions: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
