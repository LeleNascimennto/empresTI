-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "membership_role" AS ENUM ('ADMIN', 'COLLABORATOR');

-- CreateEnum
CREATE TYPE "equipment_condition" AS ENUM ('AVAILABLE', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "membership_role" NOT NULL DEFAULT 'COLLABORATOR',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("tenant_id","user_id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "asset_tag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "condition_status" "equipment_condition" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "borrower_user_id" UUID NOT NULL,
    "checked_out_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMPTZ(6) NOT NULL,
    "returned_at" TIMESTAMPTZ(6),

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_tenant_id_id_key" ON "equipment"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_tenant_id_asset_tag_key" ON "equipment"("tenant_id", "asset_tag");

-- CreateIndex
CREATE INDEX "loans_tenant_id_borrower_user_id_returned_at_idx" ON "loans"("tenant_id", "borrower_user_id", "returned_at");

-- CreateIndex
CREATE INDEX "loans_tenant_id_due_at_idx" ON "loans"("tenant_id", "due_at");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve tenant consistency across related records.
ALTER TABLE "loans"
  ADD CONSTRAINT "loans_equipment_same_tenant_fkey"
  FOREIGN KEY ("tenant_id", "equipment_id")
  REFERENCES "equipment" ("tenant_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "loans"
  ADD CONSTRAINT "loans_borrower_same_tenant_fkey"
  FOREIGN KEY ("tenant_id", "borrower_user_id")
  REFERENCES "memberships" ("tenant_id", "user_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_actor_same_tenant_fkey"
  FOREIGN KEY ("tenant_id", "actor_user_id")
  REFERENCES "memberships" ("tenant_id", "user_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "loans"
  ADD CONSTRAINT "loans_return_not_before_checkout"
  CHECK ("returned_at" IS NULL OR "returned_at" >= "checked_out_at");

CREATE UNIQUE INDEX "loans_one_open_per_equipment"
  ON "loans" ("tenant_id", "equipment_id")
  WHERE "returned_at" IS NULL;

CREATE INDEX "loans_open_by_borrower"
  ON "loans" ("tenant_id", "borrower_user_id")
  WHERE "returned_at" IS NULL;

-- Runtime connections must use a non-owner role without BYPASSRLS.
-- Set app.user_id and app.tenant_id transaction-locally from the verified request context.
CREATE SCHEMA IF NOT EXISTS "app";

CREATE FUNCTION app.is_tenant_admin(target_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships AS m
    WHERE m.tenant_id = target_tenant_id
      AND m.user_id =
        NULLIF(current_setting('app.user_id', true), '')::uuid
      AND m.role = 'ADMIN'
  )
$function$;

ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenants" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_scope" ON "tenants"
  FOR SELECT
  USING (
    "id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );

ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" FORCE ROW LEVEL SECURITY;
CREATE POLICY "membership_read_self_or_tenant" ON "memberships"
  FOR SELECT
  USING (
    "user_id" = NULLIF(current_setting('app.user_id', true), '')::uuid
    OR "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );
CREATE POLICY "membership_create_self" ON "memberships"
  FOR INSERT
  WITH CHECK (
    "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND "user_id" = NULLIF(current_setting('app.user_id', true), '')::uuid
    AND "role" = 'COLLABORATOR'
  );
CREATE POLICY "membership_admin_update" ON "memberships"
  FOR UPDATE
  USING (
    "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND app.is_tenant_admin("tenant_id")
  )
  WITH CHECK (
    "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND app.is_tenant_admin("tenant_id")
  );

ALTER TABLE "equipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "equipment" FORCE ROW LEVEL SECURITY;
CREATE POLICY "equipment_read_tenant" ON "equipment"
  FOR SELECT
  USING (
    "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );
CREATE POLICY "equipment_insert_tenant" ON "equipment"
  FOR INSERT
  WITH CHECK (
    "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );
CREATE POLICY "equipment_update_tenant" ON "equipment"
  FOR UPDATE
  USING (
    "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  )
  WITH CHECK (
    "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );

ALTER TABLE "loans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "loans" FORCE ROW LEVEL SECURITY;
CREATE POLICY "loans_read_tenant" ON "loans"
  FOR SELECT
  USING (
    "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );
CREATE POLICY "loans_insert_tenant" ON "loans"
  FOR INSERT
  WITH CHECK (
    "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );
CREATE POLICY "loans_update_tenant" ON "loans"
  FOR UPDATE
  USING (
    "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  )
  WITH CHECK (
    "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );

ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;
CREATE POLICY "audit_read_tenant" ON "audit_logs"
  FOR SELECT
  USING (
    "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );
CREATE POLICY "audit_insert_tenant" ON "audit_logs"
  FOR INSERT
  WITH CHECK (
    "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND "actor_user_id" = NULLIF(current_setting('app.user_id', true), '')::uuid
  );

CREATE FUNCTION app.reject_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END
$function$;

CREATE TRIGGER "audit_logs_append_only"
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW
  EXECUTE FUNCTION app.reject_audit_log_mutation();
