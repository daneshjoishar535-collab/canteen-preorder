// End-to-end API test. Server must be running and seeded.
//   npm run smoke                                   (local, http://localhost:5001/api)
//   API_URL=https://<your-api>/api npm run smoke     (deployed)
// Uses Node 18+ built-in fetch, no extra packages. Cleans up what it creates.
require('dotenv').config();

const API = (process.env.API_URL || `http://localhost:${process.env.PORT || 5001}/api`).replace(/\/+$/, '');
const ADMIN_CODE = process.env.ADMIN_INVITE_CODE || 'CANTEEN-ADMIN-2026';

let passed = 0;
let failed = 0;
const check = (name, ok, extra = '') => {
  if (ok) passed++; else failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${extra}`}`);
};

async function call(method, path, body, token) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  return { status: res.status, data };
}

(async () => {
  console.log(`Testing ${API}\n`);
  const tag = Date.now().toString(36);

  const health = await fetch(API.replace(/\/api$/, '') + '/health').then((r) => r.status).catch(() => 0);
  check('GET /health -> 200', health === 200, `got ${health}`);
  if (health !== 200) return finish();

  // --- auth ---
  const admin = await call('POST', '/auth/login', { email: 'admin@canteen.com', password: 'admin123' });
  check('admin login (seeded) -> 200', admin.status === 200 && admin.data.user.role === 'admin', JSON.stringify(admin.data));
  const A = admin.data?.token;

  const badLogin = await call('POST', '/auth/login', { email: 'admin@canteen.com', password: 'wrong' });
  check('wrong password -> 401', badLogin.status === 401);

  const reg = await call('POST', '/auth/register', { name: 'Smoke Student', email: `smoke_${tag}@test.com`, password: 'secret12', role: 'admin' });
  check('register ignores role in body -> student', reg.status === 201 && reg.data.user.role === 'student', JSON.stringify(reg.data));
  const S = reg.data?.token;

  const reg2 = await call('POST', '/auth/register', { name: 'Other Student', email: `smoke2_${tag}@test.com`, password: 'secret12' });
  const S2 = reg2.data?.token;

  const dup = await call('POST', '/auth/register', { name: 'Dup', email: `smoke_${tag}@test.com`, password: 'secret12' });
  check('duplicate email -> 409', dup.status === 409);

  const badCode = await call('POST', '/auth/register', { name: 'Wrong Code', email: `smoke3_${tag}@test.com`, password: 'secret12', adminCode: 'nope' });
  check('wrong admin code -> 403', badCode.status === 403);

  const regAdmin = await call('POST', '/auth/register', { name: 'Smoke Admin', email: `smokeadmin_${tag}@test.com`, password: 'secret12', adminCode: ADMIN_CODE });
  check('correct admin code -> admin', regAdmin.status === 201 && regAdmin.data.user.role === 'admin', JSON.stringify(regAdmin.data));

  check('no token -> 401', (await call('GET', '/menu-items')).status === 401);

  // --- menu (admin only writes) ---
  check('student POST /menu-items -> 403', (await call('POST', '/menu-items', { name: 'Hack', price: 1 }, S)).status === 403);
  check('menu item negative price -> 400', (await call('POST', '/menu-items', { name: `Bad ${tag}`, price: -5 }, A)).status === 400);

  const item1 = await call('POST', '/menu-items', { name: `Smoke Idli ${tag}`, price: 30, category: 'breakfast' }, A);
  const item2 = await call('POST', '/menu-items', { name: `Smoke Juice ${tag}`, price: 25, category: 'beverages' }, A);
  check('admin creates menu items -> 201', item1.status === 201 && item2.status === 201, JSON.stringify(item1.data));
  const I1 = item1.data?.item?._id;
  const I2 = item2.data?.item?._id;

  // --- slots ---
  const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
  const mins = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const slotBody = { date: `2099-12-${day}`, time: `1${Math.floor(Math.random() * 10)}:${mins}`, maxOrders: 2 };
  check('student POST /slots -> 403', (await call('POST', '/slots', slotBody, S)).status === 403);
  const slot = await call('POST', '/slots', slotBody, A);
  check('admin creates cap-2 slot -> 201', slot.status === 201, JSON.stringify(slot.data));
  const SL = slot.data?.slot?._id;

  const slots = await call('GET', '/slots', null, S);
  check('student GET /slots lists new slot', slots.status === 200 && slots.data.slots.some((s) => s._id === SL));

  // --- order validation ---
  check('quantity 11 -> 400', (await call('POST', '/orders', { slotId: SL, items: [{ menuItemId: I1, quantity: 11 }] }, S)).status === 400);
  check('duplicate items -> 400', (await call('POST', '/orders', { slotId: SL, items: [{ menuItemId: I1, quantity: 1 }, { menuItemId: I1, quantity: 1 }] }, S)).status === 400);
  check('empty items -> 400', (await call('POST', '/orders', { slotId: SL, items: [] }, S)).status === 400);

  await call('PUT', `/menu-items/${I2}`, { isAvailable: false }, A);
  const unavail = await call('POST', '/orders', { slotId: SL, items: [{ menuItemId: I2, quantity: 1 }] }, S);
  check('unavailable item -> 400', unavail.status === 400, JSON.stringify(unavail.data));
  const menuS = await call('GET', '/menu-items', null, S);
  check('student menu hides unavailable item', !menuS.data.items.some((i) => i._id === I2));
  await call('PUT', `/menu-items/${I2}`, { isAvailable: true }, A);

  // --- capacity: the key business rule ---
  const order = { slotId: SL, items: [{ menuItemId: I1, quantity: 2 }, { menuItemId: I2, quantity: 1 }], price: 1 };
  const results = await Promise.all([1, 2, 3, 4, 5].map(() => call('POST', '/orders', order, S)));
  const ok = results.filter((r) => r.status === 201);
  const full = results.filter((r) => r.status === 409);
  check('5 parallel orders on cap-2 slot -> exactly 2 accepted', ok.length === 2 && full.length === 3,
    results.map((r) => r.status).join(','));
  check('total computed on server (2x30 + 1x25 = 85)', ok[0]?.data.order.totalAmount === 85, JSON.stringify(ok[0]?.data));
  const slotAfter = await call('GET', `/slots/${SL}`, null, A);
  check('slot currentOrders = 2', slotAfter.data?.slot?.currentOrders === 2);

  const O1 = ok[0]?.data.order._id;
  const O2 = ok[1]?.data.order._id;

  // --- slot rules ---
  check('maxOrders below currentOrders -> 409', (await call('PUT', `/slots/${SL}`, { maxOrders: 1 }, A)).status === 409);
  check('move date of booked slot -> 409', (await call('PUT', `/slots/${SL}`, { date: '2099-11-01' }, A)).status === 409);
  check('delete slot with live orders -> 409', (await call('DELETE', `/slots/${SL}`, null, A)).status === 409);

  // --- order visibility ---
  check('student sees own order', (await call('GET', `/orders/${O1}`, null, S)).status === 200);
  check("other student can't view order -> 403", (await call('GET', `/orders/${O1}`, null, S2)).status === 403);
  const mine = await call('GET', '/orders', null, S2);
  check('other student order list is empty', mine.status === 200 && mine.data.count === 0);
  const all = await call('GET', '/orders', null, A);
  check('admin order list contains order', all.data.orders.some((o) => o._id === O1));

  // --- cancel frees seat exactly once ---
  check("other student can't cancel -> 403", (await call('PATCH', `/orders/${O1}/cancel`, null, S2)).status === 403);
  const c1 = await call('PATCH', `/orders/${O1}/cancel`, null, S);
  check('student cancels own order -> 200', c1.status === 200 && c1.data.order.status === 'cancelled');
  check('second cancel -> 409', (await call('PATCH', `/orders/${O1}/cancel`, null, S)).status === 409);
  const slotC = await call('GET', `/slots/${SL}`, null, A);
  check('cancel freed exactly one seat (currentOrders = 1)', slotC.data?.slot?.currentOrders === 1, JSON.stringify(slotC.data?.slot));
  const again = await call('POST', '/orders', order, S);
  check('freed seat can be booked again -> 201', again.status === 201);
  const O3 = again.data?.order?._id;

  // --- status machine ---
  check('student updates status -> 403', (await call('PATCH', `/orders/${O2}/status`, { status: 'preparing' }, S)).status === 403);
  check('confirmed -> completed (skip) -> 409', (await call('PATCH', `/orders/${O2}/status`, { status: 'completed' }, A)).status === 409);
  let flow = true;
  for (const s of ['preparing', 'ready', 'completed']) {
    const r = await call('PATCH', `/orders/${O2}/status`, { status: s }, A);
    flow = flow && r.status === 200 && r.data.order.status === s;
  }
  check('confirmed -> preparing -> ready -> completed', flow);
  check('student cancel completed order -> 409', (await call('PATCH', `/orders/${O2}/cancel`, null, S)).status === 409);
  const ac = await call('PATCH', `/orders/${O3}/status`, { status: 'cancelled' }, A);
  check('admin cancels confirmed order -> 200', ac.status === 200);

  // --- cleanup (completed order remains, so slot is deactivated instead) ---
  const del = await call('DELETE', `/slots/${SL}`, null, A);
  check('slot with only completed order still blocks delete -> 409', del.status === 409);
  await call('PUT', `/slots/${SL}`, { isActive: false }, A);
  const hidden = await call('GET', '/slots', null, S);
  check('closed slot hidden from students', !hidden.data.slots.some((s) => s._id === SL));
  const emptySlot = await call('POST', '/slots', { ...slotBody, time: '00:00', date: `2099-10-${day}` }, A);
  check('admin deletes empty slot -> 200', (await call('DELETE', `/slots/${emptySlot.data?.slot?._id}`, null, A)).status === 200);
  check('admin deletes menu item -> 200', (await call('DELETE', `/menu-items/${I1}`, null, A)).status === 200);
  await call('DELETE', `/menu-items/${I2}`, null, A);

  await cleanup();
  finish();
})().catch((e) => {
  console.error('\nSmoke test crashed:', e.message);
  console.error(`Is the API running at ${API}?`);
  process.exit(1);
});

// The API has no "delete user/order" endpoints, so remove the test users, their
// orders and the 2099 test slots directly in MongoDB (if MONGO_URI is available).
async function cleanup() {
  if (!process.env.MONGO_URI) return console.log('\n(no MONGO_URI - test data left in DB)');
  const mongoose = require('mongoose');
  const User = require('../src/models/User');
  const Order = require('../src/models/Order');
  const Slot = require('../src/models/Slot');
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({ email: /^smoke.*@test\.com$/ }).distinct('_id');
  await Order.deleteMany({ student: { $in: users } });
  await User.deleteMany({ _id: { $in: users } });
  await Slot.deleteMany({ date: /^2099-/ });
  await mongoose.disconnect();
  console.log('\nTest data cleaned up.');
}

function finish() {
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
