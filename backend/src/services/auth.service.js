const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const authDb = require('../lib/authDb');
const { JWT_SECRET } = require('../middleware/auth.middleware');

const TOKEN_EXPIRY = '24h';

const authService = {
  /**
   * Authenticate user with email and password.
   * Uses pg (authDb) to avoid Prisma client issues in some environments.
   */
  async login(email, password) {
    const user = await authDb.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token,
    };
  },

  /**
   * Get user profile by ID.
   * Uses pg (authDb) to avoid Prisma client issues in some environments.
   */
  async getProfile(userId) {
    const user = await authDb.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  },

  /**
   * Create a new user (for seeding or admin purposes)
   */
  /**
   * Create a new user (for seeding or admin purposes)
   */
  async createUser(data) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        name: data.name,
        role: data.role || 'admin',
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  },
};

module.exports = authService;

