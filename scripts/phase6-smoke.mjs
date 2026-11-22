// Run inside the frontend container against the local development server.
// Read-only requests plus a cross-origin mutation that must be rejected before forwarding.
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

const origin = "http://127.0.0.1:3000";
async function check(path, expected, options) {
  const started = performance.now();
  const response = await fetch(origin + path, { redirect: "manual", signal: AbortSignal.timeout(30000), ...options });
  const body = await response.text();
  assert.equal(response.status, expected, `${path}: unexpected HTTP status`);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  console.log(`${response.status} ${path} ${Math.round(performance.now() - started)}ms`);
  return { response, body };
}

const home = await check("/", 200);
assert.ok(/name="robots" content="noindex, nofollow"/.test(home.body), "Homepage must remain noindex locally");
const canonical = home.body.match(/rel="canonical" href="([^"]+)"/)?.[1];
assert.ok(canonical, "Homepage needs a canonical URL");
assert.equal(new URL(canonical).href, new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").href);
const robots = await check("/robots.txt", 200);
assert.ok(/Disallow: \/\s/.test(robots.body), "Local robots policy must disallow crawling");
const sitemap = await check("/sitemap.xml", 200);
assert.ok(!/<loc>/.test(sitemap.body), "Local sitemap must not publish URLs");
for (const path of ["/account", "/admin/dashboard", "/checkout", "/login"]) {
  const { response, body } = await check(path, 200);
  assert.match(response.headers.get("x-robots-tag"), /noindex/);
  assert.ok(/name="robots" content="noindex/.test(body), `${path}: private metadata must exclude indexing`);
}
for (const path of ["/api/notifications", "/api/admin/reports/dashboard?start=2026-11-01&end=2026-11-22"]) {
  const { response } = await check(path, 401);
  assert.match(response.headers.get("cache-control"), /no-store/);
}
await check("/api/notifications", 403, { method: "POST", headers: { Origin: "https://untrusted.example", "Content-Type": "application/json" }, body: "{}" });
await check("/products/phase6-unpublished-probe-4ea20b9f", 404);
await check("/pages/phase6-unpublished-probe-4ea20b9f", 404);
await check("/products/phase6-unpublished-probe-4ea20b9f?year=2020", 400);
console.log("Phase 6 local HTTP smoke passed. Timings are development observations, not production load results.");
