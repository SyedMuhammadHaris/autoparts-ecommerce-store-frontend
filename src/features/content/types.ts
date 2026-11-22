export type PublicSettings = { name: string; tagline: string; support_email: string; support_phone: string; business_address: string };
export type PublicHome = { settings: PublicSettings | null; banners: { id: number; title: string; body: string; image_url: string; link_path: string; link_label: string }[]; sections: { id: number; title: string; body: string }[]; pages: { slug: string; title: string }[] };
export type PublicPage = { title: string; slug: string; body: string; description: string };
export function isContentPath(value: string) { return /^\/(?:products(?:\/[A-Za-z0-9_-]+)?|pages\/[A-Za-z0-9_-]+|cart|login|signup)?$/.test(value); }
