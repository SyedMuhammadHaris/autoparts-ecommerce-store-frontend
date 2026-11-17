/** @jest-environment node */
import { GET } from "@/app/api/catalog/[resource]/route";
import { proxyApi } from "@/lib/server/proxy";
jest.mock("@/lib/server/proxy", () => ({ proxyApi: jest.fn().mockResolvedValue(new Response("{}")) }));
beforeEach(() => jest.clearAllMocks());
it("allows only vehicle lookup destinations and numeric query parameters", async () => {
  await GET(new Request("http://localhost:3000/api/catalog/vehicle-models?make=1&page_size=100&redirect=http://evil.example"), { params: Promise.resolve({ resource: "vehicle-models" }) });
  expect(proxyApi).toHaveBeenCalledWith(expect.anything(), "/catalog/vehicle-models/?make=1&page_size=100", ["GET"]);
});
it("rejects arbitrary catalog destinations without contacting the backend", async () => {
  expect((await GET(new Request("http://localhost:3000/api/catalog/x"), { params: Promise.resolve({ resource: "staff" }) }))).toHaveProperty("status", 404);
  expect(proxyApi).not.toHaveBeenCalled();
});
