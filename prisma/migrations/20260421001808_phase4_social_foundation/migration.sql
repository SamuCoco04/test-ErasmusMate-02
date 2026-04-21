-- CreateTable
CREATE TABLE "SocialSupportProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mobilityRecordId" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "languages" TEXT,
    "interests" TEXT,
    "profileState" TEXT NOT NULL,
    "discoverable" BOOLEAN NOT NULL DEFAULT false,
    "contactable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SocialSupportProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SocialSupportProfile_mobilityRecordId_fkey" FOREIGN KEY ("mobilityRecordId") REFERENCES "MobilityRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialVisibilitySettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "showHeadline" BOOLEAN NOT NULL DEFAULT true,
    "showBio" BOOLEAN NOT NULL DEFAULT false,
    "showLanguages" BOOLEAN NOT NULL DEFAULT true,
    "showInterests" BOOLEAN NOT NULL DEFAULT true,
    "showDestination" BOOLEAN NOT NULL DEFAULT true,
    "showHostInstitution" BOOLEAN NOT NULL DEFAULT true,
    "showCity" BOOLEAN NOT NULL DEFAULT true,
    "showMobilityPeriod" BOOLEAN NOT NULL DEFAULT true,
    "showMobilityStage" BOOLEAN NOT NULL DEFAULT true,
    "directContactExposed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SocialVisibilitySettings_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "SocialSupportProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialConsentSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "discoverabilityConsent" BOOLEAN NOT NULL DEFAULT false,
    "contactabilityConsent" BOOLEAN NOT NULL DEFAULT false,
    "consentRevokedAt" DATETIME,
    CONSTRAINT "SocialConsentSettings_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "SocialSupportProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterProfileId" TEXT NOT NULL,
    "recipientProfileId" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "initiatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    "closedAt" DATETIME,
    "blockedByUserId" TEXT,
    CONSTRAINT "SocialConnection_requesterProfileId_fkey" FOREIGN KEY ("requesterProfileId") REFERENCES "SocialSupportProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SocialConnection_recipientProfileId_fkey" FOREIGN KEY ("recipientProfileId") REFERENCES "SocialSupportProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SocialConnection_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "UserAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SocialConnection_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "UserAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SocialConnection_blockedByUserId_fkey" FOREIGN KEY ("blockedByUserId") REFERENCES "UserAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MessageThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "connectionId" TEXT NOT NULL,
    "permissionState" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MessageThread_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "SocialConnection" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MessageThread" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "UserAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialSupportProfile_userId_key" ON "SocialSupportProfile"("userId");

-- CreateIndex
CREATE INDEX "SocialSupportProfile_discoverable_idx" ON "SocialSupportProfile"("discoverable");

-- CreateIndex
CREATE INDEX "SocialSupportProfile_contactable_idx" ON "SocialSupportProfile"("contactable");

-- CreateIndex
CREATE UNIQUE INDEX "SocialVisibilitySettings_profileId_key" ON "SocialVisibilitySettings"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialConsentSettings_profileId_key" ON "SocialConsentSettings"("profileId");

-- CreateIndex
CREATE INDEX "SocialConnection_requesterUserId_idx" ON "SocialConnection"("requesterUserId");

-- CreateIndex
CREATE INDEX "SocialConnection_recipientUserId_idx" ON "SocialConnection"("recipientUserId");

-- CreateIndex
CREATE INDEX "SocialConnection_state_idx" ON "SocialConnection"("state");

-- CreateIndex
CREATE UNIQUE INDEX "MessageThread_connectionId_key" ON "MessageThread"("connectionId");

-- CreateIndex
CREATE INDEX "Message_threadId_sentAt_idx" ON "Message"("threadId", "sentAt");
