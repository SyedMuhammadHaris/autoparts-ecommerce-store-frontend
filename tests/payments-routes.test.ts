/** @jest-environment node */
import { GET as adminGet, POST as adminPost, PATCH } from "@/app/api/admin/[...path]/route";
import { GET as orderGet, POST as orderPost } from "@/app/api/orders/[[...path]]/route";
import { proxyApi } from "@/lib/server/proxy";
jest.mock("@/lib/server/proxy", () => ({ proxyApi: jest.fn().mockResolvedValue(new Response(null, { status: 204 })) }));
const proxy = proxyApi as jest.Mock;
it("limits reports to read-only known endpoints and bounded allowlisted filters", async () => {
  await adminGet(new Request("http://localhost:3000/api/admin/reports/dashboard?start=2026-11-01&end=2026-11-30&destination=evil"), { params: Promise.resolve({ path: ["reports", "dashboard"] }) });
  expect(proxy).toHaveBeenLastCalledWith(expect.any(Request), "/admin/reports/dashboard/?start=2026-11-01&end=2026-11-30", ["GET"]);
  expect((await adminGet(new Request("http://localhost:3000/api/admin/reports/arbitrary"), { params: Promise.resolve({ path: ["reports", "arbitrary"] }) })).status).toBe(404);
});
beforeEach(() => proxy.mockClear());
it("keeps customer status mutation separate from read-only account/order lookup", async () => {
  await adminGet(new Request("http://localhost:3000/api/admin/customers/7/orders?page=2"), { params: Promise.resolve({ path: ["customers", "7", "orders"] }) });
  expect(proxy).toHaveBeenLastCalledWith(expect.any(Request), "/admin/customers/7/orders/?page=2", ["GET"]);
  await adminPost(new Request("http://localhost:3000/api/admin/customers/7/status", { method: "POST" }), { params: Promise.resolve({ path: ["customers", "7", "status"] }) });
  expect(proxy).toHaveBeenLastCalledWith(expect.any(Request), "/admin/customers/7/status/", ["POST"]);
  expect((await adminGet(new Request("http://localhost:3000/api/admin/customers/7/password"), { params: Promise.resolve({ path: ["customers", "7", "password"] }) })).status).toBe(404);
});
it("allowlists owned payment endpoints without broadening the order proxy", async () => {
  const path = ["a".repeat(24), "payment"];
  await orderGet(new Request("http://localhost:3000/api/orders/test/payment"), { params: Promise.resolve({ path }) });
  expect(proxy).toHaveBeenCalledWith(expect.any(Request), `/orders/${path.join("/")}/`, ["GET", "POST"]);
  proxy.mockClear();
  expect((await orderPost(new Request("http://localhost:3000/api/orders/test/payment"), { params: Promise.resolve({ path: [...path, "upload"] }) })).status).toBe(404);
  expect(proxy).not.toHaveBeenCalled();
});
it("limits staff payment mutations to explicit actions", async () => {
  await adminGet(new Request("http://localhost:3000/api/admin/payments?page=2&destination=evil"), { params: Promise.resolve({ path: ["payments"] }) });
  expect(proxy).toHaveBeenLastCalledWith(expect.any(Request), "/admin/payments/?page=2", ["GET"]);
  await adminPost(new Request("http://localhost:3000/api/admin/payments/1/verify", { method: "POST" }), { params: Promise.resolve({ path: ["payments", "1", "verify"] }) });
  expect(proxy).toHaveBeenLastCalledWith(expect.any(Request), "/admin/payments/1/verify/", ["POST"]);
  expect((await PATCH(new Request("http://localhost:3000/api/admin/payments/1/arbitrary", { method: "PATCH" }), { params: Promise.resolve({ path: ["payments", "1", "arbitrary"] }) })).status).toBe(404);
});

it("limits fulfillment to list/detail routes and forwards only the page query", async () => {
  await adminGet(new Request("http://localhost:3000/api/admin/fulfillment?page=2&status=arbitrary"), { params: Promise.resolve({ path: ["fulfillment"] }) });
  expect(proxy).toHaveBeenLastCalledWith(expect.any(Request), "/admin/fulfillment/?page=2", ["GET"]);
  await adminPost(new Request("http://localhost:3000/api/admin/fulfillment/1", { method: "POST" }), { params: Promise.resolve({ path: ["fulfillment", "1"] }) });
  expect(proxy).toHaveBeenLastCalledWith(expect.any(Request), "/admin/fulfillment/1/", ["GET", "POST"]);
  expect((await adminPost(new Request("http://localhost:3000/api/admin/fulfillment/1/skip"), { params: Promise.resolve({ path: ["fulfillment", "1", "skip"] }) })).status).toBe(404);
});

it("allowlists return/refund collection and detail routes without arbitrary actions", async () => {
  const reference = "a".repeat(24);
  await orderPost(new Request("http://localhost:3000/api/orders/test/returns", { method: "POST" }), { params: Promise.resolve({ path: [reference, "returns"] }) });
  expect(proxy).toHaveBeenLastCalledWith(expect.any(Request), `/orders/${reference}/returns/`, ["GET", "POST"]);
  await adminGet(new Request("http://localhost:3000/api/admin/returns"), { params: Promise.resolve({ path: ["returns"] }) });
  expect(proxy).toHaveBeenLastCalledWith(expect.any(Request), "/admin/returns/", ["GET"]);
  await adminPost(new Request("http://localhost:3000/api/admin/refunds", { method: "POST" }), { params: Promise.resolve({ path: ["refunds"] }) });
  expect(proxy).toHaveBeenLastCalledWith(expect.any(Request), "/admin/refunds/", ["GET", "POST"]);
  expect((await adminPost(new Request("http://localhost:3000/api/admin/refunds/1/complete"), { params: Promise.resolve({ path: ["refunds", "1", "complete"] }) })).status).toBe(404);
});
