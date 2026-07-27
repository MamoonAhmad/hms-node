const prisma = require('../lib/prisma');

const MRN_PREFIX = 'MRN';
const MRN_DIGITS = 12;

/**
 * Next MRN in the form MRN000000000001, MRN000000000002, ...
 * Uses the highest existing numeric MRN so gaps from soft-deletes are not reused incorrectly.
 */
async function generateNextMrn(db = prisma) {
  const rows = await db.$queryRaw`
    SELECT COALESCE(MAX(CAST(SUBSTRING(mrn FROM 4) AS BIGINT)), 0) AS "maxSeq"
    FROM patients
    WHERE mrn ~ '^MRN[0-9]+$'
  `;

  const maxSeq = Number(rows[0]?.maxSeq ?? 0);
  const nextSeq = maxSeq + 1;

  if (nextSeq > 10 ** MRN_DIGITS - 1) {
    throw new Error('MRN sequence exhausted');
  }

  return `${MRN_PREFIX}${String(nextSeq).padStart(MRN_DIGITS, '0')}`;
}

module.exports = {
  generateNextMrn,
  MRN_PREFIX,
  MRN_DIGITS,
};
