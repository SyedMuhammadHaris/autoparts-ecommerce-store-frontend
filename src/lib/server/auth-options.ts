import "server-only";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { backendConfiguration } from "@/lib/server/backend";
import { readTokenPair, refreshTokens, SessionEnded } from "@/lib/server/auth-tokens";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 86400 },
  pages: { signIn: "/login", error: "/login" },
  providers: [CredentialsProvider({
    name: "Email and password",
    credentials: { email: { type: "email" }, password: { type: "password" } },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password || credentials.email.length > 255 || credentials.password.length > 128) return null;
      const { baseUrl, timeoutMs } = backendConfiguration();
      const response = await fetch(`${baseUrl}/auth/login/`, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: credentials.email, password: credentials.password }), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.status === 400 || response.status === 401) return null;
      if (response.status === 429) throw new Error("Too many sign-in attempts. Please wait and try again.");
      if (!response.ok) throw new Error("Sign-in is temporarily unavailable.");
      const payload = await response.json();
      const pair = readTokenPair(payload);
      if (!Number.isSafeInteger(payload.user?.id)) throw new Error("Sign-in is temporarily unavailable.");
      return { id: String(payload.user.id), accessToken: pair.access, refreshToken: pair.refresh, accessExpiresAt: pair.access_expires_at, refreshExpiresAt: pair.refresh_expires_at };
    },
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) return { sub: user.id, accessToken: user.accessToken, refreshToken: user.refreshToken, accessExpiresAt: user.accessExpiresAt, refreshExpiresAt: user.refreshExpiresAt };
      try { return await refreshTokens(token); }
      catch (failure) {
        if (failure instanceof SessionEnded) return { sub: token.sub, authError: "SessionExpired" };
        // A temporary outage must not destroy otherwise recoverable refresh credentials.
        return token;
      }
    },
    async session({ session, token }) {
      // Never expose bearer tokens through /api/auth/session or useSession().
      return { expires: session.expires, authError: token.authError };
    },
  },
  events: {
    async signOut({ token }) {
      if (!token) return;
      try {
        const state = await refreshTokens(token);
        const { baseUrl, timeoutMs } = backendConfiguration();
        const response = await fetch(`${baseUrl}/auth/logout/`, { method: "POST", headers: { Authorization: `Bearer ${state.accessToken}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(timeoutMs) });
        if (!response.ok && response.status !== 401) throw new Error("Revocation unavailable");
      } catch (failure) {
        if (!(failure instanceof SessionEnded)) console.error("Server-side logout revocation unavailable.");
      }
    },
  },
  logger: { error(code) { console.error("Authentication error:", code); }, warn(code) { console.warn("Authentication warning:", code); } },
  debug: false,
};
