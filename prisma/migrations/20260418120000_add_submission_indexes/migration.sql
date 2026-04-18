-- CreateIndex
CREATE INDEX "DocumentSubmission_studentId_idx" ON "DocumentSubmission"("studentId");

-- CreateIndex
CREATE INDEX "DocumentSubmission_mobilityRecordId_idx" ON "DocumentSubmission"("mobilityRecordId");

-- CreateIndex
CREATE INDEX "SubmissionEvent_submissionId_idx" ON "SubmissionEvent"("submissionId");

-- CreateIndex
CREATE INDEX "AuditRecord_targetId_idx" ON "AuditRecord"("targetId");
