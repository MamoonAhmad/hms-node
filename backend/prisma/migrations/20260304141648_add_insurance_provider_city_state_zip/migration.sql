/*
  Warnings:

  - You are about to drop the column `hasOnsiteLab` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `hasOnsitePharmacy` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `hasOnsiteRadiology` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the `departments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_patientId_fkey";

-- AlterTable
ALTER TABLE "insurance_providers" ADD COLUMN     "city" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zip" TEXT;

-- AlterTable
ALTER TABLE "locations" DROP COLUMN "hasOnsiteLab",
DROP COLUMN "hasOnsitePharmacy",
DROP COLUMN "hasOnsiteRadiology";

-- DropTable
DROP TABLE "departments";

-- DropTable
DROP TABLE "orders";
