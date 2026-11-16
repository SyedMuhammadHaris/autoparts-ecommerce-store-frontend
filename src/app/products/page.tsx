import Link from "next/link";
import type { Metadata } from "next";
import { CatalogInvalidFilters, readBrands, readCategories, readProducts, readVehicleMakes, readVehicleModels, readVehicleFitments } from "@/lib/server/catalog";
import { VehicleSelector } from "@/components/vehicle-selector";
import { vehicleQuery } from "@/lib/vehicle-query";
import { priceLabel } from "@/lib/catalog-types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop automotive parts", description: "Explore automotive parts and product options in Pakistan." };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const text = (key: string) => typeof query[key] === "string" ? query[key] as string : "";
  let data;
  let invalid = false;
  try {
    data = await Promise.all([readProducts(query), readCategories(), readBrands(), readVehicleMakes(), readVehicleModels(text("make")), readVehicleFitments(text("make"), text("model"))]);
  } catch (failure) { invalid = failure instanceof CatalogInvalidFilters; }
  if (invalid) return <main id="main-content" className="state-panel"><h1>Check your filters.</h1><p>Select a make, a model belonging to it, and a supported year or price range.</p><Link href="/products">Clear filters and try again</Link></main>;
  if (!data) return <main id="main-content" className="state-panel"><h1>Catalog temporarily unavailable.</h1><p>We couldn’t load the parts right now.</p><Link href="/products">Try again</Link></main>;
    const [products, categories, brands, makes, models, fitments] = data;
    const vehicle = vehicleQuery(query);
    const page = Math.max(1, Number(query.page) || 1);
    function pageLink(next: number) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) if (typeof value === "string") params.set(key, value);
      params.set("page", String(next)); return `/products?${params}`;
    }
    return <main id="main-content" className="catalog-page">
      <p className="eyebrow">Find your next part</p><h1>Parts for the road ahead.</h1>
      <form className="catalog-filters" action="/products">
        <VehicleSelector key={vehicle || "all-vehicles"} makes={makes} models={models} fitments={fitments} initial={{ make: text("make"), model: text("model"), year: text("year"), engine: text("engine"), trim: text("trim") }} />
        <label>Search<input name="search" defaultValue={typeof query.search === "string" ? query.search : ""} placeholder="Product name or SKU" maxLength={120} /></label>
        <label>Category<select name="category" defaultValue={typeof query.category === "string" ? query.category : ""}><option value="">All categories</option>{categories.results.map(value => <option key={value.id} value={value.slug}>{value.name}</option>)}</select></label>
        <label>Brand<select name="brand" defaultValue={typeof query.brand === "string" ? query.brand : ""}><option value="">All brands</option>{brands.results.map(value => <option key={value.id} value={value.slug}>{value.name}</option>)}</select></label>
        <label>Sort<select name="ordering" defaultValue={typeof query.ordering === "string" ? query.ordering : "-id"}><option value="-id">Newest</option><option value="price">Price: low to high</option><option value="-price">Price: high to low</option><option value="name">Name</option></select></label>
        <label>Minimum price (PKR)<input type="number" name="min_price" min="0" step=".01" defaultValue={typeof query.min_price === "string" ? query.min_price : ""} /></label>
        <label>Maximum price (PKR)<input type="number" name="max_price" min="0" step=".01" defaultValue={typeof query.max_price === "string" ? query.max_price : ""} /></label>
        <button className="primary-button">Find parts</button><Link href="/products">Clear filters</Link>
      </form>
      <p>{products.count} product{products.count === 1 ? "" : "s"}</p>
      {!products.results.length && <div className="empty-panel"><h2>No parts found yet.</h2><p>Try a different search or check back as the catalog grows.</p></div>}
      <div className="product-grid">{products.results.map(product => <article className="product-card" key={product.id}>
        <Link href={`/products/${product.slug}${vehicle ? "?" + vehicle : ""}`}>
          <div className="product-image">{product.display_image_url ? (
            // External links are rendered in the browser; no server image optimizer fetches them.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.display_image_url} alt={product.name} loading="lazy" referrerPolicy="no-referrer" />
          ) : <span>Image coming soon</span>}</div>
          <p className="eyebrow">{product.category_name}</p><h2>{product.name}</h2><p>From {priceLabel(product.price ?? product.base_price)}</p>
        </Link>
      </article>)}</div>
      <nav className="pagination" aria-label="Product pages">{products.previous && <Link href={pageLink(page - 1)}>Previous</Link>}<span>Page {page}</span>{products.next && <Link href={pageLink(page + 1)}>Next</Link>}</nav>
    </main>;
}
