CREATE TYPE "public"."github_sync_status" AS ENUM('running', 'succeeded', 'not_modified', 'failed');--> statement-breakpoint
CREATE TYPE "public"."github_sync_trigger" AS ENUM('manual', 'scheduled', 'bootstrap');--> statement-breakpoint
CREATE TYPE "public"."publication_state" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."repository_availability" AS ENUM('public', 'missing');--> statement-breakpoint
CREATE TYPE "public"."visibility_override" AS ENUM('inherit', 'force_hidden', 'force_visible');--> statement-breakpoint
CREATE TABLE "github_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_account_id" bigint NOT NULL,
	"username" varchar(39) NOT NULL,
	"profile_url" text NOT NULL,
	"display_name" text,
	"headline" text,
	"location" text,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sync_enabled" boolean DEFAULT true NOT NULL,
	"collection_etag" text,
	"last_verified_at" timestamp with time zone,
	"last_successful_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "github_accounts_github_account_id_unique" UNIQUE("github_account_id")
);
--> statement-breakpoint
CREATE TABLE "github_repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"github_id" bigint NOT NULL,
	"owner_github_id" bigint NOT NULL,
	"owner_login" varchar(39) NOT NULL,
	"name" text NOT NULL,
	"full_name" text NOT NULL,
	"html_url" text NOT NULL,
	"api_url" text NOT NULL,
	"description" text,
	"homepage_url" text,
	"primary_language" text,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"license_spdx_id" text,
	"stars" integer DEFAULT 0 NOT NULL,
	"forks" integer DEFAULT 0 NOT NULL,
	"open_issues" integer DEFAULT 0 NOT NULL,
	"default_branch" text NOT NULL,
	"is_fork" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_disabled" boolean DEFAULT false NOT NULL,
	"visibility" text NOT NULL,
	"availability" "repository_availability" DEFAULT 'public' NOT NULL,
	"github_created_at" timestamp with time zone NOT NULL,
	"github_updated_at" timestamp with time zone NOT NULL,
	"github_pushed_at" timestamp with time zone,
	"first_observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_complete_sync_id" uuid,
	"consecutive_miss_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "github_repositories_github_id_unique" UNIQUE("github_id"),
	CONSTRAINT "github_repositories_nonnegative_counts_check" CHECK ("github_repositories"."stars" >= 0 and "github_repositories"."forks" >= 0 and "github_repositories"."open_issues" >= 0 and "github_repositories"."consecutive_miss_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "github_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"trigger" "github_sync_trigger" NOT NULL,
	"status" "github_sync_status" DEFAULT 'running' NOT NULL,
	"correlation_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"pages_observed" integer DEFAULT 0 NOT NULL,
	"items_observed" integer DEFAULT 0 NOT NULL,
	"created_count" integer DEFAULT 0 NOT NULL,
	"updated_count" integer DEFAULT 0 NOT NULL,
	"missing_count" integer DEFAULT 0 NOT NULL,
	"complete_snapshot" boolean DEFAULT false NOT NULL,
	"response_etag" text,
	"rate_limit_remaining" integer,
	"rate_limit_reset_at" timestamp with time zone,
	"lease_owner" text,
	"lease_expires_at" timestamp with time zone,
	"error_code" varchar(64),
	"error_message" text,
	CONSTRAINT "github_sync_runs_correlation_id_unique" UNIQUE("correlation_id"),
	CONSTRAINT "github_sync_runs_nonnegative_counts_check" CHECK ("github_sync_runs"."pages_observed" >= 0 and "github_sync_runs"."items_observed" >= 0 and "github_sync_runs"."created_count" >= 0 and "github_sync_runs"."updated_count" >= 0 and "github_sync_runs"."missing_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "project_slug_redirects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"old_slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_slug_redirects_old_slug_unique" UNIQUE("old_slug")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_repository_id" uuid,
	"slug" text NOT NULL,
	"custom_title" text,
	"summary_markdown" text,
	"body_markdown" text,
	"category" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"publication_state" "publication_state" DEFAULT 'published' NOT NULL,
	"visibility_override" "visibility_override" DEFAULT 'inherit' NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_github_repository_id_unique" UNIQUE("github_repository_id"),
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "github_repositories" ADD CONSTRAINT "github_repositories_account_id_github_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."github_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_repositories" ADD CONSTRAINT "github_repositories_last_complete_sync_id_github_sync_runs_id_fk" FOREIGN KEY ("last_complete_sync_id") REFERENCES "public"."github_sync_runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_sync_runs" ADD CONSTRAINT "github_sync_runs_account_id_github_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."github_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_slug_redirects" ADD CONSTRAINT "project_slug_redirects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_github_repository_id_github_repositories_id_fk" FOREIGN KEY ("github_repository_id") REFERENCES "public"."github_repositories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "github_accounts_username_lower_uidx" ON "github_accounts" USING btree (lower("username"));--> statement-breakpoint
CREATE UNIQUE INDEX "github_accounts_single_active_uidx" ON "github_accounts" USING btree ("is_active") WHERE "github_accounts"."is_active" = true;--> statement-breakpoint
CREATE INDEX "github_repositories_account_availability_idx" ON "github_repositories" USING btree ("account_id","availability");--> statement-breakpoint
CREATE INDEX "github_sync_runs_account_started_idx" ON "github_sync_runs" USING btree ("account_id","started_at");--> statement-breakpoint
CREATE INDEX "project_slug_redirects_project_idx" ON "project_slug_redirects" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "projects_public_order_idx" ON "projects" USING btree ("publication_state","sort_order");