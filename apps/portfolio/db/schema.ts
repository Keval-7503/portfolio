import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const githubSyncTrigger = pgEnum("github_sync_trigger", [
  "manual",
  "scheduled",
  "bootstrap",
]);
export const githubSyncStatus = pgEnum("github_sync_status", [
  "running",
  "succeeded",
  "not_modified",
  "failed",
]);
export const repositoryAvailability = pgEnum("repository_availability", ["public", "missing"]);
export const publicationState = pgEnum("publication_state", ["draft", "published", "archived"]);
export const visibilityOverride = pgEnum("visibility_override", [
  "inherit",
  "force_hidden",
  "force_visible",
]);
export const adminStatus = pgEnum("admin_status", ["active", "disabled"]);
export const mediaStorageClass = pgEnum("media_storage_class", ["public", "private", "quarantine"]);
export const mediaScanStatus = pgEnum("media_scan_status", ["pending", "clean", "rejected"]);
export const mediaLifecycleState = pgEnum("media_lifecycle_state", ["active", "deleted"]);
export const privateDocumentType = pgEnum("private_document_type", [
  "transcript",
  "reference",
  "other",
]);
export const processingPermissionState = pgEnum("processing_permission_state", [
  "denied",
  "allowed",
  "withdrawn",
]);
export const documentRetentionState = pgEnum("document_retention_state", [
  "active",
  "pending_delete",
  "deleted",
]);
export const extractionStatus = pgEnum("extraction_status", [
  "not_requested",
  "pending",
  "complete",
  "failed",
]);
export const contactMessageStatus = pgEnum("contact_message_status", ["new", "read", "archived"]);
export const aiDraftStatus = pgEnum("ai_draft_status", [
  "requested",
  "generated",
  "reviewed",
  "rejected",
  "applied",
  "failed",
]);

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    subject: varchar("subject", { length: 160 }).notNull(),
    body: text("body").notNull(),
    status: contactMessageStatus("status").notNull().default("new"),
    ipHash: varchar("ip_hash", { length: 64 }).notNull(),
    userAgentHash: varchar("user_agent_hash", { length: 64 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("contact_messages_status_created_idx").on(table.status, table.createdAt),
    index("contact_messages_ip_created_idx").on(table.ipHash, table.createdAt),
    check("contact_messages_body_length_check", sql`length(${table.body}) between 10 and 5000`),
  ],
);

export const homepageSections = pgTable(
  "homepage_sections",
  {
    key: varchar("key", { length: 32 }).primaryKey(),
    enabled: boolean("enabled").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    configuration: jsonb("configuration").$type<Record<string, unknown>>().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    index("homepage_sections_sort_order_idx").on(table.sortOrder),
    check("homepage_sections_sort_order_check", sql`${table.sortOrder} between 0 and 100`),
  ],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    objectKey: text("object_key").notNull().unique(),
    originalFilename: text("original_filename").notNull(),
    safeFilename: text("safe_filename").notNull(),
    declaredMediaType: text("declared_media_type").notNull(),
    detectedMediaType: text("detected_media_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    sha256: varchar("sha256", { length: 64 }).notNull().unique(),
    storageClass: mediaStorageClass("storage_class").notNull().default("quarantine"),
    scanStatus: mediaScanStatus("scan_status").notNull().default("pending"),
    lifecycleState: mediaLifecycleState("lifecycle_state").notNull().default("active"),
    uploadedByAuthUserId: text("uploaded_by_auth_user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (table) => [
    index("media_assets_owner_created_idx").on(table.uploadedByAuthUserId, table.createdAt),
    check(
      "media_assets_byte_size_check",
      sql`${table.byteSize} > 0 and ${table.byteSize} <= 5242880`,
    ),
  ],
);

export const resumeVersions = pgTable(
  "resume_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mediaAssetId: uuid("media_asset_id")
      .notNull()
      .unique()
      .references(() => mediaAssets.id, { onDelete: "restrict" }),
    label: text("label").notNull(),
    category: text("category").notNull().default("general"),
    isPublic: boolean("is_public").notNull().default(false),
    isCurrent: boolean("is_current").notNull().default(false),
    safeFilename: text("safe_filename").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("resume_versions_single_current_public_uidx")
      .on(table.isCurrent)
      .where(sql`${table.isCurrent} = true and ${table.isPublic} = true`),
    index("resume_versions_created_idx").on(table.createdAt),
  ],
);

export const privateDocuments = pgTable(
  "private_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mediaAssetId: uuid("media_asset_id")
      .notNull()
      .unique()
      .references(() => mediaAssets.id, { onDelete: "restrict" }),
    documentType: privateDocumentType("document_type").notNull().default("other"),
    ownerLabel: text("owner_label").notNull(),
    processingPermission: processingPermissionState("processing_permission")
      .notNull()
      .default("denied"),
    retentionState: documentRetentionState("retention_state").notNull().default("active"),
    extractionStatus: extractionStatus("extraction_status").notNull().default("not_requested"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("private_documents_retention_idx").on(table.retentionState, table.createdAt)],
);

