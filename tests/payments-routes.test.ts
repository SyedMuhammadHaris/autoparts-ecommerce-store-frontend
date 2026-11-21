/** @jest-environment node */
import { GET as adminGet, POST as adminPost, PATCH } from "@/app/api/admin/[...path]/route";
import { GET as orderGet, POST as orderPost } from "@/app/api/orders/[[...path]]/route";
import { proxyApi } from "@/lib/server/proxy";
jest.mock("@/lib/server/proxy", () => ({ proxyApi: jest.fn().mockResolvedValue(new Response(null, { status: 204 })) }));
const proxy = proxyApi as jest.Mock;
beforeEach(() => proxy.mockClear());
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
