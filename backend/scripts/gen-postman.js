// Generates postman/Canteen-PreOrder.postman_collection.json
const fs = require('fs');
const path = require('path');

const req = (name, method, url, { body, auth = true, test } = {}) => ({
  name,
  event: test ? [{ listen: 'test', script: { type: 'text/javascript', exec: test.split('\n') } }] : undefined,
  request: {
    method,
    header: [
      ...(body ? [{ key: 'Content-Type', value: 'application/json' }] : []),
      ...(auth ? [{ key: 'Authorization', value: 'Bearer {{token}}' }] : []),
    ],
    ...(body ? { body: { mode: 'raw', raw: JSON.stringify(body, null, 2) } } : {}),
    url: { raw: `{{baseUrl}}${url}`, host: ['{{baseUrl}}'], path: url.split('?')[0].split('/').filter(Boolean), query: url.includes('?') ? url.split('?')[1].split('&').map((p) => ({ key: p.split('=')[0], value: p.split('=')[1] })) : undefined },
  },
});

const saveToken = (varName) => `const j = pm.response.json();\npm.environment.set("${varName}", j.token);\npm.test("status 2xx", () => pm.response.to.be.success);`;
const saveId = (varName, key) => `const j = pm.response.json();\npm.environment.set("${varName}", j.${key}._id);\npm.test("created", () => pm.response.to.have.status(201));`;
const expect = (code) => `pm.test("status ${code}", () => pm.response.to.have.status(${code}));`;

