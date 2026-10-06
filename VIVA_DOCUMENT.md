---
title: "Online Food Pre-order System (Campus Canteen)"
subtitle: "Complete Project Document, Viva Guide and Introduction Speech — B.Tech CSE, Backend Development (Node.js, Express.js & MongoDB), Project 130"
---

# PART A — VIVA DAY KIT

# 1. Quick Facts (keep this page open)

| Item | Value |
|---|---|
| Live website (frontend) | https://canteen-preorder-six.vercel.app |
| Live API (backend) | https://canteen-api-v1ga.onrender.com |
| API health check | https://canteen-api-v1ga.onrender.com/health → `{"status":"ok"}` |
| Source code (GitHub) | https://github.com/daneshjoishar535-collab/canteen-preorder |
| Demo admin login | `admin@canteen.com` / `admin123` |
| Demo student login | `student@college.edu` / `student123` |
| Admin invite code (to register a new admin) | `CANTEEN-ADMIN-2026` |
| Local frontend URL | http://localhost:5173 |
| Local backend URL | http://localhost:5001 (not 5000 — see §21) |
| Database (live) | MongoDB Atlas, cluster `Cluster0`, database `campus_canteen` |
| Database (offline) | Local MongoDB 8 on this Mac, database `canteen` |
| Hosting | Backend on Render (free plan), frontend on Vercel (Hobby/free), DB on MongoDB Atlas (free M0) |
| Automated test | `npm run smoke` → 43 checks, all passing (local, offline and live) |

# 2. Introduction Speech

## 2.1 Full version (about 2 minutes)

"Good morning, respected sir/ma'am. My project is the **Online Food Pre-order System for a Campus Canteen**, project number 130 of our Backend Development course.

The problem is simple: during lunch break every student reaches the canteen at the same time, so there are long queues and the kitchen gets overloaded. Our system lets students **pre-order food for a specific pickup time slot**. Every slot has a **maximum number of orders**, so the load is spread across the day and the kitchen never gets more orders than it can prepare in that slot.

There are two roles. A **student** can register, log in, browse the menu, choose a pickup slot, place an order, see order history and cancel an order. A **canteen admin** can add, edit, delete and hide menu items, create pickup slots and set their capacity, open or close slots, see all orders and move each order through *preparing → ready → completed*.

The backend is a **REST API built with Node.js and Express.js**, and the data is stored in **MongoDB Atlas** using **Mongoose** schemas for User, MenuItem, Slot and Order, connected by references. Security uses **JWT authentication**, **bcrypt password hashing** and **role-based authorization middleware**, so only admins can change the menu and slots.

The most important rule is the **slot capacity**. We enforce it with a **single atomic MongoDB update**, so even if many students try to book the last seat at the same moment, only one succeeds and the others get *HTTP 409 – Slot is full*. We proved this with an automated test that sends five orders at the same instant to a slot with capacity two — exactly two are accepted.

The React frontend only calls the API; all validation and business rules live in Express and MongoDB. The project is **deployed live**: the backend on Render, the frontend on Vercel and the database on MongoDB Atlas. It can also run **fully offline** on my laptop with a local MongoDB.

Let me show you a live demo."

## 2.2 Short version (30 seconds)

"My project is a Campus Canteen Pre-order System. Students pre-order food for a pickup time slot, and each slot has a maximum capacity so queues and kitchen overload are avoided. It is a Node.js + Express REST API with MongoDB Atlas and Mongoose, JWT login and role-based admin access. The capacity rule is enforced atomically in MongoDB, so a full slot automatically rejects new orders with HTTP 409. It is deployed on Render and Vercel, and also runs offline."

## 2.3 One-line answers to "what is special about your project?"

- Capacity is enforced **atomically**, so it is safe against race conditions (two students booking the last seat at the same time).
- Prices and totals are **computed on the server**, so a student cannot tamper with the bill.
- A student **cannot make himself/herself an admin**; admin needs a secret invite code.
- Past orders keep a **snapshot** of item name and price, so history stays correct when the menu changes.
- **43 automated end-to-end checks** prove every business rule; it is **live on the internet** and also **runs offline**.

# 3. Do I need to log in again? Just open the link?

