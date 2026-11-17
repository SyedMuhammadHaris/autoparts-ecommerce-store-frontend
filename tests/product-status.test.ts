/** @jest-environment node */
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { CatalogInvalidFilters, CatalogNotFound, readProduct } from "@/lib/server/catalog";
jest.mock("@/lib/server/catalog", () => ({ ...jest.requireActual("@/lib/server/catalog"), readProduct: jest.fn() }));
const lookup = readProduct as jest.Mock;
it("returns a real 404 before streaming unpublished product pages", async () => {
  lookup.mockRejectedValue(new CatalogNotFound());
  const response = await proxy(new NextRequest("http://localhost:3000/products/draft"));
  expect(response.status).toBe(404);
  expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/_not-found");
});
it("returns sanitized 503 before streaming when the backend is unavailable", async () => {
  lookup.mockRejectedValue(new Error("internal-private-address"));
  const response = await proxy(new NextRequest("http://localhost:3000/products/part"));
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("internal-private-address");
});
it("allows published products to render", async () => {
  lookup.mockResolvedValue({ id: 1 });
  expect((await proxy(new NextRequest("http://localhost:3000/products/part")))).toHaveProperty("status", 200);
});
it("checks the selected vehicle before streaming product details", async () => {
  lookup.mockResolvedValue({ id: 1 });
  await proxy(new NextRequest("http://localhost:3000/products/part?make=1&model=10&year=2018"));
  expect(lookup).toHaveBeenLastCalledWith("part", { make: "1", model: "10", year: "2018" });
});
it("returns 400 for invalid vehicle combinations", async () => {
  lookup.mockRejectedValue(new CatalogInvalidFilters());
  expect((await proxy(new NextRequest("http://localhost:3000/products/part?year=2018")))).toHaveProperty("status", 400);
});
