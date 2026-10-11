CREATE TYPE "public"."ai_draft_status" AS ENUM('requested', 'generated', 'reviewed', 'rejected', 'applied', 'failed');--> statement-breakpoint
CREATE TABLE "ai_consent_documents" (
	"consent_id" uuid NOT NULL,
	"private_document_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_consent_documents_consent_id_private_document_id_pk" PRIMARY KEY("consent_id","private_document_id")
);
--> statement-breakpoint
CREATE TABLE "ai_draft_sources" (
	"draft_id" uuid NOT NULL,
	"private_document_id" uuid NOT NULL,
	"locator" varchar(240) NOT NULL,
	"support_classification" varchar(32) NOT NULL,
	CONSTRAINT "ai_draft_sources_draft_id_private_document_id_locator_pk" PRIMARY KEY("draft_id","private_document_id","locator")
);
--> statement-breakpoint
CREATE TABLE "ai_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_auth_user_id" text NOT NULL,
	"consent_id" uuid NOT NULL,
	"target_type" varchar(64) NOT NULL,
	"target_id" text,
	"prompt_summary" varchar(500) NOT NULL,
	"provider" varchar(64) NOT NULL,
	"model" varchar(128) NOT NULL,
	"status" "ai_draft_status" DEFAULT 'requested' NOT NULL,
	"proposal" jsonb,
	"input_tokens" integer,
	"output_tokens" integer,
	"cost_micros" bigint,
	"error_code" varchar(64),
	"retention_expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_processing_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_auth_user_id" text NOT NULL,
	"purpose" varchar(240) NOT NULL,
	"scope" varchar(64) DEFAULT 'portfolio_drafting' NOT NULL,
	"provider_policy_version" varchar(64) NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_consent_documents" ADD CONSTRAINT "ai_consent_documents_consent_id_ai_processing_consents_id_fk" FOREIGN KEY ("consent_id") REFERENCES "public"."ai_processing_consents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_consent_documents" ADD CONSTRAINT "ai_consent_documents_private_document_id_private_documents_id_fk" FOREIGN KEY ("private_document_id") REFERENCES "public"."private_documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_draft_sources" ADD CONSTRAINT "ai_draft_sources_draft_id_ai_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."ai_drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_draft_sources" ADD CONSTRAINT "ai_draft_sources_private_document_id_private_documents_id_fk" FOREIGN KEY ("private_document_id") REFERENCES "public"."private_documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_admin_auth_user_id_auth_users_id_fk" FOREIGN KEY ("admin_auth_user_id") REFERENCES "public"."auth_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_consent_id_ai_processing_consents_id_fk" FOREIGN KEY ("consent_id") REFERENCES "public"."ai_processing_consents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_processing_consents" ADD CONSTRAINT "ai_processing_consents_admin_auth_user_id_auth_users_id_fk" FOREIGN KEY ("admin_auth_user_id") REFERENCES "public"."auth_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_drafts_admin_created_idx" ON "ai_drafts" USING btree ("admin_auth_user_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_drafts_retention_idx" ON "ai_drafts" USING btree ("retention_expires_at");--> statement-breakpoint
CREATE INDEX "ai_consents_admin_created_idx" ON "ai_processing_consents" USING btree ("admin_auth_user_id","created_at");