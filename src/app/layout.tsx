import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { readSiteUrl } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(readSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)),
  title: { default: "Autoparts | Built for the road ahead", template: "%s | Autoparts" },
  description: "Explore automotive parts for Pakistan, check vehicle compatibility and build your cart.",
  // The foundation is not a launched storefront. Revisit in the SEO milestone.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-PK">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <div className="site-shell">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
