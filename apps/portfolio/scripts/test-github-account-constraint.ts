import assert from "node:assert/strict";

import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const sql = neon(databaseUrl);
const accounts = await sql`
  select github_account_id, username, is_active
  from github_accounts
  order by created_at
`;

assert.equal(accounts.length, 1, "Exactly one configured GitHub account is required.");
assert.equal(Number(accounts[0]?.github_account_id), 80451128);
assert.equal(accounts[0]?.username, "Keval-7503");
assert.equal(accounts[0]?.is_active, true);

let constraintName = "";
try {
  await sql.transaction([
    sql`
      insert into github_accounts (
        github_account_id,
        username,
        profile_url,
        is_active,
        sync_enabled
      ) values (
        999999999999,
        'constraint-verification-fixture',
        'https://github.com/constraint-verification-fixture',
        true,
        false
      )
    `,
    sql`select 1 / 0`,
  ]);
} catch (error) {
  const databaseError = error as { code?: string; constraint?: string };
  assert.equal(databaseError.code, "23505", "A second active account was not uniquely rejected.");
  constraintName = databaseError.constraint ?? "";
}

assert.equal(constraintName, "github_accounts_single_active_uidx");
const [{ count }] = await sql`
  select count(*)::integer as count
  from github_accounts
  where is_active = true
`;
assert.equal(count, 1);

console.log("GitHub owner identity and single-active-account constraint passed.");
