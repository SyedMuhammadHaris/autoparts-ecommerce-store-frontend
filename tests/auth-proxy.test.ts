/** @jest-environment node */
import { createHash } from "node:crypto";
import { encode } from "next-auth/jwt";
import { proxyApi } from "@/lib/server/proxy";
import { GET as accountGet } from "@/app/api/account/[...path]/route";

const originalFetch = global.fetch;
const secret = "synthetic-nextauth-test-secret-" + "s".repeat(32);
const csrf = "a".repeat(64);
const hash = createHash("sha256").update(csrf + secret).digest("hex");
beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
  process.env.NEXTAUTH_URL = "http://localhost:3000";
  process.env.NEXTAUTH_SECRET = secret;
  process.env.BACKEND_API_URL = "http://backend:8000/api/v1";
  global.fetch = jest.fn().mockResolvedValue(Response.json({ user: { id: 1 } }));
});
afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });
async function request(method = "GET", origin = "http://localhost:3000", body = "{}", authenticated = true) {
  const token = await encode({ token: { sub: "1", accessToken: "signed.access.jwt", refreshToken: "signed.refresh.jwt", accessExpiresAt: Math.floor(Date.now()/1000)+300, refreshExpiresAt: Math.floor(Date.now()/1000)+86400 }, secret });
  return new Request("http://localhost:3000/api/account/me", { method, headers: { origin, "x-csrftoken": csrf, authorization: "Bearer attacker-token", cookie: `${authenticated ? `next-auth.session-token=${token}; ` : ""}next-auth.csrf-token=${encodeURIComponent(csrf + "|" + hash)}; sessionid=legacy; other=private` }, body: method === "GET" ? undefined : body });
}
it("uses a decrypted NextAuth cookie to send only a bearer token to Django", async () => {
  const response = await proxyApi(await request(), "/auth/me/", ["GET"]);
  expect(response.status).toBe(200);
  const [url, options] = (fetch as jest.Mock).mock.calls[0];
  expect(url).toBe("http://backend:8000/api/v1/auth/me/");
  expect(options.headers.Authorization).toBe("Bearer signed.access.jwt");
  expect(options.headers.Cookie).toBeUndefined();
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  expect(await response.text()).not.toContain("signed.access.jwt");
});
it("requires the cookie and ignores browser-provided bearer credentials", async () => {
  expect((await proxyApi(await request("GET", undefined, undefined, false), "/auth/me/", ["GET"])).status).toBe(401);
  expect(fetch).not.toHaveBeenCalled();
});
it("accepts an exact-origin mutation with signed double-submit CSRF", async () => {
  expect((await proxyApi(await request("PATCH"), "/auth/me/", ["PATCH"])).status).toBe(200);
});
it("rejects forged CSRF and foreign origins before contacting Django", async () => {
  const valid = await request("PATCH");
  const headers = new Headers(valid.headers);
  headers.set("x-csrftoken", "b".repeat(64));
  expect((await proxyApi(new Request(valid, { headers }), "/auth/me/", ["PATCH"])).status).toBe(403);
  expect((await proxyApi(await request("PATCH", "https://evil.example"), "/auth/me/", ["PATCH"])).status).toBe(403);
  expect(fetch).not.toHaveBeenCalled();
});
it.each(["not-json", "x".repeat(65537)])("rejects malformed and oversized bodies", async body => {
  expect((await proxyApi(await request("PATCH", undefined, body), "/auth/me/", ["PATCH"])).status).toBe(400);
  expect(fetch).not.toHaveBeenCalled();
});
it("allows anonymous registration without exposing upstream cookies", async () => {
  global.fetch = jest.fn().mockResolvedValue(Response.json({ user: {} }, { status: 201, headers: { "Set-Cookie": "sessionid=discard" } }));
  const response = await proxyApi(await request("POST", undefined, "{}", false), "/auth/register/", ["POST"]);
  expect(response.status).toBe(201);
  expect(response.headers.get("set-cookie")).toBeNull();
});
it("sanitizes backend failures", async () => {
  global.fetch = jest.fn().mockResolvedValue(Response.json({ detail: "private-diagnostic" }, { status: 500 }));
  const response = await proxyApi(await request(), "/auth/me/", ["GET"]);
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("private-diagnostic");
});
it("rejects arbitrary account destinations", async () => {
  const response = await accountGet(new Request("http://localhost:3000/api/account/x"), { params: Promise.resolve({ path: ["arbitrary"] }) });
  expect(response.status).toBe(404);
  expect(fetch).not.toHaveBeenCalled();
});
