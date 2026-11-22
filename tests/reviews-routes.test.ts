/** @jest-environment node */
import { GET, POST } from "@/app/api/reviews/[...path]/route";
import { proxyApi } from "@/lib/server/proxy";
jest.mock("@/lib/server/proxy", () => ({ proxyApi: jest.fn().mockResolvedValue(new Response(null, { status: 204 })) }));
beforeEach(() => (proxyApi as jest.Mock).mockClear());
it("separates public review reads from authenticated owner submissions", async () => {
  await GET(new Request("http://localhost:3000/api/reviews/part?page=2"), { params: Promise.resolve({ path: ["part"] }) });
  expect(proxyApi).toHaveBeenLastCalledWith(expect.any(Request), "/catalog/products/part/reviews/?page=2", ["GET"]);
  await POST(new Request("http://localhost:3000/api/reviews/part/mine", { method: "POST" }), { params: Promise.resolve({ path: ["part", "mine"] }) });
  expect(proxyApi).toHaveBeenLastCalledWith(expect.any(Request), "/reviews/products/part/mine/", ["GET", "POST", "PATCH"]);
  expect((await POST(new Request("http://localhost:3000/api/reviews/bad"), { params: Promise.resolve({ path: ["..", "mine"] }) })).status).toBe(404);
});