export const aiProcessingConsents = pgTable(
  "ai_processing_consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminAuthUserId: text("admin_auth_user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    purpose: varchar("purpose", { length: 240 }).notNull(),
    scope: varchar("scope", { length: 64 }).notNull().default("portfolio_drafting"),
    providerPolicyVersion: varchar("provider_policy_version", { length: 64 }).notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index("ai_consents_admin_created_idx").on(table.adminAuthUserId, table.createdAt)],
);

export const aiConsentDocuments = pgTable(
  "ai_consent_documents",
  {
    consentId: uuid("consent_id")
      .notNull()
      .references(() => aiProcessingConsents.id, { onDelete: "cascade" }),
    privateDocumentId: uuid("private_document_id")
      .notNull()
      .references(() => privateDocuments.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.consentId, table.privateDocumentId] })],
);

export type AiDraftProposal = {
  summary: string;
  claims: Array<{ text: string; citations: string[] }>;
  unsupportedClaims: string[];
};

export const aiDrafts = pgTable(
  "ai_drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminAuthUserId: text("admin_auth_user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    consentId: uuid("consent_id")
      .notNull()
      .references(() => aiProcessingConsents.id, { onDelete: "restrict" }),
    targetType: varchar("target_type", { length: 64 }).notNull(),
    targetId: text("target_id"),
    promptSummary: varchar("prompt_summary", { length: 500 }).notNull(),
    provider: varchar("provider", { length: 64 }).notNull(),
    model: varchar("model", { length: 128 }).notNull(),
    status: aiDraftStatus("status").notNull().default("requested"),
    proposal: jsonb("proposal").$type<AiDraftProposal>(),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    costMicros: bigint("cost_micros", { mode: "number" }),
    errorCode: varchar("error_code", { length: 64 }),
    retentionExpiresAt: timestamp("retention_expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("ai_drafts_admin_created_idx").on(table.adminAuthUserId, table.createdAt),
    index("ai_drafts_retention_idx").on(table.retentionExpiresAt),
  ],
);

export const aiDraftSources = pgTable(
  "ai_draft_sources",
  {
    draftId: uuid("draft_id")
      .notNull()
      .references(() => aiDrafts.id, { onDelete: "cascade" }),
    privateDocumentId: uuid("private_document_id")
      .notNull()
      .references(() => privateDocuments.id, { onDelete: "restrict" }),
    locator: varchar("locator", { length: 240 }).notNull(),
    supportClassification: varchar("support_classification", { length: 32 }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.draftId, table.privateDocumentId, table.locator] })],
);

export const authUsers = pgTable(
  "auth_users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex("auth_users_email_lower_uidx").on(sql`lower(${table.email})`)],
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (table) => [index("auth_sessions_user_idx").on(table.userId)],
);

export const authAccounts = pgTable(
  "auth_accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (table) => [
    index("auth_accounts_user_idx").on(table.userId),
    uniqueIndex("auth_accounts_provider_account_uidx").on(table.providerId, table.accountId),
  ],
);

export const authVerifications = pgTable(
  "auth_verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index("auth_verifications_identifier_idx").on(table.identifier)],
);

export const authTwoFactors = pgTable(
  "auth_two_factors",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    verified: boolean("verified").notNull().default(true),
    failedVerificationCount: integer("failed_verification_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
  },
  (table) => [index("auth_two_factors_user_idx").on(table.userId)],
);

export const authRateLimits = pgTable("auth_rate_limits", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authUserId: text("auth_user_id")
      .notNull()
      .unique()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    email: text("email").notNull(),
    status: adminStatus("status").notNull().default("active"),
    mfaRequired: boolean("mfa_required").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("admin_users_email_lower_uidx").on(sql`lower(${table.email})`),
    uniqueIndex("admin_users_single_active_uidx")
      .on(table.status)
      .where(sql`${table.status} = 'active'`),
  ],
);

export const githubAccounts = pgTable(
  "github_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    githubAccountId: bigint("github_account_id", { mode: "number" }).notNull().unique(),
    username: varchar("username", { length: 39 }).notNull(),
    profileUrl: text("profile_url").notNull(),
    displayName: text("display_name"),
    headline: text("headline"),
    location: text("location"),
    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").notNull().default(true),
    syncEnabled: boolean("sync_enabled").notNull().default(true),
    collectionEtag: text("collection_etag"),
    syncLeaseOwner: text("sync_lease_owner"),
    syncLeaseExpiresAt: timestamp("sync_lease_expires_at", { withTimezone: true }),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    lastSuccessfulSyncAt: timestamp("last_successful_sync_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("github_accounts_username_lower_uidx").on(sql`lower(${table.username})`),
    uniqueIndex("github_accounts_single_active_uidx")
      .on(table.isActive)
      .where(sql`${table.isActive} = true`),
    index("github_accounts_sync_lease_idx").on(table.syncLeaseExpiresAt),
  ],
);

