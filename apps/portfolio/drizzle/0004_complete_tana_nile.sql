ALTER TABLE "github_repositories" ADD COLUMN "readme_markdown" text;--> statement-breakpoint
ALTER TABLE "github_repositories" ADD COLUMN "readme_fetched_at" timestamp with time zone;