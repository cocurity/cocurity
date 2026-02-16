import { Grade, Verdict } from "@prisma/client";

export function computeScore(criticalCount: number, warningCount: number) {
  const score = Math.max(0, 100 - criticalCount * 30 - warningCount * 10);
  let grade: Grade = Grade.READY;
  let verdict: Verdict = Verdict.LAUNCH_READY;

  if (criticalCount >= 1) {
    grade = Grade.BLOCK;
    verdict = Verdict.BLOCKED;
  } else if (warningCount >= 1) {
    grade = Grade.CAUTION;
  }

  return { score, grade, verdict };
}
