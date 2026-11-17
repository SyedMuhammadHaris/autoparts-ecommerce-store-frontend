import Link from "next/link";
import { AccountNav } from "@/components/account-nav";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Autoparts home">
        <span className="brand-mark" aria-hidden="true">
          a.
        </span>
        <span>
          autoparts<span className="brand-dot">.</span>
        </span>
      </Link>
      <AccountNav />
    </header>
  );
}
