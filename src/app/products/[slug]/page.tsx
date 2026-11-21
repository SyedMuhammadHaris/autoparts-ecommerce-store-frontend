import { ProductScreen } from "@/features/catalog/product-screen";
import { productMetadata } from "@/features/catalog/product-metadata";
import type { ProductRouteProps } from "@/features/catalog/route-types";

export const dynamic = "force-dynamic";
export const generateMetadata = productMetadata;

export default function Page(props: ProductRouteProps) {
  return <ProductScreen {...props} />;
}
