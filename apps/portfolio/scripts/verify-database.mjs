import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for database verification.");
}

const expectedTables = [
  "github_accounts",
  "github_repositories",
  "github_sync_runs",
  "project_slug_redirects",
  "projects",
];

const sql = neon(databaseUrl);
const rows = await sql`
  select table_name
  from information_schema.tables
  where table_schema = 'public'
  order by table_name
`;

const actualTables = rows.map((row) => row.table_name);
const missingTables = expectedTables.filter((tableName) => !actualTables.includes(tableName));

if (missingTables.length > 0) {
  console.error(
    JSON.stringify(
      {
        status: "incomplete",
        expectedTables,
        missingTables,
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify(
      {
        status: "ready",
        verifiedTables: expectedTables,
      },
      null,
      2,
    ),
  );
}
