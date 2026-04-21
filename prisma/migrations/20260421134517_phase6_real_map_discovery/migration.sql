/*
  Warnings:

  - Added the required column `latitude` to the `PlaceContext` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `PlaceContext` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlaceContext" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "erasmusScopeTag" TEXT NOT NULL DEFAULT 'general_erasmus_support',
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_PlaceContext" ("category", "city", "country", "createdAt", "id", "isPublic", "label", "latitude", "longitude")
SELECT "category", "city", "country", "createdAt", "id", "isPublic", "label", 41.3874, 2.1686 FROM "PlaceContext";
DROP TABLE "PlaceContext";
ALTER TABLE "new_PlaceContext" RENAME TO "PlaceContext";
CREATE INDEX "PlaceContext_city_idx" ON "PlaceContext"("city");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
