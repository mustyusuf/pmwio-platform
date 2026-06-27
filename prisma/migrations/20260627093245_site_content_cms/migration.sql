-- CreateTable
CREATE TABLE "SiteContent" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "updatedAt" DATETIME NOT NULL
);
