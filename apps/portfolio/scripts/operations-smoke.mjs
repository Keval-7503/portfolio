const origin = (process.argv[2] || "http://127.0.0.1:8787").replace(/\/$/, "");
const checks = [
  ["/", 200],
  ["/api/health", 200],
  ["/api/ready", 200],
  ["/robots.txt", 200],
  ["/admin", 307],
  ["/api/admin/documents/not-a-real-id/download", 401],
];

for (const [path, expected] of checks) {
  const response = await fetch(`${origin}${path}`, { redirect: "manual" });
  if (response.status !== expected) {
    throw new Error(`${path} returned ${response.status}; expected ${expected}`);
  }
}
console.log(
  `Operations smoke passed ${checks.length} public/private boundary checks at ${origin}.`,
);
