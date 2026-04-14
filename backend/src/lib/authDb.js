/**
 * PG-based DB access for auth only.
 * Used to avoid Prisma client (e.g. WASM/query compiler issues) for login and token validation.
 */
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function rowToUser(row) {
  if (!row) return null;
  const get = (obj, ...keys) => {
    for (const k of keys) if (obj[k] !== undefined) return obj[k];
    return undefined;
  };
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: get(row, 'isActive', 'isactive'),
    createdAt: get(row, 'createdAt', 'createdat'),
    updatedAt: get(row, 'updatedAt', 'updatedat'),
    ...(get(row, 'password') !== undefined && { password: get(row, 'password') }),
  };
}

async function findUserByEmail(email) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      'SELECT id, email, password, name, role, "isActive", "createdAt", "updatedAt" FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return res.rows[0] ? rowToUser(res.rows[0]) : null;
  } finally {
    client.release();
  }
}

async function findUserById(id) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      'SELECT id, email, name, role, "isActive", "createdAt", "updatedAt" FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] ? rowToUser(res.rows[0]) : null;
  } finally {
    client.release();
  }
}

module.exports = { findUserByEmail, findUserById, pool };
