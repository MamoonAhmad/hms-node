/*
  Warnings:

  - You are about to drop the column `insuranceProvider` on the `patients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "patients" DROP COLUMN "insuranceProvider",
ADD COLUMN     "insuranceProviderId" TEXT;

-- CreateTable
CREATE TABLE "insurance_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insurance_providers_name_key" ON "insurance_providers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_providers_code_key" ON "insurance_providers"("code");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_insuranceProviderId_fkey" FOREIGN KEY ("insuranceProviderId") REFERENCES "insurance_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
