import { z } from 'zod';
import type { IFinding } from '../../models/Review.ts';
import { calculateQualityScore } from '../scoringService.ts';
import type { ReviewResponseData } from './providerInterface.ts';

const findingSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  category: z.enum(['security', 'bug', 'performance', 'maintainability', 'complexity', 'best_practice']).catch('best_practice'),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']).catch('medium'),
  confidence: z.enum(['high', 'medium', 'low']).catch('medium'),
  filePath: z.string().optional(),
  lineNumber: z.coerce.number().optional(),
  evidence: z.string().optional().default(''),
  description: z.string().default(''),
  impact: z.string().optional().default(''),
  recommendation: z.string().default(''),
  suggestedFix: z.string().optional(),
  verificationStatus: z.enum(['unverified', 'confirmed', 'false_positive']).default('unverified'),
});

const aiResponseSchema = z.object({
  summary: z.string().default('Analysis complete.'),
  findings: z.array(findingSchema).default([]),
  positiveObservations: z.array(z.string()).default([]),
  recommendedPriorities: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
});

export function parseAndValidateAIResponse(
  rawText: string,
  linesAnalyzed = 100,
  modelUsed = 'gemini-2.5-flash'
): ReviewResponseData {
  let cleaned = rawText.trim();

  // Strip markdown code block wrappers if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  let parsedJson: any;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch (err) {
    // Attempt relaxed regex JSON extraction if JSON was prefixed with chatter
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsedJson = JSON.parse(jsonMatch[0]);
      } catch (innerErr) {
        throw new Error('Failed to parse AI output into valid JSON format.');
      }
    } else {
      throw new Error('AI returned non-JSON response.');
    }
  }

  const validated = aiResponseSchema.parse(parsedJson);

  // Normalize findings with reliable UUIDs and types
  const normalizedFindings: IFinding[] = validated.findings.map((f, idx) => ({
    id: f.id || `finding-${idx + 1}-${Date.now().toString(36)}`,
    title: f.title,
    category: f.category as any,
    severity: f.severity as any,
    confidence: f.confidence as any,
    filePath: f.filePath,
    lineNumber: f.lineNumber,
    evidence: f.evidence || '',
    description: f.description || f.title,
    impact: f.impact || 'Potential functional or security risk',
    recommendation: f.recommendation || 'Review and refactor code according to best practices',
    suggestedFix: f.suggestedFix,
    verificationStatus: 'unverified',
  }));

  // Deterministic quality scoring calculation
  const { score, riskLevel } = calculateQualityScore(normalizedFindings, linesAnalyzed);

  return {
    summary: validated.summary,
    overallScore: score,
    riskLevel,
    findings: normalizedFindings,
    positiveObservations: validated.positiveObservations,
    recommendedPriorities: validated.recommendedPriorities,
    limitations: validated.limitations,
    linesAnalyzed,
    modelUsed,
  };
}
