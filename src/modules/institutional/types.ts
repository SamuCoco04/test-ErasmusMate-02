type MobilityRecordBase = {
  id: string;
  studentId: string;
  coordinatorId: string;
  institutionId: string;
  state: string;
  destinationCity: string;
  mobilityType: string;
  mobilityPhase: string;
};

type DeadlineItemBase = {
  id: string;
  title: string;
  dueAt: string;
  overrideDueAt: string | null;
  effectiveState: string;
};

export type StudentDeadlineItem = DeadlineItemBase & {
  mobilityRecord: MobilityRecordBase;
};

export type CoordinatorDeadlineItem = DeadlineItemBase & {
  mobilityRecord: MobilityRecordBase & {
    student: {
      fullName: string;
    };
  };
};

/** @deprecated Use StudentDeadlineItem or CoordinatorDeadlineItem */
export type DeadlineItem = StudentDeadlineItem | CoordinatorDeadlineItem;

type ExceptionItemBase = {
  id: string;
  scopeType: string;
  reason: string;
  decisionRationale: string | null;
  state: string;
};

export type StudentExceptionItem = ExceptionItemBase;

export type CoordinatorExceptionItem = ExceptionItemBase & {
  student: {
    fullName: string;
  };
};

/** @deprecated Use StudentExceptionItem or CoordinatorExceptionItem */
export type ExceptionItem = StudentExceptionItem | CoordinatorExceptionItem;
