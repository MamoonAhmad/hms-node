-- Hospital rooms and beds (bed records support bed counts and room delete cascade)

CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "displayName" TEXT,
    "floor" TEXT,
    "unit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "licensedBeds" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rooms_roomNumber_not_deleted_key"
  ON "rooms"("roomNumber")
  WHERE "deletedAt" IS NULL;

CREATE INDEX "rooms_roomNumber_idx" ON "rooms"("roomNumber");
CREATE INDEX "rooms_status_idx" ON "rooms"("status");
CREATE INDEX "rooms_deletedAt_idx" ON "rooms"("deletedAt");

ALTER TABLE "rooms"
  ADD CONSTRAINT "rooms_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "rooms"
  ADD CONSTRAINT "rooms_updatedBy_fkey"
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "rooms"
  ADD CONSTRAINT "rooms_deletedBy_fkey"
  FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "room_type_on_room" (
    "roomId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,

    CONSTRAINT "room_type_on_room_pkey" PRIMARY KEY ("roomId", "roomTypeId")
);

ALTER TABLE "room_type_on_room"
  ADD CONSTRAINT "room_type_on_room_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "room_type_on_room"
  ADD CONSTRAINT "room_type_on_room_roomTypeId_fkey"
  FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "beds" (
    "id" TEXT NOT NULL,
    "bedLabel" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "patientName" TEXT,
    "service" TEXT,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beds_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "beds_roomId_idx" ON "beds"("roomId");
CREATE INDEX "beds_status_idx" ON "beds"("status");
CREATE INDEX "beds_deletedAt_idx" ON "beds"("deletedAt");

ALTER TABLE "beds"
  ADD CONSTRAINT "beds_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
