const encountersWorkListService = require('../services/encountersWorkList.service');
const pick = require('../utils/pick');

const encountersWorkListController = {
  async findAll(req, res, next) {
    try {
      const filters = pick(req.validatedQuery || req.query, [
        'page',
        'limit',
        'search',
        'gender',
        'departmentId',
        'status',
        'providerId',
        'dateFrom',
        'dateTo',
        'appointmentTimeFilter',
        'tab',
      ]);

      filters.assignedToId = req.user?.id;

      const result = await encountersWorkListService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = encountersWorkListController;
