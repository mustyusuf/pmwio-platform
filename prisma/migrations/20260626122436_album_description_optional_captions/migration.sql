-- AlterTable
ALTER TABLE "Album" ADD COLUMN "description" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GalleryImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "caption" TEXT,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "albumId" TEXT,
    CONSTRAINT "GalleryImage_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GalleryImage" ("active", "albumId", "caption", "category", "createdAt", "id", "mimeType", "order", "size", "storedName") SELECT "active", "albumId", "caption", "category", "createdAt", "id", "mimeType", "order", "size", "storedName" FROM "GalleryImage";
DROP TABLE "GalleryImage";
ALTER TABLE "new_GalleryImage" RENAME TO "GalleryImage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
