/** @jest-environment node */
import { apiAction, clientFetch } from "@/lib/api/client";
import { ApiError, apiPath, errorEnvelope, successEnvelope } from "@/lib/api/contracts";
import { serverFetch } from "@/lib/server/fetch";

const originalFetch = global.fetch;
beforeEach(() => { process.env.BACKEND_API_URL = "http://backend:8000/api/v1"; });
afterEach(() => { global.fetch = originalFetch; });
it("serializes query arrays, zero and false, and encodes dynamic path segments", () => {
  expect(apiPath({ path: "/api/products/{id}", pathParams: { id: "a/b" }, query: { page: 0, active: false, tag: ["one", "two"], skip: undefined } })).toBe("/api/products/a%2Fb?page=0&active=false&tag=one&tag=two");
});
it.each(["https://evil.invalid/api", "//evil.invalid/api", "/api/../admin", "/api/%2e%2e/admin", "/api/x#fragment", "/api/\\evil"])("rejects nonlocal or unsafe API paths before fetching", async path => {
  global.fetch = jest.fn();
  await expect(clientFetch({ path })).rejects.toBeInstanceOf(ApiError);
  expect(fetch).not.toHaveBeenCalled();
});
it("requires all dynamic path parameters", () => {
  expect(() => apiPath({ path: "/api/products/{id}" })).toThrow("Missing or invalid path parameter");
});
it.each(["POST", "PUT", "PATCH", "DELETE"] as const)("supports %s actions with signed CSRF preparation", async method => {
  global.fetch = jest.fn().mockResolvedValueOnce(Response.json({ csrfToken: "csrf-test" })).mockResolvedValueOnce(Response.json(successEnvelope({ id: 7 })));
  expect(await apiAction({ path: "/api/products/{id}", pathParams: { id: 7 }, query: { confirm: false }, method, payload: { name: "Part" } })).toEqual({ id: 7 });
  expect(fetch).toHaveBeenLastCalledWith("/api/products/7?confirm=false", expect.objectContaining({ method, body: '{"name":"Part"}', credentials: "same-origin" }));
});
it("retains status, machine code and field errors from the shared error envelope", async () => {
  const body = errorEnvelope(400, "Invalid request", "VALIDATION_ERROR", "wire-1");
  body.error.data.details = { email: ["Invalid email."] };
  global.fetch = jest.fn().mockResolvedValue(Response.json(body, { status: 400 }));
  await expect(clientFetch({ path: "/api/account/me" })).rejects.toMatchObject({ status: 400, code: "VALIDATION_ERROR", requestId: "wire-1", details: { email: ["Invalid email."] } });
});
it("rejects a raw success response without the application envelope", async () => {
  global.fetch = jest.fn().mockResolvedValue(Response.json({ id: 7 }));
  await expect(clientFetch({ path: "/api/account/me" })).rejects.toMatchObject({ status: 503 });
});
it("handles bodyless 204 responses", async () => {
  global.fetch = jest.fn().mockResolvedValue(new Response(null, { status: 204 }));
  expect(await clientFetch({ path: "/api/account/logout" })).toBeUndefined();
});
it("uses a fixed server base with no cache or redirects and optional server-only credentials", async () => {
  global.fetch = jest.fn().mockResolvedValue(Response.json(successEnvelope({ id: 7 })));
  await serverFetch({ path: "/orders/{id}/", pathParams: { id: 7 }, accessToken: "test.access", requestId: "safe-request" });
  expect(fetch).toHaveBeenCalledWith("http://backend:8000/api/v1/orders/7/", expect.objectContaining({ cache: "no-store", redirect: "error", headers: expect.objectContaining({ Authorization: "Bearer test.access" }) }));
  await expect(serverFetch({ path: "/outside/" })).rejects.toMatchObject({ status: 400 });
});
