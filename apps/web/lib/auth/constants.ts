export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

export const ACCESS_EXPIRY_SKEW_SECONDS = 10;

export const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
