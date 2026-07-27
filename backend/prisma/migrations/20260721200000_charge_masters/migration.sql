-- CreateTable
CREATE TABLE "charge_masters" (
    "id" TEXT NOT NULL,
    "cptCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "revenueCode" TEXT NOT NULL,
    "priceEffectiveDate" DATE NOT NULL,
    "cptEffectiveDate" DATE,
    "standardAmount" DECIMAL(12,2) NOT NULL,
    "totalRevenue" DECIMAL(14,2),
    "totalVolume" DECIMAL(12,2),
    "percentageIncreased" DECIMAL(8,2) DEFAULT 0,
    "category" TEXT,
    "genericDepartment" TEXT,
    "discountPercent" DECIMAL(8,2) DEFAULT 0,
    "location" TEXT NOT NULL,
    "payer" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charge_masters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "charge_masters_cptCode_idx" ON "charge_masters"("cptCode");

-- CreateIndex
CREATE INDEX "charge_masters_revenueCode_idx" ON "charge_masters"("revenueCode");

-- CreateIndex
CREATE INDEX "charge_masters_location_idx" ON "charge_masters"("location");

-- CreateIndex
CREATE INDEX "charge_masters_category_idx" ON "charge_masters"("category");

-- CreateIndex
CREATE INDEX "charge_masters_payer_idx" ON "charge_masters"("payer");

-- CreateIndex
CREATE INDEX "charge_masters_genericDepartment_idx" ON "charge_masters"("genericDepartment");

-- CreateIndex
CREATE INDEX "charge_masters_isActive_idx" ON "charge_masters"("isActive");

-- CreateIndex
CREATE INDEX "charge_masters_deletedAt_idx" ON "charge_masters"("deletedAt");

-- AddForeignKey
ALTER TABLE "charge_masters" ADD CONSTRAINT "charge_masters_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_masters" ADD CONSTRAINT "charge_masters_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_masters" ADD CONSTRAINT "charge_masters_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
