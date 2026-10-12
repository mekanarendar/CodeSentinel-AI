export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Category = 'security' | 'bug' | 'performance' | 'maintainability' | 'complexity' | 'best_practice';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'clean';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  preferences?: {
    theme: 'dark' | 'light' | 'system';
    autoRedactSecrets: boolean;
    defaultLanguage: string;
  };
}

export interface Finding {
  id: string;
  title: string;
  category: Category;
  severity: Severity;
  confidence: 'high' | 'medium' | 'low';
  filePath?: string;
  lineNumber?: number;
  evidence: string;
  description: string;
  impact: string;
  recommendation: string;
  suggestedFix?: string;
  verificationStatus: 'unverified' | 'confirmed' | 'false_positive';
}

export interface ReviewStats {
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  linesOfCodeAnalyzed: number;
  executionTimeMs: number;
}

export interface Review {
  _id?: string;
  id?: string;
  userId: string;
  projectId?: string;
  type: 'single-file' | 'project';
  title: string;
  language: string;
  codeSnippetPreview?: string;
  codeHash?: string;
  overallScore: number;
  riskLevel: RiskLevel;
  summary: string;
  findings: Finding[];
  positiveObservations: string[];
  recommendedPriorities: string[];
  limitations: string[];
  stats: ReviewStats;
  createdAt: string;
}

export interface Project {
  _id?: string;
  id?: string;
  userId: string;
  name: string;
  description?: string;
  repositoryUrl?: string;
  primaryLanguage: string;
  latestScore: number;
  totalReviews: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalReviews: number;
  totalProjects: number;
  criticalVulnerabilities: number;
  highSeverityIssues: number;
  mediumSeverityIssues: number;
  lowSeverityIssues: number;
  averageQualityScore: number;
  languages: Record<string, number>;
  recentReviews: Review[];
}

export interface ComparisonResult {
  baselineReviewId: string;
  targetReviewId: string;
  scoreDelta: number;
  newFindings: Finding[];
  resolvedFindings: Finding[];
  persistentFindings: Finding[];
  summary: string;
}

export interface SystemHealth {
  status: string;
  uptime: number;
  environment: string;
  database: {
    connected: boolean;
    mode: string;
    host: string;
    database: string;
  };
  capabilities: {
    jwtAuth: boolean;
    secretRedaction: boolean;
    archiveExtraction: boolean;
    deterministicScoring: boolean;
    aiProvider: string;
  };
}
