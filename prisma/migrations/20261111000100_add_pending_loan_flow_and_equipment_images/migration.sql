-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "image_license" TEXT,
ADD COLUMN     "image_photographer" TEXT,
ADD COLUMN     "image_provider_photo_id" TEXT,
ADD COLUMN     "image_source_url" TEXT,
ADD COLUMN     "image_url" TEXT;

-- AlterTable
ALTER TABLE "loans" ADD COLUMN     "cancelled_at" TIMESTAMPTZ(6),
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expired_at" TIMESTAMPTZ(6),
ADD COLUMN     "expires_at" TIMESTAMPTZ(6),
ALTER COLUMN "checked_out_at" DROP NOT NULL,
ALTER COLUMN "checked_out_at" DROP DEFAULT,
ALTER COLUMN "due_at" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "equipment_image_provider_photo_id_key" ON "equipment"("image_provider_photo_id");

-- Preserve the closest known historical timestamp for existing loans.
UPDATE "loans"
SET "created_at" = "checked_out_at";

-- A loan is either pending pickup, active, cancelled, expired, or returned.
ALTER TABLE "loans"
  ADD CONSTRAINT "loans_valid_state_check"
  CHECK (
    (
      "checked_out_at" IS NULL
      AND "due_at" IS NULL
      AND "returned_at" IS NULL
      AND "cancelled_at" IS NULL
      AND "expired_at" IS NULL
      AND "expires_at" IS NOT NULL
    )
    OR (
      "checked_out_at" IS NOT NULL
      AND "due_at" IS NOT NULL
      AND "returned_at" IS NULL
      AND "cancelled_at" IS NULL
      AND "expired_at" IS NULL
    )
    OR (
      "checked_out_at" IS NULL
      AND "due_at" IS NULL
      AND "returned_at" IS NULL
      AND "cancelled_at" IS NOT NULL
      AND "expired_at" IS NULL
      AND "expires_at" IS NOT NULL
    )
    OR (
      "checked_out_at" IS NULL
      AND "due_at" IS NULL
      AND "returned_at" IS NULL
      AND "cancelled_at" IS NULL
      AND "expired_at" IS NOT NULL
      AND "expires_at" IS NOT NULL
    )
    OR (
      "checked_out_at" IS NOT NULL
      AND "due_at" IS NOT NULL
      AND "returned_at" IS NOT NULL
      AND "cancelled_at" IS NULL
      AND "expired_at" IS NULL
    )
  );

-- Pending pickup and active loans both reserve an equipment item.
DROP INDEX "loans_one_open_per_equipment";
CREATE UNIQUE INDEX "loans_one_open_per_equipment"
  ON "loans" ("tenant_id", "equipment_id")
  WHERE "returned_at" IS NULL
    AND "cancelled_at" IS NULL
    AND "expired_at" IS NULL;

DROP INDEX "loans_open_by_borrower";
CREATE INDEX "loans_open_by_borrower"
  ON "loans" ("tenant_id", "borrower_user_id")
  WHERE "returned_at" IS NULL
    AND "cancelled_at" IS NULL
    AND "expired_at" IS NULL;
