// Production bootstrap seed — creates the first administrator account.
//
// This is intentionally separate from src/lib/seed.ts (which WIPES the database
// and loads demo data). This script is idempotent and non-destructive: it never
// deletes anything, and if the admin account already exists it does nothing.
//
// Run once after the first deploy:  npx prisma db seed
//
// Credentials are read from environment variables:
//   SEED_ADMIN_EMAIL     (default: admin@piousmuslimwomen.org.ng)
//   SEED_ADMIN_NAME      (default: PMWIO Administrator)
//   SEED_ADMIN_ROLE      (default: EXECUTIVE — the top role; can manage users)
//   SEED_ADMIN_PASSWORD  (optional: if unset, a strong random one is generated
//                         and printed once below)
import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Unambiguous alphabet (no O/0, I/1), matching src/lib/auth.ts.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateUserId(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `PMW-${code}`;
}

const VALID_ROLES = ["EXECUTIVE", "BOARD", "ADMIN", "FINANCE", "COORDINATOR", "MEMBER", "BENEFICIARY"];

async function main() {
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
  const prisma = new PrismaClient({ adapter });

  try {
    // Ensure the Settings singleton exists — approval/quorum logic depends on it.
    await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" }, // boardQuorum/executiveQuorum/empowermentOpen use schema defaults
    });

    const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@piousmuslimwomen.org.ng").trim().toLowerCase();
    const name = process.env.SEED_ADMIN_NAME ?? "PMWIO Administrator";
    const role = (process.env.SEED_ADMIN_ROLE ?? "EXECUTIVE").toUpperCase();

    if (!VALID_ROLES.includes(role)) {
      throw new Error(`SEED_ADMIN_ROLE="${role}" is invalid. Use one of: ${VALID_ROLES.join(", ")}`);
    }

    // Use the provided password, or generate a strong random one and print it.
    const provided = process.env.SEED_ADMIN_PASSWORD;
    const password = provided && provided.length > 0 ? provided : randomBytes(12).toString("base64url");
    const passwordHash = await bcrypt.hash(password, 10);

    const reset = ["1", "true", "yes"].includes((process.env.SEED_ADMIN_RESET_PASSWORD ?? "").toLowerCase());
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (!reset) {
        console.log(`✓ Admin account already exists (${email}, ${existing.userId}). Nothing to do.`);
        console.log("  (To reset its password, re-run with SEED_ADMIN_RESET_PASSWORD=true)");
        return;
      }
      await prisma.user.update({ where: { email }, data: { passwordHash, active: true, approved: true } });
      console.log(`✓ Password reset for existing admin (${email}, ${existing.userId}).`);
      if (!provided) console.log(`  New password: ${password}  (shown only once)`);
      return;
    }

    // Generate a unique public userId.
    let userId = generateUserId();
    while (await prisma.user.findUnique({ where: { userId } })) userId = generateUserId();

    await prisma.user.create({
      data: { name, email, role, userId, passwordHash, active: true, approved: true },
    });

    console.log("\n========================================");
    console.log("  First admin account created");
    console.log("========================================");
    console.log(`  Name:     ${name}`);
    console.log(`  Email:    ${email}`);
    console.log(`  User ID:  ${userId}`);
    console.log(`  Role:     ${role}`);
    if (!provided) {
      console.log(`  Password: ${password}`);
      console.log("  ^ Save this now — it is shown only once. Change it after first login.");
    } else {
      console.log("  Password: (from SEED_ADMIN_PASSWORD)");
    }
    console.log("========================================\n");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
