const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  flavour: { type: String, enum: ['Raw', 'Salted', 'Peri Peri', 'Cheese & Herbs', 'Mint & Lime'], required: true },
  imageUrl: { type: String },
  inStock: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
