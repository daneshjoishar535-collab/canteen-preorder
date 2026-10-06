const Slot = require('../models/Slot');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const { asyncHandler } = require('../middleware/validate');
const { httpError } = require('../middleware/error');

const populateOrder = (q) =>
  q.populate('slot', 'date time maxOrders currentOrders').populate('student', 'name email');

// POST /api/orders   body: { slotId, items:[{menuItemId, quantity}], note? }
//
// Order flow (each step maps to a business rule):
//  1. slot must exist, be active and not already started
//  2. every menu item must exist AND be available (item-availability validation)
//  3. total is computed on the SERVER from DB prices (never trust client prices)
//  4. capacity is reserved with ONE atomic conditional update:
//       findOneAndUpdate({_id, currentOrders < maxOrders}, {$inc:{currentOrders:1}})
//     so two students can never take the last seat at the same time.
//  5. order is saved; if saving fails, the reserved seat is released.
exports.create = asyncHandler(async (req, res) => {
  const { slotId, items, note } = req.body;

  const slot = await Slot.findById(slotId);
  if (!slot || !slot.isActive) throw httpError(404, 'Slot not found or not open for booking');
  if (slot.startsAt() <= new Date()) throw httpError(400, 'This slot has already started');

  const ids = items.map((i) => i.menuItemId);
  const menuItems = await MenuItem.find({ _id: { $in: ids } });
  const byId = new Map(menuItems.map((m) => [String(m._id), m]));

  const unavailable = [];
  const lines = items.map((i) => {
    const m = byId.get(String(i.menuItemId));
    if (!m) throw httpError(404, `Menu item not found: ${i.menuItemId}`);
    if (!m.isAvailable) unavailable.push(m.name);
    return { menuItem: m._id, name: m.name, price: m.price, quantity: i.quantity };
  });
  if (unavailable.length) {
    throw httpError(400, `Item(s) currently unavailable: ${unavailable.join(', ')}`);
  }

  const totalAmount = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  // Atomic capacity check + reservation
  const reserved = await Slot.findOneAndUpdate(
    { _id: slot._id, isActive: true, $expr: { $lt: ['$currentOrders', '$maxOrders'] } },
    { $inc: { currentOrders: 1 } },
    { new: true }
  );
  if (!reserved) throw httpError(409, 'Slot is full. Please choose another pickup slot.');

  try {
    const order = await Order.create({
      student: req.user._id,
      slot: slot._id,
      items: lines,
      totalAmount,
      note,
    });
    const populated = await populateOrder(Order.findById(order._id));
    res.status(201).json({ order: populated });
  } catch (err) {
    await Slot.updateOne({ _id: slot._id }, { $inc: { currentOrders: -1 } }); // release seat
    throw err;
  }
});

// GET /api/orders?status=&date=&slotId=   students: own orders, admin: all orders
exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role !== 'admin') filter.student = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.slotId) filter.slot = req.query.slotId;
  if (req.query.date) {
    const slotIds = await Slot.find({ date: req.query.date }).distinct('_id');
    filter.slot = { $in: slotIds };
  }
  const orders = await populateOrder(Order.find(filter).sort({ createdAt: -1 }));
  res.json({ count: orders.length, orders });
});

// GET /api/orders/:id   (owner or admin)
exports.getOne = asyncHandler(async (req, res) => {
  const order = await populateOrder(Order.findById(req.params.id));
  if (!order) throw httpError(404, 'Order not found');
  const ownerId = String(order.student._id || order.student);
  if (req.user.role !== 'admin' && ownerId !== String(req.user._id)) {
    throw httpError(403, 'You can only view your own orders');
  }
  res.json({ order });
});

// PATCH /api/orders/:id/cancel   (owner while still 'confirmed', or admin)
exports.cancel = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('slot');
  if (!order) throw httpError(404, 'Order not found');

  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && String(order.student) !== String(req.user._id)) {
    throw httpError(403, 'You can only cancel your own orders');
  }
  if (!isAdmin && order.status !== 'confirmed') {
    throw httpError(409, `Order is already ${order.status} and can no longer be cancelled`);
  }
  if (!isAdmin && order.slot.startsAt() <= new Date()) {
    throw httpError(409, 'Slot has started; cancellation is closed');
  }

  // conditional update guards against double-cancel (which would double-release the seat)
  const cancelled = await Order.findOneAndUpdate(
    { _id: order._id, status: { $nin: ['cancelled', 'completed'] } },
    { status: 'cancelled' },
    { new: true }
  );
  if (!cancelled) throw httpError(409, 'Order cannot be cancelled in its current state');

  await Slot.updateOne({ _id: order.slot._id, currentOrders: { $gt: 0 } }, { $inc: { currentOrders: -1 } });
  res.json({ order: await populateOrder(Order.findById(order._id)) });
});

const NEXT = {
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

// PATCH /api/orders/:id/status   (admin)  body: { status }
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw httpError(404, 'Order not found');
  if (!NEXT[order.status].includes(status)) {
    throw httpError(409, `Cannot move order from "${order.status}" to "${status}". Allowed: ${NEXT[order.status].join(', ') || 'none'}`);
  }
  order.status = status;
  await order.save();
  if (status === 'cancelled') {
    await Slot.updateOne({ _id: order.slot, currentOrders: { $gt: 0 } }, { $inc: { currentOrders: -1 } });
  }
  res.json({ order: await populateOrder(Order.findById(order._id)) });
});
