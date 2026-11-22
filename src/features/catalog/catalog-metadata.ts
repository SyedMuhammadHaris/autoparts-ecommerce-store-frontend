import type { Metadata } from "next";
import { publicRobots } from "@/lib/seo/policy";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function catalogMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = await searchParams;
  const page = typeof query.page === "string" && /^[1-9]\d{0,5}$/.test(query.page) ? Number(query.page) : 1;
  const filtered = Object.entries(query).some(([key, value]) => key !== "page" && value !== undefined && value !== "");
  const robots = publicRobots();
  return {
    title: page > 1 ? `Shop automotive parts · Page ${page}` : "Shop automotive parts",
    description: "Explore automotive parts and product options in Pakistan.",
    alternates: { canonical: page > 1 ? `/products?page=${page}` : "/products" },
    robots: filtered ? { index: false, follow: robots.follow } : robots,
  };
}
