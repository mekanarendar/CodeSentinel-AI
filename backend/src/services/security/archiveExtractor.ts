import AdmZip from 'adm-zip';
import path from 'path';
import { redactSecrets, DetectedSecret } from './secretRedactor.ts';

export interface ExtractedFile {
  path: string;
  name: string;
  extension: string;
  content: string;
  size: number;
  detectedSecrets: DetectedSecret[];
}

export interface ArchiveExtractionResult {
  files: ExtractedFile[];
  totalFiles: number;
  excludedCount: number;
  allSecrets: DetectedSecret[];
  primaryLanguage: string;
}

const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  '.svn',
  'dist',
  'build',
  'out',
  'coverage',
  '.next',
  '.cache',
  'vendor',
  '__pycache__',
];

const EXCLUDED_FILES = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  'id_rsa',
  'id_ed25519',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
];

const CODE_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx',
  '.py', '.java', '.c', '.cpp', '.h', '.hpp',
  '.cs', '.go', '.php', '.rb', '.rs',
  '.html', '.htm', '.css', '.scss',
  '.sql', '.sh', '.bash', '.json', '.yaml', '.yml'
]);

export function extractProjectArchive(
  zipBuffer: Buffer,
  maxFiles = 200,
  maxFileSize = 1024 * 1024 // 1MB per file
): ArchiveExtractionResult {
  const zip = new AdmZip(zipBuffer);
  const zipEntries = zip.getEntries();

  const extractedFiles: ExtractedFile[] = [];
  const allSecrets: DetectedSecret[] = [];
  let excludedCount = 0;
  const langCounts: Record<string, number> = {};

  for (const entry of zipEntries) {
    if (entry.isDirectory) continue;

    const rawPath = entry.entryName.replace(/\\/g, '/');
    const normalized = path.normalize(rawPath).replace(/^(\.\.[\/\\])+/, '');

    // Zip Slip defense: ensure no path traversal
    if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
      excludedCount++;
      continue;
    }

    const segments = normalized.split('/');
    const fileName = segments[segments.length - 1];
    const ext = path.extname(fileName).toLowerCase();

    // Check directory exclusions
    if (segments.some((seg) => EXCLUDED_DIRS.includes(seg))) {
      excludedCount++;
      continue;
    }

    // Check file exclusions
    if (EXCLUDED_FILES.includes(fileName) || fileName.endsWith('.pem') || fileName.endsWith('.key')) {
      excludedCount++;
      continue;
    }

    // Check allowed extensions and file size limit
    if (!CODE_EXTENSIONS.has(ext) || entry.header.size > maxFileSize) {
      excludedCount++;
      continue;
    }

    if (extractedFiles.length >= maxFiles) {
      break;
    }

    const rawContent = entry.getData().toString('utf8');
    const { sanitizedContent, detectedSecrets } = redactSecrets(rawContent);

    if (detectedSecrets.length > 0) {
      allSecrets.push(
        ...detectedSecrets.map((s) => ({
          ...s,
          snippet: `[${normalized}:${s.line}] ${s.snippet}`,
        }))
      );
    }

    extractedFiles.push({
      path: normalized,
      name: fileName,
      extension: ext,
      content: sanitizedContent,
      size: entry.header.size,
      detectedSecrets,
    });

    const langName = ext.replace('.', '');
    langCounts[langName] = (langCounts[langName] || 0) + 1;
  }

  // Detect dominant language
  let dominantLang = 'javascript';
  let maxCount = 0;
  for (const [lang, count] of Object.entries(langCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantLang = lang;
    }
  }

  return {
    files: extractedFiles,
    totalFiles: extractedFiles.length,
    excludedCount,
    allSecrets,
    primaryLanguage: dominantLang,
  };
}
