/** @jest-environment node */
import { randomUUID } from "node:crypto";
import { refreshTokens, SessionEnded } from "@/lib/server/auth-tokens";
import { authOptions } from "@/lib/server/auth-options";
const originalFetch = global.fetch;
beforeEach(() => { process.env.BACKEND_API_URL = "http://backend:8000/api/v1"; });
afterEach(() => { global.fetch = originalFetch; });
function expired() { return { sub: "1", accessToken: "old.access", refreshToken: randomUUID(), accessExpiresAt: 1, refreshExpiresAt: Math.floor(Date.now()/1000)+3600 }; }
function rotated() { return { access: "new.access", refresh: "new.refresh", access_expires_at: Math.floor(Date.now()/1000)+300, refresh_expires_at: Math.floor(Date.now()/1000)+3600 }; }
it("coalesces concurrent refreshes and old-cookie retries into one backend rotation", async () => {
  global.fetch = jest.fn().mockResolvedValue(Response.json(rotated()));
  const old = expired();
  const [first, second] = await Promise.all([refreshTokens(old), refreshTokens(old)]);
  expect(first.refreshToken).toBe("new.refresh");
  expect(second).toEqual(first);
  await refreshTokens(old);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith("http://backend:8000/api/v1/auth/refresh/", expect.objectContaining({ cache: "no-store", redirect: "error" }));
});
it("does not refresh valid access credentials or silently reuse a revoked refresh", async () => {
  global.fetch = jest.fn().mockResolvedValue(Response.json({}, { status: 401 }));
  const valid = { ...expired(), accessExpiresAt: Math.floor(Date.now()/1000)+300 };
  expect(await refreshTokens(valid)).toBe(valid);
  expect(fetch).not.toHaveBeenCalled();
  await expect(refreshTokens(expired())).rejects.toBeInstanceOf(SessionEnded);
});
it("allows a refresh retry after a temporary backend outage", async () => {
  global.fetch = jest.fn().mockRejectedValueOnce(new Error("private-diagnostic")).mockResolvedValueOnce(Response.json(rotated()));
  const old = expired();
  await expect(refreshTokens(old)).rejects.toThrow();
  expect((await refreshTokens(old)).accessToken).toBe("new.access");
});
it("never exposes backend bearer credentials in the client session callback", async () => {
  const callback = authOptions.callbacks!.session!;
  const result = await callback({ session: { expires: "2099-01-01" }, token: { ...expired(), authError: "SessionExpired" } } as Parameters<typeof callback>[0]);
  expect(result).toEqual({ expires: "2099-01-01", authError: "SessionExpired" });
  expect(JSON.stringify(result)).not.toContain("accessToken");
  expect(JSON.stringify(result)).not.toContain("refreshToken");
});
it("revokes the Django session on NextAuth signout", async () => {
  global.fetch = jest.fn().mockResolvedValue(new Response(null, { status: 204 }));
  const token = { ...expired(), accessExpiresAt: Math.floor(Date.now()/1000)+300 };
  const callback = authOptions.events!.signOut!;
  await callback({ token, session: { expires: "2099-01-01" } });
  expect(fetch).toHaveBeenCalledWith("http://backend:8000/api/v1/auth/logout/", expect.objectContaining({ method: "POST", headers: { Authorization: "Bearer old.access" } }));
});
