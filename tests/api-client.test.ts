/** @jest-environment node */
import { apiRequest, ApiError } from "@/lib/api";
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
it("obtains a fresh CSRF token before mutations and keeps cookies same-origin", async () => {
  global.fetch = jest.fn().mockResolvedValueOnce(Response.json({ csrf_token: "masked-token" })).mockResolvedValueOnce(Response.json({ user: { id: 1 } }));
  await apiRequest("/api/auth/me", "PATCH", { name: "New name" });
  expect(fetch).toHaveBeenNthCalledWith(1, "/api/auth/csrf", expect.objectContaining({ credentials: "same-origin", cache: "no-store" }));
  expect(fetch).toHaveBeenNthCalledWith(2, "/api/auth/me", expect.objectContaining({ headers: { "X-CSRFToken": "masked-token", "Content-Type": "application/json" }, credentials: "same-origin" }));
});
it("stops a mutation when CSRF setup fails", async () => {
  global.fetch = jest.fn().mockResolvedValue(Response.json({}, { status: 503 }));
  await expect(apiRequest("/api/auth/logout", "POST")).rejects.toBeInstanceOf(ApiError);
  expect(fetch).toHaveBeenCalledTimes(1);
});
