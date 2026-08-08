function positiveSeconds(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function accessTokenTtlSeconds(): number {
  return positiveSeconds(process.env.ACCESS_TOKEN_TTL_SECONDS, 60);
}

export function refreshTokenTtlSeconds(): number {
  return positiveSeconds(
    process.env.REFRESH_TOKEN_TTL_SECONDS,
    60 * 60 * 24 * 7,
  );
}

export type TokenPair = { accessToken: string; refreshToken: string };
