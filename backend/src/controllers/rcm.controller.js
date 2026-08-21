const claimEngineService = require('../services/claimEngine.service');
const cms1500ClaimService = require('../services/cms1500Claim.service');
const eraService = require('../services/era.service');
const denialService = require('../services/denial.service');
const collectionsService = require('../services/collections.service');
const statementCycleService = require('../services/statementCycle.service');
const rcmReportsService = require('../services/rcmReports.service');
const chargeMasterService = require('../services/chargeMaster.service');
const rcmEncounterService = require('../services/rcmEncounter.service');

function handle(res, next, promise) {
  promise
    .then((data) => res.json({ success: true, data }))
    .catch((error) => {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          error: error.message,
          errors: error.errors || undefined,
          details: error.details || undefined,
        });
      }
      if (error.name === 'PrismaClientValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Claim could not be loaded after save. Check provider/department data and try again.',
          error: error.message,
        });
      }
      next(error);
    });
}

const rcmController = {
  listClaims(req, res, next) {
    handle(res, next, cms1500ClaimService.list(req.query));
  },
  getClaim(req, res, next) {
    handle(res, next, cms1500ClaimService.getById(req.params.id));
  },
  createClaim(req, res, next) {
    handle(res, next, cms1500ClaimService.create(req.body, req.user));
  },
  updateClaim(req, res, next) {
    handle(res, next, cms1500ClaimService.update(req.params.id, req.body, req.user));
  },
  deleteClaim(req, res, next) {
    handle(res, next, cms1500ClaimService.remove(req.params.id, req.user));
  },
  copyClaim(req, res, next) {
    handle(res, next, cms1500ClaimService.copy(req.params.id, req.user));
  },
  splitClaim(req, res, next) {
    handle(res, next, cms1500ClaimService.split(req.params.id, req.body || {}, req.user));
  },
  claimChargeHistory(req, res, next) {
    handle(res, next, cms1500ClaimService.chargeHistory(req.params.id));
  },
  electronicPreview(req, res, next) {
    handle(res, next, cms1500ClaimService.electronicPreview(req.params.id));
  },
  printClaim(req, res, next) {
    handle(res, next, cms1500ClaimService.printData(req.params.id));
  },
  scrubClaim(req, res, next) {
    handle(res, next, claimEngineService.scrub(req.params.id, req.user));
  },
  submitClaim(req, res, next) {
    handle(res, next, claimEngineService.submit(req.params.id, req.user, req.body || {}));
  },
  ackClaim(req, res, next) {
    handle(res, next, claimEngineService.acknowledge277(req.params.id, req.user, req.body || {}));
  },
  voidClaim(req, res, next) {
    handle(res, next, claimEngineService.voidClaim(req.params.id, req.user, req.body?.reason));
  },
  updateClaimStatus(req, res, next) {
    handle(res, next, claimEngineService.updateStatus(req.params.id, req.body.claimStatus, req.user, req.body));
  },
  buildClaim(req, res, next) {
    handle(res, next, claimEngineService.buildFromEncounter({ ...req.body, user: req.user }));
  },
  mockEligibility(req, res, next) {
    handle(res, next, claimEngineService.mockEligibilityCheck({ ...req.body, user: req.user }));
  },

  listEras(req, res, next) {
    handle(res, next, eraService.listBatches(req.query));
  },
  getEra(req, res, next) {
    handle(res, next, eraService.getBatch(req.params.id));
  },
  importEra(req, res, next) {
    handle(res, next, eraService.importBatch(req.body, req.user, { autoPost: req.body?.autoPost !== false }));
  },
  postEra(req, res, next) {
    handle(res, next, eraService.postBatch(req.params.id, req.user));
  },
  simulateEra(req, res, next) {
    handle(res, next, eraService.simulateForClaim(req.params.claimId, req.body || {}, req.user));
  },

  listDenials(req, res, next) {
    handle(res, next, denialService.listDenials(req.query));
  },
  createDenial(req, res, next) {
    handle(res, next, denialService.createDenial(req.body, req.user));
  },
  updateDenial(req, res, next) {
    handle(res, next, denialService.updateDenial(req.params.id, req.body, req.user));
  },
  createAppeal(req, res, next) {
    handle(res, next, denialService.createAppeal(req.params.id, req.body, req.user));
  },
  decideAppeal(req, res, next) {
    handle(res, next, denialService.decideAppeal(req.params.id, req.body, req.user));
  },
  listFollowUps(req, res, next) {
    handle(res, next, denialService.listFollowUps(req.query));
  },
  createFollowUp(req, res, next) {
    handle(res, next, denialService.createFollowUp(req.body, req.user));
  },
  completeFollowUp(req, res, next) {
    handle(res, next, denialService.completeFollowUp(req.params.id, req.user));
  },

  listCollections(req, res, next) {
    handle(res, next, collectionsService.list(req.query));
  },
  placeCollections(req, res, next) {
    handle(res, next, collectionsService.place(req.body, req.user));
  },
  updateCollections(req, res, next) {
    handle(res, next, collectionsService.update(req.params.id, req.body, req.user));
  },
  advanceDunning(req, res, next) {
    handle(res, next, collectionsService.advanceDunning(req.params.id, req.user));
  },

  listStatementCycles(req, res, next) {
    handle(res, next, statementCycleService.list(req.query));
  },
  runStatementCycle(req, res, next) {
    handle(res, next, statementCycleService.createAndRun(req.body || {}, req.user));
  },
  markStatementCycleSent(req, res, next) {
    handle(res, next, statementCycleService.markSent(req.params.id, req.user));
  },

  report(req, res, next) {
    handle(res, next, rcmReportsService.run(req.params.slug, req.query));
  },
  dashboard(req, res, next) {
    handle(res, next, rcmReportsService.dashboard());
  },

  async listChargeMaster(req, res, next) {
    try {
      const result = await chargeMasterService.list(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
  getChargeMaster(req, res, next) {
    handle(res, next, chargeMasterService.getById(req.params.id));
  },
  createChargeMaster(req, res, next) {
    handle(res, next, chargeMasterService.create(req.body, req.user));
  },
  updateChargeMaster(req, res, next) {
    handle(res, next, chargeMasterService.update(req.params.id, req.body, req.user));
  },
  deleteChargeMaster(req, res, next) {
    handle(res, next, chargeMasterService.remove(req.params.id, req.user));
  },
  searchCharges(req, res, next) {
    handle(res, next, chargeMasterService.searchForCapture(req.query.q || req.query.search, Number(req.query.limit) || 25));
  },

  verifyEncounterEligibility(req, res, next) {
    handle(res, next, rcmEncounterService.verifyEligibility(req.params.id, req.user));
  },
};

module.exports = rcmController;
