import { ContentPage, contentMetadata, type ContentPageProps } from "@/features/content/content-page";

export const dynamic = "force-dynamic";
export const generateMetadata = contentMetadata;
export default function Page(props: ContentPageProps) { return <ContentPage {...props} />; }
