import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    isRegistered: { type: Boolean, default: true },
    gstin: { type: String, trim: true, uppercase: true, default: '' },
    stateCode: { type: String, required: true, trim: true },
    stateName: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

customerSchema.index({ name: 'text', gstin: 'text', phone: 'text' });

export default mongoose.model('Customer', customerSchema);

