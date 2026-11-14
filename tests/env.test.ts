import { readSiteUrl } from "@/lib/env";

describe("public site origin configuration", () => {
  it.each([undefined, "", "  "])("rejects an absent origin", (value) => {
    expect(() => readSiteUrl(value)).toThrow("Configure NEXT_PUBLIC_SITE_URL");
  });

  it.each(["http://localhost:3000", "https://shop.example.com/"])("accepts an HTTP origin", (value) => {
    expect(readSiteUrl(value)).toBe(new URL(value).origin);
  });

  it.each(["invalid", "ftp://example.com", "https://example.com/path", "https://example.com/?key=value", "https://example.com/#section"])("rejects unsafe origins", (value) => {
    expect(() => readSiteUrl(value)).toThrow("NEXT_PUBLIC_SITE_URL");
  });

  it("does not echo credentials in errors", () => {
    expect(() => readSiteUrl("https://private-user:private-password@example.com")).toThrow(
      "without credentials or paths",
    );
    try { readSiteUrl("https://private-user:private-password@example.com"); } catch (error) {
      expect(String(error)).not.toContain("private-password");
    }
  });
});
