/** @jest-environment node */
import { successEnvelope } from "@/lib/api/contracts";
import { CatalogNotFound, readProduct, readProducts } from "@/lib/server/catalog";
const originalFetch = global.fetch;
beforeEach(() => {
  process.env.BACKEND_API_URL = "http://backend:8000/api/v1";
  global.fetch = jest.fn().mockResolvedValue(Response.json(successEnvelope({ count: 0, results: [] })));
});
afterEach(() => { global.fetch = originalFetch; });
it("forwards only bounded catalog filters and drops empty form values", async () => {
  await readProducts({ search: "pad", category: "", brand: "", ordering: "price", destination: "http://evil.example", page: "2" });
  expect(fetch).toHaveBeenCalledWith("http://backend:8000/api/v1/catalog/products/?search=pad&ordering=price&page=2", expect.objectContaining({ cache: "no-store", redirect: "error" }));
});
it("rejects paths and classifies unpublished products as not found", async () => {
  expect(() => readProduct("../admin")).toThrow(CatalogNotFound);
  expect(fetch).not.toHaveBeenCalled();
  global.fetch = jest.fn().mockResolvedValue(Response.json({}, { status: 404 }));
  await expect(readProduct("draft-product")).rejects.toBeInstanceOf(CatalogNotFound);
});
it("forwards make/model/year and engine/trim as bounded query values", async () => {
  await readProducts({ make: "1", model: "10", year: "2018", engine: "1.8", trim: "Grande" });
  expect(fetch).toHaveBeenCalledWith("http://backend:8000/api/v1/catalog/products/?make=1&model=10&year=2018&engine=1.8&trim=Grande", expect.anything());
});
it("retains vehicle selection when loading a product detail", async () => {
  await readProduct("brake-pad", { make: "1", model: "10", year: "2018", destination: "http://evil.example" });
  expect(fetch).toHaveBeenCalledWith("http://backend:8000/api/v1/catalog/products/brake-pad/?make=1&model=10&year=2018", expect.anything());
});
