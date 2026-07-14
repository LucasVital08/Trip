-- Replace the legacy URL array with first-class, ordered vehicle photos.
CREATE TABLE "VehiclePhoto" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VehiclePhoto_pkey" PRIMARY KEY ("id")
);

INSERT INTO "VehiclePhoto" ("id", "vehicleId", "url", "provider", "storageKey", "position")
SELECT
  md5(random()::text || clock_timestamp()::text || v."id" || p.url),
  v."id",
  p.url,
  'legacy',
  p.url,
  (p.ordinality - 1)::integer
FROM "Vehicle" v
CROSS JOIN LATERAL unnest(v."photos") WITH ORDINALITY AS p(url, ordinality);

ALTER TABLE "Vehicle" DROP COLUMN "photos";

CREATE UNIQUE INDEX "VehiclePhoto_vehicleId_storageKey_key" ON "VehiclePhoto"("vehicleId", "storageKey");
CREATE INDEX "VehiclePhoto_vehicleId_position_idx" ON "VehiclePhoto"("vehicleId", "position");
ALTER TABLE "VehiclePhoto" ADD CONSTRAINT "VehiclePhoto_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
