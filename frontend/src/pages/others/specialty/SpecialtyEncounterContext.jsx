import { createContext, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { usePatientChart } from '@/pages/patient-dashboard/PatientChartContext';
import { getDepartmentBySlug } from '../departmentEncounterDepartments';
import { getSpecialtyEncounterConfig } from './specialtyEncounterConfig';
import { useSpecialtyEncounterState } from './useSpecialtyEncounterState';

const SpecialtyEncounterContext = createContext(null);

export function SpecialtyEncounterProvider({ children }) {
  const { departmentSlug } = useParams();
  const { patientId, appointmentId, patient, appointment } = usePatientChart();
  const department = getDepartmentBySlug(departmentSlug);
  const specialtyConfig = getSpecialtyEncounterConfig(departmentSlug);

  const specialtyState = useSpecialtyEncounterState({
    departmentSlug,
    patientId,
    appointmentId,
    clinicalChecks: department?.clinicalChecks || [],
  });

  const value = {
    departmentSlug,
    department,
    specialtyConfig,
    patient,
    appointment,
    patientId,
    appointmentId,
    ...specialtyState,
  };

  return (
    <SpecialtyEncounterContext.Provider value={value}>
      {children}
    </SpecialtyEncounterContext.Provider>
  );
}

export function useSpecialtyEncounter() {
  const ctx = useContext(SpecialtyEncounterContext);
  if (!ctx) {
    throw new Error('useSpecialtyEncounter must be used within SpecialtyEncounterProvider');
  }
  return ctx;
}
