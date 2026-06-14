import bcrypt from "bcryptjs";

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Unambiguous alphabet (no O/0, I/1) for readable, shareable IDs.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Generates a human-friendly public User ID such as "PMW-7F3K9Q". */
export function generateUserId(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `PMW-${code}`;
}

/** Generates a short application reference such as "F6N6TO8B". */
export function generateReference(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}
