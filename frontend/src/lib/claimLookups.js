import {
  patientApi,
  providerApi,
  locationApi,
  insuranceProviderApi,
  diagnosisCodeApi,
  billingProviderApi,
} from '@/services/api';

function formatDob(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export async function searchPatients(q) {
  const res = await patientApi.getAll({ search: q || undefined, page: 1, limit: 25 });
  return (res.data || []).map((row) => ({
    id: row.id,
    label: [row.lastName, row.firstName].filter(Boolean).join(', '),
    lines: [
      [row.mrn && `MRN ${row.mrn}`, row.id && `ID ${String(row.id).slice(0, 8)}`].filter(Boolean).join(' · '),
      [formatDob(row.dateOfBirth), row.contactNumber || row.cellPhone || row.homePhone].filter(Boolean).join(' · '),
    ],
    raw: row,
  }));
}

export async function searchBillingProviders(q) {
  const res = await billingProviderApi.getAll({
    search: q || undefined,
    page: 1,
    limit: 25,
    lookup: true,
  });
  return (res.data || []).map((row) => ({
    id: row.id,
    label: row.name,
    lines: [
      [row.npi && `NPI ${row.npi}`, row.code && `Code ${row.code}`].filter(Boolean).join(' · '),
      row.taxId ? `Tax ID ${row.taxId}` : '',
    ].filter(Boolean),
    raw: row,
  }));
}

export async function searchProviders(q) {
  const res = await providerApi.getAll({ search: q || undefined, page: 1, limit: 25, isActive: true });
  return (res.data || []).map((row) => {
    const name = [row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ');
    return {
      id: row.id,
      label: name,
      lines: [
        [row.npi && `NPI ${row.npi}`, row.specialty?.name || row.specialtyName].filter(Boolean).join(' · '),
        row.department?.name || row.departmentName || '',
      ],
      raw: row,
    };
  });
}

export async function searchFacilities(q) {
  const res = await locationApi.getAll({ search: q || undefined, page: 1, limit: 25, isActive: true });
  return (res.data || []).map((row) => ({
    id: row.id,
    label: row.name,
    lines: [
      [row.address, [row.city, row.state].filter(Boolean).join(', ')].filter(Boolean).join(' · '),
    ],
    raw: row,
  }));
}

export async function searchPayers(q) {
  const res = await insuranceProviderApi.getAll({
    search: q || undefined,
    page: 1,
    limit: 25,
    isActive: true,
  });
  return (res.data || []).map((row) => ({
    id: row.id,
    label: row.name,
    lines: [
      [row.code && `Payer ID ${row.code}`, row.isActive === false ? 'Inactive' : 'Active'].filter(Boolean).join(' · '),
      [row.address, row.city, row.state].filter(Boolean).join(', '),
    ],
    raw: row,
  }));
}

export async function searchDiagnoses(q) {
  const res = await diagnosisCodeApi.getAll({
    search: q || undefined,
    lookup: true,
    page: 1,
    limit: 25,
  });
  return (res.data || []).map((row) => ({
    id: row.id,
    label: `${row.code} - ${row.description}`,
    lines: [row.chapter].filter(Boolean),
    raw: row,
  }));
}
