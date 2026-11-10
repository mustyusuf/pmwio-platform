import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";

/** Passwords for new accounts and password changes must be at least this long. */
export const MIN_PASSWORD_LENGTH = 8;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Compared against when no account matches a login, so "no such user" takes as
// long as "wrong password" and response time can't be used to find real accounts.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);
export function burnPasswordCheck(plain: string): Promise<boolean> {
  return bcrypt.compare(plain, DUMMY_HASH);
}

/** Fields to write when a password changes: the new hash, and revoke all existing sessions. */
export async function passwordUpdate(plain: string) {
  return { passwordHash: await hashPassword(plain), sessionsValidFrom: new Date() };
}

// Unambiguous alphabet (no O/0, I/1) for readable, shareable IDs.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Generates a human-friendly public User ID such as "PMW-7F3K9Q". */
export function generateUserId(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `PMW-${code}`;
}

/** Generates a short application reference such as "F6N6TO8B". */
export function generateReference(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}
