/**
 * Pre-flight Secret Redactor and Detector
 * Prevents unintentional leakage of credentials and sensitive tokens to external AI services.
 */

export interface DetectedSecret {
  type: string;
  line: number;
  snippet: string;
}

export interface RedactionResult {
  sanitizedContent: string;
  hasSecrets: boolean;
  detectedSecrets: DetectedSecret[];
}

const SECRET_PATTERNS: { type: string; regex: RegExp }[] = [
  {
    type: 'AWS Access Key',
    regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
  },
  {
    type: 'Private RSA / OpenSSH Key',
    regex: /-----BEGIN(?:[A-Z ]+)?PRIVATE KEY-----[a-zA-Z0-9\s+/=]+-----END(?:[A-Z ]+)?PRIVATE KEY-----/g,
  },
  {
    type: 'GitHub Token',
    regex: /gh[pousr]_[A-Za-z0-9_]{36,255}/g,
  },
  {
    type: 'Generic High-Entropy API Key',
    regex: /(?:api[_-]?key|secret[_-]?key|access[_-]?token)[\s:=]+['"]?([a-zA-Z0-9_\-]{24,120})['"]?/gi,
  },
  {
    type: 'Database Connection String with Password',
    regex: /(?:mongodb(?:\+srv)?|postgres|postgresql|mysql|redis):\/\/[a-zA-Z0-9_]+:[^@\s]+@[a-zA-Z0-9.\-_]+(?::\d+)?\/[a-zA-Z0-9_]+/gi,
  },
  {
    type: 'Google Gemini / Cloud API Key',
    regex: /AIza[0-9A-Za-z-_]{35}/g,
  },
  {
    type: 'Slack Bot / User Token',
    regex: /xox[baprs]-[0-9a-zA-Z]{10,48}/g,
  },
];

export function redactSecrets(content: string): RedactionResult {
  const detectedSecrets: DetectedSecret[] = [];
  let sanitized = content;

  const lines = content.split('\n');

  for (const { type, regex } of SECRET_PATTERNS) {
    lines.forEach((line, lineIndex) => {
      let match: RegExpExecArray | null;
      const re = new RegExp(regex);
      while ((match = re.exec(line)) !== null) {
        detectedSecrets.push({
          type,
          line: lineIndex + 1,
          snippet: line.trim().substring(0, 80),
        });
      }
    });

    sanitized = sanitized.replace(regex, (match) => {
      return `[REDACTED_${type.toUpperCase().replace(/\s+/g, '_')}]`;
    });
  }

  return {
    sanitizedContent: sanitized,
    hasSecrets: detectedSecrets.length > 0,
    detectedSecrets,
  };
}
