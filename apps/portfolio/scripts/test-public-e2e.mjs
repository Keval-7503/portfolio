const baseUrl = (process.env.E2E_BASE_URL ?? "http://127.0.0.1:8787").replace(/\/$/, "");

async function expectStatus(pathname, expected, options) {
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: "manual", ...options });
  if (response.status !== expected) {
    throw new Error(`${pathname} returned ${response.status}; expected ${expected}.`);
  }
  return response;
}

const home = await expectStatus("/", 200);
const homeHtml = await home.text();
if (!homeHtml.includes('rel="canonical"') || !homeHtml.includes("application/ld+json")) {
  throw new Error("Homepage metadata is incomplete.");
}

const requiredPublicRoutes = [
  "/about",
  "/experience",
  "/education",
  "/research",
  "/publications",
  "/projects",
  "/skills",
  "/certifications",
  "/achievements",
  "/blog",
  "/resume",
  "/profiles",
  "/contact",
];
for (const pathname of requiredPublicRoutes) {
  const response = await expectStatus(pathname, 200);
  if (!(await response.text()).includes("Explore the portfolio")) {
    throw new Error(`${pathname} is missing shared public navigation.`);
  }
}
await expectStatus("/not-a-real-section", 404);
if (!homeHtml.includes("homepage-composition") || !homeHtml.includes('id="projects"')) {
  throw new Error("Database-configured homepage composition is missing.");
}
for (const requiredHomepageContent of [
  'id="experience"',
  'id="education"',
  "https://github.com/Keval-7503",
  "linkedin.com/in/kevalpatel-eng",
  "instagram.com/kevallpatel",
]) {
  if (!homeHtml.includes(requiredHomepageContent)) {
    throw new Error(`Homepage is missing ${requiredHomepageContent}.`);
  }
}
if (homeHtml.indexOf('id="experience"') > homeHtml.indexOf('id="contact"')) {
  throw new Error("Experience must appear before Contact.");
}
if (homeHtml.indexOf('id="education"') > homeHtml.indexOf('id="contact"')) {
  throw new Error("Education must appear before Contact.");
}

const knownRequestId = "3d4eae89-90f7-4ee2-9ccd-63c32f81b714";
const health = await expectStatus("/api/health", 200, {
  headers: { "x-request-id": knownRequestId },
});
if (health.headers.get("x-request-id") !== knownRequestId) {
  throw new Error("Health endpoint did not preserve a valid request ID.");
}
if ((await health.json()).status !== "ok") throw new Error("Liveness response is invalid.");

const ready = await expectStatus("/api/ready", 200);
if (!ready.headers.get("x-request-id")) throw new Error("Readiness request ID is missing.");
if ((await ready.json()).checks?.database !== "ready") throw new Error("Database is not ready.");

const robots = await expectStatus("/robots.txt", 200);
if (!(await robots.text()).includes("Disallow: /admin/"))
  throw new Error("Admin robots denial is missing.");

const sitemap = await expectStatus("/sitemap.xml", 200);
const sitemapXml = await sitemap.text();
const projectPath = sitemapXml.match(/<loc>https?:\/\/[^/]+(\/projects\/[^<]+)<\/loc>/)?.[1];
if (!projectPath) throw new Error("Sitemap contains no published project.");

const project = await expectStatus(projectPath, 200);
if (!(await project.text()).includes("SoftwareSourceCode"))
  throw new Error("Project JSON-LD is missing.");

await expectStatus("/projects/does-not-exist", 404);
const admin = await expectStatus("/admin", 307);
if (!admin.headers.get("location")?.endsWith("/admin/login"))
  throw new Error("Admin redirect is incorrect.");
if (!admin.headers.get("x-robots-tag")?.includes("noindex"))
  throw new Error("Admin noindex header is missing.");

await expectStatus("/admin/documents", 307);
await expectStatus("/api/admin/uploads", 403, { method: "POST" });
await expectStatus("/api/admin/uploads", 401, {
  method: "POST",
  headers: { origin: baseUrl, "sec-fetch-site": "same-origin" },
});
await expectStatus("/quarantine/not-a-public-object", 404);
const currentResume = await expectStatus("/api/resume/current", 200);
if (currentResume.headers.get("content-type") !== "application/pdf") {
  throw new Error("Current public resume is not served as a PDF.");
}
await expectStatus("/api/admin/documents/00000000-0000-4000-8000-000000000000/download", 401);

console.log("Public route, crawl, metadata, not-found, and admin-denial E2E checks passed.");
