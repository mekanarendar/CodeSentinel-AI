import { IFinding } from '../models/Review.ts';

export interface ScoreCalculationResult {
  score: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'clean';
  breakdown: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    infoCount: number;
    totalDeductions: number;
    formula: string;
  };
}

const SEVERITY_WEIGHTS = {
  critical: 25,
  high: 15,
  medium: 7,
  low: 2,
  info: 0,
};

export function calculateQualityScore(
  findings: IFinding[],
  linesOfCode = 100
): ScoreCalculationResult {
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let infoCount = 0;

  for (const f of findings) {
    switch (f.severity) {
      case 'critical':
        criticalCount++;
        break;
      case 'high':
        highCount++;
        break;
      case 'medium':
        mediumCount++;
        break;
      case 'low':
        lowCount++;
        break;
      case 'info':
        infoCount++;
        break;
    }
  }

  // Base deductions from weighted findings
  const rawDeduction =
    criticalCount * SEVERITY_WEIGHTS.critical +
    highCount * SEVERITY_WEIGHTS.high +
    mediumCount * SEVERITY_WEIGHTS.medium +
    lowCount * SEVERITY_WEIGHTS.low;

  // Scale factor: dampen deduction for larger projects so a 5,000 line repo isn't zeroed by 2 low issues
  const locFactor = Math.max(1, Math.log10(Math.max(10, linesOfCode)) / 2);
  const normalizedDeduction = Math.round(rawDeduction / locFactor);

  const finalScore = Math.max(0, Math.min(100, 100 - normalizedDeduction));

  let riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'clean' = 'clean';
  if (criticalCount > 0 || finalScore < 40) {
    riskLevel = 'critical';
  } else if (highCount > 0 || finalScore < 65) {
    riskLevel = 'high';
  } else if (mediumCount > 1 || finalScore < 85) {
    riskLevel = 'medium';
  } else if (lowCount > 0 || finalScore < 95) {
    riskLevel = 'low';
  }

  return {
    score: finalScore,
    riskLevel,
    breakdown: {
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      infoCount,
      totalDeductions: normalizedDeduction,
      formula: 'Score = max(0, 100 - (Sum(Severity_Count * Weight) / Log10(LOC_Factor)))',
    },
  };
}
