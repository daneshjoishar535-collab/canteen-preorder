---
title: "Online Food Pre-order System (Campus Canteen)"
subtitle: "Project Report & Viva Preparation Document — Backend Development (Node.js, Express.js & MongoDB)"
---

# 1. Project Overview

## 1.1 Problem statement
A college canteen wants students to **pre-order food for a specific pickup time slot** so they don't wait in queues. Each slot is **capped at a maximum number of orders**, and canteen **admins manage the menu and daily slot capacity**.

## 1.2 What the system does
- Students register/login, browse the menu, choose a pickup slot, place a pre-order, view order history and cancel orders.
- Orders beyond a slot's capacity are **automatically rejected** (HTTP 409).
- Admins add/update/delete menu items, mark them unavailable, create slots, change slot capacity, and move orders through preparing → ready → completed.
- Order history is available to students (own orders) and admins (all orders).

## 1.3 Objectives → how each is met

| Objective (from project sheet) | Implementation |
|---|---|
| Design MenuItem, Slot, Order schemas using Mongoose | `models/MenuItem.js`, `Slot.js`, `Order.js` (+ `User.js`) |
| CRUD for menu items and slots | `menuController.js`, `slotController.js` |
| Maximum-order-per-slot rule | Atomic update in `orderController.create` |
| Role-based authorization for admin actions | `authorize('admin')` middleware on admin routes |
| Validate order data incl. item availability | `validate.js` (shape) + `orderController` (availability, price) |

## 1.4 Technology stack

| Layer | Technology | Why |
|---|---|---|
| Runtime | Node.js | Non-blocking I/O, same language (JavaScript) front and back |
| Web framework | Express.js | Minimal, middleware-based routing |
| Database | MongoDB Atlas | Document store, free cloud tier, flexible schema |
| ODM | Mongoose | Schemas, validation, references, populate |
| Auth | JWT + bcryptjs | Stateless authentication, hashed passwords |
| Frontend | React (Vite) + Axios + React Router | Component UI that only calls the REST API |
| Deployment | Render/Railway (API), Vercel/Netlify (UI), Atlas (DB) | As required by the deployment note |

# 2. System Architecture

```
 React (Vercel)  ──HTTPS/JSON──►  Express API (Render)  ──Mongoose──►  MongoDB Atlas
   Axios + JWT                    routes → middleware → controllers      users, menuitems,
   (no business logic)            (auth, validate, authorize)            slots, orders
```

**Request lifecycle** (e.g. `POST /api/orders`):

1. `app.js` — CORS, JSON body parser, logger.
2. `orderRoutes.js` — matches the route.
3. `protect` — reads `Authorization: Bearer <token>`, verifies JWT, loads the user into `req.user`.
4. `validateOrder` — checks request shape (valid ids, quantity 1–10, no duplicates).
5. `orderController.create` — business logic (slot, availability, capacity, save).
6. On any thrown error, `errorHandler` converts it to a clean JSON response with the right status code.

**Design principles used**
- *Separation of concerns*: routes (what URL), middleware (cross-cutting checks), controllers (business logic), models (data).
- *Frontend contains no business rules*: validation and capacity logic are enforced in Express/MongoDB, exactly as the project sheet requires. The UI's checks are only for user convenience.
- *Never trust the client*: prices and totals are computed on the server from database values; the client only sends ids and quantities.

# 3. Folder Structure

```
backend/
  server.js                 loads .env, connects to MongoDB, starts HTTP server
  src/app.js                builds the Express app (middleware + routes)
  src/config/db.js          Mongoose connection using MONGO_URI
  src/models/               User, MenuItem, Slot, Order
  src/controllers/          authController, menuController, slotController, orderController
  src/middleware/           auth.js (protect, authorize), validate.js, error.js
  src/routes/               authRoutes, menuRoutes, slotRoutes, orderRoutes
  scripts/seed.js           demo data      scripts/gen-postman.js  builds Postman collection
  scripts/smoke-test.js     end-to-end API test (npm run smoke)
  postman/                  collection + environment
  .env.example              environment variable template
frontend/
  src/api.js                Axios instance (baseURL from VITE_API_URL, JWT interceptor)
  src/AuthContext.jsx       login/register/logout state
  src/pages/                Login, Register, Dashboard, MenuForm, OrderHistory, OrderDetails, AdminSlots
  src/components/Navbar.jsx
```

