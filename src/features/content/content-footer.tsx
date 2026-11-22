import { readPublicHome } from "@/lib/server/content";
import { SiteFooter } from "@/components/site-footer";

export async function ContentFooter() {
  const content = await readPublicHome();
  return <SiteFooter settings={content?.settings} pages={content?.pages} />;
}
