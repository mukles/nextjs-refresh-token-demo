import type { AuthenticatedUser } from "../auth/auth.service";

declare global {
  namespace Express {
    interface Request {
      /** Set by {@link JwtAuthGuard} once the access token verifies. */
      user?: AuthenticatedUser;
      /** The verified access token, for handlers that re-enter AuthService. */
      accessToken?: string;
    }
  }
}
