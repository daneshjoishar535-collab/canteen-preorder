---
title: "How to Run the Campus Canteen Project on a Mac"
subtitle: "Step-by-step guide — Live (online), Offline (no internet) and Local with cloud database"
---

# 1. Which way should I use?

| Way | Internet needed? | When to use | Fastest method |
|---|---|---|---|
| **A. Live website** | Yes | Normal demo / viva — nothing to start | Double-click `open-live.command` |
| **B. Offline on this Mac** | **No** | No Wi-Fi, or the live site is down | Double-click `start-offline.command` |
| **C. Local + cloud database** | Yes | Run on this Mac but use the same data as the live site | Double-click `start-online.command` |

All three use the same logins:

| Role | Email | Password |
|---|---|---|
| Student | `student@college.edu` | `student123` |
| Admin | `admin@canteen.com` | `admin123` |
| Register a new admin | (any email) | tick "I am canteen staff" and use code `CANTEEN-ADMIN-2026` |

**Where is the project?** Finder → **Downloads** → **canteen-preorder**. The double-click files (`.command`) are in this folder.

# 2. Way A — Live Website (online)

## 2.1 One-step method
1. Open Finder → Downloads → canteen-preorder.
2. Double-click **`open-live.command`**.
3. A Terminal window says "Waking up the live API…". Wait (up to 60 seconds the first time).
4. Your browser opens **https://canteen-preorder-six.vercel.app** automatically.
5. Log in with the student or admin account above.

## 2.2 Manual method (without the file)
1. Open Safari or Chrome.
2. First open **https://canteen-api-v1ga.onrender.com/health** and wait until the page shows `{"status":"ok"}`.
   - Why: the backend is on Render's free plan, which **sleeps after about 15 minutes** of no use. The first visit wakes it (takes about 50 seconds).
3. Now open **https://canteen-preorder-six.vercel.app**.
4. Log in.

## 2.3 Things to know
- You do **not** need to install or start anything for the live site.
- The site may remember your login for up to 7 days in the same browser. Click **Logout** to log in again or switch between student and admin.
- If the login spins for a long time the first time, wait and click **Login** again — the server was waking up.
- You do **not** need to log in to Render, Vercel, MongoDB Atlas or GitHub to use the website.

# 3. Way B — Offline on this Mac (no internet)

Everything needed is already installed on this Mac: Node.js, the project packages, and MongoDB 8 (a local database that starts automatically when the Mac starts). The demo accounts, menu and pickup slots are already loaded into the local database.

## 3.1 One-step method
1. Open Finder → Downloads → canteen-preorder.
2. Double-click **`start-offline.command`**.
3. Three Terminal windows appear:
   - one small window that starts everything (it shows "Done" at the end),
   - one **backend** window — wait until it shows `MongoDB connected` and `API running on port 5001`,
   - one **frontend** window — it shows `Local: http://localhost:5173/`.
4. The browser opens **http://localhost:5173** automatically. If not, open that address yourself.
5. Log in with the student or admin account.
6. **Keep the backend and frontend windows open** while using the app. Minimise them if you like.

**First time only:** macOS may ask *"Terminal wants access to control Terminal"* — click **OK / Allow**. If macOS says the file *"cannot be opened"*, right-click the file → **Open** → **Open**.

## 3.2 Manual method (type the commands yourself)
1. Press **⌘ + Space**, type **Terminal**, press **Return**.
2. Make sure MongoDB is running (it normally already is):
```
brew services start mongodb-community@8.0
```
3. Start the backend:
```
cd ~/Downloads/canteen-preorder/backend
npm run dev:offline
```
   Wait for these two lines:
```
MongoDB connected
API running on port 5001
```
4. Open a **second** Terminal window: in Terminal press **⌘ + N**.
5. Start the frontend:
```
cd ~/Downloads/canteen-preorder/frontend
npm run dev
```
   Wait for: `Local: http://localhost:5173/`
6. Open **http://localhost:5173** in the browser and log in.

## 3.3 Refresh the demo data (optional)
If the pickup-slot list is empty (slots exist for 3 days from the last time the data was loaded), open a new Terminal window and run:
```
cd ~/Downloads/canteen-preorder/backend
npm run seed:offline
```
It prints `Seed complete.` This adds slots for today and the next 2 days (09:00 to 20:00). It never deletes or duplicates anything, so it is safe to run any time. Refresh the browser afterwards.

## 3.4 Important
- Offline data and live data are **separate databases**. Orders placed offline do not appear on the live site and vice versa.
- The laptop must stay awake; closing the lid stops the servers.

# 4. Way C — Local on this Mac with the cloud database (internet needed)

Same as offline, but the backend connects to **MongoDB Atlas**, so you see the same data as the live website.

## 4.1 One-step method
Double-click **`start-online.command`**. It works exactly like section 3.1 and opens http://localhost:5173.

## 4.2 Manual method
Terminal window 1:
```
cd ~/Downloads/canteen-preorder/backend
npm run dev
```
Terminal window 2 (⌘ + N):
```
cd ~/Downloads/canteen-preorder/frontend
npm run dev
```
Open http://localhost:5173.

