import Link from "next/link";
import type { PublicSettings } from "@/features/content/types";

export function SiteFooter({ settings, pages = [] }: { settings?: PublicSettings | null; pages?: { slug: string; title: string }[] }) {
  return (
    <footer className="site-footer">
      <span>{settings?.name || "Autoparts"}</span>
      <span>{settings?.tagline || "Pakistan · Prices in PKR"}</span>
      {settings?.support_email && <span>{settings.support_email}</span>}
      {settings?.support_phone && <span>{settings.support_phone}</span>}
      {settings?.business_address && <span>{settings.business_address}</span>}
      <nav aria-label="Information">{pages.map(page => <Link key={page.slug} href={`/pages/${encodeURIComponent(page.slug)}`}>{page.title} </Link>)}</nav>
    </footer>
  );
}
