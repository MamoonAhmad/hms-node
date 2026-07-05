/**
 * Pick the active appointment for a patient chart (mirrors frontend patientChartUtils).
 */
function pickActiveAppointment(appointments) {
  if (!appointments?.length) return null;

  const today = new Date().toISOString().slice(0, 10);
  const openStatuses = ['Scheduled', 'Checked-In', 'In Progress', 'Rescheduled', 'Arrived', 'Roomed', 'With Provider', 'Provider Out'];

  const todayAppt = appointments.find((a) => {
    const date =
      typeof a.appointmentDate === 'string'
        ? a.appointmentDate.slice(0, 10)
        : new Date(a.appointmentDate).toISOString().slice(0, 10);
    return date === today && openStatuses.includes(a.status);
  });
  if (todayAppt) return todayAppt;

  const open = appointments.find((a) => openStatuses.includes(a.status));
  if (open) return open;

  return appointments[0];
}

module.exports = {
  pickActiveAppointment,
};
