-- CreateTable
CREATE TABLE "PlaceContext" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SocialContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "authorProfileId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "rating" INTEGER,
    "destinationCity" TEXT NOT NULL,
    "topicCategory" TEXT NOT NULL,
    "placeContextId" TEXT,
    "state" TEXT NOT NULL,
    "moderationState" TEXT NOT NULL DEFAULT 'VISIBLE',
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SocialContent_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "UserAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SocialContent_authorProfileId_fkey" FOREIGN KEY ("authorProfileId") REFERENCES "SocialSupportProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SocialContent_placeContextId_fkey" FOREIGN KEY ("placeContextId") REFERENCES "PlaceContext" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialFavorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "socialContentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SocialFavorite_socialContentId_fkey" FOREIGN KEY ("socialContentId") REFERENCES "SocialContent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModerationReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetContentId" TEXT,
    "reportReason" TEXT NOT NULL,
    "reportDetails" TEXT,
    "state" TEXT NOT NULL DEFAULT 'reported',
    "reportedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "moderationCaseId" TEXT,
    CONSTRAINT "ModerationReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "UserAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ModerationReport_targetContentId_fkey" FOREIGN KEY ("targetContentId") REFERENCES "SocialContent" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ModerationReport_moderationCaseId_fkey" FOREIGN KEY ("moderationCaseId") REFERENCES "ModerationCase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModerationCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "targetType" TEXT NOT NULL,
    "targetContentId" TEXT,
    "caseState" TEXT NOT NULL,
    "thresholdTriggered" BOOLEAN NOT NULL DEFAULT false,
    "outcomeSummary" TEXT,
    "moderationAction" TEXT,
    "moderatorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    CONSTRAINT "ModerationCase_targetContentId_fkey" FOREIGN KEY ("targetContentId") REFERENCES "SocialContent" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ModerationCase_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "UserAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PlaceContext_city_idx" ON "PlaceContext"("city");

-- CreateIndex
CREATE INDEX "SocialContent_authorId_idx" ON "SocialContent"("authorId");

-- CreateIndex
CREATE INDEX "SocialContent_destinationCity_idx" ON "SocialContent"("destinationCity");

-- CreateIndex
CREATE INDEX "SocialContent_kind_idx" ON "SocialContent"("kind");

-- CreateIndex
CREATE INDEX "SocialContent_state_moderationState_idx" ON "SocialContent"("state", "moderationState");

-- CreateIndex
CREATE INDEX "SocialFavorite_userId_createdAt_idx" ON "SocialFavorite"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SocialFavorite_userId_socialContentId_key" ON "SocialFavorite"("userId", "socialContentId");

-- CreateIndex
CREATE INDEX "ModerationReport_targetType_targetContentId_idx" ON "ModerationReport"("targetType", "targetContentId");

-- CreateIndex
CREATE INDEX "ModerationReport_state_reportedAt_idx" ON "ModerationReport"("state", "reportedAt");

-- CreateIndex
CREATE INDEX "ModerationCase_caseState_updatedAt_idx" ON "ModerationCase"("caseState", "updatedAt");

-- CreateIndex
CREATE INDEX "ModerationCase_targetType_targetContentId_idx" ON "ModerationCase"("targetType", "targetContentId");
