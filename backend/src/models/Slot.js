const mongoose = require('mongoose');

// A pickup time slot. `currentOrders` is incremented atomically by the order
// controller; `maxOrders` is the capacity set by the canteen admin.
const slotSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'] },
    time: { type: String, required: true, match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'time must be HH:mm'] },
    maxOrders: { type: Number, required: true, min: [1, 'maxOrders must be at least 1'], validate: Number.isInteger },
    currentOrders: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// One slot per date+time
slotSchema.index({ date: 1, time: 1 }, { unique: true });

slotSchema.virtual('remaining').get(function () {
  return Math.max(this.maxOrders - this.currentOrders, 0);
});
slotSchema.virtual('isFull').get(function () {
  return this.currentOrders >= this.maxOrders;
});
slotSchema.set('toJSON', { virtuals: true });
slotSchema.set('toObject', { virtuals: true });

// Start of the slot as a JS Date (uses canteen timezone offset, default IST)
slotSchema.methods.startsAt = function () {
  const offset = process.env.CANTEEN_TZ_OFFSET || '+05:30';
  return new Date(`${this.date}T${this.time}:00${offset}`);
};

module.exports = mongoose.model('Slot', slotSchema);
