import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    accessToken?: string;
    refreshToken?: string;
    accessExpiresAt?: number;
    refreshExpiresAt?: number;
  }
  interface Session { authError?: "SessionExpired" }
}
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessExpiresAt?: number;
    refreshExpiresAt?: number;
    authError?: "SessionExpired";
  }
}
