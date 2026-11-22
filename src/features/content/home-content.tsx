import { readPublicHome } from "@/lib/server/content";
import { HomeScreen } from "@/features/home/home-screen";

export async function HomeContent() {
  return <HomeScreen content={await readPublicHome()} />;
}
