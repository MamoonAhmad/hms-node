-- Custom Order Sets
CREATE TABLE "custom_order_sets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "category" TEXT,
    "departmentId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'global',
    "status" TEXT NOT NULL DEFAULT 'active',
    "ownerUserId" TEXT,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_order_sets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "custom_order_set_items" (
    "id" TEXT NOT NULL,
    "orderSetId" TEXT NOT NULL,
    "procedureId" TEXT,
    "procedureCode" TEXT,
    "procedureName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_order_set_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_status_history" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "changedBy" TEXT,
    "changedByName" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- Extend orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "mrn" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "encounterId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "orderType" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "siteId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "siteName" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "orderedByUserId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "orderedByUserName" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sourceType" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customOrderSetId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customOrderSetName" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "custom_order_sets_name_idx" ON "custom_order_sets"("name");
CREATE INDEX IF NOT EXISTS "custom_order_sets_status_idx" ON "custom_order_sets"("status");
CREATE INDEX IF NOT EXISTS "custom_order_sets_isDeleted_idx" ON "custom_order_sets"("isDeleted");
CREATE INDEX IF NOT EXISTS "custom_order_sets_departmentId_idx" ON "custom_order_sets"("departmentId");
CREATE INDEX IF NOT EXISTS "custom_order_set_items_orderSetId_idx" ON "custom_order_set_items"("orderSetId");
CREATE INDEX IF NOT EXISTS "custom_order_set_items_procedureId_idx" ON "custom_order_set_items"("procedureId");
CREATE INDEX IF NOT EXISTS "order_status_history_orderId_idx" ON "order_status_history"("orderId");
CREATE INDEX IF NOT EXISTS "orders_isDeleted_idx" ON "orders"("isDeleted");
CREATE INDEX IF NOT EXISTS "orders_customOrderSetId_idx" ON "orders"("customOrderSetId");

ALTER TABLE "custom_order_sets" ADD CONSTRAINT "custom_order_sets_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "custom_order_sets" ADD CONSTRAINT "custom_order_sets_ownerUserId_fkey"
    FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "custom_order_sets" ADD CONSTRAINT "custom_order_sets_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "custom_order_sets" ADD CONSTRAINT "custom_order_sets_updatedBy_fkey"
    FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "custom_order_sets" ADD CONSTRAINT "custom_order_sets_deletedBy_fkey"
    FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "custom_order_set_items" ADD CONSTRAINT "custom_order_set_items_orderSetId_fkey"
    FOREIGN KEY ("orderSetId") REFERENCES "custom_order_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "custom_order_set_items" ADD CONSTRAINT "custom_order_set_items_procedureId_fkey"
    FOREIGN KEY ("procedureId") REFERENCES "procedures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders" ADD CONSTRAINT "orders_customOrderSetId_fkey"
    FOREIGN KEY ("customOrderSetId") REFERENCES "custom_order_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_updatedBy_fkey"
    FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_deletedBy_fkey"
    FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
