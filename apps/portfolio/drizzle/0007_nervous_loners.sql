CREATE TYPE "public"."media_lifecycle_state" AS ENUM('active', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."media_scan_status" AS ENUM('pending', 'clean', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."media_storage_class" AS ENUM('public', 'private', 'quarantine');--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"object_key" text NOT NULL,
	"original_filename" text NOT NULL,
	"safe_filename" text NOT NULL,
	"declared_media_type" text NOT NULL,
	"detected_media_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"sha256" varchar(64) NOT NULL,
	"storage_class" "media_storage_class" DEFAULT 'quarantine' NOT NULL,
	"scan_status" "media_scan_status" DEFAULT 'pending' NOT NULL,
	"lifecycle_state" "media_lifecycle_state" DEFAULT 'active' NOT NULL,
	"uploaded_by_auth_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "media_assets_sha256_unique" UNIQUE("sha256"),
	CONSTRAINT "media_assets_byte_size_check" CHECK ("media_assets"."byte_size" > 0 and "media_assets"."byte_size" <= 5242880)
);
--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_auth_user_id_auth_users_id_fk" FOREIGN KEY ("uploaded_by_auth_user_id") REFERENCES "public"."auth_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_assets_owner_created_idx" ON "media_assets" USING btree ("uploaded_by_auth_user_id","created_at");