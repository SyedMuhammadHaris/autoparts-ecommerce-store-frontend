import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { ContentFooter } from "@/features/content/content-footer";
import { readSiteUrl } from "@/lib/env";
import { publicRobots } from "@/lib/seo/policy";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ApiProvider } from "@/lib/query/provider";
import { ToastHost } from "@/components/toast-host";

export const metadata: Metadata = {
  metadataBase: new URL(readSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)),
  title: { default: "Autoparts | Built for the road ahead", template: "%s | Autoparts" },
  description: "Explore automotive parts for Pakistan, check vehicle compatibility and build your cart.",
  robots: publicRobots(),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-PK">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <ApiProvider><div className="site-shell">
          <SiteHeader />
          {children}
          <ContentFooter />
        </div></ApiProvider>
        <ToastHost />
      </body>
    </html>
  );
}
