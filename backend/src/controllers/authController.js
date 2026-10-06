const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/validate');
const { httpError } = require('../middleware/error');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

// POST /api/auth/register
// Students self-register. An admin account can only be created by supplying the
// secret ADMIN_INVITE_CODE (so nobody can simply send role:"admin").
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, adminCode } = req.body;

  if (await User.findOne({ email: String(email).toLowerCase() })) {
    throw httpError(409, 'Email already registered');
  }

  let role = 'student';
  if (adminCode !== undefined && adminCode !== '') {
    if (!process.env.ADMIN_INVITE_CODE || adminCode !== process.env.ADMIN_INVITE_CODE) {
      throw httpError(403, 'Invalid admin invite code');
    }
    role = 'admin';
  }

  const user = await User.create({ name, email, password, role });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw httpError(401, 'Invalid email or password');
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
