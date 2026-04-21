export type DeadlineItem = {
  id: string;
  title: string;
  dueAt: string;
  overrideDueAt: string | null;
  effectiveState: string;
  mobilityRecord: {
    student: {
      fullName: string;
    };
  };
};

export type ExceptionItem = {
  id: string;
  scopeType: string;
  reason: string;
  decisionRationale: string | null;
  state: string;
  student: {
    fullName: string;
  };
};
