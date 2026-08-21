/**
 * PG-based DB access for auth only.
 * Used to avoid Prisma client (e.g. WASM/query compiler issues) for login and token validation.
 */
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const USER_COLUMNS = `
  id, email, username, name, "firstName", "middleName", "lastName",
  "phoneNumber", address, "addressLine2", city, state, zip, "profilePicture",
  role, "isActive", "createdAt", "updatedAt"
`;

function rowToUser(row) {
  if (!row) return null;
  const get = (obj, ...keys) => {
    for (const k of keys) if (obj[k] !== undefined) return obj[k];
    return undefined;
  };
  return {
    id: row.id,
    email: row.email,
    username: get(row, 'username') ?? null,
    name: row.name,
    firstName: get(row, 'firstName', 'firstname') ?? null,
    middleName: get(row, 'middleName', 'middlename') ?? null,
    lastName: get(row, 'lastName', 'lastname') ?? null,
    phoneNumber: get(row, 'phoneNumber', 'phonenumber') ?? null,
    address: row.address ?? null,
    addressLine2: get(row, 'addressLine2', 'addressline2') ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    zip: row.zip ?? null,
    profilePicture: get(row, 'profilePicture', 'profilepicture') ?? null,
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
      `SELECT id, email, password, username, name, "firstName", "middleName", "lastName",
              "phoneNumber", address, "addressLine2", city, state, zip, "profilePicture",
              role, "isActive", "createdAt", "updatedAt"
       FROM users WHERE email = $1`,
      [email.toLowerCase()],
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
      `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
      [id],
    );
    return res.rows[0] ? rowToUser(res.rows[0]) : null;
  } finally {
    client.release();
  }
}

async function findUserByUsername(username, excludeUserId = null) {
  if (!username?.trim()) return null;
  const client = await pool.connect();
  try {
    const params = [username.trim().toLowerCase()];
    let sql = 'SELECT id FROM users WHERE LOWER(username) = $1';
    if (excludeUserId) {
      params.push(excludeUserId);
      sql += ' AND id != $2';
    }
    const res = await client.query(sql, params);
    return res.rows[0] || null;
  } finally {
    client.release();
  }
}

async function updateUserProfile(userId, data) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `UPDATE users SET
        username = $2,
        "firstName" = $3,
        "middleName" = $4,
        "lastName" = $5,
        name = $6,
        "phoneNumber" = $7,
        address = $8,
        "addressLine2" = $9,
        city = $10,
        state = $11,
        zip = $12,
        "profilePicture" = $13,
        "updatedAt" = NOW()
      WHERE id = $1
      RETURNING ${USER_COLUMNS}`,
      [
        userId,
        data.username || null,
        data.firstName,
        data.middleName || null,
        data.lastName,
        data.name,
        data.phoneNumber || null,
        data.address || null,
        data.addressLine2 || null,
        data.city || null,
        data.state || null,
        data.zip || null,
        data.profilePicture || null,
      ],
    );
    return res.rows[0] ? rowToUser(res.rows[0]) : null;
  } finally {
    client.release();
  }
}

module.exports = {
  findUserByEmail,
  findUserById,
  findUserByUsername,
  updateUserProfile,
  pool,
};
