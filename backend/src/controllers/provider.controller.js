const providerService = require('../services/provider.service');
const pick = require('../utils/pick');

function toIsoDateOnly(value) {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function normalizeNppESResult(result) {
  const basic = result?.basic || {};
  const entityType = String(result?.enumeration_type || '').toUpperCase();
  const addresses = Array.isArray(result?.addresses) ? result.addresses : [];
  const taxonomies = Array.isArray(result?.taxonomies) ? result.taxonomies : [];

  const practice = addresses.find((a) => a.address_purpose === 'LOCATION') || null;
  const mailing = addresses.find((a) => a.address_purpose === 'MAILING') || null;

  const primaryTaxonomy = taxonomies.find((t) => t.primary === true) || null;

  return {
    npi: String(result?.number || ''),
    entityType: entityType === 'NPI-1' ? 'INDIVIDUAL' : entityType === 'NPI-2' ? 'ORGANIZATION' : 'UNKNOWN',
    enumerationDate: toIsoDateOnly(basic?.enumeration_date),
    lastUpdated: toIsoDateOnly(basic?.last_updated),
    status: basic?.status || 'UNKNOWN',
    name: {
      first: basic?.first_name || null,
      middle: basic?.middle_name || null,
      last: basic?.last_name || null,
      suffix: basic?.name_suffix || null,
      organizationName: basic?.organization_name || null,
    },
    taxonomy: primaryTaxonomy
      ? [
          {
            code: primaryTaxonomy.code,
            desc: primaryTaxonomy.desc || null,
            primary: true,
          },
        ]
      : [],
    addresses: {
      practice: practice
        ? {
            line1: practice.address_1 || null,
            line2: practice.address_2 || null,
            city: practice.city || null,
            state: practice.state || null,
            postalCode: practice.postal_code || null,
            countryCode: practice.country_code || null,
            phone: practice.telephone_number || null,
            fax: practice.fax_number || null,
          }
        : null,
      mailing: mailing
        ? {
            line1: mailing.address_1 || null,
            line2: mailing.address_2 || null,
            city: mailing.city || null,
            state: mailing.state || null,
            postalCode: mailing.postal_code || null,
            countryCode: mailing.country_code || null,
            phone: mailing.telephone_number || null,
            fax: mailing.fax_number || null,
          }
        : null,
    },
    raw: result,
  };
}

async function fetchNpiFromNppes(npi) {
  const version = process.env.NPPES_API_VERSION || '2.1';
  const url = `https://npiregistry.cms.hhs.gov/api/?number=${encodeURIComponent(npi)}&version=${encodeURIComponent(version)}`;

  const controller = new AbortController();
  const timeoutMs = Number(process.env.NPPES_TIMEOUT_MS || 10000);
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) {
      throw new Error(`NPPES responded with status ${resp.status}`);
    }
    return await resp.json();
  } finally {
    clearTimeout(t);
  }
}

const providerController = {
  async create(req, res, next) {
    try {
      const provider = await providerService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Provider created successfully',
        data: provider,
      });
    } catch (error) {
      if (error?.status === 400) {
        return res.status(400).json({
          success: false,
          message: error.message || 'Bad request',
        });
      }
      if (error?.code === 'P2003') {
        return res.status(400).json({
          success: false,
          message: 'Invalid reference (specialty, sub-specialty, or department)',
        });
      }
      // Prisma unique constraint (e.g., duplicate NPI)
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Provider with this NPI already exists',
        });
      }
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, ['page', 'limit', 'search', 'isActive', 'departmentId']);
      const result = await providerService.findAll(filters);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const provider = await providerService.findById(req.params.id);
      if (!provider) {
        return res.status(404).json({
          success: false,
          message: 'Provider not found',
        });
      }
      res.json({
        success: true,
        data: provider,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await providerService.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Provider not found',
        });
      }

      const updated = await providerService.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Provider updated successfully',
        data: updated,
      });
    } catch (error) {
      if (error?.status === 400) {
        return res.status(400).json({
          success: false,
          message: error.message || 'Bad request',
        });
      }
      if (error?.code === 'P2003') {
        return res.status(400).json({
          success: false,
          message: 'Invalid reference (specialty, sub-specialty, or department)',
        });
      }
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Provider with this NPI already exists',
        });
      }
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await providerService.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Provider not found',
        });
      }

      await providerService.delete(req.params.id);
      res.json({
        success: true,
        message: 'Provider deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  async lookupByNpi(req, res) {
    const { npi } = req.params;
    try {
      const json = await fetchNpiFromNppes(npi);
      const results = Array.isArray(json?.results) ? json.results : [];
      if (!results.length) {
        return res.status(404).json({
          success: false,
          message: 'NPI not found',
        });
      }
      const normalized = normalizeNppESResult(results[0]);
      return res.json({
        success: true,
        data: normalized,
      });
    } catch (error) {
      return res.status(502).json({
        success: false,
        message: 'NPI lookup service unavailable',
      });
    }
  },
};

module.exports = providerController;

