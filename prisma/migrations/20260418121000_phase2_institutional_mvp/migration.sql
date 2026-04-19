-- AlterTable
ALTER TABLE "MobilityRecord" ADD COLUMN "mobilityPhase" TEXT NOT NULL DEFAULT 'DURING_MOBILITY';

-- AlterTable
ALTER TABLE "ProcedureDefinition" ADD COLUMN "phase" TEXT NOT NULL DEFAULT 'DURING_MOBILITY';

-- CreateTable
CREATE TABLE "ProcedureApplicabilityRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "procedureDefinitionId" TEXT NOT NULL,
    "destinationCity" TEXT,
    "mobilityType" TEXT,
    "lifecyclePhase" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ProcedureApplicabilityRule_procedureDefinitionId_fkey" FOREIGN KEY ("procedureDefinitionId") REFERENCES "ProcedureDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Deadline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mobilityRecordId" TEXT NOT NULL,
    "procedureDefinitionId" TEXT,
    "title" TEXT NOT NULL,
    "dueAt" DATETIME NOT NULL,
    "overrideDueAt" DATETIME,
    "state" TEXT NOT NULL,
    "obligationType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deadline_mobilityRecordId_fkey" FOREIGN KEY ("mobilityRecordId") REFERENCES "MobilityRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Deadline_procedureDefinitionId_fkey" FOREIGN KEY ("procedureDefinitionId") REFERENCES "ProcedureDefinition" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExceptionRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mobilityRecordId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeRefId" TEXT,
    "reason" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "decisionRationale" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExceptionRequest_mobilityRecordId_fkey" FOREIGN KEY ("mobilityRecordId") REFERENCES "MobilityRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExceptionRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "UserAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExceptionEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exceptionId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "fromState" TEXT,
    "toState" TEXT NOT NULL,
    "rationale" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExceptionEvent_exceptionId_fkey" FOREIGN KEY ("exceptionId") REFERENCES "ExceptionRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExceptionEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProcedureApplicabilityRule_procedureDefinitionId_idx" ON "ProcedureApplicabilityRule"("procedureDefinitionId");

-- CreateIndex
CREATE INDEX "Deadline_mobilityRecordId_idx" ON "Deadline"("mobilityRecordId");

-- CreateIndex
CREATE INDEX "Deadline_dueAt_idx" ON "Deadline"("dueAt");

-- CreateIndex
CREATE INDEX "ExceptionRequest_mobilityRecordId_idx" ON "ExceptionRequest"("mobilityRecordId");

-- CreateIndex
CREATE INDEX "ExceptionRequest_studentId_idx" ON "ExceptionRequest"("studentId");

-- CreateIndex
CREATE INDEX "ExceptionRequest_state_idx" ON "ExceptionRequest"("state");

-- CreateIndex
CREATE INDEX "ExceptionEvent_exceptionId_idx" ON "ExceptionEvent"("exceptionId");
