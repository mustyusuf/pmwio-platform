-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "boardQuorum" INTEGER NOT NULL DEFAULT 2,
    "executiveQuorum" INTEGER NOT NULL DEFAULT 2,
    "empowermentOpen" BOOLEAN NOT NULL DEFAULT false,
    "memberValidationOpen" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("boardQuorum", "empowermentOpen", "executiveQuorum", "id", "updatedAt") SELECT "boardQuorum", "empowermentOpen", "executiveQuorum", "id", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
