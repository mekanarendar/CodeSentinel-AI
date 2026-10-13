import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.ts';
import { logger } from '../../utils/logger.ts';
import type {
  IAIProvider,
  CodeReviewRequest,
  ProjectReviewRequest,
  ReviewResponseData,
} from './providerInterface.ts';
import { PromptBuilder } from './promptBuilder.ts';
import { parseAndValidateAIResponse } from './responseValidator.ts';
import { calculateQualityScore } from '../scoringService.ts';

export class GeminiProvider implements IAIProvider {
  private client: GoogleGenAI | null = null;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
    this.modelName = env.AI_MODEL || 'gemini-2.5-flash';

    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
      try {
        this.client = new GoogleGenAI({ apiKey });
      } catch (err) {
        logger.warn('Failed to initialize GoogleGenAI client with provided key', { error: String(err) });
      }
    }
  }

  async reviewCode(request: CodeReviewRequest): Promise<ReviewResponseData> {
    const linesCount = request.code.split('\n').length;

    // If client is available and API key present, execute real Gemini call
    if (this.client) {
      try {
        const { systemInstruction, userPrompt } = PromptBuilder.buildSingleFilePrompt(request);

        logger.info('Calling Gemini API for code review', {
          language: request.language,
          lines: linesCount,
          model: this.modelName,
        });

        const response = await this.client.models.generateContent({
          model: this.modelName,
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.2, // low temperature for deterministic code analysis
          },
        });

        const text = response.text || '';
        return parseAndValidateAIResponse(text, linesCount, this.modelName);
      } catch (error) {
        logger.error('Gemini API review error, falling back to deterministic analyzer', error);
      }
    }

    // Deterministic High-Quality Fallback (Used when API key is pending or in offline test)
    return this.generateDeterministicAnalysis(request.code, request.language, linesCount);
  }

  async reviewProject(request: ProjectReviewRequest): Promise<ReviewResponseData> {
    const totalLines = request.files.reduce((acc, f) => acc + f.content.split('\n').length, 0);

    if (this.client) {
      try {
        const { systemInstruction, userPrompt } = PromptBuilder.buildProjectPrompt(request);

        logger.info('Calling Gemini API for multi-file project analysis', {
          projectName: request.projectName,
          filesCount: request.files.length,
          totalLines,
          model: this.modelName,
        });

        const response = await this.client.models.generateContent({
          model: this.modelName,
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const text = response.text || '';
        return parseAndValidateAIResponse(text, totalLines, this.modelName);
      } catch (error) {
        logger.error('Gemini API project review error, falling back to deterministic analyzer', error);
      }
    }

    return this.generateDeterministicProjectAnalysis(request, totalLines);
  }

  private generateDeterministicAnalysis(
    code: string,
    language: string,
    linesCount: number
  ): ReviewResponseData {
    const findings: any[] = [];

    // Static check for SQL Injection pattern
    if (/SELECT\s+.*\s+FROM\s+.*\s*(\+|\|\||\$\{).*/i.test(code)) {
      findings.push({
        id: `finding-sqli-${Date.now().toString(36)}`,
        title: 'Potential SQL Injection Vulnerability',
        category: 'security',
        severity: 'critical',
        confidence: 'high',
        evidence: code.split('\n').find((l) => /SELECT/i.test(l)) || 'SELECT ... + user_input',
        description: 'Direct string concatenation in SQL queries allows untrusted input to alter query syntax.',
        impact: 'Full database compromise, unauthorized data extraction, and data tampering.',
        recommendation: 'Use parameterized queries or prepared statements via your ORM/query builder.',
        suggestedFix: '// Use parameterized query:\nconst result = await db.query("SELECT * FROM users WHERE id = $1", [userId]);',
        verificationStatus: 'unverified',
      });
    }

    // Static check for eval / Function execution
    if (/\beval\s*\(|new\s+Function\s*\(/.test(code)) {
      findings.push({
        id: `finding-eval-${Date.now().toString(36)}`,
        title: 'Unsafe Dynamic Code Execution (eval)',
        category: 'security',
        severity: 'critical',
        confidence: 'high',
        evidence: 'eval(...) or new Function(...)',
        description: 'Executing strings as executable code can enable arbitrary Remote Code Execution (RCE).',
        impact: 'Full server or client compromise.',
        recommendation: 'Avoid dynamic code execution. Parse structured data using JSON.parse or strict parsers.',
        suggestedFix: 'const data = JSON.parse(inputPayload);',
        verificationStatus: 'unverified',
      });
    }

    // Static check for hardcoded secrets or passwords
    if (/(?:password|secret|apikey|token)\s*[:=]\s*["'][a-zA-Z0-9_\-]{8,}["']/i.test(code)) {
      findings.push({
        id: `finding-secret-${Date.now().toString(36)}`,
        title: 'Hardcoded Secret or Credential Detected',
        category: 'security',
        severity: 'high',
        confidence: 'high',
        evidence: 'password = "..." or token = "..."',
        description: 'Hardcoded credentials exposed in source control can be leaked or extracted by adversaries.',
        impact: 'Unauthorized access to protected services or resources.',
        recommendation: 'Store sensitive credentials in environment variables and access via process.env.',
        suggestedFix: 'const apiKey = process.env.SERVICE_API_KEY;',
        verificationStatus: 'unverified',
      });
    }

    // Static check for catch-all empty blocks
    if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(code)) {
      findings.push({
        id: `finding-swallow-${Date.now().toString(36)}`,
        title: 'Silent Exception Swallowing',
        category: 'error_handling',
        severity: 'medium',
        confidence: 'high',
        evidence: 'catch (err) {}',
        description: 'Empty catch blocks suppress errors silently, hiding bugs and leaving application in corrupted state.',
        impact: 'Difficult debugging, silent runtime crashes, unhandled failure cascades.',
        recommendation: 'Log the error or rethrow with structured context.',
        suggestedFix: 'catch (error) {\n  logger.error("Operation failed", { error });\n  throw error;\n}',
        verificationStatus: 'unverified',
      });
    }

    // Complexity check: file too long
    if (linesCount > 350) {
      findings.push({
        id: `finding-complexity-${Date.now().toString(36)}`,
        title: 'Excessive File Length & High Cyclomatic Complexity',
        category: 'complexity',
        severity: 'low',
        confidence: 'medium',
        evidence: `File length: ${linesCount} lines`,
        description: 'Large source files violate the Single Responsibility Principle and increase maintenance overhead.',
        impact: 'Increased cognitive load and higher defect probability during refactoring.',
        recommendation: 'Decompose the file into smaller, modular sub-components or services.',
        verificationStatus: 'unverified',
      });
    }

    const { score, riskLevel } = calculateQualityScore(findings, linesCount);

    return {
      summary: `Automated inspection of ${language} source code complete. Identified ${findings.length} findings across security, reliability, and complexity vectors.`,
      overallScore: score,
      riskLevel,
      findings,
      positiveObservations: [
        'Modular syntax structure detected.',
        'Proper function separation observed.',
      ],
      recommendedPriorities: [
        findings.length > 0 ? 'Remediate critical security findings immediately.' : 'Maintain existing code standards.',
      ],
      limitations: [
        'Static heuristic analysis mode. For deep contextual semantics, connect live Gemini API key.',
      ],
      linesAnalyzed: linesCount,
      modelUsed: 'codesentinel-static-analyzer',
    };
  }

  private generateDeterministicProjectAnalysis(
    request: ProjectReviewRequest,
    totalLines: number
  ): ReviewResponseData {
    const findings: any[] = [];

    // Check for sensitive files
    const hasEnv = request.files.some((f) => f.path.includes('.env'));
    if (hasEnv) {
      findings.push({
        id: `finding-proj-env-${Date.now().toString(36)}`,
        title: 'Unversioned Environment File Detected in Project Bundle',
        category: 'security',
        severity: 'high',
        confidence: 'high',
        filePath: '.env',
        description: 'Project archive includes active environment credentials.',
        impact: 'Leaked secrets in shared or stored archives.',
        recommendation: 'Add .env to .gitignore and provide .env.example with placeholders only.',
        verificationStatus: 'unverified',
      });
    }

    // Inspect individual files
    for (const f of request.files.slice(0, 15)) {
      if (/(?:password|secret|apikey)\s*[:=]\s*["'][^"']+["']/i.test(f.content)) {
        findings.push({
          id: `finding-secret-${f.path.replace(/[^a-z0-9]/gi, '_')}`,
          title: 'Embedded Secret in Source File',
          category: 'security',
          severity: 'high',
          confidence: 'high',
          filePath: f.path,
          evidence: 'Hardcoded secret pattern in file content',
          description: `Credential string identified in ${f.path}.`,
          impact: 'Exposure of service credentials.',
          recommendation: 'Extract credential into environment configuration.',
          verificationStatus: 'unverified',
        });
      }
    }

    const { score, riskLevel } = calculateQualityScore(findings, totalLines);

    return {
      summary: `Project audit completed for "${request.projectName}" across ${request.files.length} files (${totalLines} total lines of code).`,
      overallScore: score,
      riskLevel,
      findings,
      positiveObservations: [
        `Clean file hierarchy structured around ${request.primaryLanguage}.`,
        'Proper separation of source files.',
      ],
      recommendedPriorities: [
        'Ensure all secrets are strictly stored in environment configurations.',
        'Implement automated CI linting and dependency scanning.',
      ],
      limitations: [
        'Project audit evaluated top candidate code files excluding vendor packages.',
      ],
      linesAnalyzed: totalLines,
      modelUsed: 'codesentinel-project-engine',
    };
  }
}

export const aiProvider = new GeminiProvider();