# 4. Database Design

## 4.1 Collections and relationships

```
User 1 ──── * Order * ──── 1 Slot
                 │
                 └── items[] → (snapshot of) MenuItem
```

**User** — `name`, `email` (unique, lowercase), `password` (bcrypt hash, `select:false` so it is never returned by default), `role` (`student` | `admin`).

**MenuItem** — `name` (unique), `description`, `price` (≥ 0), `category` (enum), `isAvailable` (boolean), `createdBy` → User.

**Slot** — `date` (`YYYY-MM-DD`), `time` (`HH:mm`), `maxOrders` (integer ≥ 1), `currentOrders` (default 0), `isActive`, `createdBy` → User. A **compound unique index on (date, time)** prevents duplicate slots. Virtuals `remaining` and `isFull` are computed from the two counters.

**Order** — `student` → User (ref), `slot` → Slot (ref), `items[]` (each has `menuItem` → MenuItem ref plus `name`, `price`, `quantity` snapshot), `totalAmount`, `status` (`confirmed`, `preparing`, `ready`, `completed`, `cancelled`), `note`.

## 4.2 Why *referenced* collections (not embedded)?
The project requires "MongoDB/Mongoose database with referenced collections". Users, slots and menu items are shared, independently-changing entities used by many orders, so they are **referenced by ObjectId** and fetched with `populate()`. Embedding a slot inside every order would duplicate data and break the single shared `currentOrders` counter.

## 4.3 Why a *snapshot* of name/price inside the order?
If the admin later changes a price or deletes an item, past orders must still show what the student actually paid. So each order line stores `name` and `price` at the time of ordering **and** keeps the `menuItem` reference.

## 4.4 Indexes
`Slot(date, time)` unique; `Order.student` and `Order.slot` indexed for fast history/slot queries; `User.email` unique.

# 5. Authentication & Authorization

## 5.1 Authentication (who are you?)
1. **Register**: password is hashed with **bcrypt (10 salt rounds)** in a Mongoose `pre('save')` hook — plain passwords are never stored.
2. **Login**: the email is looked up (with `.select('+password')`), `bcrypt.compare` checks the password, then a **JWT** `{id, role}` signed with `JWT_SECRET` (expires in 7 days) is returned.
3. **Protected routes**: the `protect` middleware extracts the Bearer token, verifies the signature/expiry, loads the user from the DB (so deleted users are rejected) and sets `req.user`.
4. The React app stores the token in `localStorage` and an Axios request interceptor attaches it to every call; a response interceptor logs out on 401.

## 5.2 Authorization (what may you do?) — Role-Based Access Control
`authorize('admin')` is a middleware factory:

```js
exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
  next();
};
```
Used as `router.post('/', authorize('admin'), validateMenuItem(false), c.create)`. Order of middleware matters: **authenticate → authorize → validate → controller**.

**Status codes:** 401 = not logged in / bad token; 403 = logged in but not allowed.

## 5.3 Preventing privilege escalation
A client could send `"role": "admin"` while registering. The controller **ignores any role field**; admin accounts can only be created when the correct secret `ADMIN_INVITE_CODE` (stored in `.env`) is supplied (or via the seed script).

## 5.4 Object-level authorization
Beyond roles, a student may only read/cancel **their own** orders: `getOne` and `cancel` compare `order.student` with `req.user._id` and return 403 otherwise.

# 6. The Core Business Rule: Maximum Orders per Slot

## 6.1 The naive approach and why it is wrong (race condition)
```js
const slot = await Slot.findById(id);
if (slot.currentOrders >= slot.maxOrders) reject();   // check
slot.currentOrders += 1; await slot.save();            // act
```
If two students order the **last seat at the same instant**, both requests read `currentOrders = 9` (max 10), both pass the check, and the slot ends up with 11 orders. This is a *check-then-act race condition*.

