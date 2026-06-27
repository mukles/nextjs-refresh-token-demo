import bcrypt from "bcryptjs";

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
};

export type StoredRefreshToken = {
  token: string;
  familyId: string;
  userId: string;
  used: boolean;
  expiresAt: number;
};

const DEMO_USER: User = {
  id: "user_1",
  email: "demo@example.com",
  name: "Demo User",
  passwordHash: bcrypt.hashSync("password123", 10),
};

export const users = new Map<string, User>([[DEMO_USER.email, DEMO_USER]]);

export const refreshTokens = new Map<string, StoredRefreshToken>();

export function findUserByEmail(email: string): User | undefined {
  return users.get(email);
}

export function findUserById(id: string): User | undefined {
  for (const user of users.values()) {
    if (user.id === id) return user;
  }
  return undefined;
}

export function revokeFamily(familyId: string): void {
  for (const [token, record] of refreshTokens) {
    if (record.familyId === familyId) refreshTokens.delete(token);
  }
}
