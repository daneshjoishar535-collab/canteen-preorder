const MenuItem = require('../models/MenuItem');
const { asyncHandler } = require('../middleware/validate');
const { httpError } = require('../middleware/error');

const EDITABLE = ['name', 'description', 'price', 'category', 'isAvailable'];
const pick = (obj, keys) => keys.reduce((acc, k) => (obj[k] !== undefined ? { ...acc, [k]: obj[k] } : acc), {});

// GET /api/menu-items?category=&search=   (students see only available items)
exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role !== 'admin') filter.isAvailable = true;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) filter.name = { $regex: String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
  res.json({ count: items.length, items });
});

// GET /api/menu-items/:id
exports.getOne = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item || (!item.isAvailable && req.user.role !== 'admin')) throw httpError(404, 'Menu item not found');
  res.json({ item });
});

// POST /api/menu-items  (admin)
exports.create = asyncHandler(async (req, res) => {
  const item = await MenuItem.create({ ...pick(req.body, EDITABLE), createdBy: req.user._id });
  res.status(201).json({ item });
});

// PUT /api/menu-items/:id  (admin)
exports.update = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, pick(req.body, EDITABLE), {
    new: true,
    runValidators: true,
  });
  if (!item) throw httpError(404, 'Menu item not found');
  res.json({ item });
});

// DELETE /api/menu-items/:id  (admin)
// Past orders keep a snapshot of name/price, so hard delete is safe.
exports.remove = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) throw httpError(404, 'Menu item not found');
  res.json({ message: 'Menu item deleted' });
});
