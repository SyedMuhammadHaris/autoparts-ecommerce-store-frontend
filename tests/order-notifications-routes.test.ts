/** @jest-environment node */
import { GET, POST } from "@/app/api/notifications/route";
import { GET as orderGet } from "@/app/api/orders/[[...path]]/route";
import { proxyApi } from "@/lib/server/proxy";
jest.mock("@/lib/server/proxy", () => ({ proxyApi: jest.fn().mockResolvedValue(new Response(null, { status: 204 })) }));
it("keeps registered inbox and owned guest order notification routes separate", async () => {
  await GET(new Request("http://localhost:3000/api/notifications?page=2&recipient=evil"));
  expect(proxyApi).toHaveBeenLastCalledWith(expect.any(Request), "/notifications/?page=2", ["GET", "POST"]);
  await POST(new Request("http://localhost:3000/api/notifications", { method: "POST" }));
  expect(proxyApi).toHaveBeenLastCalledWith(expect.any(Request), "/notifications/", ["GET", "POST"]);
  const reference = "a".repeat(24);
  await orderGet(new Request("http://localhost:3000/api/orders/test/notifications?page=2"), { params: Promise.resolve({ path: [reference, "notifications"] }) });
  expect(proxyApi).toHaveBeenLastCalledWith(expect.any(Request), `/orders/${reference}/notifications/?page=2`, ["GET", "POST"]);
});