const collection = {
  info: {
    name: 'Campus Canteen Pre-order API',
    description: 'Run folders top to bottom. Set environment variable baseUrl (e.g. http://localhost:5001/api). Admin invite code must match ADMIN_INVITE_CODE in backend .env.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [{ key: 'baseUrl', value: 'http://localhost:5001/api' }],
  item: [
    {
      name: '1. Auth',
      item: [
        req('Register admin', 'POST', '/auth/register', { auth: false, body: { name: 'Canteen Admin', email: 'admin@canteen.com', password: 'admin123', adminCode: 'CANTEEN-ADMIN-2026' }, test: saveToken('adminToken') }),
        req('Login admin', 'POST', '/auth/login', { auth: false, body: { email: 'admin@canteen.com', password: 'admin123' }, test: saveToken('adminToken') }),
        req('Register student', 'POST', '/auth/register', { auth: false, body: { name: 'Demo Student', email: 'student@college.edu', password: 'student123' }, test: saveToken('studentToken') }),
        req('Login student', 'POST', '/auth/login', { auth: false, body: { email: 'student@college.edu', password: 'student123' }, test: saveToken('studentToken') }),
        req('Me (uses {{token}})', 'GET', '/auth/me'),
        req('NEGATIVE: wrong password -> 401', 'POST', '/auth/login', { auth: false, body: { email: 'student@college.edu', password: 'wrong' }, test: expect(401) }),
        req('NEGATIVE: student tries admin code -> 403', 'POST', '/auth/register', { auth: false, body: { name: 'Hacker', email: 'h@x.com', password: 'secret1', adminCode: 'nope' }, test: expect(403) }),
      ],
    },
    { name: '2. Menu items', item: [] },
  ],
};

// helper: set Authorization per request by token var
const withToken = (r, tokenVar) => {
  r.request.header = r.request.header.map((h) => (h.key === 'Authorization' ? { ...h, value: `Bearer {{${tokenVar}}}` } : h));
  return r;
};
const A = (r) => withToken(r, 'adminToken');
const S = (r) => withToken(r, 'studentToken');

collection.item[0].item[4] = A(req('Me (admin)', 'GET', '/auth/me'));

collection.item[1].item = [
  A(req('Create menu item (admin)', 'POST', '/menu-items', { body: { name: 'Veg Burger', description: 'Crispy patty burger', price: 55, category: 'snacks' }, test: saveId('menuItemId', 'item') })),
  A(req('Create 2nd menu item (admin)', 'POST', '/menu-items', { body: { name: 'Lemon Soda', price: 25, category: 'beverages' }, test: saveId('menuItemId2', 'item') })),
  A(req('List all items (admin sees unavailable too)', 'GET', '/menu-items')),
  A(req('Get one item', 'GET', '/menu-items/{{menuItemId}}')),
  A(req('Update item (admin)', 'PUT', '/menu-items/{{menuItemId}}', { body: { price: 60 }, test: expect(200) })),
  A(req('Mark item2 unavailable (admin)', 'PUT', '/menu-items/{{menuItemId2}}', { body: { isAvailable: false }, test: expect(200) })),
  S(req('Student list (only available items)', 'GET', '/menu-items?category=snacks')),
  S(req('NEGATIVE: student creates item -> 403', 'POST', '/menu-items', { body: { name: 'X', price: 1 }, test: expect(403) })),
  A(req('NEGATIVE: invalid price -> 400', 'POST', '/menu-items', { body: { name: 'Bad', price: -5 }, test: expect(400) })),
  req('NEGATIVE: no token -> 401', 'GET', '/menu-items', { auth: false, test: expect(401) }),
];

collection.item.push(
  {
    name: '3. Slots',
    item: [
      A(req('Create slot cap=2 (admin)', 'POST', '/slots', { body: { date: '2030-01-15', time: '12:30', maxOrders: 2 }, test: saveId('slotId', 'slot') })),
      A(req('Create slot cap=1 (admin)', 'POST', '/slots', { body: { date: '2030-01-15', time: '13:00', maxOrders: 1 }, test: saveId('slotId2', 'slot') })),
      A(req('NEGATIVE: duplicate date+time -> 409', 'POST', '/slots', { body: { date: '2030-01-15', time: '12:30', maxOrders: 5 }, test: expect(409) })),
      A(req('NEGATIVE: bad time format -> 400', 'POST', '/slots', { body: { date: '2030-01-15', time: '25:99', maxOrders: 5 }, test: expect(400) })),
      S(req('Student list slots', 'GET', '/slots?date=2030-01-15&available=true')),
      S(req('NEGATIVE: student creates slot -> 403', 'POST', '/slots', { body: { date: '2030-01-16', time: '12:00', maxOrders: 5 }, test: expect(403) })),
      A(req('Update capacity (admin)', 'PUT', '/slots/{{slotId}}', { body: { maxOrders: 2 }, test: expect(200) })),
    ],
  },
  {
    name: '4. Orders (capacity rule)',
    item: [
      S(req('Place order #1 in slot (cap 2) -> 201', 'POST', '/orders', { body: { slotId: '{{slotId}}', items: [{ menuItemId: '{{menuItemId}}', quantity: 2 }], note: 'No onions' }, test: saveId('orderId', 'order') })),
      S(req('Place order #2 in slot -> 201', 'POST', '/orders', { body: { slotId: '{{slotId}}', items: [{ menuItemId: '{{menuItemId}}', quantity: 1 }] }, test: saveId('orderId2', 'order') })),
      S(req('NEGATIVE: order #3 beyond capacity -> 409 FULL', 'POST', '/orders', { body: { slotId: '{{slotId}}', items: [{ menuItemId: '{{menuItemId}}', quantity: 1 }] }, test: expect(409) })),
      S(req('NEGATIVE: unavailable item -> 400', 'POST', '/orders', { body: { slotId: '{{slotId2}}', items: [{ menuItemId: '{{menuItemId2}}', quantity: 1 }] }, test: expect(400) })),
      S(req('NEGATIVE: quantity 0 -> 400', 'POST', '/orders', { body: { slotId: '{{slotId2}}', items: [{ menuItemId: '{{menuItemId}}', quantity: 0 }] }, test: expect(400) })),
      S(req('NEGATIVE: empty items -> 400', 'POST', '/orders', { body: { slotId: '{{slotId2}}', items: [] }, test: expect(400) })),
      S(req('My order history', 'GET', '/orders')),
      S(req('Order details', 'GET', '/orders/{{orderId}}')),
      S(req('Cancel order #2 (frees a seat)', 'PATCH', '/orders/{{orderId2}}/cancel', { test: expect(200) })),
      S(req('Order #3 now succeeds (seat freed) -> 201', 'POST', '/orders', { body: { slotId: '{{slotId}}', items: [{ menuItemId: '{{menuItemId}}', quantity: 1 }] }, test: expect(201) })),
      A(req('Admin: all orders', 'GET', '/orders?status=confirmed')),
      A(req('Admin: confirmed -> preparing', 'PATCH', '/orders/{{orderId}}/status', { body: { status: 'preparing' }, test: expect(200) })),
      A(req('Admin: preparing -> ready', 'PATCH', '/orders/{{orderId}}/status', { body: { status: 'ready' }, test: expect(200) })),
      A(req('Admin: ready -> completed', 'PATCH', '/orders/{{orderId}}/status', { body: { status: 'completed' }, test: expect(200) })),
      A(req('NEGATIVE: invalid transition -> 409', 'PATCH', '/orders/{{orderId}}/status', { body: { status: 'preparing' }, test: expect(409) })),
      S(req('NEGATIVE: student updates status -> 403', 'PATCH', '/orders/{{orderId}}/status', { body: { status: 'ready' }, test: expect(403) })),
      A(req('NEGATIVE: delete slot with live orders -> 409', 'DELETE', '/slots/{{slotId}}', { test: expect(409) })),
    ],
  },
  {
    name: '5. Cleanup (admin)',
    item: [
      A(req('Delete menu item 2', 'DELETE', '/menu-items/{{menuItemId2}}')),
      A(req('Delete empty slot 2', 'DELETE', '/slots/{{slotId2}}')),
    ],
  }
);

const outDir = path.join(__dirname, '..', 'postman');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'Canteen-PreOrder.postman_collection.json'), JSON.stringify(collection, null, 2));
fs.writeFileSync(
  path.join(outDir, 'Canteen-Local.postman_environment.json'),
  JSON.stringify({ name: 'Canteen Local', values: [{ key: 'baseUrl', value: 'http://localhost:5001/api', enabled: true }], _postman_variable_scope: 'environment' }, null, 2)
);
console.log('Postman files written to', outDir);