- **Yes, just open the link.** Everything is already set up: accounts, menu (7 items) and pickup slots for today, tomorrow and the day after already exist in the live database. Nothing needs to be installed or configured.
- **Logging in is part of the demo.** Use the demo accounts in §1. Logging in in front of the examiner is good — it shows authentication working.
- If you logged in earlier **on the same browser**, the site may remember you for up to 7 days (the JWT is stored in the browser's localStorage). Click **Logout** first so you can show the login.
- To switch between student and admin, click **Logout**, then log in with the other account.
- You do **not** need to log in to Render, Vercel, Atlas or GitHub during the viva. Only if the examiner asks to see the deployment dashboards, open them (you are already signed in on this Mac, or sign in with GitHub/Google).

# 4. Viva Day Checklist

**The night before**
1. Open https://canteen-preorder-six.vercel.app, log in as student, place one test order, log out. This confirms everything works.
2. Charge the laptop. Keep this document and the GitHub page bookmarked.
3. Make sure the offline mode works once (see §6), in case Wi-Fi fails tomorrow.

**15–20 minutes before the viva**
1. Open https://canteen-api-v1ga.onrender.com/health and wait until it shows `{"status":"ok"}`. The free Render server **sleeps after 15 minutes of no use** and the first request can take about 50 seconds. Opening /health wakes it up.
2. Open the live website in one tab and keep it on the Login page.
3. Optionally open in other tabs: the GitHub repo, the code in VS Code, MongoDB Atlas → Browse Collections, and Postman with the collection imported.
4. If you are demoing for longer than 15 minutes with breaks, refresh /health again just before showing the site.

**If the internet fails** → switch to the offline mode in §6 (takes about 1 minute).

# 5. Live Demo Script (7–8 minutes)

Follow this order. Each step shows one requirement of the project sheet.

| # | Do this | Say this / what it proves |
|---|---|---|
| 1 | Open the live site. Show the URL. | "Frontend deployed on Vercel, backend on Render, database on Atlas." |
| 2 | Register a new student (any name, e.g. `rahul@college.edu`, password ≥ 6 chars). | Registration; password is hashed with bcrypt; a JWT is returned and the user is logged in. |
| 3 | On the menu page: search "dosa", click category chips. | Students see only **available** items. |
| 4 | Click **Place pre-order** with no slot selected. | Client-side message "Please choose a pickup slot". |
| 5 | Add 2–3 items with **+**, choose a pickup slot (dropdown shows seats left), add a note, **Place pre-order**. | Order created; you land on the **Details page** with server-computed total. |
| 6 | Click **My Orders**. | Order history for the student (only own orders). |
| 7 | Open the order → **Cancel order** → confirm. | Cancel frees the seat; status becomes *cancelled*. |
| 8 | Logout → log in as **admin**. | Role-based UI: admin sees Menu management, All Orders, Slots. |
| 9 | **+ Add item** → create "Paneer Roll ₹50" → **Edit** price → **Mark unavailable**. | CRUD on menu items; unavailable item is hidden from students and rejected by the API. |
| 10 | **Slots** → create a slot with **Max orders = 1** for later today. | Admin manages slot capacity. |
| 11 | Logout → log in as student → order in that capacity-1 slot (success). | First booking accepted. |
| 12 | Try to book the same slot again (refresh first; it shows **FULL** and is disabled). | Capacity rule: full slots cannot be booked. If forced via Postman → **409 Slot is full**. |
| 13 | Logout → admin → **All Orders** → open the order → **Mark preparing → ready → completed**. | Status state machine; only legal next steps are shown. |
| 14 | Slots page → try **Delete** on the booked slot. | Error "Slot has active orders; deactivate it instead of deleting" (business rule). |
| 15 | (Optional) In the terminal: `cd backend && npm run smoke`. | 43 automated checks pass, including "5 parallel orders on cap-2 slot → exactly 2 accepted". |
| 16 | (Optional) Show code: `orderController.js` `create`, `middleware/auth.js` `authorize`. | Explain the atomic `findOneAndUpdate` and RBAC middleware. |

**Tip:** Step 12 is the heart of the project. Say: "The rule is enforced on the server with an atomic conditional update; the frontend only shows FULL for convenience."

# 6. Running the Project Offline (no internet)

MongoDB Community 8.0 is installed on this Mac and starts automatically at login. In offline mode the backend uses this local database instead of Atlas. The demo data is already loaded into it.

**Start (two Terminal windows, keep both open):**

Terminal 1 — backend with local database:
```
cd ~/Downloads/canteen-preorder/backend
npm run dev:offline
```
Wait for `MongoDB connected` and `API running on port 5001`.

Terminal 2 — frontend:
```
cd ~/Downloads/canteen-preorder/frontend
npm run dev
```
Then open **http://localhost:5173** and log in with the same demo accounts.

**Useful extra commands**
- Reload demo data / create fresh slots for today + next 2 days (offline DB): `npm run seed:offline` (inside `backend`).
- Run all 43 tests against the offline backend: `MONGO_URI=mongodb://127.0.0.1:27017/canteen npm run smoke` (inside `backend`, while the server runs).
- Run locally but with the **cloud** database (internet needed): `npm run dev` instead of `npm run dev:offline`.
- If MongoDB is not running: `brew services start mongodb-community@8.0`.
- Stop a server: press `Ctrl + C` in its terminal.

**How it works:** the backend reads `MONGO_URI` from `backend/.env` (the Atlas string). The `dev:offline` script sets `MONGO_URI=mongodb://127.0.0.1:27017/canteen` before starting; `dotenv` never overrides a variable that is already set, so the local database is used. The frontend's `frontend/.env` already points to `http://localhost:5001/api`. All npm packages are already installed in `node_modules`, so nothing needs to be downloaded.

**Offline data vs live data:** the two databases are separate. An order placed offline does not appear on the live site, and vice versa.

# PART B — COMPLETE PROJECT EXPLANATION

# 7. Project Overview

## 7.1 Problem statement (from the project sheet)
A college canteen wants students to **pre-order food for a specific pickup time slot** to avoid queues. Orders for a slot should be **capped at a maximum number**, and canteen **admins manage the menu and daily slot capacity**.

## 7.2 Objectives → how each is met

| Objective | Implementation |
|---|---|
| Design MenuItem, Slot and Order schemas using Mongoose | `models/MenuItem.js`, `models/Slot.js`, `models/Order.js` (+ `models/User.js`) |
| CRUD operations for menu items and slots | `controllers/menuController.js`, `controllers/slotController.js` + routes |
| Enforce a maximum-order-per-slot business rule | Atomic `findOneAndUpdate` in `orderController.create` |
| Role-based authorization for canteen admin actions | `authorize('admin')` middleware on all admin routes |
| Validate order data including item availability | `middleware/validate.js` (shape) + `orderController.create` (availability, slot, price) |

## 7.3 Outcomes → status

| Expected outcome | Status |
|---|---|
| Students can pre-order food for an available pickup slot | Done — Dashboard page + `POST /api/orders` |
| Orders beyond a slot's capacity are automatically rejected | Done — HTTP 409, tested with 5 parallel orders |
| Canteen admins can manage the menu and slot capacities | Done — Menu management + Slots page |
| Order history is available for both students and admins | Done — `/orders` (own for students, all for admins) |

## 7.4 Deliverables → status

| Deliverable | Where |
|---|---|
| Express.js REST API for menu, slots and orders | `backend/` |
| MongoDB/Mongoose database with referenced collections | Order → User, Slot, MenuItem (ObjectId refs + `populate`) |
| Role-based authorization middleware | `backend/src/middleware/auth.js` |
| Postman/Thunder Client collection | `backend/postman/` (collection + environment) |
| Environment configuration for MongoDB Atlas | `backend/.env.example`, Render environment variables |
| React frontend (menu page, slot selector, order history) | `frontend/` — deployed on Vercel |
| Deployment (Render + Vercel + Atlas, env-based API URL) | Live URLs in §1 |

## 7.5 Technology stack

| Layer | Technology | Why |
|---|---|---|
| Runtime | Node.js (v18+, used v22) | Non-blocking I/O; JavaScript on both frontend and backend |
| Web framework | Express.js 4 | Minimal, middleware-based routing |
| Database | MongoDB Atlas (cloud) / MongoDB 8 (local) | Document database, free cloud tier, flexible schema |
| ODM | Mongoose 8 | Schemas, validation, references, populate, hooks, virtuals |
| Authentication | JSON Web Token (`jsonwebtoken`) + `bcryptjs` | Stateless login, hashed passwords |
| Other backend packages | `cors`, `dotenv`, `morgan` | Cross-origin access, env variables, request logging |
| Frontend | React 18 + Vite 5 + Axios + React Router 6 | Component UI; only calls the REST API |
| Hosting | Render (API), Vercel (UI), MongoDB Atlas (DB) | As required by the deployment note |
| Tools | Git + GitHub, Postman, npm, VS Code, MongoDB Compass | Version control, API testing |

# 8. System Architecture

```
  Browser (React app on Vercel)
        |  HTTPS + JSON, header  Authorization: Bearer <JWT>
        v
  Express REST API on Render  ---  /api/auth, /api/menu-items, /api/slots, /api/orders
        |  routes -> middleware (protect, authorize, validate) -> controllers
        |  Mongoose
        v
  MongoDB Atlas  ---  collections: users, menuitems, slots, orders
```

**Request lifecycle** (example: a student places an order, `POST /api/orders`):

1. React (`Dashboard.jsx`) calls `api.post('/orders', {...})`. The Axios interceptor in `api.js` adds the JWT header.
2. `app.js` runs global middleware: **CORS** check, **express.json()** body parser, **morgan** logger.
3. `orderRoutes.js` matches the route.
4. `protect` verifies the JWT and loads the user into `req.user`.
5. `authorize('student','admin')` checks the role.
6. `validateOrder` checks the body shape (ids, quantities 1–10, no duplicates).
7. `orderController.create` runs the business logic (slot open and in the future, items available, server-side total, atomic seat reservation, save order).
8. Any error thrown goes to `errorHandler`, which returns clean JSON with the right status code.
9. React shows the order details page or the error message.

**Design principles**
- **Separation of concerns:** routes = URLs, middleware = cross-cutting checks, controllers = business logic, models = data.
- **Frontend has no business rules:** all validation and capacity logic is in Express/MongoDB (required by the project sheet). UI checks are only for convenience.
- **Never trust the client:** the client sends only ids and quantities; prices and totals come from the database.
- **Configuration through environment variables:** the same code runs locally, offline and in production.

# 9. Folder Structure and Every File Explained

## 9.1 Top level

| Path | Purpose |
|---|---|
| `README.md` | How to run locally, API summary, deployment steps |
| `VIVA_DOCUMENT.md / .docx` | This document |
| `.gitignore` | Keeps `node_modules`, `.env`, `dist` out of Git |
| `backend/` | Express + Mongoose REST API |
| `frontend/` | React (Vite) user interface |

## 9.2 Backend (`backend/`)

| File | What it does |
|---|---|
| `server.js` | Entry point. Loads `.env` (dotenv), connects to MongoDB, then starts the HTTP server on `PORT` (default 5001). Exits with an error message if the DB connection fails. |
| `package.json` | Dependencies and scripts: `start`, `dev`, `dev:offline`, `seed`, `seed:offline`, `smoke`. |
| `.env.example` | Template of all environment variables (no real secrets). Copy to `.env`. |
| `.env` | Real secrets (Atlas URI, JWT secret). **Never committed** (git-ignored). |
| `src/app.js` | Builds the Express app: CORS (allowed origins from `CLIENT_ORIGIN`, any localhost in development), JSON parser, morgan logger, `/` and `/health` routes, mounts the four routers, then 404 and error handlers. Exported so tests could import it. |
| `src/config/db.js` | `connectDB()` — checks `MONGO_URI` exists, sets `strictQuery`, calls `mongoose.connect`, logs "MongoDB connected". |
| `src/models/User.js` | User schema; **pre-save hook hashes the password** with bcrypt; `matchPassword()` method compares passwords. |
| `src/models/MenuItem.js` | Menu item schema (name unique, price ≥ 0, category enum, isAvailable). |
| `src/models/Slot.js` | Pickup slot schema; unique index on (date, time); virtuals `remaining`, `isFull`; method `startsAt()` returns the slot start as a Date in the canteen timezone. |
| `src/models/Order.js` | Order schema with references to User and Slot, embedded order lines (menuItem ref + name/price snapshot + quantity), total, status, note. |
| `src/middleware/auth.js` | `protect` (JWT authentication) and `authorize(...roles)` (role-based authorization). |
| `src/middleware/validate.js` | `asyncHandler` wrapper, `validateObjectId`, and request-body validators for register, login, menu item, slot and order. |
| `src/middleware/error.js` | `notFound` (404 for unknown routes), central `errorHandler` (maps Mongoose/Mongo errors to 400/409/500), `httpError(status, msg)` helper. |
| `src/controllers/authController.js` | `register` (ignores any role in the body; admin only with invite code), `login` (bcrypt compare, sign JWT), `me`. |
| `src/controllers/menuController.js` | `list` (students see only available; search + category filter), `getOne`, `create`, `update`, `remove`. Only whitelisted fields can be edited. |
| `src/controllers/slotController.js` | `list` (students see only active, future slots), `getOne`, `create`, `update` (capacity ≥ current orders; date/time frozen when booked), `remove` (blocked with live orders). |
| `src/controllers/orderController.js` | `create` (the core logic and capacity rule), `list`, `getOne` (owner/admin), `cancel` (frees the seat once), `updateStatus` (state machine). |
| `src/routes/authRoutes.js` | `POST /register`, `POST /login`, `GET /me`. |
| `src/routes/menuRoutes.js` | All routes need login; POST/PUT/DELETE need `authorize('admin')`. |
| `src/routes/slotRoutes.js` | Same pattern as menu routes. |
| `src/routes/orderRoutes.js` | `POST /`, `GET /`, `GET /:id`, `PATCH /:id/cancel`, admin-only `PATCH /:id/status`. |
| `scripts/seed.js` | Creates the demo admin and student, 7 menu items and pickup slots (10 per day) for today + next 2 days. Safe to run repeatedly (upserts). |
| `scripts/smoke-test.js` | End-to-end test of the running API: 43 checks covering every rule; deletes its own test data afterwards. |
| `scripts/gen-postman.js` | Generates the Postman collection and environment files. |
| `postman/Canteen-PreOrder.postman_collection.json` | Postman collection (5 folders, chained requests, positive + negative tests). |
| `postman/Canteen-Local.postman_environment.json` | Postman environment with `baseUrl = http://localhost:5001/api`. |

## 9.3 Frontend (`frontend/`)

| File | What it does |
|---|---|
| `index.html` | Single HTML page with `<div id="root">`. |
| `vite.config.js` | Vite + React plugin, dev server on port 5173. |
| `package.json` | React, React Router, Axios; scripts `dev`, `build`, `preview`. |
| `.env` / `.env.example` | `VITE_API_URL` — the backend base URL (must end with `/api`). |
| `vercel.json` | Rewrites every path to `index.html` so refreshing `/orders/123` works on Vercel. |
| `public/_redirects` | The same rewrite for Netlify. |
| `.vercelignore` | Stops local `.env` files from being uploaded to Vercel. |
| `src/main.jsx` | Renders `<App/>` inside `BrowserRouter` and `AuthProvider`. |
| `src/App.jsx` | Route table and the `Private` guard (redirects to `/login` if not logged in; `adminOnly` routes redirect students to `/`). |
| `src/api.js` | Axios instance (`baseURL` from `VITE_API_URL`); request interceptor adds the JWT; response interceptor logs out on 401; `errMsg()` turns errors into readable text ("Cannot reach the API at …" when the server is unreachable). |
| `src/AuthContext.jsx` | React Context holding the logged-in user; `login`, `register`, `logout`; saves token and user in localStorage. |
| `src/components/Navbar.jsx` | Top bar; different links for student / admin / logged-out users. |
| `src/pages/Login.jsx` | Login form. |
| `src/pages/Register.jsx` | Register form with optional "I am canteen staff" admin invite code. |
| `src/pages/Dashboard.jsx` | **Main page.** Student: menu with search + category chips, quantity +/− (max 10), cart, total, slot selector showing seats left (full slots disabled), note, Place pre-order. Admin: menu management (Edit, Mark unavailable/available, Delete). |
| `src/pages/MenuForm.jsx` | One form for both **Add** and **Update** menu item (admin). |
| `src/pages/OrderHistory.jsx` | Orders table with status filter chips. Student: own orders. Admin: all orders with student name. |
| `src/pages/OrderDetails.jsx` | Order details (slot, items, subtotal, total). Student: Cancel while confirmed. Admin: buttons for the next allowed status. |
| `src/pages/AdminSlots.jsx` | Create slot (date, time, max orders), change capacity, open/close, delete. Shows booked/capacity and open/full/closed badges. |
| `src/styles.css` | All styling (plain CSS, no framework). |

# 10. Database Design

## 10.1 Collections and relationships

```
  User 1 ------ * Order * ------ 1 Slot
                    |
                    +-- items[]: { menuItem -> MenuItem, name, price, quantity }
  MenuItem.createdBy -> User        Slot.createdBy -> User
```

## 10.2 Schemas field by field

**User** (`users`)

| Field | Type | Rules |
|---|---|---|
| name | String | required, 2–60 chars, trimmed |
| email | String | required, **unique**, lowercase, email format |
| password | String | required, min 6, **bcrypt hash**, `select: false` (never returned by default) |
| role | String | enum `student` / `admin`, default `student` |
| createdAt / updatedAt | Date | automatic (`timestamps: true`) |

**MenuItem** (`menuitems`)

| Field | Type | Rules |
|---|---|---|
| name | String | required, **unique**, max 80 |
| description | String | max 300, default "" |
| price | Number | required, min 0 |
| category | String | enum breakfast / lunch / snacks / beverages / desserts (default snacks) |
| isAvailable | Boolean | default true |
| createdBy | ObjectId → User | admin who created it |

**Slot** (`slots`)

| Field | Type | Rules |
|---|---|---|
| date | String | `YYYY-MM-DD` |
| time | String | `HH:mm` (24-hour) |
| maxOrders | Number | required, integer ≥ 1 (capacity) |
| currentOrders | Number | default 0, min 0 (seats taken) |
| isActive | Boolean | default true (admin can close a slot) |
| createdBy | ObjectId → User | |
| remaining, isFull | virtual | computed from maxOrders and currentOrders, not stored |
| Index | (date, time) **unique** | no two slots at the same date and time |

**Order** (`orders`)

| Field | Type | Rules |
|---|---|---|
| student | ObjectId → User | required, indexed |
| slot | ObjectId → Slot | required, indexed |
| items[] | sub-documents | at least one; each: `menuItem` (ref), `name`, `price` (snapshot), `quantity` (integer 1–10) |
| totalAmount | Number | computed on the server |
| status | String | confirmed / preparing / ready / completed / cancelled (default confirmed) |
| note | String | max 200 |

## 10.3 Why referenced collections (not embedded)?
The project asks for "MongoDB/Mongoose database with referenced collections". Users, slots and menu items are shared, independently changing entities used by many orders, so they are **referenced by ObjectId** and fetched with `populate()`. Embedding the slot inside every order would duplicate data and break the single shared `currentOrders` counter.

## 10.4 Why a snapshot of name/price inside the order?
If the admin later changes a price or deletes an item, past orders must still show what the student actually ordered and paid. So each order line stores `name` and `price` at order time **and** keeps the `menuItem` reference.

## 10.5 Indexes
`User.email` unique; `MenuItem.name` unique; `Slot(date, time)` compound unique; `Order.student` and `Order.slot` indexed for fast history and slot queries.

# 11. Authentication and Authorization

## 11.1 Authentication (who are you?)
1. **Register:** the password is hashed with **bcrypt (10 salt rounds)** in a Mongoose `pre('save')` hook — plain passwords are never stored.
2. **Login:** find the user by email (with `.select('+password')`), check with `bcrypt.compare`, then sign a **JWT** containing `{ id, role }` with `JWT_SECRET`, valid for 7 days (`JWT_EXPIRES_IN`).
3. **Protected routes:** `protect` reads `Authorization: Bearer <token>`, verifies signature and expiry, **loads the user from the database** (deleted users are rejected) and sets `req.user`.
4. **Frontend:** the token is stored in localStorage; Axios attaches it to every request; a 401 response logs the user out automatically.

## 11.2 Authorization (what may you do?) — Role-Based Access Control
```js
exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
  next();
};
```
Used as `router.post('/', authorize('admin'), validateMenuItem(false), c.create)`. Middleware order: **authenticate → authorize → validate → controller**.

**401** = not logged in / bad token. **403** = logged in but not allowed.

## 11.3 Preventing privilege escalation
A user could send `"role": "admin"` while registering. The controller **ignores any role field**. An admin account is created only when the correct secret `ADMIN_INVITE_CODE` is supplied (or by the seed script). Role checks use the role stored in the database, never what the client sends.

## 11.4 Object-level authorization (ownership)
A student can read and cancel **only their own** orders: `getOne` and `cancel` compare `order.student` with `req.user._id` and return 403 otherwise. `list` filters by `student = req.user._id` for students.

# 12. The Core Business Rule: Maximum Orders per Slot

## 12.1 The naive approach and why it is wrong (race condition)
```js
const slot = await Slot.findById(id);
if (slot.currentOrders >= slot.maxOrders) reject();   // check
slot.currentOrders += 1; await slot.save();            // act
```
If two students order the **last seat at the same instant**, both read `currentOrders = 9` (max 10), both pass the check, and the slot ends with 11 orders. This is a **check-then-act race condition**.

## 12.2 Our solution: one atomic conditional update
```js
const reserved = await Slot.findOneAndUpdate(
  { _id: slot._id, isActive: true, $expr: { $lt: ['$currentOrders', '$maxOrders'] } },
  { $inc: { currentOrders: 1 } },
  { new: true }
);
if (!reserved) throw httpError(409, 'Slot is full. Please choose another pickup slot.');
```
MongoDB applies a single-document update **atomically**: the filter ("has room") and the increment happen as one indivisible operation. For the last seat only one request can match; the others get `null` and receive **409 Conflict**. No lock or transaction is needed. `$expr` lets us compare two fields of the same document.

**Proof:** the smoke test sends 5 orders **in parallel** to a slot with capacity 2 → exactly 2 return 201 and 3 return 409, and the slot's `currentOrders` is exactly 2.

## 12.3 Complete order-creation flow (`orderController.create`)
1. `validateOrder`: valid `slotId`, non-empty `items`, each `menuItemId` valid, quantity integer 1–10, no duplicate items.
2. Slot must exist and be active (else 404) and **not already started** (else 400). Start time = `date` + `time` + `CANTEEN_TZ_OFFSET` (default +05:30, IST).
3. Every menu item must exist (else 404) **and** be available (else 400 listing the unavailable names).
4. **Total computed on the server** from database prices.
5. **Atomically reserve a seat** (12.2) — 409 if full.
6. Save the order. If saving fails, the seat is **released** (`$inc: -1`) so capacity never leaks.
7. Return 201 with the order populated with slot and student details.

## 12.4 Releasing seats (cancel)
- A student can cancel only while the status is `confirmed` and before the slot starts; an admin can cancel any confirmed order (via status → cancelled).
- The order is updated with a **conditional update** (`status not in [cancelled, completed]`), so a double click cannot release the seat twice.
- Then `currentOrders` is decremented (only if > 0).

## 12.5 Other slot rules
- `maxOrders` cannot be set below `currentOrders` (409).
- Date/time of a slot that already has bookings cannot be changed (409).
- A slot with non-cancelled orders cannot be deleted (409) — admin should **close** it instead.
- Students only see **active, future** slots; the UI disables full slots and shows "x left".

## 12.6 Order status state machine
```
confirmed --> preparing --> ready --> completed
    |
    +--> cancelled
```
`updateStatus` rejects illegal jumps (e.g. confirmed → completed, completed → preparing) with 409. The admin UI shows only the allowed next buttons.

# 13. All Business Rules at a Glance

| # | Rule | Where |
|---|---|---|
| R1 | Order rejected with 409 when the slot is full (atomic `findOneAndUpdate` + `$expr` + `$inc`) | `orderController.create` |
| R2 | If saving the order fails after reserving, the seat is released | `orderController.create` |
| R3 | Items must exist and be available; quantity integer 1–10; no duplicate items; total computed on server | `validate.js`, `orderController.create` |
| R4 | Slot must be active and in the future (canteen timezone) | `Slot.startsAt()`, `orderController.create` |
| R5 | Admin only: menu create/update/delete, slot create/update/delete, order status updates | routes with `authorize('admin')` |
| R6 | Students see only available items and active future slots; read/cancel only own orders | controllers |
| R7 | Cancel frees a seat exactly once | `orderController.cancel`, `updateStatus` |
| R8 | Capacity ≥ current orders; date/time frozen once booked; slot with live orders cannot be deleted | `slotController` |
| R9 | Status machine confirmed → preparing → ready → completed; confirmed → cancelled | `orderController.updateStatus` |
| R10 | Register ignores `role`; admin only with correct `ADMIN_INVITE_CODE` | `authController.register` |

# 14. REST API Reference

Base URL: `https://canteen-api-v1ga.onrender.com/api` (live) or `http://localhost:5001/api` (local). All routes except register and login need `Authorization: Bearer <token>`.

| Method | Endpoint | Who | Success | Errors |
|---|---|---|---|---|
| POST | /auth/register | public | 201 token + user | 400, 403 (bad admin code), 409 (email exists) |
| POST | /auth/login | public | 200 token + user | 400, 401 |
| GET | /auth/me | any user | 200 | 401 |
| GET | /menu-items?category=&search= | any user | 200 list | 401 |
| GET | /menu-items/:id | any user | 200 | 400 (bad id), 404 |
| POST | /menu-items | admin | 201 | 400, 401, 403, 409 (duplicate name) |
| PUT | /menu-items/:id | admin | 200 | 400, 403, 404 |
| DELETE | /menu-items/:id | admin | 200 | 403, 404 |
| GET | /slots?date=&available=true | any user | 200 list | 401 |
| GET | /slots/:id | any user | 200 | 404 |
| POST | /slots | admin | 201 | 400, 403, 409 (duplicate date+time) |
| PUT | /slots/:id | admin | 200 | 400, 403, 404, 409 |
| DELETE | /slots/:id | admin | 200 | 403, 404, 409 (live orders) |
| POST | /orders | student/admin | 201 | 400, 404, **409 (slot full)** |
| GET | /orders?status=&date=&slotId= | any user | 200 (own / all for admin) | 401 |
| GET | /orders/:id | owner/admin | 200 | 403, 404 |
| PATCH | /orders/:id/cancel | owner/admin | 200 | 403, 404, 409 |
| PATCH | /orders/:id/status | admin | 200 | 403, 404, 409 |

Also: `GET /health` (no `/api`) → `{"status":"ok"}`; unknown routes → 404 JSON.

**Sample — place an order**

Request `POST /api/orders`:
```json
{ "slotId": "665f...a1", "items": [ { "menuItemId": "665f...b2", "quantity": 2 } ], "note": "Less spicy" }
```
Response `201`:
```json
{ "order": { "_id": "...", "status": "confirmed", "totalAmount": 120,
  "slot": { "date": "2026-10-07", "time": "12:30", "maxOrders": 10, "currentOrders": 1 },
  "items": [ { "menuItem": "665f...b2", "name": "Masala Dosa", "price": 60, "quantity": 2 } ] } }
```
Slot full → `409 { "message": "Slot is full. Please choose another pickup slot." }`

**Status codes used:** 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Internal Server Error.

# 15. Validation and Error Handling

| Level | Where | Examples |
|---|---|---|
| Request shape | `middleware/validate.js` | email format, password ≥ 6, date `YYYY-MM-DD`, time `HH:mm`, maxOrders integer ≥ 1, price ≥ 0, quantity 1–10, valid ObjectIds, no duplicate items |
| Schema | Mongoose (`required`, `min`, `max`, `enum`, `match`, `unique`) | last line of defence for data integrity |
| Business | Controllers | item available, slot open and in the future, slot not full, capacity ≥ bookings, legal status change, ownership |
| Client (convenience only) | React forms | required fields, disables full slots and unavailable items, max quantity 10 |

**Central error handler** (`middleware/error.js`): Mongoose `ValidationError` → 400 with the list of messages; `CastError` (bad id) → 400; duplicate key (code 11000) → 409 naming the field; errors created with `httpError(status, msg)` → that status; anything else → 500 "Internal server error" (no stack trace leaked). Controllers are wrapped in `asyncHandler` so rejected promises reach the handler (Express 4 does not catch async errors by itself).

Search input is **escaped** before being used in a regex, preventing regex injection / ReDoS.

# 16. Frontend (React) in Detail

| Page | Route | Who | Description |
|---|---|---|---|
| Login | `/login` | public | Email + password; shows API error messages |
| Register | `/register` | public | Name, email, password; optional admin invite code |
| Dashboard (main list view) | `/` | both | Student: menu, search, category chips, +/− quantity, cart with total, slot selector (seats left, FULL disabled), note, Place pre-order. Admin: menu management with Edit / Mark unavailable / Delete and **+ Add item** |
| Add / Update form | `/admin/menu/new`, `/admin/menu/:id/edit` | admin | One component for both create and edit |
| Order history | `/orders` | both | Status filter chips; student = own orders, admin = all with student name |
| Details page | `/orders/:id` | owner/admin | Items, subtotals, total, slot, note; Cancel (student), next status buttons (admin) |
| Slot management | `/admin/slots` | admin | Create slot, Capacity, Close/Open, Delete; booked/capacity and status badges |

- **Route guards:** the `Private` component redirects logged-out users to `/login` and students away from admin pages (UX only; the API is the real protection).
- **State:** `AuthContext` (user, login, logout) shared by all components; each page keeps its own data with `useState` / `useEffect`.
- **API calls:** only through `api.js`; base URL from `VITE_API_URL`, so the same code works locally and in production. Vite **bakes** this value into the build, so changing it requires a rebuild/redeploy.

# 17. Environment Configuration

**Backend (`backend/.env` locally, Render "Environment" in production):**

| Variable | Local value | Production (Render) | Purpose |
|---|---|---|---|
| `PORT` | 5001 | set automatically by Render (10000) | Port the API listens on |
| `NODE_ENV` | development | production | Production disables the "any localhost" CORS rule |
| `MONGO_URI` | Atlas connection string | same Atlas string | Database connection (secret) |
| `JWT_SECRET` | long random string | different random string generated by Render | Signs tokens (secret) |
| `JWT_EXPIRES_IN` | 7d | default 7d | Token lifetime |
| `ADMIN_INVITE_CODE` | CANTEEN-ADMIN-2026 | CANTEEN-ADMIN-2026 | Secret code to register an admin |
| `CLIENT_ORIGIN` | http://localhost:5173 | https://canteen-preorder-six.vercel.app | Allowed frontend origin(s) for CORS (comma-separated, no trailing slash) |
| `CANTEEN_TZ_OFFSET` | +05:30 | +05:30 | Timezone used to decide if a slot has started |

**Frontend:** `VITE_API_URL` = `http://localhost:5001/api` (in `frontend/.env`) / `https://canteen-api-v1ga.onrender.com/api` (Vercel environment variable).

**Offline:** `npm run dev:offline` sets `MONGO_URI=mongodb://127.0.0.1:27017/canteen`.

`.env` files are git-ignored; `.env.example` documents the variables with placeholder values only.

# 18. Deployment (what was actually done)

**1. Database — MongoDB Atlas (free M0 cluster)**
- Cluster `Cluster0`, database `campus_canteen`, a database user with password.
- Network Access: `0.0.0.0/0` (allow from anywhere) so Render's servers can connect.
- Connection string (SRV) stored only in `backend/.env` and Render's environment — never in Git.

**2. Code — GitHub**
- Repository: `daneshjoishar535-collab/canteen-preorder` (public). `.env` verified not committed.

**3. Backend — Render (free Web Service `canteen-api`)**
- Source: the public GitHub repo, branch `main`, **root directory `backend/`**.
- Build command `npm install`, start command `npm start`, runtime Node, region Oregon, plan Free.
- Environment variables: `NODE_ENV`, `MONGO_URI`, `JWT_SECRET` (generated by Render), `ADMIN_INVITE_CODE`, `CANTEEN_TZ_OFFSET`, `CLIENT_ORIGIN`. `PORT` is provided by Render.
- Result: https://canteen-api-v1ga.onrender.com — log shows "MongoDB connected" and "Your service is live".

**4. Frontend — Vercel (project `canteen-preorder`)**
- Deployed from the `frontend/` folder with the Vercel CLI (`vercel deploy --prod`). Vite build (`npm run build`, output `dist`).
- Environment variable `VITE_API_URL=https://canteen-api-v1ga.onrender.com/api` (Production).
- `vercel.json` rewrites all paths to `index.html` (single-page app).
- Result: https://canteen-preorder-six.vercel.app

**5. Connect them**
- Render `CLIENT_ORIGIN` set to the Vercel URL → API redeployed. Verified: requests from the Vercel site are allowed, requests from any other website are blocked by CORS.

**6. Verify**
- `API_URL=https://canteen-api-v1ga.onrender.com/api npm run smoke` → **43 passed, 0 failed**.

**Updating after a code change:** push to GitHub; Render → *Manual Deploy → Deploy latest commit*; frontend → `npx vercel deploy --prod` inside `frontend/`.

**Free-tier note:** Render's free instance sleeps after ~15 minutes without traffic; the first request then takes ~50 seconds. Open `/health` before demonstrating.

# 19. Testing

## 19.1 Automated end-to-end test (`npm run smoke`)
`backend/scripts/smoke-test.js` uses Node's built-in `fetch` against a running server (local, offline or live) and checks **43 behaviours**:

- **Health and auth:** /health 200; admin login; wrong password 401; register ignores `role` in body; duplicate email 409; wrong admin code 403; correct admin code creates admin; no token 401.
- **Menu (RBAC + validation):** student POST menu 403; negative price 400; admin creates items 201.
- **Slots:** student POST slot 403; admin creates a capacity-2 slot; student can see it.
- **Order validation:** quantity 11 → 400; duplicate items → 400; empty items → 400; unavailable item → 400; unavailable item hidden from students.
- **Capacity:** **5 parallel orders on a cap-2 slot → exactly 2 accepted**; total computed on server (2×30 + 1×25 = 85); `currentOrders = 2`.
- **Slot rules:** capacity below bookings 409; move date of booked slot 409; delete slot with live orders 409.
- **Ownership:** student sees own order; another student gets 403 and an empty list; admin sees all.
- **Cancel:** other student cannot cancel (403); owner cancels (200); second cancel 409; exactly one seat freed; freed seat can be booked again.
- **Status machine:** student cannot change status (403); confirmed → completed rejected (409); confirmed → preparing → ready → completed works; cancelling a completed order 409; admin cancels a confirmed order.
- **Cleanup rules:** slot with a completed order still cannot be deleted; closed slot hidden from students; empty slot deleted; menu item deleted.

At the end the script deletes its test users, orders and slots from the database, so the real data stays clean.

**Results:** 43/43 passed on local (Atlas), 43/43 on offline (local MongoDB), 43/43 on the live Render deployment.

## 19.2 Manual browser testing (all passed)
Student: register, search, category filter, cart and total, "choose a slot" message, place order → details page, My Orders, cancel, blocked from admin pages. Admin: login, add item, edit price, mark unavailable, delete, create slot, change capacity, close/open, delete empty slot, error when deleting a booked slot, All Orders with status filters, order details → preparing → ready → completed. Live site: all pages load (including direct links like `/orders/...`), API URL correct, CORS restricted, no console errors.

## 19.3 Postman
Import `backend/postman/Canteen-PreOrder.postman_collection.json` and `Canteen-Local.postman_environment.json`, select the environment, run folders 1 → 5. Test scripts save `adminToken`, `studentToken`, `menuItemId`, `slotId`, `orderId` automatically. Key scenario: capacity 2 → order 1 (201) → order 2 (201) → order 3 (**409 full**) → cancel 2 → order 3 again (201). Note: the Auth folder registers fixed emails, so on a second run those requests return 409 unless the test users are removed.

# 20. Security Measures

- Passwords hashed with bcrypt (salted, 10 rounds); `password` excluded from queries by default.
- JWT signed with a secret from environment variables; expiry enforced; user reloaded from DB on each request.
- Role checks on every admin route; ownership checks on orders; register cannot set role.
- Server-side price and total calculation.
- Validation at three server levels; regex input escaped.
- Generic 500 responses (no stack traces).
- Secrets only in `.env` / hosting dashboards; `.env` git-ignored; `.env.example` has placeholders only.
- CORS restricted to the deployed frontend in production.
- HTTPS everywhere in production (Render and Vercel provide TLS).
- *Future hardening:* `helmet` security headers, rate limiting on login, httpOnly cookies instead of localStorage, refresh tokens.

# 21. Problems Faced and How We Solved Them (good viva material)

| Problem | Cause | Solution |
|---|---|---|
| Login showed **"Network Error"** | On macOS the **AirPlay Receiver** uses port **5000** and answers every request with 403, so requests never reached Express. The browser saw no valid API response. | Moved the backend to **port 5001** everywhere (`.env`, `server.js`, frontend `VITE_API_URL`, Postman). Improved the error message to "Cannot reach the API at …". |
| Frontend could be blocked by CORS when Vite changed port | `CLIENT_ORIGIN` allowed only one exact origin | In development any `http://localhost:<port>` is allowed; trailing slashes ignored; production still allows only the Vercel URL. |
| Real database password was inside `.env.example` | The seed script read `.env.example`, so the real values were copied there — and `.env.example` is committed to Git | Seed now reads `.env`; `.env.example` restored to placeholders; verified with Git that no secret was ever pushed. |
| Demo slots could expire before the viva | Seed created slots only for the next day 12:30–13:30 | Seed now creates 10 slots per day (09:00–20:00) for today + next 2 days, in IST. |
| Test orders filled the real "All Orders" list | Automated test created real users/orders | Test now deletes its own data at the end. |
| Live site must not call localhost | Vite bakes `VITE_API_URL` at build time | Set `VITE_API_URL` in Vercel to the Render URL before building. |
| Need to demo without internet | Atlas is a cloud database | Added `npm run dev:offline` using local MongoDB 8. |

# 22. Limitations and Future Enhancements

- Online payment (UPI / Razorpay) at the time of ordering.
- Real-time order status (WebSockets / push notifications) — "your food is ready".
- Stock per menu item, not only capacity per slot.
- Automatic daily slot templates (cron job) instead of seeding/creating manually.
- Pagination and date filters in the UI for large order histories; reports for the admin (daily sales).
- Unit/integration tests with Jest + Supertest in CI; rate limiting and helmet.
- Email/OTP verification and "forgot password".

# PART C — VIVA QUESTIONS AND ANSWERS

## A. Project and concept

**Q1. Explain your project in one minute.**
It is a REST API with a React UI for a campus canteen. Students choose food and a pickup slot; each slot has a maximum number of orders, enforced on the server. Admins manage the menu and slots. It uses Express for routing, MongoDB Atlas with Mongoose for data, JWT for authentication and role-based middleware to protect admin actions. It is deployed on Render and Vercel.

**Q2. What problem does it solve?**
Queues at the canteen. Pre-ordering spreads demand across time slots, and the capacity cap stops the kitchen from being overloaded in any one slot.

**Q3. Who are the users and what can each do?**
Student: register/login, view available menu, view open slots, place/cancel own orders, see own history. Admin: CRUD on menu items and slots, change capacity, open/close slots, view all orders, update order status.

**Q4. Why separate frontend and backend?**
Independent deployment and scaling, a reusable API (a mobile app could use it later), and a clear boundary: the frontend only shows data; validation and business rules stay in the backend where they cannot be bypassed.

**Q5. What is a slot in your project?**
A pickup time (date + time) with a capacity `maxOrders` and a counter `currentOrders`. Each order reserves one place in a slot.

**Q6. What happens if a slot is full?**
The server rejects the order with HTTP 409 "Slot is full. Please choose another pickup slot." The UI also shows the slot as FULL and disables it.

## B. Node.js and Express

**Q7. What is Node.js and why use it?**
A JavaScript runtime built on Chrome's V8 engine with an event-driven, non-blocking I/O model — ideal for APIs that mostly wait on the database.

**Q8. What is the event loop?**
The mechanism that lets Node run asynchronous callbacks on a single thread: I/O is handed to the system, and when it finishes the callback/promise is queued and executed, so the server never blocks while waiting.

**Q9. What is Express and what is middleware?**
Express is a minimal web framework. Middleware are functions `(req, res, next)` that run in sequence; they can change the request, end the response, or call `next()`. Ours: `cors`, `express.json`, `morgan`, `protect`, `authorize`, validators, error handler.

**Q10. What is the order of middleware in your order route and why?**
`protect` → `authorize` → `validateOrder` → controller. Security checks run first so unauthorised requests never reach the business logic.

**Q11. What does `next(err)` do? How do you handle async errors?**
Passing an argument to `next` jumps to the error-handling middleware (4 parameters). `asyncHandler` wraps controllers in `Promise.resolve(fn()).catch(next)` so rejected promises reach it.

**Q12. Why `express.json()`?**
It parses JSON request bodies into `req.body`; without it `req.body` is undefined.

**Q13. What is CORS and why configure it?**
Browsers block requests to a different origin unless the server allows it. Our React app (vercel.app) calls the API (onrender.com), so the API allows the origin in `CLIENT_ORIGIN`. Other websites are blocked.

**Q14. Difference between PUT and PATCH?**
PUT updates a resource (we use it for menu/slot edits, applying only supplied fields); PATCH is for partial, action-like changes (cancel, status).

**Q15. What do 401, 403, 404, 409 mean in your API?**
401 not logged in; 403 logged in but not permitted; 404 not found; 409 conflict with current state (slot full, duplicate, illegal status change).

**Q16. What is `morgan` and `dotenv`?**
`morgan` logs each HTTP request (method, URL, status, time). `dotenv` loads variables from `.env` into `process.env`.

**Q17. What is REST?**
An architectural style where resources are identified by URLs and manipulated with HTTP methods (GET, POST, PUT, PATCH, DELETE), stateless requests and JSON representations.

## C. MongoDB and Mongoose

**Q18. What is MongoDB? How is it different from SQL?**
A document database storing JSON-like (BSON) documents in collections, with flexible schemas and horizontal scaling. SQL databases use fixed tables and joins; we use references + `populate` instead of joins.

**Q19. What is Mongoose?**
An ODM (Object Data Modeling) library that adds schemas, validation, hooks, virtuals, population and query helpers on top of the MongoDB driver.

**Q20. Why referenced collections rather than embedded?**
Users, slots and items are shared and change independently; one authoritative slot document holds the counter. References avoid duplication; `populate` resolves them. Order lines embed only a small snapshot that must not change after purchase.

**Q21. What is `populate()`?**
It replaces an ObjectId reference with the referenced document (an application-level join). We use it to show slot date/time and student name in orders.

**Q22. What are virtuals?**
Computed properties not stored in the database: `Slot.remaining` and `Slot.isFull`.

**Q23. What does `select: false` do on the password?**
The field is not returned by queries unless requested with `.select('+password')`, preventing accidental leaks.

**Q24. What is a compound unique index and where is it used?**
An index over several fields that must be unique together — `Slot(date, time)`, so two slots cannot exist at the same time.

**Q25. What is a pre-save hook?**
Mongoose middleware that runs before `save()`. We hash the password there, only when it was modified.

**Q26. What is `$inc`, `$expr`, `findOneAndUpdate`, `{ new: true }`?**
`$inc` atomically increments a number; `$expr` lets a query compare two fields of the same document; `findOneAndUpdate` finds and updates in one atomic step; `{ new: true }` returns the updated document.

**Q27. How do you connect to MongoDB Atlas?**
`mongoose.connect(process.env.MONGO_URI)` with the `mongodb+srv://` connection string containing user, password, cluster host and database name. Atlas Network Access must allow the server's IP (we allow 0.0.0.0/0 for Render).

**Q28. What is an ObjectId?**
A 12-byte unique identifier (timestamp + random + counter) that MongoDB assigns to every document's `_id`.

## D. Authentication and Authorization

**Q29. Authentication vs authorization?**
Authentication proves identity (login + JWT). Authorization decides permissions (role check, ownership check).

**Q30. What is a JWT and what does yours contain?**
A signed token `header.payload.signature`. Ours contains `id`, `role`, `iat` (issued at) and `exp` (expiry). The server verifies the signature with `JWT_SECRET`, so no session storage is needed (stateless).

**Q31. Is the JWT encrypted?**
No, it is signed, not encrypted. The payload is base64 and readable, so no secrets go inside it. Tampering is detected because the signature would not match.

**Q32. Why bcrypt? What is a salt?**
bcrypt is a deliberately slow, adaptive hashing algorithm for passwords. A random salt is added so equal passwords get different hashes and rainbow tables fail. We use 10 rounds.

**Q33. How is role-based authorization implemented?**
Each user has a `role`. `authorize('admin')` checks `req.user.role` and returns 403 if it is not allowed. It is attached to every admin route.

**Q34. Could a student make themselves admin?**
No. The register controller ignores any `role` in the body. Admin requires the secret `ADMIN_INVITE_CODE`. Permissions use the role stored in the database.

**Q35. Where is the token stored on the client? Any risk?**
In localStorage for simplicity. Risk: an XSS attack could read it. Production hardening: httpOnly secure cookies and a Content Security Policy.

**Q36. Why reload the user from the database in `protect`?**
So deleted users or role changes take effect immediately, not only after the token expires.

**Q37. What happens when the token expires?**
`jwt.verify` fails → 401 → the frontend interceptor clears the token and redirects to the login page.

## E. The capacity rule (most important)

**Q38. How do you enforce the maximum orders per slot?**
With one atomic `findOneAndUpdate` whose filter requires `currentOrders < maxOrders` and whose update is `$inc: { currentOrders: 1 }`. If nothing matches, the slot is full → 409.

**Q39. Why not read the slot, compare and then save?**
That is a race condition: two simultaneous requests can both see room for the last seat and both succeed. The atomic conditional update makes check-and-increment one indivisible operation.

**Q40. How did you prove it works?**
The smoke test sends 5 orders at the same time to a slot with capacity 2: exactly 2 succeed (201) and 3 fail (409), and `currentOrders` ends at exactly 2.

**Q41. Is a transaction needed?**
Not for the capacity check — single-document updates are atomic. For the second write (creating the order) we use a compensating action: if `Order.create` fails, we decrement the seat. A multi-document transaction (Atlas supports it) would be an alternative.

**Q42. What happens when an order is cancelled?**
The status changes through a conditional update (so it cannot be cancelled twice), then `currentOrders` is decremented, freeing the seat.

**Q43. What if the admin lowers capacity below current bookings?**
Rejected with 409.

**Q44. Why compute the total on the server?**
The client could send fake prices. The server uses database prices, so the total is trustworthy. Our test sends `price: 1` in the body and the server still computes the correct total.

**Q45. How is item availability validated?**
`orderController.create` loads all requested items and rejects the order (400) listing any unavailable item; unknown ids return 404. The UI also disables unavailable items, but the server check is the real guard.

**Q46. How do you stop orders for a slot that has already started?**
`slot.startsAt()` builds a Date from the slot's date, time and `CANTEEN_TZ_OFFSET` (+05:30). If it is not in the future, the order is rejected (400) and students do not see that slot.

**Q47. Why store `date` and `time` as strings?**
They are easy to validate with regex, display and query by day, and the unique index on (date, time) is simple. `startsAt()` converts them to a real Date when needed, using the canteen timezone.

## F. Validation and errors

**Q48. Where does validation happen and why in multiple places?**
Shape validation in middleware (fast, clear 400s), integrity rules in Mongoose schemas (last line of defence), business rules in controllers, convenience checks in React. The frontend can be bypassed with Postman, so backend validation is mandatory.

**Q49. How are duplicate emails or slots handled?**
The unique index makes MongoDB throw error code 11000; the central error handler converts it to 409 naming the field. Register also checks the email first and returns "Email already registered".

**Q50. What does the global error handler do?**
Maps validation errors to 400, invalid ids to 400, duplicates to 409, our `httpError`s to their status, and hides details of unexpected errors behind a generic 500.

## G. React frontend

**Q51. How does the frontend talk to the backend?**
Through an Axios instance (`api.js`) whose base URL comes from `VITE_API_URL`. A request interceptor adds the JWT; a response interceptor logs out on 401.

**Q52. How do you protect routes in React?**
A `Private` wrapper checks `useAuth()`; logged-out users go to `/login`, and `adminOnly` routes send students to `/`. This is only UX — the real protection is on the API.

**Q53. How does the cart work?**
A state object `{ menuItemId: quantity }` in Dashboard. Cart lines are derived by matching the menu list. On submit only ids and quantities are sent.

**Q54. Why React Context for auth?**
So the logged-in user and login/logout functions are available everywhere without passing props through every component.

**Q55. What are `useState` and `useEffect`?**
`useState` stores component data that re-renders the UI when it changes. `useEffect` runs side effects such as loading data from the API after the component appears.

**Q56. What is Vite?**
A fast development server and build tool. `npm run dev` serves the app with hot reload; `npm run build` creates optimised static files in `dist/` that Vercel hosts.

## H. Deployment, configuration and tools

**Q57. How did you deploy?**
Database on MongoDB Atlas (free M0), backend as a Render Web Service (root `backend`, `npm install` / `npm start`, env variables), frontend on Vercel with `VITE_API_URL` pointing to the Render API, and Render's `CLIENT_ORIGIN` set to the Vercel URL for CORS.

**Q58. Why is the first request to the live site slow sometimes?**
Render's free plan puts the server to sleep after 15 minutes of no traffic; waking it takes about 50 seconds. Paid plans stay awake.

**Q59. Why don't you set PORT on Render?**
Render assigns the port itself through the `PORT` environment variable; our server reads `process.env.PORT`.

**Q60. Why did you allow 0.0.0.0/0 in Atlas?**
Render's free servers do not have a fixed IP address, so Atlas must accept connections from any IP. Security still comes from the database username/password in the connection string, which is secret.

**Q61. Why must `VITE_API_URL` be set before building the frontend?**
Vite replaces `import.meta.env.VITE_API_URL` with the actual value at build time. If you change it, you must rebuild/redeploy.

**Q62. Why `.env` files? What must never be committed?**
They keep secrets and environment-specific settings out of source code. `.env` (Atlas password, JWT secret) is git-ignored; `.env.example` documents the variable names with placeholders.

**Q63. Why port 5001 instead of 5000?**
On macOS, the AirPlay Receiver listens on port 5000 and answers with 403, which made the browser report "Network Error". Using 5001 avoids the conflict.

**Q64. Can the project run without internet?**
Yes. MongoDB is installed locally; `npm run dev:offline` connects the backend to `mongodb://127.0.0.1:27017/canteen`, and the frontend runs with `npm run dev` at localhost:5173.

**Q65. What is the role of Postman?**
To test and document the API independently of the UI. Requests are chained with saved variables (tokens, ids) and include positive and negative tests.

**Q66. Why does the frontend need `vercel.json` / `_redirects`?**
It is a single-page app; refreshing `/orders/123` would give 404 on a static host without rewriting all paths to `index.html`.

**Q67. What is Git/GitHub used for here?**
Version control and the source for deployment. Render builds the backend from the GitHub repository; secrets are excluded by `.gitignore`.

**Q68. What does the seed script do?**
Creates the demo admin and student, 7 menu items and 10 slots per day for today and the next 2 days. It uses upserts, so running it again does not duplicate data.

**Q69. What would you improve next?**
Payments, real-time status notifications, per-item stock, automatic daily slots, rate limiting/helmet, pagination, and Jest + Supertest tests in CI.

**Q70. What was the hardest part?**
Getting the capacity rule right under concurrency (atomic update instead of check-then-save), and debugging the "Network Error" that turned out to be macOS AirPlay occupying port 5000.

## I. Quick-fire one-liners

- **Idempotent methods:** GET, PUT, DELETE (same result if repeated); POST is not.
- **`req.params` vs `req.query` vs `req.body`:** URL path parts / query string / request payload.
- **`next()`:** passes control to the next middleware.
- **Stateless:** server stores no session; each request carries its JWT.
- **`npm install` vs `npm start`:** install dependencies / run `node server.js`.
- **`node --watch`:** restarts the server automatically when files change (used by `npm run dev`).
- **`lean()`:** returns plain objects, faster (not used where virtuals are needed).
- **`bcrypt.compare`:** hashes the candidate password with the stored salt and compares.
- **SRV connection string:** `mongodb+srv://` resolves the cluster's servers through DNS.
- **HTTP 201:** resource created (register, new order, new slot, new item).
- **HTTP 409:** conflict with current state — slot full, duplicate, illegal status change.
- **npm scripts:** `dev`, `dev:offline`, `start`, `seed`, `seed:offline`, `smoke` (backend); `dev`, `build` (frontend).
