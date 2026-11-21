/** @jest-environment node */
import { apiAction, clientFetch } from "@/lib/api/client";
import { ApiError, errorEnvelope, successEnvelope } from "@/lib/api/contracts";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { createQueryClient } from "@/lib/query/provider";

jest.mock("@/lib/notifications", () => ({ notifyError: jest.fn(), notifySuccess: jest.fn() }));
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; jest.clearAllMocks(); });
function respond(body: unknown, status = 200) {
  global.fetch = jest.fn().mockResolvedValueOnce(Response.json({ csrfToken: "csrf-test" })).mockResolvedValueOnce(Response.json(body, { status }));
}
it("uses the server's success message before the caller's fallback", async () => {
  const body = { ...successEnvelope({ id: 1 }), success: { code: 200, data: { id: 1 }, message: "Saved by the API." } };
  respond(body);
  expect(await apiAction({ path: "/api/admin/products", method: "POST", payload: {}, notifications: { success: "Saved locally." } })).toEqual({ id: 1 });
  expect(notifySuccess).toHaveBeenCalledWith("Saved by the API.");
  expect(notifyError).not.toHaveBeenCalled();
});
it("uses an action-specific fallback and supports silent quote success", async () => {
  respond(successEnvelope({}));
  await apiAction({ path: "/api/cart", method: "PUT", payload: {}, notifications: { success: "Cart updated." } });
  expect(notifySuccess).toHaveBeenCalledWith("Cart updated.");
  jest.clearAllMocks(); respond(successEnvelope({}));
  await apiAction({ path: "/api/checkout/quote", method: "POST", payload: {}, notifications: { success: false } });
  expect(notifySuccess).not.toHaveBeenCalled();
});
it("shows API errors and still rejects so form/recovery handling runs", async () => {
  const body = errorEnvelope(400, "Invalid request.", "VALIDATION_ERROR");
  body.error.data.details = { name: ["Name is required."] };
  respond(body, 400);
  await expect(apiAction({ path: "/api/account/me", method: "PATCH", payload: {} })).rejects.toMatchObject({ status: 400 });
  expect(notifyError).toHaveBeenCalledWith(expect.objectContaining({ status: 400, details: { name: ["Name is required."] } }));
  expect(notifySuccess).not.toHaveBeenCalled();
});
it("shows CSRF setup failures without submitting the action", async () => {
  global.fetch = jest.fn().mockResolvedValue(Response.json({}, { status: 503 }));
  await expect(apiAction({ path: "/api/cart", method: "PUT", payload: {} })).rejects.toBeInstanceOf(ApiError);
  expect(fetch).toHaveBeenCalledTimes(1); expect(notifyError).toHaveBeenCalledTimes(1);
});
it("does not announce successful background reads", async () => {
  global.fetch = jest.fn().mockResolvedValue(Response.json(successEnvelope({})));
  await clientFetch({ path: "/api/cart" });
  expect(notifySuccess).not.toHaveBeenCalled();
});
it("notifies once after query retries, and keeps anonymous account checks quiet", async () => {
  const client = createQueryClient();
  const defaults = client.getDefaultOptions();
  client.setDefaultOptions({ ...defaults, queries: { ...defaults.queries, retryDelay: 0 } });
  try {
    const load = jest.fn().mockRejectedValue(new ApiError("Unavailable.", 503));
    await expect(client.fetchQuery({ queryKey: ["retry-test"], queryFn: load })).rejects.toBeInstanceOf(ApiError);
    expect(load).toHaveBeenCalledTimes(2); expect(notifyError).toHaveBeenCalledTimes(1);
    jest.clearAllMocks();
    await expect(client.fetchQuery({ queryKey: ["anonymous"], queryFn: () => Promise.reject(new ApiError("Sign in.", 401)) })).rejects.toBeInstanceOf(ApiError);
    expect(notifyError).not.toHaveBeenCalled();
    await expect(client.fetchQuery({ queryKey: ["quiet"], meta: { notifyErrors: false }, queryFn: () => Promise.reject(new ApiError("Unavailable.", 503)) })).rejects.toBeInstanceOf(ApiError);
    expect(notifyError).not.toHaveBeenCalled();
  } finally { client.clear(); }
});
