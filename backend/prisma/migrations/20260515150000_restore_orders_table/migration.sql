-- AlterTable
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "hasOnsiteLab" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "hasOnsitePharmacy" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "hasOnsiteRadiology" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE IF NOT EXISTS "orders" (
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

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_patientId_idx" ON "orders"("patientId");
CREATE INDEX IF NOT EXISTS "orders_appointmentId_idx" ON "orders"("appointmentId");
CREATE INDEX IF NOT EXISTS "orders_category_destination_idx" ON "orders"("category", "destination");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
