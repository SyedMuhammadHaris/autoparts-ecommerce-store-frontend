import type { ReactNode } from "react";
export { privateMetadata as metadata } from "@/lib/seo/policy";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return children;
}