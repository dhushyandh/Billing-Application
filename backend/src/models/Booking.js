import mongoose from 'mongoose';

const bookingItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    description: { type: String, required: true },
    subDescription: { type: String, default: '' },
    hsnSac: { type: String, required: true },
    unit: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.001 },
    rate: { type: Number, required: true },
    rateInclTax: { type: Number, required: true },
    gstRate: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true, trim: true },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, default: '' },
      address: { type: String, required: true, trim: true },
      isRegistered: { type: Boolean, default: false },
      gstin: { type: String, trim: true, uppercase: true, default: '' },
      stateCode: { type: String, default: '33' },
      stateName: { type: String, default: 'Tamil Nadu' },
    },
    items: [bookingItemSchema],
    estimatedTotal: { type: Number, required: true },
    notes: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
    invoiceNumber: { type: String, default: '' },
  },
  { timestamps: true }
);

bookingSchema.index({ createdAt: -1, status: 1 });

export default mongoose.model('Booking', bookingSchema);

