/** @jest-environment node */
import { backendConfiguration, getBackendHealth } from "@/lib/server/backend";

const originalFetch = global.fetch;
beforeEach(() => {
  process.env.BACKEND_API_URL = "http://backend:8000/api/v1";
  delete process.env.BACKEND_API_TIMEOUT_MS;
});
afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });

it("calls only the fixed readiness destination with no cache or redirects", async () => {
  const mockFetch = jest.fn().mockResolvedValue(Response.json({ status: "ok", extra: "discard" }));
  global.fetch = mockFetch;
  expect(await getBackendHealth("request-1")).toEqual({ status: "ok" });
  expect(mockFetch).toHaveBeenCalledWith("http://backend:8000/api/v1/health/ready/", expect.objectContaining({
    cache: "no-store", redirect: "error",
    headers: { Accept: "application/json", "X-Request-ID": "request-1" },
  }));
});

it.each([
  "https://name:secret@example.com/api/v1", "file:///api/v1",
  "http://backend:8000/other", "http://backend:8000/api/v1?redirect=elsewhere",
])("rejects invalid server configuration without exposing it", (value) => {
  process.env.BACKEND_API_URL = value;
  expect(backendConfiguration).toThrow("BACKEND_API_URL");
});

it.each(["0", "NaN", "15001"])("bounds request timeouts", (timeout) => {
  process.env.BACKEND_API_TIMEOUT_MS = timeout;
  expect(backendConfiguration).toThrow("BACKEND_API_TIMEOUT_MS");
});

it.each([
  () => Promise.reject(new Error("secret-diagnostic")),
  () => Promise.reject(new DOMException("Timed out", "TimeoutError")),
  () => Promise.resolve(Response.json({ detail: "secret-diagnostic" }, { status: 500 })),
  () => Promise.resolve(Response.json({ status: "unexpected" })),
  () => Promise.resolve(new Response("<html>internal error</html>")),
])("sanitizes network, timeout and invalid upstream responses", async (implementation) => {
  global.fetch = jest.fn(implementation) as typeof fetch;
  await expect(getBackendHealth("request-1")).rejects.toThrow("The service is temporarily unavailable.");
});
