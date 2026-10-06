const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const slotRoutes = require('./routes/slotRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

// CORS: allow the frontend origin(s) from CLIENT_ORIGIN (comma-separated, trailing "/" ignored).
// Outside production any http://localhost:<port> / 127.0.0.1 is also allowed, so the
// dev frontend works even if Vite picks another port.
const clean = (s) => s.trim().replace(/\/+$/, '');
const origins = (process.env.CLIENT_ORIGIN || '*').split(',').map(clean).filter(Boolean);
const isLocal = (o) => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || origins.includes('*') || origins.includes(clean(origin))) return cb(null, true);
      if (process.env.NODE_ENV !== 'production' && isLocal(origin)) return cb(null, true);
      return cb(null, false); // browser will block; server stays up
    },
  })
);
app.use(express.json());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/', (req, res) => res.json({ message: 'Campus Canteen Pre-order API', status: 'ok' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/menu-items', menuRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/orders', orderRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
