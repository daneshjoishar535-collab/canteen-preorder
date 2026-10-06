const mongoose = require('mongoose');

// Wraps async controllers so rejected promises reach the error middleware
exports.asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Rejects requests whose :id param is not a valid ObjectId
exports.validateObjectId = (param = 'id') => (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params[param])) {
    return res.status(400).json({ message: `Invalid ${param}` });
  }
  next();
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

// Request-body validators (kept hand-written and explicit for viva explanation)
exports.validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};
  const errors = [];
  if (!name || String(name).trim().length < 2) errors.push('name must be at least 2 characters');
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push('a valid email is required');
  if (!password || String(password).length < 6) errors.push('password must be at least 6 characters');
  if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });
  next();
};

exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Validation failed', errors: ['email and password are required'] });
  }
  next();
};

exports.validateMenuItem = (partial = false) => (req, res, next) => {
  const b = req.body || {};
  const errors = [];
  if (!partial || b.name !== undefined) {
    if (!b.name || !String(b.name).trim()) errors.push('name is required');
  }
  if (!partial || b.price !== undefined) {
    if (typeof b.price !== 'number' || Number.isNaN(b.price) || b.price < 0) errors.push('price must be a non-negative number');
  }
  if (b.isAvailable !== undefined && typeof b.isAvailable !== 'boolean') errors.push('isAvailable must be boolean');
  if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });
  next();
};

exports.validateSlot = (partial = false) => (req, res, next) => {
  const b = req.body || {};
  const errors = [];
  if (!partial || b.date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || '')) errors.push('date must be YYYY-MM-DD');
  }
  if (!partial || b.time !== undefined) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time || '')) errors.push('time must be HH:mm (24h)');
  }
  if (!partial || b.maxOrders !== undefined) {
    if (!Number.isInteger(b.maxOrders) || b.maxOrders < 1) errors.push('maxOrders must be an integer >= 1');
  }
  if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });
  next();
};

exports.validateOrder = (req, res, next) => {
  const { slotId, items } = req.body || {};
  const errors = [];
  if (!slotId || !mongoose.isValidObjectId(slotId)) errors.push('slotId must be a valid id');
  if (!Array.isArray(items) || items.length === 0) {
    errors.push('items must be a non-empty array');
  } else {
    items.forEach((it, i) => {
      if (!isObj(it) || !mongoose.isValidObjectId(it.menuItemId)) errors.push(`items[${i}].menuItemId must be a valid id`);
      if (!isObj(it) || !Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 10) {
        errors.push(`items[${i}].quantity must be an integer between 1 and 10`);
      }
    });
    const ids = items.map((it) => it && it.menuItemId);
    if (new Set(ids).size !== ids.length) errors.push('duplicate menu items — combine them into one line with a higher quantity');
  }
  if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });
  next();
};
