-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "mrn" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "suffix" TEXT,
    "preferredName" TEXT,
    "previousName" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "genderIdentity" TEXT,
    "pronouns" TEXT,
    "contactNumber" TEXT NOT NULL,
    "preferredContactMethod" TEXT NOT NULL DEFAULT 'cell',
    "email" TEXT,
    "address" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT DEFAULT 'US',
    "homePhone" TEXT,
    "workPhone" TEXT,
    "cellPhone" TEXT,
    "governmentIdType" TEXT,
    "governmentIdNumber" TEXT,
    "birthPlace" TEXT,
    "veteranStatus" TEXT,
    "disabilityStatus" TEXT,
    "tribalAffiliation" TEXT,
    "generalNotes" TEXT,
    "ethnicity" TEXT,
    "sexualOrientation" TEXT,
    "race" TEXT,
    "language" TEXT,
    "interpreterRequired" BOOLEAN NOT NULL DEFAULT false,
    "interpreterLanguageRequired" TEXT,
    "maritalStatus" TEXT,
    "employmentStatus" TEXT,
    "employerName" TEXT,
    "occupation" TEXT,
    "employerPhoneNumber" TEXT,
    "employerStreetAddress" TEXT,
    "employerCity" TEXT,
    "employerState" TEXT,
    "employerZip" TEXT,
    "otherInfo" TEXT,
    "insuranceProviderId" TEXT,
    "policyNumber" TEXT,
    "copay" DECIMAL(10,2),
    "deductible" DECIMAL(10,2),
    "primaryCarePhysician" TEXT,
    "referringPhysicianFirstName" TEXT,
    "referringPhysicianLastName" TEXT,
    "referringPhysicianNpi" TEXT,
    "referringPhysicianPhone" TEXT,
    "referringPhysicianFax" TEXT,
    "referringPhysicianAddress" TEXT,
    "referringPhysicianCity" TEXT,
    "referringPhysicianState" TEXT,
    "referringPhysicianZip" TEXT,
    "profilePhoto" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactNumber" TEXT,
    "emergencyContactRelationship" TEXT,
    "emergencyContactEmail" TEXT,
    "emergencyContactAddress" TEXT,
    "emergencyContactCity" TEXT,
    "emergencyContactState" TEXT,
    "emergencyContactZip" TEXT,
    "secondaryEmergencyContactName" TEXT,
    "secondaryEmergencyContactRelationship" TEXT,
    "secondaryEmergencyContactNumber" TEXT,
    "secondaryEmergencyContactEmail" TEXT,
    "guarantorName" TEXT,
    "guarantorPhone" TEXT,
    "guarantorRelationship" TEXT,
    "guarantorEmail" TEXT,
    "guarantorAddress" TEXT,
    "guarantorCity" TEXT,
    "guarantorState" TEXT,
    "guarantorZip" TEXT,
    "guarantorDateOfBirth" TIMESTAMP(3),
    "authorizedRepresentativeName" TEXT,
    "authorizedRepresentativeRelationship" TEXT,
    "authorizedRepresentativePhone" TEXT,
    "authorizedRepresentativeEmail" TEXT,
    "legalGuardianName" TEXT,
    "legalGuardianRelationship" TEXT,
    "legalGuardianPhone" TEXT,
    "legalGuardianEmail" TEXT,
    "patientIsMinor" BOOLEAN NOT NULL DEFAULT false,
    "primaryNextOfKinName" TEXT,
    "primaryNextOfKinRelationship" TEXT,
    "primaryNextOfKinPhone" TEXT,
    "secondaryNextOfKinName" TEXT,
    "secondaryNextOfKinRelationship" TEXT,
    "secondaryNextOfKinPhone" TEXT,
    "subscriberPhone" TEXT,
    "subscriberSsnLast4" TEXT,
    "subscriberEmployer" TEXT,
    "subscriberAddress" TEXT,
    "subscriberCity" TEXT,
    "subscriberState" TEXT,
    "subscriberZip" TEXT,
    "subscriberEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "npi" TEXT NOT NULL,
    "initials" TEXT,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "gender" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "specialtyId" TEXT,
    "subSpecialtyId" TEXT,
    "departmentId" TEXT,
    "taxonomy" TEXT,
    "email" TEXT,
    "taxId" TEXT,
    "group" TEXT,
    "deaNumber" TEXT,
    "deaEffectiveDate" TIMESTAMP(3),
    "deaExpiryDate" TIMESTAMP(3),
    "stateLicenseNumber" TEXT,
    "stateLicenseEffectiveDate" TIMESTAMP(3),
    "stateLicenseExpiryDate" TIMESTAMP(3),
    "csrLicenseNumber" TEXT,
    "csrExpiryDate" TIMESTAMP(3),
    "mobileNumber" TEXT,
    "degree" TEXT,
    "experience" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "treatment" TEXT,
    "cprsTabEffectiveDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_specialties" (
    "id" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "appointmentDate" DATE NOT NULL,
    "appointmentTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "appointmentType" TEXT NOT NULL,
    "visitReason" TEXT,
    "department" TEXT,
    "provider" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "notes" TEXT,
    "patientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "category" TEXT NOT NULL,
    "procedureCode" TEXT NOT NULL,
    "procedureName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "destination" TEXT NOT NULL DEFAULT 'onsite',
    "site" TEXT,
    "orderedBy" TEXT,
    "orderDateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "hasOnsiteLab" BOOLEAN NOT NULL DEFAULT true,
    "hasOnsitePharmacy" BOOLEAN NOT NULL DEFAULT true,
    "hasOnsiteRadiology" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "departmentCode" TEXT NOT NULL,
    "departmentType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "description" TEXT,
    "facilityName" TEXT,
    "building" TEXT,
    "floor" TEXT,
    "roomNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "supportsAppointments" BOOLEAN NOT NULL DEFAULT false,
    "supportsWalkIns" BOOLEAN NOT NULL DEFAULT false,
    "defaultAppointmentDuration" INTEGER,
    "operatingDays" JSONB,
    "startTime" TEXT,
    "endTime" TEXT,
    "departmentHead" TEXT,
    "assignedProviders" JSONB,
    "assignedNurses" JSONB,
    "defaultBillingProvider" TEXT,
    "costCenter" TEXT,
    "revenueCode" TEXT,
    "acceptsInsurance" BOOLEAN NOT NULL DEFAULT false,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_mrn_key" ON "patients"("mrn");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_providers_name_key" ON "insurance_providers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_providers_code_key" ON "insurance_providers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "providers_npi_key" ON "providers"("npi");

-- CreateIndex
CREATE UNIQUE INDEX "specialties_name_key" ON "specialties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "specialties_code_key" ON "specialties"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sub_specialties_specialtyId_name_key" ON "sub_specialties"("specialtyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "sub_specialties_specialtyId_code_key" ON "sub_specialties"("specialtyId", "code");

-- CreateIndex
CREATE INDEX "orders_patientId_idx" ON "orders"("patientId");

-- CreateIndex
CREATE INDEX "orders_appointmentId_idx" ON "orders"("appointmentId");

-- CreateIndex
CREATE INDEX "orders_category_destination_idx" ON "orders"("category", "destination");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "departments_departmentCode_key" ON "departments"("departmentCode");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_insuranceProviderId_fkey" FOREIGN KEY ("insuranceProviderId") REFERENCES "insurance_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "specialties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_subSpecialtyId_fkey" FOREIGN KEY ("subSpecialtyId") REFERENCES "sub_specialties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_specialties" ADD CONSTRAINT "sub_specialties_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
