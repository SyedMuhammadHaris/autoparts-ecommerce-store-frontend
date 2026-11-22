import { screen } from "@testing-library/react";
import { renderWithQuery as render } from "./helpers/render";
import { ContentSections } from "@/features/content/content-sections";
import { SiteFooter } from "@/components/site-footer";
import { resourceSchema } from "@/features/admin/schemas";
import { resources } from "@/features/admin/resources";

it("renders published text without executing HTML and rejects unsafe banner links", () => {
  render(<ContentSections content={{ settings: null, pages: [], banners: [{ id: 1, title: "Test banner", body: "<script>unsafe()</script>", image_url: "", link_path: "javascript:unsafe()", link_label: "Unsafe" }], sections: [{ id: 1, title: "Test section", body: "Text" }] }} />);
  expect(screen.getByText("<script>unsafe()</script>")).toBeInTheDocument();
  expect(document.querySelector("script")).toBeNull();
  expect(screen.queryByRole("link", { name: "Unsafe" })).not.toBeInTheDocument();
});
it("shows public contact settings and published page links without changing the layout", () => {
  render(<SiteFooter settings={{ name: "Test store", tagline: "Test tagline", support_email: "support@example.invalid", support_phone: "", business_address: "" }} pages={[{ slug: "returns", title: "Return policy" }]} />);
  expect(screen.getByText("Test store")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Return policy" })).toHaveAttribute("href", "/pages/returns");
});
it("accepts a full CMS page body while bounding its metadata", () => {
  const schema = resourceSchema(resources.find(resource => resource.key === "pages")!, false);
  expect(schema.safeParse({ title: "About", slug: "about", body: "x".repeat(15000), description: "Summary", is_published: false }).success).toBe(true);
  expect(schema.safeParse({ title: "About", slug: "about", body: "Text", description: "x".repeat(161), is_published: false }).success).toBe(false);
});
