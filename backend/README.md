# HMS Backend

Node.js API for HMS. Uses **Express**, **PostgreSQL**, and **Prisma** (client generated into `src/generated/prisma`; see `prisma/schema.prisma`).

## Prerequisites

- **Node.js** (see repo expectations for version)
- **PostgreSQL** and a reachable database
- **`backend/.env`** with at least **`DATABASE_URL`** (and any other vars your deployment needs)

---

## NPM scripts (`package.json`)

| Script | Purpose |
|--------|--------|
| **`npm run dev`** | Regenerates the Prisma Client, applies **pending migrations** (`migrate deploy`), then starts the API with **`node --watch`** (restarts when source files change). |
| **`npm start`** | Run the API once (no migrations, production-style): `node src/index.js`. |
| **`npm run prisma:generate`** | `prisma generate` — required after schema changes so `src/generated/prisma` is up to date. |
| **`npm run prisma:migrate`** | `prisma migrate dev` — interactive: create **new** migrations from schema edits during development (use when you change `schema.prisma` and need a migration file). |
| **`npm run prisma:studio`** | Open Prisma Studio against your database. |
| **`npm run seed:admin`** | Creates default admin **`root@localhost`** / **`1234`** if no user exists (uses `pg` directly). Safe to rerun; skips if user exists. |
| **`npm run seed:demo`** | Demo dataset via Prisma. Runs **only when the DB has no users** (empty-database guard). Requires migrations applied and **`prisma generate`**. Uses `require('../generated/prisma')` (custom output path). |
| **`npm run seed:demo:wipe`** | Deletes data in FK-safe order, then loads the demo seed. **Destructive.** |

### Seed scripts (`src/scripts/`)

| File | Role |
|------|------|
| **`seedAdmin.js`** | Minimal admin bootstrap (`npm run seed:admin`). |
| **`seedDemoData.js`** | Full demo data (tenants, locations, specialties, providers, appointments, etc.). Uses **`--wipe`** for a clean slate; otherwise seeds only when the DB is empty. Demo login documented in that file matches **`root@localhost`** / **`1234`**. |

**Note:** If `prisma migrate deploy` fails (wrong `DATABASE_URL`, DB down, drift), **`npm run dev`** will exit before starting the server. Fix the database or migrations, then run `dev` again.

---

## Migrations vs `npm run dev`

- **`migrate deploy`** (used by **`npm run dev`**) applies **existing** migration files under `prisma/migrations/` to the database — non-interactive, suitable for tying local startup to schema version.
- When **you change** `prisma/schema.prisma` and need a **new** migration file committed to the repo, use **`npm run prisma:migrate`** (or equivalent `prisma migrate dev`) deliberately; do not rely on `dev` to author migrations.

---

## Git: create a new branch from `master`

From the repository root:

```bash
git fetch origin
git checkout master
git pull origin master
git checkout -b your-branch-name
```

Replace `your-branch-name` with something short and descriptive (e.g. `feature/provider-fk-fields`).

If your default branch is **`main`** instead of **`master`**, use `main` in place of `master` in the commands above.

---

## Quick local workflow

```bash
cd backend
cp .env.example .env   # if you maintain an example — otherwise create .env with DATABASE_URL
npm install
npm run dev             # migrate + generate + API with watch
```

Optional seeds:

```bash
npm run seed:admin      # bootstrap admin user
npm run seed:demo       # demo data when DB is empty
```
