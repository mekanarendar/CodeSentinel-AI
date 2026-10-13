import type { IFinding } from '../../models/Review.ts';

export interface CodeReviewRequest {
  code: string;
  language: string;
  filename?: string;
  context?: string;
}

export interface ProjectReviewRequest {
  files: { path: string; content: string; language: string }[];
  projectName: string;
  primaryLanguage: string;
}

export interface ReviewResponseData {
  summary: string;
  overallScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'clean';
  findings: IFinding[];
  positiveObservations: string[];
  recommendedPriorities: string[];
  limitations: string[];
  linesAnalyzed: number;
  modelUsed: string;
}

export interface IAIProvider {
  reviewCode(request: CodeReviewRequest): Promise<ReviewResponseData>;
  reviewProject(request: ProjectReviewRequest): Promise<ReviewResponseData>;
}
