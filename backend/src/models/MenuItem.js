const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
    category: {
      type: String,
      enum: ['breakfast', 'lunch', 'snacks', 'beverages', 'desserts'],
      default: 'snacks',
    },
    isAvailable: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);
