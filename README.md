# Lease Review Assistant

## 🚀 Live Demo

https://lease-review-assistant.vercel.app/

## 🔗 Project Links

- **Live Demo:** https://lease-review-assistant.vercel.app/
- **GitHub Repository:** https://github.com/Abioffical/lease-review-assistant


# Lease Agreement Review Assistant

A review assistant for a property management company's legal desk. It reads a lease
agreement clause by clause and checks it against the company's standard positions —
acceptable ranges (deposit, notice period), required clauses (maintenance responsibility,
deposit return timeline), and terms the company never accepts. It produces a report that
**flags and explains** issues for a human reviewer — it never approves or rejects on its own.

Built for the NexusTiQ hackathon using **only**: React + Vite (JavaScript) on the frontend,
Node.js + Express on the backend, and MySQL 8 for the database.

## Why a rule engine instead of an AI/LLM API

This assistant deliberately does **not** call an external AI API. Instead, it uses a
transparent, deterministic **rule engine**: every finding traces back to a specific
keyword match against a specific row in the `standards` table (the company's own
"playbook", editable from the app itself). For a legal desk, this matters:

- **Explainable**: every finding quotes the exact clause it came from and states which
  standard it was checked against — nothing is a black box.
- **Auditable & editable**: the legal team can see and change exactly what the system
  checks for, in plain language, without touching code.
- **No API keys, no per-request cost, no external dependency** — it works completely
  offline once the database is seeded.
- **Silence is a finding, not a gap**: if a required clause never appears anywhere in the
  document, that is reported explicitly, the same as an out-of-range deviation.

## How the review works

1. The lease text (pasted or uploaded as `.txt`/`.pdf`) is split into individual clauses.
2. Every **active** row in the `standards` table is checked against those clauses:
   - **Range standards** (e.g. deposit amount, notice period) — the engine finds the
     relevant clause, extracts the stated number, and compares it to the accepted range.
   - **Required-clause standards** (e.g. maintenance responsibility) — the engine checks
     whether any clause addresses the topic at all. If not, it's reported as **missing**.
   - **Prohibited standards** (e.g. non-refundable deposit, waiver of legal rights) — if a
     matching clause is found, it's flagged as **critical**; if not, that's reported too,
     as a match ("the agreement complies here").
3. A short plain-language summary of the 3–4 terms a signer most needs to understand
   (rent, deposit, notice period, renewal terms) is generated separately.
4. Everything is saved to MySQL and shown as a report with an overall status of
   **Clean** (nothing to flag) or **Needs Review**.

## Project structure

```
lease-review-assistant/
├── backend/
│   ├── config/db.js              # MySQL connection pool
│   ├── controllers/              # Request handlers
│   ├── routes/                   # Express routes
│   ├── utils/
│   │   ├── clauseSplitter.js     # Splits lease text into clauses
│   │   ├── numberExtractor.js    # Extracts amounts/durations from clause text
│   │   ├── ruleEngine.js         # Core match/deviation/missing/prohibited logic
│   │   ├── summaryGenerator.js   # Plain-language summary generator
│   │   └── fileParser.js         # .pdf / .txt text extraction
│   ├── database/
│   │   ├── schema.sql            # Table definitions
│   │   └── seed.sql              # The company's standard positions (the playbook)
│   ├── uploads/                  # Temporary storage for uploaded files
│   ├── server.js                 # Express app entry point
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── api/api.js            # All backend API calls
│   │   ├── components/           # Navbar, StatusBadge, FindingCard
│   │   ├── pages/                # NewReview, ReviewDetail, History, Standards
│   │   ├── styles/                # CSS
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── sample-leases/
│   ├── sample-lease-with-issues.txt   # Triggers deviations, missing clauses, prohibited terms
│   └── sample-lease-clean.txt         # Passes every standard
├── .gitignore
└── README.md
```

## Prerequisites (matches your environment)

- VS Code
- Node.js v24.16.0 and npm 11.13.0 (or newer)
- Git
- MySQL 8 / MySQL80 running locally
- MySQL Workbench

---

## 1. Get the code into VS Code

```bash
git clone <your-repo-url>
cd lease-review-assistant
code .
```

