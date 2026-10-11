CREATE TYPE "public"."contact_message_status" AS ENUM('new', 'read', 'archived');--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(254) NOT NULL,
	"subject" varchar(160) NOT NULL,
	"body" text NOT NULL,
	"status" "contact_message_status" DEFAULT 'new' NOT NULL,
	"ip_hash" varchar(64) NOT NULL,
	"user_agent_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_messages_body_length_check" CHECK (length("contact_messages"."body") between 10 and 5000)
);
--> statement-breakpoint
CREATE INDEX "contact_messages_status_created_idx" ON "contact_messages" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "contact_messages_ip_created_idx" ON "contact_messages" USING btree ("ip_hash","created_at");