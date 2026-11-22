import { CatalogScreen } from "@/features/catalog/catalog-screen";
export { catalogMetadata as generateMetadata } from "@/features/catalog/catalog-metadata";

export const dynamic = "force-dynamic";

export default function Page(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogScreen {...props} />;
}
