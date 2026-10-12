import { IReview, IFinding } from '../models/Review.ts';

export interface ReviewComparisonResult {
  baselineReviewId: string;
  targetReviewId: string;
  scoreDelta: number;
  newFindings: IFinding[];
  resolvedFindings: IFinding[];
  persistentFindings: IFinding[];
  summary: string;
}

export function compareReviews(baseline: IReview, target: IReview): ReviewComparisonResult {
  const baselineFindings = baseline.findings || [];
  const targetFindings = target.findings || [];

  // Match key generator (title + category + evidence snippet or approximate location)
  const getKey = (f: IFinding) => `${f.category}:${f.title.toLowerCase().trim()}`;

  const baselineMap = new Map<string, IFinding>();
  for (const f of baselineFindings) {
    baselineMap.set(getKey(f), f);
  }

  const targetMap = new Map<string, IFinding>();
  for (const f of targetFindings) {
    targetMap.set(getKey(f), f);
  }

  const newFindings: IFinding[] = [];
  const persistentFindings: IFinding[] = [];
  const resolvedFindings: IFinding[] = [];

  for (const [key, targetFinding] of targetMap.entries()) {
    if (baselineMap.has(key)) {
      persistentFindings.push(targetFinding);
    } else {
      newFindings.push(targetFinding);
    }
  }

  for (const [key, baseFinding] of baselineMap.entries()) {
    if (!targetMap.has(key)) {
      resolvedFindings.push(baseFinding);
    }
  }

  const scoreDelta = (target.overallScore || 0) - (baseline.overallScore || 0);

  let summary = `Comparison indicates a score change of ${scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta} points. `;
  if (resolvedFindings.length > 0) {
    summary += `${resolvedFindings.length} issue(s) were successfully resolved. `;
  }
  if (newFindings.length > 0) {
    summary += `${newFindings.length} new issue(s) were introduced. `;
  }
  if (persistentFindings.length > 0) {
    summary += `${persistentFindings.length} persistent issue(s) still require remediation.`;
  }

  return {
    baselineReviewId: (baseline._id || (baseline as any).id).toString(),
    targetReviewId: (target._id || (target as any).id).toString(),
    scoreDelta,
    newFindings,
    resolvedFindings,
    persistentFindings,
    summary,
  };
}
