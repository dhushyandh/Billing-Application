import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    description: { type: String, required: true },
    subDescription: { type: String, default: '' },
    hsnSac: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.001 },
    unit: { type: String, required: true },
    rateInclTax: { type: Number, default: 0 },
    rate: { type: Number, required: true, min: 0.01 },
    isTaxInclusive: { type: Boolean, default: false },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0 },
    taxableValue: { type: Number, required: true },
    gstRate: { type: Number, required: true, min: 0, max: 28 },
    cgstRate: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstRate: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    totalTax: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const hsnSummarySchema = new mongoose.Schema(
  {
    hsnSac: { type: String, required: true },
    gstRate: { type: Number, required: true },
    taxableValue: { type: Number, required: true },
    cgstRate: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstRate: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    totalTaxAmount: { type: Number, required: true },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      enum: ['Tax Invoice', 'Proforma Invoice', 'Credit Note'],
      required: true,
      default: 'Tax Invoice',
    },
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    invoiceDate: { type: Date, required: true },
    eWayBillNo: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Draft', 'Pending', 'Paid', 'Cancelled'],
      default: 'Pending',
    },
    supplyType: { type: String, enum: ['INTRA', 'INTER'], required: true },
    seller: {
      name: String,
      address: String,
      gstin: String,
      stateName: String,
      stateCode: String,
      contact: String,
      email: String,
      logoUrl: String,
      signatureUrl: String,
      showLogo: { type: Boolean, default: true },
      showBankDetails: { type: Boolean, default: true },
      termsAndConditions: String,
      bankDetails: {
        accountHolderName: String,
        bankName: String,
        accountNo: String,
        branchName: String,
        ifscCode: String,
        branchAndIfsc: String,
        swiftCode: String,
      },
    },
    buyer: {
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
      name: { type: String, required: true },
      address: { type: String, required: true },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      isRegistered: { type: Boolean, default: true },
      gstin: { type: String, default: '' },
      stateName: { type: String, required: true },
      stateCode: { type: String, required: true },
    },
    dispatchDetails: {
      deliveryNote: { type: String, default: '' },
      modeOfPayment: { type: String, default: 'IMMEDIATE' },
      referenceNoAndDate: { type: String, default: '' },
      otherReferences: { type: String, default: '' },
      buyersOrderNo: { type: String, default: '' },
      buyersOrderDate: { type: String, default: '' },
      dispatchDocNo: { type: String, default: '' },
      deliveryNoteDate: { type: String, default: '' },
      dispatchedThrough: { type: String, default: '' },
      destination: { type: String, default: '' },
      billOfLadingNo: { type: String, default: '' },
      motorVehicleNo: { type: String, default: '' },
      termsOfDelivery: { type: String, default: '' },
    },
    items: [invoiceItemSchema],
    hsnSummary: [hsnSummarySchema],
    totals: {
      subtotalTaxable: { type: Number, required: true },
      totalDiscount: { type: Number, default: 0 },
      totalCgst: { type: Number, default: 0 },
      totalSgst: { type: Number, default: 0 },
      totalIgst: { type: Number, default: 0 },
      totalTax: { type: Number, required: true },
      roundOff: { type: Number, default: 0 },
      grandTotal: { type: Number, required: true },
      autoRoundOff: { type: Boolean, default: true },
    },
    amountInWords: { type: String, required: true },
    taxAmountInWords: { type: String, required: true },
    declaration: { type: String, default: '' },
    notes: { type: String, default: '' },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    bookingRef: { type: String, default: '' },
  },
  { timestamps: true }
);

invoiceSchema.index({ invoiceDate: -1, documentType: 1 });

export default mongoose.model('Invoice', invoiceSchema);