## 6.2 Our solution: one atomic conditional update
```js
const reserved = await Slot.findOneAndUpdate(
  { _id: slot._id, isActive: true, $expr: { $lt: ['$currentOrders', '$maxOrders'] } },
  { $inc: { currentOrders: 1 } },
  { new: true }
);
if (!reserved) throw httpError(409, 'Slot is full...');
```
MongoDB executes a single-document update **atomically**: the filter (“has room”) and the increment happen as one indivisible operation. Only one of two simultaneous requests can match the filter for the last seat; the other gets `null` and receives **409 Conflict**. No transaction or lock is needed.

## 6.3 Complete order-creation flow
1. Validate body shape (`validateOrder`): valid ObjectIds, non-empty `items`, quantity integer 1–10, no duplicate items.
2. Load the slot → must exist, be `isActive`, and **not already started** (start time computed with `CANTEEN_TZ_OFFSET`, default +05:30).
3. Load all menu items → each must exist **and** `isAvailable === true`; otherwise 404/400 with the item names.
4. **Compute `totalAmount` on the server** from DB prices.
5. **Atomically reserve a seat** (6.2) — 409 if full.
6. Save the order. If saving fails, the seat is **released** (`$inc: -1`) so capacity never leaks.

## 6.4 Releasing seats
- Student cancel (`PATCH /orders/:id/cancel`) is allowed only while status is `confirmed` and before the slot starts; admin can cancel anytime before completion.
- The order is changed using a **conditional update** (`status: {$nin: ['cancelled','completed']}`) so a double-click cannot decrement the slot twice.
- Then `currentOrders` is decremented (guarded by `$gt: 0`).

## 6.5 Other slot rules
- Admin cannot set `maxOrders` below `currentOrders` (409).
- Date/time of a slot with bookings cannot be changed.
- A slot with non-cancelled orders cannot be deleted (admin should *close* it with `isActive:false`).
- Students only see active, future slots; the UI also disables full slots.

## 6.6 Order status state machine
```
confirmed ──► preparing ──► ready ──► completed
    └──► cancelled
```
`updateStatus` rejects illegal jumps (e.g. completed → preparing) with 409.

# 7. REST API Reference

| Method | Endpoint | Role | Success | Errors |
|---|---|---|---|---|
| POST | /api/auth/register | public | 201 token+user | 400, 403 (bad admin code), 409 (email exists) |
| POST | /api/auth/login | public | 200 token+user | 400, 401 |
| GET | /api/auth/me | user | 200 | 401 |
| GET | /api/menu-items | user | 200 list | 401 |
| GET | /api/menu-items/:id | user | 200 | 400 (bad id), 404 |
| POST | /api/menu-items | admin | 201 | 400, 401, 403, 409 (duplicate name) |
| PUT | /api/menu-items/:id | admin | 200 | 400, 403, 404 |
| DELETE | /api/menu-items/:id | admin | 200 | 403, 404 |
| GET | /api/slots | user | 200 list | 401 |
| POST | /api/slots | admin | 201 | 400, 403, 409 (duplicate date+time) |
| PUT | /api/slots/:id | admin | 200 | 400, 403, 404, 409 |
| DELETE | /api/slots/:id | admin | 200 | 403, 404, 409 (live orders) |
| POST | /api/orders | user | 201 | 400 (validation/unavailable), 404, **409 (slot full)** |
| GET | /api/orders | user | 200 (own / all for admin) | 401 |
| GET | /api/orders/:id | owner/admin | 200 | 403, 404 |
| PATCH | /api/orders/:id/cancel | owner/admin | 200 | 403, 404, 409 |
| PATCH | /api/orders/:id/status | admin | 200 | 403, 404, 409 |

**HTTP status codes used:** 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Internal Server Error.

**Sample — place an order**