To refresh slots in the cloud database (used by the live site too): `cd ~/Downloads/canteen-preorder/backend` then `npm run seed`.

# 5. Stopping the Project

- **One step:** double-click **`stop-local.command`**, then close the Terminal windows.
- **Manual:** click inside each server window and press **Control + C**, then close the window.
- The live website (Way A) runs in the cloud; you never need to stop it.
- MongoDB itself can keep running in the background; it uses very little memory. To stop it completely: `brew services stop mongodb-community@8.0`.

# 6. Run the Automatic Test (optional, good to show in the viva)

With the backend running (Way B or C), open a new Terminal window:

Against the offline backend:
```
cd ~/Downloads/canteen-preorder/backend
MONGO_URI=mongodb://127.0.0.1:27017/canteen npm run smoke
```
Against the local + cloud backend:
```
cd ~/Downloads/canteen-preorder/backend
npm run smoke
```
Expected last line: **`43 passed, 0 failed`**. The test removes its own test data when it finishes.

# 7. Viva Day Checklist

**Night before**
1. Double-click `open-live.command`, log in as student, place one order, log out.
2. Double-click `start-offline.command` once to make sure offline works, then `stop-local.command`.
3. Charge the laptop.

**15–20 minutes before**
1. Connect to Wi-Fi. Double-click `open-live.command` (this wakes the server) and leave the site on the Login page.
2. Keep `VIVA_DOCUMENT.docx` open for the speech and the demo script.

**If Wi-Fi fails during the viva**
1. Double-click `start-offline.command`.
2. Wait about 15 seconds for the browser to open http://localhost:5173.
3. Continue the demo with the same logins.

# 8. Troubleshooting

| Problem | What it means | Fix |
|---|---|---|
| Login shows **"Cannot reach the API at http://localhost:5001/api"** | Backend is not running (Way B/C) | Look at the backend window for an error. Start again with the `.command` file or `npm run dev:offline`. |
| Backend window shows **"MongoDB connection failed"** (offline) | Local MongoDB is not running | Run `brew services start mongodb-community@8.0`, then start again. |
| Backend window shows **"MongoDB connection failed"** (Way C) | No internet, or Atlas unreachable | Check Wi-Fi, or use the offline way instead. |
| **"Port 5001 is already in use"** / `EADDRINUSE` | An old copy is still running | Double-click `stop-local.command`, then start again. |
| Frontend opens on **5174** instead of 5173 | An old frontend is still running | Double-click `stop-local.command`, then start again. |
| **"Invalid email or password"** for the demo accounts | Demo data not loaded in that database | Run `npm run seed:offline` (offline) or `npm run seed` (cloud) inside the `backend` folder. |
| **"No upcoming slots are open right now"** | All loaded slots are in the past | Run the seed command (section 3.3) and refresh the page. |
| Live site login **takes very long** | Render free server waking up | Wait up to 60 seconds and try again. Open the /health link first next time. |
| **"npm: command not found"** | Terminal didn't load Node | Close Terminal completely (⌘ + Q) and open a new window. |
| Mac says the `.command` file **"cannot be opened"** | macOS security check | Right-click the file → **Open** → **Open**. |
| Never use port 5000 | macOS AirPlay Receiver uses port 5000 and blocks it | The project already uses 5001 — do not change it back. |

# 9. Useful Commands (reference)

| Command (run inside `backend/`) | What it does |
|---|---|
| `npm run dev` | Start backend with the cloud database (Atlas), auto-restart on code changes |
| `npm run dev:offline` | Start backend with the local database (no internet) |
| `npm start` | Start backend without auto-restart (used by Render) |
| `npm run seed` / `npm run seed:offline` | Load demo accounts, menu and 3 days of slots (cloud / local) |
| `npm run smoke` | Run the 43 automatic checks |

| Command (run inside `frontend/`) | What it does |
|---|---|
| `npm run dev` | Start the website at http://localhost:5173 |
| `npm run build` | Build the production version (what Vercel does) |

| Address | What it is |
|---|---|
| http://localhost:5173 | Local website |
| http://localhost:5001/health | Local backend check — shows `{"status":"ok"}` |
| https://canteen-preorder-six.vercel.app | Live website |
| https://canteen-api-v1ga.onrender.com/health | Live backend check |
| https://github.com/daneshjoishar535-collab/canteen-preorder | Source code |

# 10. Updating the Live Site After Changing Code (only if you edit code)

1. Save your changes, then in Terminal:
```
cd ~/Downloads/canteen-preorder
git add -A
git commit -m "describe your change"
git push
```
2. **Backend:** open https://dashboard.render.com → **canteen-api** → **Manual Deploy** → **Deploy latest commit**. Wait for "Live".
3. **Frontend:**
```
cd ~/Downloads/canteen-preorder/frontend
npx vercel deploy --prod
```
4. Open the live site and test a login.
