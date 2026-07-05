const trackingBoardService = require('../services/trackingBoard.service');
const pick = require('../utils/pick');

const trackingBoardController = {
  async findAll(req, res, next) {
    try {
      const filters = pick(req.validatedQuery || req.query, [
        'page',
        'limit',
        'search',
        'status',
        'providerId',
        'date',
        'dateFrom',
        'dateTo',
        'arrivalTimeFilter',
        'indicator',
      ]);

      const result = await trackingBoardService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async assignRoom(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const { roomId } = req.body;
      const data = await trackingBoardService.assignRoom(appointmentId, roomId, req.user);
      res.json({
        success: true,
        message: 'Room assigned successfully',
        data,
      });
    } catch (error) {
      if (error?.statusCode === 404 || error?.statusCode === 400) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = trackingBoardController;
