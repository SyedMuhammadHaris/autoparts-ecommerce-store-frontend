// Local-only acceptance check. The caller removes the uniquely owned test user afterward.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { encode, decode } from "next-auth/jwt";

const email = process.env.SMOKE_EMAIL;
assert.match(email ?? "", /^auth-smoke-[a-f0-9]+@example\.invalid$/);
const secret = process.env.NEXTAUTH_SECRET;
assert.ok(secret && secret.length >= 32);
const origin = process.env.NEXTAUTH_URL;
const base = "http://127.0.0.1:3000";
const password = randomBytes(32).toString("base64url");
const cookies = new Map();
function remember(response) {
  for (const header of response.headers.getSetCookie()) {
    const pair = header.split(";")[0];
    const index = pair.indexOf("=");
    const name = pair.slice(0, index);
    const value = pair.slice(index + 1);
    if (!value) cookies.delete(name);
    else cookies.set(name, value);
  }
}
function cookieHeader() { return [...cookies].map(([key, value]) => `${key}=${value}`).join("; "); }
async function call(path, { body, method = "GET", expected = 200, cookie = cookieHeader(), type = "application/json" } = {}) {
  const response = await fetch(base + path, { method, headers: { Cookie: cookie, Origin: origin, "Content-Type": type }, body });
  remember(response);
  assert.equal(response.status, expected, `Unexpected response for ${path}`);
  return response.status === 204 ? undefined : response.json();
}
async function csrf() { return (await call("/api/auth/csrf")).csrfToken; }
const token = await csrf();
const registered = await fetch(base + "/api/account/register", { method: "POST", headers: { Origin: origin, Cookie: cookieHeader(), "Content-Type": "application/json", "X-CSRFToken": token }, body: JSON.stringify({ email, password, name: "Disposable authentication smoke" }) });
assert.equal(registered.status, 201);
await call("/api/auth/callback/credentials", { method: "POST", type: "application/x-www-form-urlencoded", body: new URLSearchParams({ email, password, csrfToken: await csrf(), callbackUrl: origin + "/account", json: "true" }).toString() });
assert.equal((await call("/api/account/me")).user.email, email);
const session = await call("/api/auth/session");
assert.ok(!JSON.stringify(session).includes("accessToken") && !JSON.stringify(session).includes("refreshToken"));
const name = origin.startsWith("https:") ? "__Secure-next-auth.session-token" : "next-auth.session-token";
const state = await decode({ token: cookies.get(name), secret });
assert.ok(state?.refreshToken);
cookies.set(name, await encode({ token: { ...state, accessExpiresAt: 1 }, secret, maxAge: 86400 }));
const oldCookie = cookieHeader();
await Promise.all([call("/api/account/me", { cookie: oldCookie }), call("/api/account/me", { cookie: oldCookie })]);
const rotated = await decode({ token: cookies.get(name), secret });
assert.notEqual(rotated.refreshToken, state.refreshToken);
const rejected = await fetch(process.env.BACKEND_API_URL + "/auth/refresh/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh: state.refreshToken }) });
assert.equal(rejected.status, 401);
await call("/api/auth/signout", { method: "POST", type: "application/x-www-form-urlencoded", body: new URLSearchParams({ csrfToken: await csrf(), callbackUrl: origin + "/", json: "true" }).toString() });
assert.ok(!cookies.has(name));
await call("/api/account/me", { expected: 401 });
const revoked = await fetch(process.env.BACKEND_API_URL + "/auth/me/", { headers: { Authorization: `Bearer ${rotated.accessToken}` } });
assert.equal(revoked.status, 401);
console.log("Live NextAuth/JWT smoke passed: cookie session, no client token disclosure, concurrent refresh, replay rejection and logout revocation.");
