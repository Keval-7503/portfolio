CREATE TYPE "public"."document_retention_state" AS ENUM('active', 'pending_delete', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."extraction_status" AS ENUM('not_requested', 'pending', 'complete', 'failed');--> statement-breakpoint
CREATE TYPE "public"."private_document_type" AS ENUM('transcript', 'reference', 'other');--> statement-breakpoint
CREATE TYPE "public"."processing_permission_state" AS ENUM('denied', 'allowed', 'withdrawn');--> statement-breakpoint
CREATE TABLE "private_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"document_type" "private_document_type" DEFAULT 'other' NOT NULL,
	"owner_label" text NOT NULL,
	"processing_permission" "processing_permission_state" DEFAULT 'denied' NOT NULL,
	"retention_state" "document_retention_state" DEFAULT 'active' NOT NULL,
	"extraction_status" "extraction_status" DEFAULT 'not_requested' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "private_documents_media_asset_id_unique" UNIQUE("media_asset_id")
);
--> statement-breakpoint
CREATE TABLE "resume_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"label" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"safe_filename" text NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resume_versions_media_asset_id_unique" UNIQUE("media_asset_id")
);
--> statement-breakpoint
ALTER TABLE "private_documents" ADD CONSTRAINT "private_documents_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "private_documents_retention_idx" ON "private_documents" USING btree ("retention_state","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "resume_versions_single_current_public_uidx" ON "resume_versions" USING btree ("is_current") WHERE "resume_versions"."is_current" = true and "resume_versions"."is_public" = true;--> statement-breakpoint
CREATE INDEX "resume_versions_created_idx" ON "resume_versions" USING btree ("created_at");