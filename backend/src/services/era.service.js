const prisma = require('../lib/prisma');
const patientLedgerService = require('./patientLedger.service');
const claimEngineService = require('./claimEngine.service');

function money(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

async function resolveClaim(line) {
  if (line.claimId) {
    return prisma.patientClaim.findUnique({ where: { id: line.claimId } });
  }
  if (line.claimNumber) {
    return prisma.patientClaim.findFirst({ where: { claimNumber: line.claimNumber } });
  }
  if (line.tcn) {
    return prisma.patientClaim.findFirst({ where: { tcn: line.tcn } });
  }
  return null;
}

const eraService = {
  async listBatches(query = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
    const where = {};
    if (query.status) where.status = query.status;

    const [total, rows] = await Promise.all([
      prisma.eraBatch.count({ where }),
      prisma.eraBatch.findMany({
        where,
        include: { lines: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map((b) => ({
        ...b,
        totalPayment: Number(b.totalPayment),
        lineCount: b.lines.length,
        postedCount: b.lines.filter((l) => l.status === 'posted').length,
        deniedCount: b.lines.filter((l) => l.denialCode).length,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    };
  },

  async getBatch(id) {
    const batch = await prisma.eraBatch.findUnique({
      where: { id },
      include: {
        lines: {
          include: { claim: { select: { id: true, claimNumber: true, claimStatus: true, patientId: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!batch) {
      const err = new Error('ERA batch not found');
      err.statusCode = 404;
      throw err;
    }
    return {
      ...batch,
      totalPayment: Number(batch.totalPayment),
      lines: batch.lines.map((l) => ({
        ...l,
        billedAmount: l.billedAmount != null ? Number(l.billedAmount) : null,
        paidAmount: Number(l.paidAmount),
        adjustmentAmount: Number(l.adjustmentAmount),
        patientResponsibility: l.patientResponsibility != null ? Number(l.patientResponsibility) : null,
      })),
    };
  },

  /**
   * Ingest a mock 835 / remittance payload and optionally auto-post.
   * Body: { payerName, checkNumber, checkDate, lines: [{ claimNumber|tcn|claimId, paidAmount, adjustmentAmount, denialCode, denialReason, patientResponsibility }] }
   */
  async importBatch(body, user, { autoPost = true } = {}) {
    const lines = Array.isArray(body.lines) ? body.lines : [];
    if (!lines.length) {
      const err = new Error('ERA lines are required');
      err.statusCode = 400;
      throw err;
    }

    const totalPayment = money(lines.reduce((s, l) => s + Number(l.paidAmount || 0), 0));
    const batchNumber = body.batchNumber || `ERA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-5)}`;

    const batch = await prisma.eraBatch.create({
      data: {
        batchNumber,
        payerName: body.payerName || null,
        checkNumber: body.checkNumber || null,
        checkDate: body.checkDate ? new Date(body.checkDate) : new Date(),
        totalPayment,
        status: 'imported',
        rawPayload: body,
        importedBy: user?.id || null,
        lines: {
          create: await Promise.all(
            lines.map(async (line) => {
              const claim = await resolveClaim(line);
              return {
                claimId: claim?.id || line.claimId || null,
                patientId: claim?.patientId || line.patientId || null,
                claimNumber: claim?.claimNumber || line.claimNumber || null,
                tcn: claim?.tcn || line.tcn || null,
                billedAmount: line.billedAmount != null ? money(line.billedAmount) : (claim ? Number(claim.billedAmount || 0) : null),
                paidAmount: money(line.paidAmount),
                adjustmentAmount: money(line.adjustmentAmount),
                patientResponsibility: line.patientResponsibility != null ? money(line.patientResponsibility) : null,
                denialCode: line.denialCode || null,
                denialReason: line.denialReason || null,
                status: 'pending',
              };
            }),
          ),
        },
      },
      include: { lines: true },
    });

    await prisma.ediTransaction.create({
      data: {
        transactionType: '835',
        direction: 'inbound',
        controlNumber: batch.batchNumber,
        status: 'imported',
        payload: { batchId: batch.id, batchNumber: batch.batchNumber, lineCount: lines.length, mock: true },
        providerName: 'mock-clearinghouse',
        createdBy: user?.id || null,
        acknowledgedAt: new Date(),
      },
    });

    if (autoPost) {
      return this.postBatch(batch.id, user);
    }
    return this.getBatch(batch.id);
  },

  async postBatch(batchId, user) {
    const batch = await prisma.eraBatch.findUnique({
      where: { id: batchId },
      include: { lines: true },
    });
    if (!batch) {
      const err = new Error('ERA batch not found');
      err.statusCode = 404;
      throw err;
    }

    const results = [];
    for (const line of batch.lines) {
      if (line.status === 'posted') {
        results.push({ id: line.id, status: 'already_posted' });
        continue;
      }

      const claim = line.claimId
        ? await prisma.patientClaim.findUnique({ where: { id: line.claimId } })
        : await resolveClaim(line);

      if (!claim) {
        await prisma.eraLine.update({
          where: { id: line.id },
          data: { status: 'unmatched' },
        });
        results.push({ id: line.id, status: 'unmatched' });
        continue;
      }

      const paid = money(line.paidAmount);
      const adj = money(line.adjustmentAmount);
      const patientId = claim.patientId;

      let ledgerPaymentId = null;
      if (paid > 0) {
        const posted = await patientLedgerService.postEraPayment(
          patientId,
          {
            amount: paid,
            appointmentId: claim.appointmentId,
            claimId: claim.id,
            payerName: batch.payerName,
            eraTraceNumber: batch.checkNumber || batch.batchNumber,
            adjustmentAmount: adj,
            claimStatus: null,
            autoAllocate: true,
            description: `ERA ${batch.batchNumber} payment for ${claim.claimNumber}`,
          },
          user,
        );
        ledgerPaymentId = posted.payment?.transaction?.id || posted.payment?.id || null;
      } else if (adj > 0) {
        await patientLedgerService.postTransaction({
          patientId,
          appointmentId: claim.appointmentId,
          transactionType: 'adjustment',
          amount: adj,
          description: `ERA ${batch.batchNumber} adjustment for ${claim.claimNumber}`,
          referenceType: 'era',
          referenceId: claim.id,
          user,
        });
      }

      const prevPaid = Number(claim.paidAmount || 0);
      const prevAdj = Number(claim.adjustmentAmount || 0);
      const newPaid = money(prevPaid + paid);
      const newAdj = money(prevAdj + adj);
      const billed = Number(claim.billedAmount || 0);
      const remaining = money(billed - newPaid - Math.abs(newAdj));

      let claimStatus = claim.claimStatus;
      if (line.denialCode || (paid === 0 && adj === 0 && line.denialReason)) {
        claimStatus = 'denied';
      } else if (remaining <= 0.01) {
        claimStatus = 'paid';
      } else if (newPaid > 0) {
        claimStatus = 'partial';
      } else if (claim.claimStatus === 'accepted' || claim.claimStatus === 'submitted') {
        claimStatus = 'accepted';
      }

      await prisma.patientClaim.update({
        where: { id: claim.id },
        data: {
          claimStatus,
          paidAmount: newPaid,
          adjustmentAmount: newAdj,
          patientResponsibility: line.patientResponsibility,
          denialCode: line.denialCode || claim.denialCode,
          denialReason: line.denialReason || claim.denialReason,
          paidAt: claimStatus === 'paid' || claimStatus === 'partial' ? new Date() : claim.paidAt,
          allowedAmount: money(billed - Math.abs(adj)),
        },
      });

      await prisma.claimEvent.create({
        data: {
          claimId: claim.id,
          eventType: 'era_posted',
          fromStatus: claim.claimStatus,
          toStatus: claimStatus,
          summary: `ERA ${batch.batchNumber} posted`,
          details: { eraLineId: line.id, paid, adj },
          createdBy: user?.id || null,
        },
      });

      if (claimStatus === 'denied') {
        const existingDenial = await prisma.denialCase.findFirst({
          where: { claimId: claim.id, status: { in: ['open', 'in_progress', 'appealing'] } },
        });
        if (!existingDenial) {
          await prisma.denialCase.create({
            data: {
              claimId: claim.id,
              patientId: claim.patientId,
              denialCode: line.denialCode || 'CO-16',
              denialReason: line.denialReason || 'Denied per remittance',
              carcCode: line.denialCode || null,
              status: 'open',
              deniedAmount: billed,
              createdBy: user?.id || null,
            },
          });
          await prisma.followUpTask.create({
            data: {
              claimId: claim.id,
              patientId: claim.patientId,
              taskType: 'denial_follow_up',
              status: 'open',
              priority: 'high',
              summary: `Denial follow-up for ${claim.claimNumber}`,
              notes: line.denialReason || line.denialCode || null,
              dueDate: new Date(Date.now() + 7 * 86400000),
              createdBy: user?.id || null,
            },
          });
        }
      }

      await prisma.eraLine.update({
        where: { id: line.id },
        data: {
          status: 'posted',
          claimId: claim.id,
          patientId: claim.patientId,
          claimNumber: claim.claimNumber,
          ledgerPaymentId,
        },
      });

      results.push({ id: line.id, status: 'posted', claimId: claim.id, claimStatus });
    }

    await prisma.eraBatch.update({
      where: { id: batchId },
      data: { status: 'posted', postedAt: new Date() },
    });

    return { batch: await this.getBatch(batchId), results };
  },

  /** Convenience: generate a mock ERA for a submitted/accepted claim. */
  async simulateForClaim(claimId, body = {}, user) {
    const claim = await claimEngineService.getById(claimId);
    const billed = Number(claim.totalCharge || claim.billedAmount || 0);
    const paidRatio = body.paidRatio != null ? Number(body.paidRatio) : 0.8;
    const paidAmount = body.paidAmount != null ? money(body.paidAmount) : money(billed * paidRatio);
    const adjustmentAmount = body.adjustmentAmount != null
      ? money(body.adjustmentAmount)
      : money(Math.max(0, billed - paidAmount - Number(body.patientResponsibility || 0)));
    const deny = Boolean(body.deny);

    return this.importBatch(
      {
        payerName: claim.payer || body.payerName || 'Mock Payer',
        checkNumber: body.checkNumber || `CHK${Date.now().toString().slice(-8)}`,
        checkDate: new Date().toISOString().slice(0, 10),
        lines: [
          {
            claimId: claim.id,
            claimNumber: claim.claimNumber,
            tcn: claim.tcn,
            billedAmount: billed,
            paidAmount: deny ? 0 : paidAmount,
            adjustmentAmount: deny ? 0 : adjustmentAmount,
            patientResponsibility: body.patientResponsibility != null ? money(body.patientResponsibility) : money(billed - paidAmount - adjustmentAmount),
            denialCode: deny ? (body.denialCode || 'CO-50') : null,
            denialReason: deny ? (body.denialReason || 'These are non-covered services') : null,
          },
        ],
      },
      user,
      { autoPost: true },
    );
  },
};

module.exports = eraService;
