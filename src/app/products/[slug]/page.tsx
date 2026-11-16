import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogNotFound, readProduct } from "@/lib/server/catalog";
import { ProductOption } from "@/components/product-option";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try { const product = await readProduct((await params).slug); return { title: product.name, description: product.description.slice(0, 160), alternates: { canonical: `/products/${product.slug}` } }; }
  catch { return { title: "Product unavailable", robots: { index: false } }; }
}
export default async function ProductPage({ params }: Props) {
  let product;
  try {
    product = await readProduct((await params).slug);
  } catch (failure) {
    if (failure instanceof CatalogNotFound) notFound();
  }
  if (!product) return <main id="main-content" className="state-panel"><h1>Product unavailable.</h1><p>We couldn’t load this part right now. Please try again.</p><Link href="/products">Back to parts</Link></main>;
    return <main id="main-content" className="catalog-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/products">All parts</Link><span> / {product.category_name}</span></nav>
      <div className="product-detail">
        <div><div className="product-image detail-image">{product.display_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.display_image_url} alt={product.name} referrerPolicy="no-referrer" />
        ) : <span>Image coming soon</span>}</div>
          <div className="image-gallery">{product.images.map(image => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={image.id} src={image.url} alt={image.alt_text || product.name} loading="lazy" referrerPolicy="no-referrer" />
          ))}</div>
        </div>
        <div><p className="eyebrow">{product.brand_name || product.category_name}</p><h1>{product.name}</h1><p>SKU: {product.sku}</p><p className="product-description">{product.description}</p><ProductOption variants={product.variants} /></div>
      </div>
    </main>;
}
