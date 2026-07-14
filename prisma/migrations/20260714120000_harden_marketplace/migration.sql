-- Harden booking lifecycle, public share links and provider idempotency.
ALTER TABLE "Booking"
  ADD COLUMN "shareExpiresAt" TIMESTAMP(3),
  ADD COLUMN "shareRevokedAt" TIMESTAMP(3),
  ADD COLUMN "paymentExpiresAt" TIMESTAMP(3),
  ADD COLUMN "activeKey" TEXT;

UPDATE "Booking" b
SET "shareExpiresAt" = t."arriveEstAt" + INTERVAL '24 hours'
FROM "Trip" t
WHERE b."tripId" = t."id" AND b."shareToken" IS NOT NULL;

CREATE UNIQUE INDEX "Booking_activeKey_key" ON "Booking"("activeKey");
CREATE INDEX "Booking_status_paymentExpiresAt_idx" ON "Booking"("status", "paymentExpiresAt");
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");
CREATE UNIQUE INDEX "Vehicle_plate_key" ON "Vehicle"("plate");