Request `POST /api/orders` with header `Authorization: Bearer <token>`:
```json
{ "slotId": "665f...a1", "items": [ {"menuItemId": "665f...b2", "quantity": 2} ], "note": "No onions" }
```
Response `201`:
```json
{ "order": { "_id": "...", "status": "confirmed", "totalAmount": 120,
  "slot": {"date":"2030-01-15","time":"12:30","maxOrders":2,"currentOrders":1},
  "items": [ {"menuItem":"665f...b2","name":"Veg Burger","price":60,"quantity":2} ] } }
```
Response when slot is full `409`: `{ "message": "Slot is full. Please choose another pickup slot." }`

# 8. Validation Strategy

| Level | Where | Examples |
|---|---|---|
| Request shape | `middleware/validate.js` | email format, password ≥ 6, date `YYYY-MM-DD`, time `HH:mm`, quantity integer 1–10, valid ObjectId params |
| Schema | Mongoose (`required`, `min`, `enum`, `match`, `unique`) | price ≥ 0, `maxOrders` ≥ 1, role enum |
| Business | Controllers | item available, slot open & in the future, slot not full, capacity ≥ current orders |
| Client (convenience only) | React forms | disables full slots, quantity limits |

**Centralised error handler** (`middleware/error.js`) converts Mongoose `ValidationError` → 400, `CastError` (bad id) → 400, duplicate key code `11000` → 409, other → 500 with a generic message (no stack leak). Controllers are wrapped in `asyncHandler` so rejected promises reach it.

# 9. Frontend (React) Summary

| Page | Route | Description |
|---|---|---|
| Login / Register | `/login`, `/register` | Auth forms with error display; optional admin invite code |
| Dashboard (List view) | `/` | Students: menu with search/category filter, quantity +/−, cart, slot selector showing seats left, place order. Admin: menu management list with Edit / Delete / availability toggle |
| Add/Update form | `/admin/menu/new`, `/admin/menu/:id/edit` | One component for create and update |
| Order history | `/orders` | Filter by status; students see own, admins see all |
| Details page | `/orders/:id` | Items, totals, slot; student can cancel; admin can advance status |
| Slot management | `/admin/slots` | Create slot, change capacity, open/close, delete |

Routing guards: `Private` component redirects unauthenticated users to `/login` and non-admins away from `/admin/*`. All data comes through Axios calls to the API; the base URL is read from `VITE_API_URL`, so the same build works locally and in production.

# 10. Environment Configuration

`backend/.env` (never committed):

| Variable | Purpose |
|---|---|
| `PORT` | Port the API listens on: 5001 locally (macOS AirPlay uses 5000); Render injects it |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret used to sign tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default 7d) |
| `ADMIN_INVITE_CODE` | Secret code for creating admin accounts |
| `CLIENT_ORIGIN` | Allowed frontend origin(s) for CORS |
| `CANTEEN_TZ_OFFSET` | Timezone offset for slot start time |

`frontend/.env`: `VITE_API_URL`.

# 11. Deployment Steps (as per Deployment Note)

1. **MongoDB Atlas**: create free cluster → create DB user → allow network access → copy connection string.
2. **Backend on Render/Railway**: connect GitHub repo, root `backend`, build `npm install`, start `npm start`, set environment variables listed above.
3. **Frontend on Vercel/Netlify**: root `frontend`, build `npm run build`, output `dist`, set `VITE_API_URL` to the live backend `/api` URL.
4. Set backend `CLIENT_ORIGIN` to the deployed frontend URL (CORS), redeploy, test login and an order end to end.

# 12. Testing with Postman

Collection: `backend/postman/Canteen-PreOrder.postman_collection.json` (5 folders, 43 requests). Test scripts store `adminToken`, `studentToken`, `menuItemId`, `slotId`, `orderId` automatically.

Key scenario (Orders folder): slot capacity = 2 → order #1 (201) → order #2 (201) → order #3 (**409 full**) → cancel #2 → order #3 again (**201**, seat freed). Negative tests cover 401, 403, 400 (negative price, zero quantity, empty items, bad time) and unavailable-item orders.

# 13. Security Considerations

