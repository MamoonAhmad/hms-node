const prisma = require('../lib/prisma');

/**
 * Channel provider abstraction — swap ConsoleNotificationProvider for Twilio/SendGrid adapters.
 */
class ConsoleNotificationProvider {
  get name() {
    return 'console';
  }

  async send({ channel, recipient, subject, body }) {
    // eslint-disable-next-line no-console
    console.info(`[notification:${channel}] to=${recipient} subject=${subject || ''} body=${body}`);
    return {
      success: true,
      providerMessageId: `CONSOLE-${Date.now()}`,
    };
  }
}

let channelProvider = new ConsoleNotificationProvider();

function renderTemplate(template, vars = {}) {
  return String(template || '').replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : '',
  );
}

const notificationService = {
  setChannelProvider(provider) {
    if (!provider || typeof provider.send !== 'function') {
      throw new Error('Notification provider must implement send()');
    }
    channelProvider = provider;
  },

  async ensureTemplate(eventKey, channel, defaults) {
    const existing = await prisma.notificationTemplate.findUnique({ where: { eventKey } });
    if (existing) return existing;
    return prisma.notificationTemplate.create({
      data: {
        eventKey,
        channel,
        subject: defaults.subject || null,
        body: defaults.body || 'Notification',
        isActive: true,
      },
    });
  },

  async enqueue({
    eventKey,
    channel,
    recipient,
    patientId = null,
    appointmentId = null,
    variables = {},
  }) {
    if (!recipient) {
      return { skipped: true, reason: 'no_recipient' };
    }

    let template = await prisma.notificationTemplate.findFirst({
      where: { eventKey, isActive: true },
    });
    if (!template) {
      template = await this.ensureTemplate(eventKey, channel, {
        subject: eventKey,
        body: JSON.stringify(variables),
      });
    }

    const subject = renderTemplate(template.subject, variables);
    const body = renderTemplate(template.body, variables);

    const log = await prisma.notificationLog.create({
      data: {
        eventKey,
        channel: channel || template.channel,
        recipient,
        patientId,
        appointmentId,
        templateId: template.id,
        status: 'queued',
        payload: { variables, subject, body },
      },
    });

    try {
      const result = await channelProvider.send({
        channel: log.channel,
        recipient,
        subject,
        body,
      });
      return prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          providerMessageId: result.providerMessageId || null,
        },
      });
    } catch (error) {
      return prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: 'failed',
          failedAt: new Date(),
          error: error.message,
          retryCount: { increment: 1 },
        },
      });
    }
  },

  async notifyAppointmentEvent(appointmentId, eventKey, extras = {}) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true },
    });
    if (!appointment) return null;

    const patient = appointment.patient;
    const variables = {
      date: appointment.appointmentDate
        ? new Date(appointment.appointmentDate).toISOString().slice(0, 10)
        : '',
      time: appointment.appointmentTime || '',
      encounter: appointment.encounterNumber || '',
      ...extras,
    };

    const results = [];
    if (patient?.email) {
      results.push(
        await this.enqueue({
          eventKey,
          channel: 'email',
          recipient: patient.email,
          patientId: patient.id,
          appointmentId,
          variables,
        }),
      );
    }
    const phone = patient?.cellPhone || patient?.contactNumber;
    if (phone && ['appointment.reminder', 'waitlist.offer'].includes(eventKey)) {
      results.push(
        await this.enqueue({
          eventKey,
          channel: 'sms',
          recipient: phone,
          patientId: patient.id,
          appointmentId,
          variables,
        }),
      );
    }
    return results;
  },

  async listForAppointment(appointmentId) {
    return prisma.notificationLog.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'desc' },
    });
  },
};

module.exports = notificationService;
