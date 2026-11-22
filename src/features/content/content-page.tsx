import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { readPublicPage } from "@/lib/server/content";
import { ApiError } from "@/lib/api/contracts";
import { publicRobots } from "@/lib/seo/policy";

export type ContentPageProps = { params: Promise<{ slug: string }> };
export async function contentMetadata({ params }: ContentPageProps): Promise<Metadata> {
  try { const page = await readPublicPage((await params).slug); return { title: page.title, description: page.description || undefined, robots: publicRobots(), alternates: { canonical: `/pages/${page.slug}` } }; }
  catch { return { title: "Page unavailable", robots: { index: false } }; }
}
export async function ContentPage({ params }: ContentPageProps) {
  let page;
  try { page = await readPublicPage((await params).slug); }
  catch (error) { if (error instanceof ApiError && error.status === 404) notFound(); }
  if (!page) return <main id="main-content" className="state-panel"><h1>Page temporarily unavailable.</h1><Link href="/">Back to home</Link></main>;
  return <main id="main-content" className="catalog-page"><h1>{page.title}</h1><div className="content-copy">{page.body}</div><p><Link href="/">Back to home</Link></p></main>;
}
