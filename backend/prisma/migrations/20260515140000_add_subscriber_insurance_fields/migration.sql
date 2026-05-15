-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "subscriberPhone" TEXT,
ADD COLUMN     "subscriberSsnLast4" TEXT,
ADD COLUMN     "subscriberEmployer" TEXT,
ADD COLUMN     "subscriberAddress" TEXT,
ADD COLUMN     "subscriberCity" TEXT,
ADD COLUMN     "subscriberState" TEXT,
ADD COLUMN     "subscriberZip" TEXT,
ADD COLUMN     "subscriberEmail" TEXT;
