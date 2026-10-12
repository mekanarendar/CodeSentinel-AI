import { Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { DataStore } from '../models/dataStore.ts';
import { aiProvider } from '../services/ai/geminiProvider.ts';
import { redactSecrets } from '../services/security/secretRedactor.ts';
import { extractProjectArchive } from '../services/security/archiveExtractor.ts';
import { compareReviews } from '../services/comparisonService.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';
import { logger } from '../utils/logger.ts';

export const analyzeCodeSchema = z.object({
  code: z.string().min(1, 'Source code cannot be empty').max(200000, 'Code size exceeds limit (max 200KB)'),
  language: z.string().default('typescript'),
  title: z.string().optional(),
  projectId: z.string().optional(),
});

export const ReviewController = {
  async analyzeCode(req: Request, res: Response) {
    const startTime = Date.now();
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const { code, language, title, projectId } = req.body;

      // Pre-flight Secret Redaction
      const { sanitizedContent, hasSecrets, detectedSecrets } = redactSecrets(code);
      if (hasSecrets) {
        logger.warn('Detected secrets in user code submission. Redaction applied before AI processing.', {
          userId: req.user.id,
          secretCount: detectedSecrets.length,
        });
      }

      // SHA256 of original code for duplicate and integrity tracking
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');

      // AI Analysis Call
      const aiResult = await aiProvider.reviewCode({
        code: sanitizedContent,
        language,
        filename: title,
      });

      const executionTimeMs = Date.now() - startTime;

      // Compute stats
      const stats = {
        totalFindings: aiResult.findings.length,
        criticalCount: aiResult.findings.filter((f) => f.severity === 'critical').length,
        highCount: aiResult.findings.filter((f) => f.severity === 'high').length,
        mediumCount: aiResult.findings.filter((f) => f.severity === 'medium').length,
        lowCount: aiResult.findings.filter((f) => f.severity === 'low').length,
        infoCount: aiResult.findings.filter((f) => f.severity === 'info').length,
        linesOfCodeAnalyzed: aiResult.linesAnalyzed,
        executionTimeMs,
      };

      // Save Review to Database
      const reviewTitle = title || `${language.toUpperCase()} Analysis (${new Date().toLocaleDateString()})`;
      const createdReview = await DataStore.createReview({
        userId: req.user.id as any,
        projectId: projectId ? (projectId as any) : undefined,
        type: 'single-file',
        title: reviewTitle,
        language,
        codeSnippetPreview: code.substring(0, 300),
        codeHash,
        overallScore: aiResult.overallScore,
        riskLevel: aiResult.riskLevel,
        summary: aiResult.summary,
        findings: aiResult.findings,
        positiveObservations: aiResult.positiveObservations,
        recommendedPriorities: aiResult.recommendedPriorities,
        limitations: aiResult.limitations,
        stats,
      });

      logger.info('Code review completed and persisted', {
        reviewId: createdReview._id || createdReview.id,
        score: aiResult.overallScore,
        findingsCount: aiResult.findings.length,
      });

      return sendSuccess(
        res,
        {
          review: createdReview,
          redactionInfo: {
            secretsDetected: hasSecrets,
            secretTypes: detectedSecrets.map((s) => s.type),
          },
        },
        'Analysis completed successfully',
        201
      );
    } catch (error) {
      logger.error('Error during code analysis', error);
      return sendError(res, 'Failed to complete code review analysis', 500);
    }
  },

  async analyzeProjectUpload(req: Request, res: Response) {
    const startTime = Date.now();
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      if (!req.file || !req.file.buffer) {
        return sendError(res, 'No project ZIP archive uploaded', 400);
      }

      const projectName = (req.body.projectName as string) || 'Analyzed Project';
      const projectId = req.body.projectId as string | undefined;

      // Extract ZIP securely with Zip Slip defense
      const extraction = extractProjectArchive(req.file.buffer);

      if (extraction.files.length === 0) {
        return sendError(res, 'No valid source code files found in archive. Ensure .zip contains readable code.', 400);
      }

      // Execute AI Project Review
      const aiResult = await aiProvider.reviewProject({
        files: extraction.files.map((f) => ({
          path: f.path,
          content: f.content,
          language: f.extension.replace('.', ''),
        })),
        projectName,
        primaryLanguage: extraction.primaryLanguage,
      });

      const executionTimeMs = Date.now() - startTime;
      const stats = {
        totalFindings: aiResult.findings.length,
        criticalCount: aiResult.findings.filter((f) => f.severity === 'critical').length,
        highCount: aiResult.findings.filter((f) => f.severity === 'high').length,
        mediumCount: aiResult.findings.filter((f) => f.severity === 'medium').length,
        lowCount: aiResult.findings.filter((f) => f.severity === 'low').length,
        infoCount: aiResult.findings.filter((f) => f.severity === 'info').length,
        linesOfCodeAnalyzed: aiResult.linesAnalyzed,
        executionTimeMs,
      };

      const codeHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

      const review = await DataStore.createReview({
        userId: req.user.id as any,
        projectId: projectId ? (projectId as any) : undefined,
        type: 'project',
        title: `${projectName} Project Audit`,
        language: extraction.primaryLanguage,
        codeSnippetPreview: `${extraction.totalFiles} files analyzed (${extraction.excludedCount} excluded)`,
        codeHash,
        overallScore: aiResult.overallScore,
        riskLevel: aiResult.riskLevel,
        summary: aiResult.summary,
        findings: aiResult.findings,
        positiveObservations: aiResult.positiveObservations,
        recommendedPriorities: aiResult.recommendedPriorities,
        limitations: aiResult.limitations,
        stats,
      });

      return sendSuccess(
        res,
        {
          review,
          projectStats: {
            totalFilesAnalyzed: extraction.totalFiles,
            excludedFiles: extraction.excludedCount,
            detectedSecretsCount: extraction.allSecrets.length,
          },
        },
        'Project archive analysis complete',
        201
      );
    } catch (error) {
      logger.error('Project upload analysis error', error);
      return sendError(res, 'Failed to analyze project archive', 500);
    }
  },

  async listReviews(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const { projectId, language, limit } = req.query;

      const reviews = await DataStore.findReviewsByUser(req.user.id, {
        projectId: projectId as string,
        language: language as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });

      return sendSuccess(res, reviews);
    } catch (error) {
      return sendError(res, 'Failed to list reviews', 500);
    }
  },

  async getReview(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const { id } = req.params;
      const review = await DataStore.findReviewById(id, req.user.id);

      if (!review) {
        return sendError(res, 'Review not found or access denied', 404);
      }

      return sendSuccess(res, review);
    } catch (error) {
      return sendError(res, 'Failed to fetch review', 500);
    }
  },

  async deleteReview(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const { id } = req.params;
      const deleted = await DataStore.deleteReview(id, req.user.id);

      if (!deleted) {
        return sendError(res, 'Review not found or access denied', 404);
      }

      return sendSuccess(res, { deleted: true }, 'Review deleted');
    } catch (error) {
      return sendError(res, 'Failed to delete review', 500);
    }
  },

  async compare(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const { baselineId, targetId } = req.body;
      if (!baselineId || !targetId) {
        return sendError(res, 'Both baselineId and targetId are required', 400);
      }

      const baseline = await DataStore.findReviewById(baselineId, req.user.id);
      const target = await DataStore.findReviewById(targetId, req.user.id);

      if (!baseline || !target) {
        return sendError(res, 'One or both reviews could not be found or belong to another user', 404);
      }

      const comparison = compareReviews(baseline, target);
      return sendSuccess(res, comparison);
    } catch (error) {
      return sendError(res, 'Failed to compare reviews', 500);
    }
  },

  async exportReport(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const { id } = req.params;
      const review = await DataStore.findReviewById(id, req.user.id);
      if (!review) return sendError(res, 'Review not found', 404);

      const format = req.query.format || 'json';

      if (format === 'html') {
        const findingsList = (review.findings || [])
          .map(
            (f: any) => `
          <div style="border-left: 4px solid ${f.severity === 'critical' ? '#ef4444' : f.severity === 'high' ? '#f97316' : '#eab308'}; padding: 12px; margin-bottom: 12px; background: #f8fafc;">
            <h4 style="margin: 0 0 6px 0;">[${f.severity.toUpperCase()}] ${f.title} (${f.category})</h4>
            <p style="margin: 4px 0;"><strong>Description:</strong> ${f.description}</p>
            <p style="margin: 4px 0;"><strong>Impact:</strong> ${f.impact}</p>
            <p style="margin: 4px 0;"><strong>Recommendation:</strong> ${f.recommendation}</p>
            ${f.suggestedFix ? `<pre style="background: #1e293b; color: #f8fafc; padding: 8px; border-radius: 4px; overflow-x: auto;"><code>${f.suggestedFix}</code></pre>` : ''}
          </div>`
          )
          .join('');

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>CodeSentinel AI Audit Report - ${review.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-weight: bold; background: #0284c7; color: white; }
    .stat-box { display: inline-block; width: 180px; padding: 12px; background: #f1f5f9; border-radius: 8px; margin-right: 12px; }
  </style>
</head>
<body>
  <h1>CodeSentinel AI Audit Report</h1>
  <p><strong>Review Title:</strong> ${review.title}</p>
  <p><strong>Date:</strong> ${new Date(review.createdAt).toUTCString()}</p>
  <p><strong>Overall Quality Score:</strong> <span class="badge">${review.overallScore} / 100</span> (Risk: ${review.riskLevel.toUpperCase()})</p>
  
  <div>
    <div class="stat-box"><strong>Total Findings:</strong> ${review.stats?.totalFindings || 0}</div>
    <div class="stat-box"><strong>Critical:</strong> ${review.stats?.criticalCount || 0}</div>
    <div class="stat-box"><strong>High:</strong> ${review.stats?.highCount || 0}</div>
  </div>

  <h3>Executive Summary</h3>
  <p>${review.summary}</p>

  <h3>Detailed Findings</h3>
  ${findingsList || '<p>No findings detected. Code adheres to configured quality standards.</p>'}
</body>
</html>`;
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
      }

      return sendSuccess(res, review);
    } catch (error) {
      return sendError(res, 'Failed to export report', 500);
    }
  },
};
