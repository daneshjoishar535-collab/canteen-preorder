const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    // snapshot so history stays correct if the menu changes later
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, max: 10, validate: Number.isInteger },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true, index: true },
    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, 'Order must contain at least one item'],
    },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'confirmed',
    },
    note: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
