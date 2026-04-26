-- CreateTable
CREATE TABLE "LearningAgreement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "mobilityRecordId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "coordinatorId" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "submittedAt" DATETIME,
  "lastReviewedAt" DATETIME,
  "acceptedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "LearningAgreement_mobilityRecordId_fkey" FOREIGN KEY ("mobilityRecordId") REFERENCES "MobilityRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "LearningAgreement_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "UserAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "LearningAgreement_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "UserAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LearningAgreementRow" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "agreementId" TEXT NOT NULL,
  "rowKey" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "supersedesRowId" TEXT,
  "isLatest" BOOLEAN NOT NULL DEFAULT true,
  "homeCourseCode" TEXT NOT NULL,
  "homeCourseName" TEXT NOT NULL,
  "destinationCourseCode" TEXT NOT NULL,
  "destinationCourseName" TEXT NOT NULL,
  "ects" REAL NOT NULL,
  "semester" TEXT NOT NULL,
  "grade" TEXT,
  "status" TEXT NOT NULL,
  "decisionRationale" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "LearningAgreementRow_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "LearningAgreement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "LearningAgreementRow_supersedesRowId_fkey" FOREIGN KEY ("supersedesRowId") REFERENCES "LearningAgreementRow" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "LearningAgreementRow_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "UserAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LearningAgreementEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "agreementId" TEXT NOT NULL,
  "rowId" TEXT,
  "actorId" TEXT NOT NULL,
  "actionType" TEXT NOT NULL,
  "fromState" TEXT,
  "toState" TEXT,
  "noteOrRationale" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LearningAgreementEvent_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "LearningAgreement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "LearningAgreementEvent_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "LearningAgreementRow" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "LearningAgreementEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningAgreement_mobilityRecordId_key" ON "LearningAgreement"("mobilityRecordId");
CREATE INDEX "LearningAgreement_studentId_idx" ON "LearningAgreement"("studentId");
CREATE INDEX "LearningAgreement_coordinatorId_idx" ON "LearningAgreement"("coordinatorId");
CREATE INDEX "LearningAgreement_state_idx" ON "LearningAgreement"("state");

CREATE UNIQUE INDEX "LearningAgreementRow_agreementId_rowKey_revision_key" ON "LearningAgreementRow"("agreementId", "rowKey", "revision");
CREATE INDEX "LearningAgreementRow_agreementId_isLatest_idx" ON "LearningAgreementRow"("agreementId", "isLatest");
CREATE INDEX "LearningAgreementRow_agreementId_status_isLatest_idx" ON "LearningAgreementRow"("agreementId", "status", "isLatest");

CREATE INDEX "LearningAgreementEvent_agreementId_createdAt_idx" ON "LearningAgreementEvent"("agreementId", "createdAt");
CREATE INDEX "LearningAgreementEvent_rowId_idx" ON "LearningAgreementEvent"("rowId");
