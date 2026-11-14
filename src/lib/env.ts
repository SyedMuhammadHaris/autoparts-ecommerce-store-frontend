/** Validate a public origin without including its input in error messages. */
export function readSiteUrl(value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error("Configure NEXT_PUBLIC_SITE_URL in .env.local; see .env.example.");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid HTTP or HTTPS origin.");
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP or HTTPS origin without credentials or paths.");
  }

  return url.origin;
}
