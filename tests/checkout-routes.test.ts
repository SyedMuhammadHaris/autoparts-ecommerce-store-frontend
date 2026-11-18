/** @jest-environment node */
import { GET as checkoutGet, POST as checkoutPost } from "@/app/api/checkout/[[...path]]/route";
import { GET as orderGet, POST as orderPost } from "@/app/api/orders/[[...path]]/route";
import { proxyApi } from "@/lib/server/proxy";
jest.mock("@/lib/server/proxy", () => ({ proxyApi: jest.fn(async () => Response.json({})) }));
beforeEach(() => jest.clearAllMocks());
it("forwards only the fixed checkout routes and bounded recovery key", async () => {
  const req = new Request("http://localhost:3000/api/checkout", { method: "POST" });
  await checkoutPost(req, { params: Promise.resolve({ path: ["quote"] }) });
  expect(proxyApi).toHaveBeenCalledWith(req, "/checkout/quote/", ["POST"]);
  expect((await checkoutGet(req, { params: Promise.resolve({ path: ["attempt", "../../admin"] }) })).status).toBe(404);
});
it("rejects guessed integer order IDs and arbitrary actions", async () => {
  const req = new Request("http://localhost:3000/api/orders");
  expect((await orderGet(req, { params: Promise.resolve({ path: ["1"] }) })).status).toBe(404);
  expect((await orderPost(req, { params: Promise.resolve({ path: ["a".repeat(24), "pay"] }) })).status).toBe(404);
  expect(proxyApi).not.toHaveBeenCalled();
});
