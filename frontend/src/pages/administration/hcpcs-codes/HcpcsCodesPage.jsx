import { MedicalCodesAdminPage } from '@/pages/administration/medical-codes/MedicalCodesAdminPage';
import { HCPCS_CONFIG } from '@/pages/administration/medical-codes/medicalCodesAdminConfig';

export function HcpcsCodesPage() {
  return <MedicalCodesAdminPage config={HCPCS_CONFIG} />;
}