(If you haven't pushed to GitHub yet, just unzip the project folder and open it in VS Code.)

## 2. Set up the database (MySQL Workbench or terminal)

**Option A — MySQL Workbench:**
1. Open MySQL Workbench and connect to your local MySQL80 instance.
2. Open `backend/database/schema.sql` as a SQL script (File → Open SQL Script) and execute it
   (the lightning bolt icon). This creates the `lease_review_db` database and all tables.
3. Open `backend/database/seed.sql` the same way and execute it. This loads the company's
   9 starter standards (deposit range, notice period range, required clauses, prohibited terms).

**Option B — terminal:**
```bash
mysql -u root -p < backend/database/schema.sql
mysql -u root -p < backend/database/seed.sql
```

## 3. Set up the backend

```bash
cd backend
npm install
copy .env.example .env
```
(On Mac/Linux use `cp .env.example .env` instead of `copy`.)

Open `.env` and fill in your real MySQL password:
```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=lease_review_db
CLIENT_ORIGIN=http://localhost:5173
```

Start the backend:
```bash
npm run dev
```
You should see `Lease Review Assistant API running on http://localhost:5000`.
Verify it's connected to the database by visiting `http://localhost:5000/api/health` —
it should return `{"status":"ok","database":"connected"}`.

## 4. Set up the frontend

Open a **second terminal** (keep the backend running):
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```
Open the URL Vite prints (usually `http://localhost:5173`).

## 5. Try it out

- Go to **New Review**, paste the contents of `sample-leases/sample-lease-with-issues.txt`,
  and run the review. You should see 2 deviations, 3 missing clauses, and 3 prohibited terms
  flagged, each quoting the exact clause.
- Try `sample-leases/sample-lease-clean.txt` — it should come back **Clean**.
- Visit **Standards Playbook** to see, edit, or add the rules the engine checks against.
- Visit **History** to see every review you've run.

---

## API Reference

| Method | Endpoint                | Description                                  |
|--------|--------------------------|-----------------------------------------------|
| GET    | `/api/health`            | Checks server + database connectivity         |
| POST   | `/api/reviews`           | Run a review on pasted text (`{title, text}`) |
| POST   | `/api/reviews/upload`    | Run a review on an uploaded `.pdf`/`.txt` file (`multipart/form-data`, field name `leaseFile`) |
| GET    | `/api/reviews`           | List all past reviews                          |
| GET    | `/api/reviews/:id`       | Full report for one review (review + findings + summary) |
| DELETE | `/api/reviews/:id`       | Delete a review                                |
| GET    | `/api/standards`         | List all standards (the playbook)              |
| POST   | `/api/standards`         | Create a new standard                          |
| PUT    | `/api/standards/:id`     | Update a standard                              |
| DELETE | `/api/standards/:id`     | Delete a standard                              |

---

## Pushing to GitHub

The included `.gitignore` files (root, `backend/`, `frontend/`) already exclude
`node_modules/`, `.env`, and uploaded files, so your MySQL password and dependencies
will never be pushed.

```bash
git init
git add .
git commit -m "Initial commit - Lease Agreement Review Assistant"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

---

## Deploying for a live demo link (free tier)

You need three pieces: a MySQL database, the backend API, and the frontend. All three
have workable free tiers as of 2026.

### Step 1 — Database on Aiven (free MySQL, no credit card)

1. Sign up at [aiven.io](https://aiven.io) and create a new **MySQL** service on the
   **Free** plan (1GB storage/RAM, always-free, no card required).
2. Once it's running, open the service overview page and copy the connection details:
   host, port, user, password, and default database name.
3. Note: Aiven's free service can power off after a period of inactivity — just restart
   it from the console before your demo if that happens.
4. Run your `schema.sql` and `seed.sql` against this remote database. You can do this
   from MySQL Workbench by creating a new connection using Aiven's host/port/credentials
   (Aiven requires SSL — Workbench's default SSL settings usually work automatically),
   or via terminal:
   ```bash
   mysql -h <aiven-host> -P <aiven-port> -u <user> -p --ssl-mode=REQUIRED < backend/database/schema.sql
   mysql -h <aiven-host> -P <aiven-port> -u <user> -p --ssl-mode=REQUIRED < backend/database/seed.sql
   ```

### Step 2 — Backend on Render (free web service)

1. Push your code to GitHub first (Render deploys from a Git repo).
2. Sign up at [render.com](https://render.com) → **New → Web Service** → connect your
   GitHub repo → set **Root Directory** to `backend`.
3. Build command: `npm install` — Start command: `npm start`.
4. Under **Environment**, add the same variables from your `.env` file, but pointing at
   your Aiven database:
   ```
   PORT=5000
   DB_HOST=<aiven-host>
   DB_PORT=<aiven-port>
   DB_USER=<aiven-user>
   DB_PASSWORD=<aiven-password>
   DB_NAME=<aiven-database-name>
   CLIENT_ORIGIN=https://your-frontend-url.vercel.app
   ```
   (You'll come back and fill in the real frontend URL after Step 3.)
5. Deploy. Render's free tier spins the service down after ~15 minutes of inactivity, so
   the first request after idle time will be slow to wake up — normal for a free demo.
6. Note the URL Render gives you, e.g. `https://lease-review-backend.onrender.com`.

### Step 3 — Frontend on Vercel (or Netlify)

1. Sign up at [vercel.com](https://vercel.com) → **New Project** → import the same repo
   → set **Root Directory** to `frontend`.
2. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
3. Add an environment variable:
   ```
   VITE_API_BASE_URL=https://lease-review-backend.onrender.com/api
   ```
4. Deploy. Vercel gives you a live URL like `https://lease-review-assistant.vercel.app`.
5. Go back to Render and update `CLIENT_ORIGIN` to this exact URL, then redeploy the
   backend so CORS allows requests from it.

You now have a live demo link you can share with judges.

---

## Notes on the rule engine's limits (good to mention in your demo)

- Number extraction relies on the lease phrasing numbers in common ways (e.g. "2 months'
  rent", "60 days notice", "Rs. 25,000"). Unusual phrasing may need a keyword tweak in the
  **Standards Playbook** page rather than a code change — that's the point of keeping the
  rules in the database.
- The system is intentionally conservative: if it can't find a clear number, it reports a
  deviation asking for manual review rather than guessing.
- This is a decision-support tool for a human reviewer, not an approval system — every
  report ends with a reminder of that.
