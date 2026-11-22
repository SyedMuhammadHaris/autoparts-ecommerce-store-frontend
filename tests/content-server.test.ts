/** @jest-environment node */
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { readPublicHome, readPublicPage } from "@/lib/server/content";
import { serverFetch } from "@/lib/server/fetch";
import { ApiError } from "@/lib/api/contracts";
jest.mock("@/lib/server/fetch", () => ({ serverFetch: jest.fn() }));
beforeEach(() => (serverFetch as jest.Mock).mockReset());
it("keeps a fallback homepage available when the CMS service fails", async () => {
  (serverFetch as jest.Mock).mockRejectedValue(new Error("private diagnostic"));
  expect(await readPublicHome()).toBeNull();
});
it("checks published content before streaming and preserves real 404/503 responses", async () => {
  (serverFetch as jest.Mock).mockRejectedValue(new ApiError("Not found", 404));
  expect((await proxy(new NextRequest("http://localhost:3000/pages/draft")))).toHaveProperty("status", 404);
  (serverFetch as jest.Mock).mockRejectedValue(new Error("private diagnostic"));
  const failure = await proxy(new NextRequest("http://localhost:3000/pages/about"));
  expect(failure.status).toBe(503);
  expect(await failure.text()).not.toContain("private diagnostic");
  expect(() => readPublicPage("../admin")).toThrow(ApiError);
});
