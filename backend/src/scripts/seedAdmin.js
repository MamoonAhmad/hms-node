/**
 * Seed script to create admin user
 * Run with: npm run seed:admin
 * Uses pg directly to avoid Prisma client WASM/query-compiler issues in some environments.
 */

require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const ADMIN_EMAIL = 'root@localhost';
const ADMIN_PASSWORD = '1234';
const ADMIN_NAME = 'Admin User';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seedAdmin() {
  console.log('🌱 Seeding admin user...\n');

  const client = await pool.connect();

  try {
    const existing = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [ADMIN_EMAIL]
    );

    if (existing.rows.length > 0) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log('   Skipping creation.\n');
      return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const now = new Date();
    const id = crypto.randomUUID();

    await client.query(
      `INSERT INTO users (id, email, password, name, role, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, ADMIN_EMAIL, hashedPassword, ADMIN_NAME, 'admin', true, now, now]
    );

    console.log('✅ Admin user created successfully!');
    console.log('   ─────────────────────────────');
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Role:     admin`);
    console.log(`   ID:       ${id}`);
    console.log('   ─────────────────────────────\n');
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedAdmin();