export const githubSyncRuns = pgTable(
  "github_sync_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => githubAccounts.id, { onDelete: "restrict" }),
    trigger: githubSyncTrigger("trigger").notNull(),
    status: githubSyncStatus("status").notNull().default("running"),
    correlationId: uuid("correlation_id").notNull().unique(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    pagesObserved: integer("pages_observed").notNull().default(0),
    itemsObserved: integer("items_observed").notNull().default(0),
    createdCount: integer("created_count").notNull().default(0),
    updatedCount: integer("updated_count").notNull().default(0),
    missingCount: integer("missing_count").notNull().default(0),
    completeSnapshot: boolean("complete_snapshot").notNull().default(false),
    responseEtag: text("response_etag"),
    rateLimitRemaining: integer("rate_limit_remaining"),
    rateLimitResetAt: timestamp("rate_limit_reset_at", { withTimezone: true }),
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    errorCode: varchar("error_code", { length: 64 }),
    errorMessage: text("error_message"),
  },
  (table) => [
    index("github_sync_runs_account_started_idx").on(table.accountId, table.startedAt),
    check(
      "github_sync_runs_nonnegative_counts_check",
      sql`${table.pagesObserved} >= 0 and ${table.itemsObserved} >= 0 and ${table.createdCount} >= 0 and ${table.updatedCount} >= 0 and ${table.missingCount} >= 0`,
    ),
  ],
);

export const githubRepositories = pgTable(
  "github_repositories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => githubAccounts.id, { onDelete: "restrict" }),
    githubId: bigint("github_id", { mode: "number" }).notNull().unique(),
    ownerGithubId: bigint("owner_github_id", { mode: "number" }).notNull(),
    ownerLogin: varchar("owner_login", { length: 39 }).notNull(),
    name: text("name").notNull(),
    fullName: text("full_name").notNull(),
    htmlUrl: text("html_url").notNull(),
    apiUrl: text("api_url").notNull(),
    description: text("description"),
    homepageUrl: text("homepage_url"),
    primaryLanguage: text("primary_language"),
    topics: jsonb("topics").$type<string[]>().notNull().default([]),
    licenseSpdxId: text("license_spdx_id"),
    stars: integer("stars").notNull().default(0),
    forks: integer("forks").notNull().default(0),
    openIssues: integer("open_issues").notNull().default(0),
    defaultBranch: text("default_branch").notNull(),
    readmeMarkdown: text("readme_markdown"),
    readmeFetchedAt: timestamp("readme_fetched_at", { withTimezone: true }),
    isFork: boolean("is_fork").notNull().default(false),
    isArchived: boolean("is_archived").notNull().default(false),
    isDisabled: boolean("is_disabled").notNull().default(false),
    visibility: text("visibility").notNull(),
    availability: repositoryAvailability("availability").notNull().default("public"),
    githubCreatedAt: timestamp("github_created_at", { withTimezone: true }).notNull(),
    githubUpdatedAt: timestamp("github_updated_at", { withTimezone: true }).notNull(),
    githubPushedAt: timestamp("github_pushed_at", { withTimezone: true }),
    firstObservedAt: timestamp("first_observed_at", { withTimezone: true }).notNull().defaultNow(),
    lastObservedAt: timestamp("last_observed_at", { withTimezone: true }).notNull().defaultNow(),
    lastCompleteSyncId: uuid("last_complete_sync_id").references(() => githubSyncRuns.id, {
      onDelete: "restrict",
    }),
    consecutiveMissCount: integer("consecutive_miss_count").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("github_repositories_account_availability_idx").on(table.accountId, table.availability),
    check(
      "github_repositories_nonnegative_counts_check",
      sql`${table.stars} >= 0 and ${table.forks} >= 0 and ${table.openIssues} >= 0 and ${table.consecutiveMissCount} >= 0`,
    ),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    githubRepositoryId: uuid("github_repository_id")
      .unique()
      .references(() => githubRepositories.id, { onDelete: "restrict" }),
    slug: text("slug").notNull().unique(),
    customTitle: text("custom_title"),
    summaryMarkdown: text("summary_markdown"),
    bodyMarkdown: text("body_markdown"),
    category: text("category"),
    isFeatured: boolean("is_featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    publicationState: publicationState("publication_state").notNull().default("published"),
    visibilityOverride: visibilityOverride("visibility_override").notNull().default("inherit"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("projects_public_order_idx").on(table.publicationState, table.sortOrder)],
);

export const projectSlugRedirects = pgTable(
  "project_slug_redirects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    oldSlug: text("old_slug").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("project_slug_redirects_project_idx").on(table.projectId)],
);

export const projectRevisions = pgTable(
  "project_revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    createdByAuthUserId: text("created_by_auth_user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    reason: varchar("reason", { length: 32 }).notNull(),
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("project_revisions_project_created_idx").on(table.projectId, table.createdAt)],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorAuthUserId: text("actor_auth_user_id").references(() => authUsers.id, {
      onDelete: "restrict",
    }),
    action: varchar("action", { length: 64 }).notNull(),
    targetType: varchar("target_type", { length: 64 }).notNull(),
    targetId: text("target_id").notNull(),
    correlationId: uuid("correlation_id").notNull().unique(),
    metadata: jsonb("metadata").$type<Record<string, string | string[]>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_events_target_created_idx").on(table.targetType, table.targetId, table.createdAt),
  ],
);
