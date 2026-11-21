import "server-only";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { serverFetch } from "@/lib/server/fetch";
import { ApiError } from "@/lib/api/contracts";
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
      let payload;
      try { payload = await serverFetch<{ user: { id: number } }>({ path: "/auth/login/", method: "POST", payload: { email: credentials.email, password: credentials.password } }); }
      catch (failure) {
        if (failure instanceof ApiError && [400, 401].includes(failure.status)) return null;
        if (failure instanceof ApiError && failure.status === 429) throw new Error("Too many sign-in attempts. Please wait and try again.");
        throw new Error("Sign-in is temporarily unavailable.");
      }
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
        await serverFetch<void>({ path: "/auth/logout/", method: "POST", accessToken: state.accessToken });
      } catch (failure) {
        if (!(failure instanceof SessionEnded)) console.error("Server-side logout revocation unavailable.");
      }
    },
  },
  logger: { error(code) { console.error("Authentication error:", code); }, warn(code) { console.warn("Authentication warning:", code); } },
  debug: false,
};
