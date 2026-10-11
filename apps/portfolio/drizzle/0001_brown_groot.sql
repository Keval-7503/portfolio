ALTER TABLE "github_accounts" ADD COLUMN "sync_lease_owner" text;--> statement-breakpoint
ALTER TABLE "github_accounts" ADD COLUMN "sync_lease_expires_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "github_accounts_sync_lease_idx" ON "github_accounts" USING btree ("sync_lease_expires_at");