- Passwords hashed with bcrypt; `password` field excluded from queries by default.
- JWT signed with a secret from the environment; expiry enforced.
- Role checks on every admin route; ownership checks on orders.
- Server-side price calculation (client cannot tamper with totals).
- Input validation + Mongoose schema validation; regex search input is escaped to avoid ReDoS/regex injection.
- Generic 500 messages (no stack traces) in responses.
- Secrets in `.env`, which is git-ignored; CORS restricted to configured origin.
- *Possible hardening (future work)*: `helmet`, rate limiting on login, refresh tokens/httpOnly cookies instead of localStorage.

# 14. Limitations and Future Enhancements
- Online payment integration (UPI/Razor­pay).
- Real-time order status via WebSockets / push notifications.
- Capacity per *item* (stock) in addition to per slot.
- Recurring daily slot templates generated automatically.
- Pagination for order history; unit/integration tests (Jest + Supertest).

# 15. Viva Questions and Answers

## A. Project & concept

**Q1. Explain your project in one minute.**
It is a REST API plus React UI for a campus canteen. Students choose food and a pickup slot; each slot has a maximum number of orders, enforced on the server. Admins manage the menu and slots. It uses Express for routing, MongoDB Atlas with Mongoose for data, JWT for authentication and role-based middleware to protect admin actions.

**Q2. What problem does it solve?**
Queues at the canteen. Pre-ordering distributes demand across time slots, and the capacity cap stops the kitchen from being overloaded in any one slot.

**Q3. Who are the users and what can each do?**
Student: register/login, view available menu, view open slots, place/cancel own orders, see own history. Admin: everything a student can, plus CRUD on menu items and slots, view all orders, update order status.

**Q4. Why separate frontend and backend?**
Independent deployment and scaling, a reusable API (mobile app later), and a clear boundary: the frontend only presents data; validation and business rules stay in the backend where they cannot be bypassed.

## B. Node.js & Express

**Q5. What is Node.js and why use it here?**
A JavaScript runtime on Chrome's V8 engine with an event-driven, non-blocking I/O model — ideal for I/O-heavy APIs like ours that mostly wait on the database.

**Q6. What is Express and what is middleware?**
Express is a minimal web framework. Middleware are functions `(req, res, next)` that run in sequence; they can modify the request, end the response, or call `next()`. Ours: `cors`, `express.json`, `morgan`, `protect`, `authorize`, validators, and the error handler.

**Q7. What is the order of middleware in your order route and why?**
`protect` (authenticate) → `authorize` (role) → `validate*` (body shape) → controller. Cheap, security-critical checks come first so unauthorised requests never reach the logic.

