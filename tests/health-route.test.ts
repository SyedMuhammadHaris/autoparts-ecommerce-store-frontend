/** @jest-environment node */
import { GET } from "@/app/api/health/route";
import { getBackendHealth } from "@/lib/server/backend";

jest.mock("@/lib/server/backend", () => ({ getBackendHealth: jest.fn() }));

it("returns an uncached health response and preserves safe correlation IDs", async () => {
  jest.mocked(getBackendHealth).mockResolvedValue({ status: "ok" });
  const response = await GET(new Request("http://localhost/api/health", { headers: { "X-Request-ID": "safe-1" } }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("x-request-id")).toBe("safe-1");
});

it("returns a sanitized 503 and replaces untrusted IDs", async () => {
  jest.mocked(getBackendHealth).mockRejectedValue(new Error("backend-secret"));
  const response = await GET(new Request("http://localhost/api/health", { headers: { "X-Request-ID": "x".repeat(100) } }));
  const body = await response.json();
  expect(response.status).toBe(503);
  expect(body.error.code).toBe("BACKEND_UNAVAILABLE");
  expect(JSON.stringify(body)).not.toContain("backend-secret");
  expect(body.request_id).toBe(response.headers.get("x-request-id"));
  expect(body.request_id).not.toBe("x".repeat(100));
});
