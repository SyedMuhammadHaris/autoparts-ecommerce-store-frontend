import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogNotFound, readProduct } from "@/lib/server/catalog";
import { ProductOption } from "@/components/product-option";
import { ProductReviews } from "@/features/reviews/product-reviews";
import { StructuredData } from "@/components/structured-data";
import { productBreadcrumbs, productStructuredData } from "@/lib/seo/structured-data";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function ProductScreen({ params, searchParams }: Props) {
  const query = await searchParams;
  let product;
  try {
    product = await readProduct((await params).slug, query);
  } catch (failure) {
    if (failure instanceof CatalogNotFound) notFound();
  }
  if (!product) return <main id="main-content" className="state-panel"><h1>Product unavailable.</h1><p>We couldn’t load this part right now. Please try again.</p><Link href="/products">Back to parts</Link></main>;
    return <main id="main-content" className="catalog-page">
      <StructuredData data={productStructuredData(product)} />
      <StructuredData data={productBreadcrumbs(product)} />
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true"> / </span><Link href="/products">All parts</Link><span aria-hidden="true"> / </span><span aria-current="page">{product.name}</span></nav>
      {query.make && <p>Showing options matching your vehicle selection, including universal parts. <Link href={`/products/${product.slug}`}>View all product options</Link></p>}
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
      <ProductReviews slug={product.slug} />
    </main>;
}
