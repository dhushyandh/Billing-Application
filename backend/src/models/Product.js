import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, uppercase: true, default: '' },
    subDescription: { type: String, trim: true, default: '' },
    hsnSac: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true, uppercase: true, default: 'NOS' },
    purchasePrice: { type: Number, min: 0, default: 0 },
    rate: { type: Number, required: true, min: 0.01 },
    rateInclTax: { type: Number, default: 0 },
    isTaxInclusive: { type: Boolean, default: false },
    gstRate: { type: Number, required: true, min: 0, max: 28, default: 18 },
    stockQty: { type: Number, default: 0 },
    category: { type: String, trim: true, default: 'Fencing & Wire' },
    description: { type: String, trim: true, default: '' },
    imageUrl: { type: String, default: '' },
    isVisibleOnStorefront: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    inStock: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', hsnSac: 'text' });

export default mongoose.model('Product', productSchema);

