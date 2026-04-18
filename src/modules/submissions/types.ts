export const transitionActions = [
  'submit',
  'start_review',
  'approve',
  'reject',
  'reopen',
  'resubmit'
] as const;

export type TransitionAction = (typeof transitionActions)[number];
