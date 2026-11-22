import Link from "next/link";
import { isContentPath, type PublicHome } from "./types";

export function ContentSections({ content }: { content: PublicHome }) {
  return <>
    {content.banners.map(banner => <section className="approach" key={`banner-${banner.id}`}><div><h2>{banner.title}</h2><p className="content-copy">{banner.body}</p>
      {banner.link_path && isContentPath(banner.link_path) && <Link className="text-link" href={banner.link_path}>{banner.link_label}</Link>}
    </div>{banner.image_url && (
      // Approved external links render in the browser, never through a server optimizer.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={banner.image_url} alt={banner.title} loading="lazy" referrerPolicy="no-referrer" className="content-image" />
    )}</section>)}
    {content.sections.map(section => <section className="approach" key={`section-${section.id}`}><h2>{section.title}</h2><p className="content-copy">{section.body}</p></section>)}
  </>;
}
