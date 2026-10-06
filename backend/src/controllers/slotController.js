const Slot = require('../models/Slot');
const Order = require('../models/Order');
const { asyncHandler } = require('../middleware/validate');
const { httpError } = require('../middleware/error');

// GET /api/slots?date=YYYY-MM-DD&available=true
// Students only see active slots that have not started yet.
exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  const isAdmin = req.user.role === 'admin';
  if (req.query.date) filter.date = req.query.date;
  if (!isAdmin) filter.isActive = true;
  if (req.query.available === 'true') filter.$expr = { $lt: ['$currentOrders', '$maxOrders'] };

  let slots = await Slot.find(filter).sort({ date: 1, time: 1 });
  if (!isAdmin) slots = slots.filter((s) => s.startsAt() > new Date());
  res.json({ count: slots.length, slots });
});

// GET /api/slots/:id
exports.getOne = asyncHandler(async (req, res) => {
  const slot = await Slot.findById(req.params.id);
  if (!slot || (!slot.isActive && req.user.role !== 'admin')) throw httpError(404, 'Slot not found');
  res.json({ slot });
});

// POST /api/slots  (admin)
exports.create = asyncHandler(async (req, res) => {
  const { date, time, maxOrders, isActive } = req.body;
  const slot = await Slot.create({ date, time, maxOrders, isActive, createdBy: req.user._id });
  res.status(201).json({ slot });
});

// PUT /api/slots/:id  (admin)
// Business rules: capacity can never drop below orders already accepted, and the
// date/time of a slot with bookings cannot be moved.
exports.update = asyncHandler(async (req, res) => {
  const slot = await Slot.findById(req.params.id);
  if (!slot) throw httpError(404, 'Slot not found');

  const { date, time, maxOrders, isActive } = req.body;
  if (maxOrders !== undefined && maxOrders < slot.currentOrders) {
    throw httpError(409, `maxOrders cannot be less than current orders (${slot.currentOrders})`);
  }
  if ((date !== undefined || time !== undefined) && slot.currentOrders > 0 &&
      ((date !== undefined && date !== slot.date) || (time !== undefined && time !== slot.time))) {
    throw httpError(409, 'Cannot change date/time of a slot that already has orders');
  }

  if (date !== undefined) slot.date = date;
  if (time !== undefined) slot.time = time;
  if (maxOrders !== undefined) slot.maxOrders = maxOrders;
  if (isActive !== undefined) slot.isActive = isActive;
  await slot.save();
  res.json({ slot });
});

// DELETE /api/slots/:id  (admin) - blocked while live orders exist
exports.remove = asyncHandler(async (req, res) => {
  const slot = await Slot.findById(req.params.id);
  if (!slot) throw httpError(404, 'Slot not found');
  const live = await Order.exists({ slot: slot._id, status: { $ne: 'cancelled' } });
  if (live) throw httpError(409, 'Slot has active orders; deactivate it instead of deleting');
  await slot.deleteOne();
  res.json({ message: 'Slot deleted' });
});
