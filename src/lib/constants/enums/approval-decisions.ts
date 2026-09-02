export const APPROVAL_DECISION_VALUES = ["pending", "approved", "rejected"] as const;

export type ApprovalDecision = (typeof APPROVAL_DECISION_VALUES)[number];

export const APPROVAL_DECISIONS = Object.fromEntries(
  APPROVAL_DECISION_VALUES.map((decision) => [decision.toUpperCase(), decision]),
) as {
  [K in Uppercase<ApprovalDecision>]: Lowercase<K>;
};
