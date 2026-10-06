# Online Food Pre-order System (Campus Canteen)

B.Tech CSE – Backend Development (Node.js, Express.js & MongoDB) – Project 130

Students pre-order food for a pickup **time slot**. Each slot has a maximum number of orders; orders beyond capacity are rejected automatically. Canteen admins manage the menu and slot capacity.

```
canteen-preorder/
├── backend/    Express + Mongoose REST API (JWT auth, role-based authorization)
│   ├── src/models        User, MenuItem, Slot, Order
│   ├── src/controllers   auth, menu, slot, order (business rules live here)
│   ├── src/middleware    auth (protect/authorize), validate, error
│   ├── src/routes        /api/auth, /api/menu-items, /api/slots, /api/orders
│   ├── scripts/seed.js   demo admin, student, menu, slots
│   ├── scripts/smoke-test.js  end-to-end API test (npm run smoke)
│   └── postman/          Postman collection + environment
├── frontend/   React (Vite) UI – only calls the REST API
└── VIVA_DOCUMENT.docx / .md
```

## 1. Run locally

Prerequisites: Node 18+, a free MongoDB Atlas cluster.

```bash
# Backend
cd backend
cp .env.example .env        # fill MONGO_URI and JWT_SECRET
npm install
npm run seed                # demo data + slots for today and the next 2 days (admin@canteen.com / admin123, student@college.edu / student123)
npm run dev                 # http://localhost:5001

# Frontend (new terminal)
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:5001/api
npm install
npm run dev                 # http://localhost:5173
```

Check the backend with the automated end-to-end test (server must be running, 43 checks incl. "5 parallel orders on a cap-2 slot → exactly 2 accepted"; it deletes its own test data afterwards):

```bash
cd backend && npm run smoke
```

> **Port 5001, not 5000:** on macOS the AirPlay Receiver occupies port 5000 and answers `403`, which the browser reports as *Network Error*.
> If login shows "Cannot reach the API…": is the backend running (`curl localhost:5001/health`)? Does `frontend/.env` say `VITE_API_URL=http://localhost:5001/api`? Restart `npm run dev` after editing `.env`.

MongoDB Atlas: create cluster → Database Access (create user) → Network Access (allow your IP, or 0.0.0.0/0 for Render) → Connect → Drivers → copy the string into `MONGO_URI` and add a database name (`/canteen`).

### Offline mode (no internet)

Needs a local MongoDB (`brew services start mongodb-community@8.0`). The backend then uses `mongodb://127.0.0.1:27017/canteen` instead of Atlas:

```bash
cd backend && npm run seed:offline   # first time / fresh slots
npm run dev:offline                  # API on http://localhost:5001
cd ../frontend && npm run dev        # UI on http://localhost:5173
```

### Live deployment

- Frontend: https://canteen-preorder-six.vercel.app
- API: https://canteen-api-v1ga.onrender.com (health: `/health`)

## 2. API summary

All routes except register/login need `Authorization: Bearer <token>`.

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | /api/auth/register | public | Register student (admin with invite code) |
| POST | /api/auth/login | public | Login → JWT |
| GET | /api/auth/me | any user | Current user |
| GET | /api/menu-items | any user | List (students see available only) |
| GET | /api/menu-items/:id | any user | One item |
| POST | /api/menu-items | **admin** | Create |
| PUT | /api/menu-items/:id | **admin** | Update (price, availability…) |
| DELETE | /api/menu-items/:id | **admin** | Delete |
| GET | /api/slots | any user | List slots (`?date=&available=true`) |
| POST | /api/slots | **admin** | Create slot (date, time, maxOrders) |
| PUT | /api/slots/:id | **admin** | Change capacity / open-close |
| DELETE | /api/slots/:id | **admin** | Delete (blocked if live orders) |
| POST | /api/orders | student/admin | Place order – capacity + availability checked |
| GET | /api/orders | any user | Student: own history · Admin: all (`?status=&date=`) |
| GET | /api/orders/:id | owner/admin | Order details |
| PATCH | /api/orders/:id/cancel | owner/admin | Cancel (frees the seat) |
| PATCH | /api/orders/:id/status | **admin** | confirmed→preparing→ready→completed |

Order request body:
```json
{ "slotId": "<id>", "items": [ { "menuItemId": "<id>", "quantity": 2 } ], "note": "less spicy" }
```

## 3. Postman

Import `backend/postman/Canteen-PreOrder.postman_collection.json` and `Canteen-Local.postman_environment.json`, select the environment, then run folders **1 → 5** in order (Collection Runner). Tokens and IDs are saved to environment variables by test scripts. The collection includes negative tests (401/403/400/409), including the *slot full* case. Regenerate with `node backend/scripts/gen-postman.js`.

## 4. Deployment

**Backend → Render (or Railway)**
1. Push repo to GitHub. New *Web Service* → root directory `backend`.
2. Build: `npm install` · Start: `npm start`.
3. Environment variables: `MONGO_URI`, `JWT_SECRET`, `ADMIN_INVITE_CODE`, `CLIENT_ORIGIN` (your Vercel/Netlify URL, no trailing slash), `NODE_ENV=production`, `CANTEEN_TZ_OFFSET=+05:30`. (`PORT` is injected by Render.)
4. In Atlas Network Access allow `0.0.0.0/0`.

**Frontend → Vercel (or Netlify)**
1. Import repo, root directory `frontend`, framework Vite, build `npm run build`, output `dist`.
2. Environment variable `VITE_API_URL=https://<your-render-app>.onrender.com/api`.
3. `vercel.json` / `public/_redirects` already handle React Router refreshes.

Then set `CLIENT_ORIGIN` on the backend to the final frontend URL. Vite bakes `VITE_API_URL` in at build time, so **redeploy** the frontend after changing it. Test the live API with `API_URL=https://<your-render-app>.onrender.com/api npm run smoke` (from `backend/`).

## 5. Key business rules (where to find them)

| Rule | File |
|---|---|
| Max orders per slot (atomic) | `controllers/orderController.js` → `create` |
| Item availability + quantity validation | `orderController.create`, `middleware/validate.js` |
| Role-based authorization | `middleware/auth.js` → `authorize('admin')` |
| Capacity cannot drop below current bookings | `controllers/slotController.js` → `update` |
| Seat released on cancel | `orderController.cancel` / `updateStatus` |
