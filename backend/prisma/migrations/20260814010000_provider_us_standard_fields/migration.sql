-- AlterTable
ALTER TABLE "providers" ADD COLUMN "npiType" TEXT;
ALTER TABLE "providers" ADD COLUMN "suffix" TEXT;
ALTER TABLE "providers" ADD COLUMN "providerType" TEXT;
ALTER TABLE "providers" ADD COLUMN "licenseState" TEXT;
ALTER TABLE "providers" ADD COLUMN "officePhone" TEXT;
ALTER TABLE "providers" ADD COLUMN "fax" TEXT;
ALTER TABLE "providers" ADD COLUMN "addressLine2" TEXT;
ALTER TABLE "providers" ADD COLUMN "zipPlus4" TEXT;
ALTER TABLE "providers" ADD COLUMN "taxIdType" TEXT;
ALTER TABLE "providers" ADD COLUMN "groupNpi" TEXT;
ALTER TABLE "providers" ADD COLUMN "medicarePtan" TEXT;
ALTER TABLE "providers" ADD COLUMN "medicaidId" TEXT;
ALTER TABLE "providers" ADD COLUMN "caqhId" TEXT;
