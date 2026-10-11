CREATE TABLE "homepage_sections" (
	"key" varchar(32) PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "homepage_sections_sort_order_check" CHECK ("homepage_sections"."sort_order" between 0 and 100)
);
--> statement-breakpoint
CREATE INDEX "homepage_sections_sort_order_idx" ON "homepage_sections" USING btree ("sort_order");
--> statement-breakpoint
INSERT INTO "homepage_sections" ("key", "enabled", "sort_order") VALUES
	('about', true, 0),
	('projects', true, 1),
	('research', true, 2),
	('resume', true, 3),
	('contact', true, 4);
