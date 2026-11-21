import "server-only";
import { randomBytes } from "node:crypto";
import { authConfiguration } from "@/lib/server/auth-tokens";

export function cartCookie(request: Request) {
  const { secure } = authConfiguration();
  const name = secure ? "__Host-autoparts-cart" : "autoparts-cart";
  const entry = (request.headers.get("cookie") ?? "").split(";").map(value => value.trim()).find(value => value.startsWith(name + "="));
  const supplied = entry?.slice(name.length + 1);
  const token = supplied && /^[a-f0-9]{64}$/.test(supplied) ? supplied : randomBytes(32).toString("hex");
  return { token, header: `${name}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure ? "; Secure" : ""}` };
}

export function hasAuthCookie(request: Request): boolean {
  return /(?:^|;\s*)(?:__Secure-)?next-auth\.session-token(?:\.\d+)?=/.test(request.headers.get("cookie") ?? "");
}
