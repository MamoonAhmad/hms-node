const authService = require('../services/auth.service');

const authController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
      }

      const result = await authService.login(email, password);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      if (error.message === 'Invalid email or password' || error.message === 'Account is deactivated') {
        return res.status(401).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;