**Q8. What does `next(err)` do? How do you handle async errors?**
Passing an argument to `next` skips to the error-handling middleware (4 arguments). `asyncHandler` wraps controllers in `Promise.resolve(fn()).catch(next)` so rejected promises are forwarded to it (Express 4 doesn't do this automatically).

**Q9. Why `express.json()`?**
It parses JSON request bodies into `req.body`; without it `req.body` is undefined.

**Q10. What is CORS and why configure it?**
Browsers block cross-origin calls unless the server allows them. The React app (different domain) calls the API, so the API sets allowed origins from `CLIENT_ORIGIN` (comma-separated, trailing `/` ignored). In development any `http://localhost:<port>` is also allowed so Vite can use any port; in production only the listed origins are allowed. A CORS block (or a server that is not running) shows in Axios as *Network Error* because the browser never gets a readable response — our `errMsg()` turns that into "Cannot reach the API at …".

**Q11. Difference between `PUT` and `PATCH`?**
`PUT` replaces/updates a resource representation (we use it for menu/slot updates, applying only supplied fields); `PATCH` is for partial, action-like changes (cancel, status change).

**Q12. What do the status codes 401, 403, 404, 409 mean in your API?**
401 not authenticated; 403 authenticated but not permitted; 404 not found; 409 conflict with current state (slot full, duplicate, illegal status change).

## C. MongoDB & Mongoose

**Q13. What is MongoDB? How is it different from SQL?**
A document database storing BSON/JSON-like documents in collections, schema-flexible, scales horizontally; no joins by default (we use references + `populate`). SQL uses fixed-schema tables and joins.

**Q14. What is Mongoose?**
An ODM that adds schemas, validation, middleware (hooks), virtuals, population and query helpers on top of the MongoDB driver.

**Q15. Why are your collections referenced rather than embedded?**
Users, slots and items are shared and change independently; a single authoritative slot document holds the counter. References avoid duplication; `populate` resolves them when needed. Order lines embed only a small snapshot (name, price, quantity) that must not change after purchase.

**Q16. What is `populate()`?**
It replaces an ObjectId reference with the actual referenced document (like a join at the application level). We use it to show slot date/time and student name in orders.

**Q17. What are Mongoose virtuals?**
Computed properties not stored in the DB. `Slot.remaining` and `isFull` derive from `maxOrders` and `currentOrders`.

**Q18. What is `select: false` on the password field?**
The field is excluded from query results unless explicitly requested with `.select('+password')`, preventing accidental leaks of hashes.

**Q19. What is a unique/compound index and where do you use it?**
An index enforcing uniqueness. `User.email` is unique; `Slot(date,time)` is a compound unique index so two slots can't exist at the same time.

**Q20. How do you connect to MongoDB Atlas?**
`mongoose.connect(process.env.MONGO_URI)` with the SRV connection string containing the DB user, password and database name; the cluster must allow our server's IP in Network Access.

**Q21. What is a pre-save hook?**
Mongoose middleware that runs before `save()`. We hash the password there only when it was modified.

## D. Authentication & Authorization

**Q22. Authentication vs authorization?**
Authentication proves identity (login + JWT). Authorization decides permissions (role check, ownership check).

**Q23. What is a JWT? What does it contain?**
A signed token `header.payload.signature`. Ours has `id`, `role`, `iat`, `exp`. The server verifies the signature with `JWT_SECRET`, so no session storage is needed (stateless).

**Q24. Is the JWT encrypted?**
No — it is signed, not encrypted; the payload is base64-encoded and readable. Never put secrets in it.

**Q25. Why bcrypt? What is a salt?**
bcrypt is a slow, adaptive hash designed for passwords. A random salt is mixed in so equal passwords produce different hashes and rainbow tables fail. We use 10 rounds.

**Q26. How is role-based authorization implemented?**
Each user has a `role`. `authorize('admin')` checks `req.user.role` against the allowed list and returns 403 otherwise. It is added to all admin routes.

**Q27. Could a student make themselves an admin?**
No. The register controller ignores any `role` in the body. Admin creation needs the secret `ADMIN_INVITE_CODE` (or the seed script). Role checks use the role stored in the database, not what the client sends.

**Q28. Where do you store the token on the client? Any risk?**
`localStorage` for simplicity. Risk: XSS could steal it. Production hardening: httpOnly secure cookies and CSP.

**Q29. Why reload the user from DB in `protect` instead of trusting the token?**
So deleted users or role changes take effect immediately, not only after the token expires.

## E. The capacity rule (most important)

**Q30. How do you enforce the maximum orders per slot?**
With a single atomic `findOneAndUpdate` whose filter requires `currentOrders < maxOrders` and whose update is `$inc: {currentOrders: 1}`. If it matches nothing, the slot is full and we return 409.

**Q31. Why not read the slot, compare, then save?**
That is a race condition: two concurrent requests can both see room for the last seat and both succeed, exceeding capacity. The atomic conditional update makes check-and-increment one indivisible operation.

**Q32. Is a MongoDB transaction needed?**
Not for the capacity check — single-document updates are atomic. We handle the second write (creating the order) with a compensating action: if `Order.create` fails, we decrement the seat. A multi-document transaction (needs a replica set, which Atlas provides) would be an alternative.

**Q33. What happens when an order is cancelled?**
Status changes via a conditional update (so it can't be cancelled twice), then `currentOrders` is decremented, freeing the seat for others.

**Q34. What if the admin lowers `maxOrders` below the current bookings?**
Rejected with 409 — capacity can't go below `currentOrders`.

**Q35. Why compute the total on the server?**
A client could send manipulated prices. The server reads prices from the DB, so totals are trustworthy.

**Q36. How is item availability validated?**
In `orderController.create` we fetch all requested items and reject the order (400) listing any with `isAvailable: false`; nonexistent ids return 404. The UI also disables unavailable items, but the server check is the real guard.

**Q37. Why store name/price inside the order line?**
Historical accuracy: later price changes or deletions must not alter past orders.

**Q38. How do you stop ordering for a slot that already started?**
`slot.startsAt()` builds a Date from the slot's date/time and the configured timezone offset; if it is not in the future the order is rejected (400).

## F. Validation & errors

**Q39. Where does validation happen and why in multiple places?**
Shape validation in middleware (fast fail, clean 400s), data-integrity rules in Mongoose schemas (last line of defence), business rules in controllers, and convenience checks in the React forms. The frontend can be bypassed (e.g. with Postman), so backend validation is mandatory.

**Q40. How do you handle duplicate emails or duplicate slots?**
MongoDB throws error code 11000 from the unique index; the central error handler maps it to HTTP 409 with the field name.

**Q41. What does the global error handler do?**
Maps known errors (validation, cast, duplicate) to proper status codes and hides internal details for unexpected 500 errors.

## G. React frontend

**Q42. How does the frontend talk to the backend?**
Via an Axios instance whose base URL comes from `VITE_API_URL`. A request interceptor adds the JWT; a response interceptor logs the user out on 401.

**Q43. How do you protect routes in React?**
A `Private` wrapper component checks `useAuth()`; unauthenticated users are redirected to `/login`, and `adminOnly` routes redirect non-admins. This is only UX — real protection is on the API.

**Q44. How does your cart work?**
A state object `{ menuItemId: quantity }` in the Dashboard component; the cart lines are derived by joining with the menu list; on submit only ids and quantities are sent.

**Q45. Why use Context for auth?**
So login state and helper functions are available to every component without prop drilling.

## H. Deployment & tools

**Q46. How did you deploy?**
Backend on Render/Railway with environment variables, database on MongoDB Atlas, frontend on Vercel/Netlify with `VITE_API_URL` pointing to the live API; backend CORS allows the frontend origin.

**Q47. Why `.env` files? What must never be committed?**
They keep secrets and environment-specific settings out of source code. `.env` is git-ignored; `.env.example` documents required variables.

**Q48. What is the role of Postman here?**
To test and document the API independently of the UI. The collection chains requests using saved variables and contains positive and negative tests.

**Q49. Why does the frontend need `_redirects`/`vercel.json`?**
It is a single-page app; refreshing `/orders/123` would 404 on the static host without a rewrite to `index.html`.

**Q50. What would you improve next?**
Payments, WebSocket status updates, per-item stock, rate limiting/helmet, pagination and automated tests with Jest and Supertest.

## I. Quick-fire (one-liners)

- **REST**: stateless architecture using HTTP verbs on resource URLs.
- **Idempotent methods**: GET, PUT, DELETE; POST is not.
- **`req.params` vs `req.query` vs `req.body`**: URL path parts / query string / payload.
- **Why `next()`?** Passes control to the next middleware.
- **ObjectId**: 12-byte unique id of a MongoDB document.
- **`findOneAndUpdate` with `{ new: true }`**: returns the updated document.
- **`$inc`**: atomic numeric increment operator.
- **`$expr`**: allows comparing two fields of the same document in a query.
- **`lean()`**: returns plain objects, faster (not used where virtuals are needed).
- **`bcrypt.compare`**: hashes the candidate with the stored salt and compares.
- **npm scripts used**: `npm run dev`, `npm start`, `npm run seed`, `npm run smoke` (end-to-end API test, 43 checks), `npm run build`.

# 16. Demonstration Script (for the viva)

1. Show `.env.example` and Atlas collections.
2. Register a student; try registering with a wrong admin code → 403.
3. Login as admin → create menu items and a slot with capacity 2 (Postman or UI).
4. Login as student → place two orders in that slot → third order is rejected (409 "Slot is full").
5. Cancel one order → place again → succeeds (seat released).
6. Show student → admin-only endpoint returns 403.
7. Show admin advancing order status and the order history/details pages.
8. Open the deployed URLs and repeat one order against the live backend.
