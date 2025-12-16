const prisma = require('../lib/prisma');

const appointmentService = {
  /**
   * Create a new appointment
   */
  async create(data) {
    return prisma.appointment.create({
      data: {
        appointmentDate: new Date(data.appointmentDate),
        appointmentTime: data.appointmentTime,
        duration: data.duration || 30,
        appointmentType: data.appointmentType,
        visitReason: data.visitReason,
        department: data.department,
        provider: data.provider,
        status: data.status || 'Scheduled',
        notes: data.notes,
        patientId: data.patientId,
      },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
            contactNumber: true,
            email: true,
          },
        },
      },
    });
  },

  /**
   * Get all appointments with optional pagination and filters
   */
  async findAll({ page = 1, limit = 10, search = '', status, appointmentType, department, date, patientId }) {
    const skip = (page - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    const conditions = [];

    // Search filter (by patient name or visit reason)
    if (search) {
      conditions.push({
        OR: [
          { visitReason: { contains: search, mode: 'insensitive' } },
          { provider: { contains: search, mode: 'insensitive' } },
          { patient: { firstName: { contains: search, mode: 'insensitive' } } },
          { patient: { lastName: { contains: search, mode: 'insensitive' } } },
          { patient: { mrn: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    // Status filter
    if (status) {
      conditions.push({ status });
    }

    // Appointment type filter
    if (appointmentType) {
      conditions.push({ appointmentType });
    }

    // Department filter
    if (department) {
      conditions.push({ department: { contains: department, mode: 'insensitive' } });
    }

    // Date filter
    if (date) {
      const filterDate = new Date(date);
      conditions.push({ appointmentDate: filterDate });
    }

    // Patient filter
    if (patientId) {
      conditions.push({ patientId });
    }

    // Combine conditions with AND
    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: parseInt(limit) || 10,
        orderBy: [
          { appointmentDate: 'asc' },
          { appointmentTime: 'asc' },
        ],
        include: {
          patient: {
            select: {
              id: true,
              mrn: true,
              firstName: true,
              lastName: true,
              contactNumber: true,
              email: true,
            },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  /**
   * Get an appointment by ID
   */
  async findById(id) {
    return prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
            contactNumber: true,
            email: true,
            dateOfBirth: true,
            gender: true,
            insuranceProvider: true,
          },
        },
      },
    });
  },

  /**
   * Get appointments by patient ID
   */
  async findByPatientId(patientId) {
    return prisma.appointment.findMany({
      where: { patientId },
      orderBy: [
        { appointmentDate: 'desc' },
        { appointmentTime: 'desc' },
      ],
    });
  },

  /**
   * Update an appointment
   */
  async update(id, data) {
    const updateData = { ...data };

    if (data.appointmentDate) {
      updateData.appointmentDate = new Date(data.appointmentDate);
    }

    // Ensure duration is an integer
    if (data.duration !== undefined && data.duration !== null) {
      updateData.duration = parseInt(data.duration, 10);
    }

    return prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
            contactNumber: true,
            email: true,
          },
        },
      },
    });
  },

  /**
   * Delete an appointment
   */
  async delete(id) {
    return prisma.appointment.delete({
      where: { id },
    });
  },

  /**
   * Get today's appointments
   */
  async getTodayAppointments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.appointment.findMany({
      where: {
        appointmentDate: today,
      },
      orderBy: { appointmentTime: 'asc' },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
            contactNumber: true,
          },
        },
      },
    });
  },
};

module.exports = appointmentService;

