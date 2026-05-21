import { MedicalCodesAdminPage } from '@/pages/administration/medical-codes/MedicalCodesAdminPage';
import { DIAGNOSIS_CONFIG } from '@/pages/administration/medical-codes/medicalCodesAdminConfig';

export function DiagnosisCodesPage() {
  return <MedicalCodesAdminPage config={DIAGNOSIS_CONFIG} />;
}
