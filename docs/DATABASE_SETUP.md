# Database setup for HMS (with pgAdmin 4)

This guide sets up the PostgreSQL database so the backend can connect and the login page works.

---

## 1. Create the database in pgAdmin 4

1. **Open pgAdmin 4** and connect to your PostgreSQL server (e.g. **localhost**).

2. **Create a new database:**
   - Right‑click **Databases** → **Create** → **Database**.
   - **Database:** `hms`
   - **Owner:** your PostgreSQL user (e.g. `postgres`).
   - Click **Save**.

3. **Note your connection details:**
   - **Host:** usually `localhost` (or `127.0.0.1`).
   - **Port:** usually `5432`.
   - **Username:** e.g. `postgres` (or the user you use in pgAdmin).
   - **Password:** the one you set for that user.
   - **Database name:** `hms`.

---

## 2. Set `DATABASE_URL` in the backend

1. In the **backend** folder, open or create the file **`.env`** (same folder as `package.json`).

2. Add or update this line (replace with your real password and details if different):

   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/hms"
   ```

   Replace:
   - `postgres` → your PostgreSQL **username**
   - `YOUR_PASSWORD` → your PostgreSQL **password**
   - `localhost` → your DB host (use `localhost` if PostgreSQL is on the same machine)
   - `5432` → your PostgreSQL port (default is `5432`)
   - `hms` → database name (must be exactly **hms**)

   **Example (password `mypass123`):**

   ```env
   DATABASE_URL="postgresql://postgres:mypass123@localhost:5432/hms"
   ```

3. Save the file.

---

## 3. Run migrations and seed admin user

In a terminal, from the **backend** folder:

```bash
cd backend
npm install
npx prisma migrate deploy
npm run seed:admin
```

- **`npx prisma migrate deploy`** creates all tables in the `hms` database.
- **`npm run seed:admin`** creates the default admin user.

---

## 4. Start backend and frontend

- **Backend:** from `backend` folder run `npm run dev` (or `npm start`).
- **Frontend:** from `frontend` folder run `npm run dev`.

Then open the app (e.g. `http://localhost:5173`) and log in with:

- **Email:** `root@localhost`
- **Password:** `1234`

---

## Quick reference

| Item            | Value            |
|-----------------|------------------|
| **Database name** | `hms`          |
| **Host**        | `localhost`      |
| **Port**        | `5432`           |
| **URL format**  | `postgresql://USER:PASSWORD@localhost:5432/hms` |

If you still see **“Failed to fetch”**:

1. Confirm PostgreSQL is running (e.g. service or from pgAdmin).
2. Confirm the database **`hms`** exists in pgAdmin.
3. Confirm **`.env`** has the correct `DATABASE_URL` and no typos.
4. Restart the backend after changing `.env`.
5. Ensure the frontend is calling the same backend URL (e.g. `http://localhost:3000` for the API).
