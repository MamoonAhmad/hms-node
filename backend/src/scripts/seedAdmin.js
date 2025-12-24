/**
 * Seed script to create admin user
 * Run with: npm run seed:admin
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const ADMIN_EMAIL = 'root@localhost';
const ADMIN_PASSWORD = '1234';
const ADMIN_NAME = 'Admin User';

async function seedAdmin() {
  console.log('🌱 Seeding admin user...\n');

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log('   Skipping creation.\n');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        password: hashedPassword,
        name: ADMIN_NAME,
        role: 'admin',
        isActive: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('   ─────────────────────────────');
    console.log(`   Email:    ${admin.email}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Role:     ${admin.role}`);
    console.log(`   ID:       ${admin.id}`);
    console.log('   ─────────────────────────────\n');
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();

