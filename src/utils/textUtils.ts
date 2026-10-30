/**
 * Pure utility functions for Persian and Arabic manuscript text processing,
 * normalization, search snippet extraction, and OCR error metrics (CER / WER).
 */

// Common Persian/Arabic diacritics (Harakat)
const DIACRITICS_REGEX = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

// Normalization mappings for Persian/Arabic character variants
const CHAR_MAP: Record<string, string> = {
  'ي': 'ی',
  'ى': 'ی',
  'ك': 'ک',
  'ة': 'ه',
  'ؤ': 'و',
  'إ': 'ا',
  'أ': 'ا',
  'آ': 'ا',
  'ء': '',
  '٠': '۰',
  '١': '۱',
  '٢': '۲',
  '٣': '۳',
  '٤': '۴',
  '٥': '۵',
  '٦': '۶',
  '٧': '۷',
  '٨': '۸',
  '٩': '۹',
};

/**
 * Normalizes Persian and Arabic text for robust search matching:
 * - Removes diacritical marks (Tashdid, Fathah, Dammah, Kasrah, etc.)
 * - Unifies Yeh/Kaf characters
 * - Unifies Arabic numerals to Persian numerals
 * - Normalizes whitespaces
 */
export function normalizePersianArabicText(input: string): string {
  if (!input) return '';
  let text = input.replace(DIACRITICS_REGEX, '');
  text = text.replace(/[يكةؤإأآء٠-٩]/g, (char) => CHAR_MAP[char] ?? char);
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Extracts a contextual snippet around a search query match
 * while preserving valid Persian/Arabic word boundaries.
 */
export function extractSearchSnippet(fullText: string, query: string, maxRadius = 50): { snippet: string; hasMatch: boolean } {
  if (!fullText) return { snippet: '', hasMatch: false };
  if (!query || query.trim() === '') {
    return {
      snippet: fullText.length > maxRadius * 2 ? fullText.substring(0, maxRadius * 2) + '...' : fullText,
      hasMatch: false,
    };
  }

  const normText = normalizePersianArabicText(fullText).toLowerCase();
  const normQuery = normalizePersianArabicText(query).toLowerCase();
  const matchIndex = normText.indexOf(normQuery);

  if (matchIndex === -1) {
    return {
      snippet: fullText.length > maxRadius * 2 ? fullText.substring(0, maxRadius * 2) + '...' : fullText,
      hasMatch: false,
    };
  }

  // Find approximate start and end around the match in original text
  const start = Math.max(0, matchIndex - maxRadius);
  const end = Math.min(fullText.length, matchIndex + query.length + maxRadius);

  let snippet = fullText.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < fullText.length) snippet = snippet + '...';

  return { snippet, hasMatch: true };
}

/**
 * Levenshtein Distance for character-level edit distance.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Computes Character Error Rate (CER) between reference (ground truth) and hypothesis (AI output).
 * CER = (Levenshtein Distance) / (Length of Reference)
 * Returns a percentage value (0.0 to 100.0).
 */
export function computeCER(reference: string, hypothesis: string): number {
  const refClean = reference.trim();
  const hypClean = hypothesis.trim();
  if (refClean.length === 0) return hypClean.length === 0 ? 0 : 100;
  const dist = levenshteinDistance(refClean, hypClean);
  return Number(((dist / refClean.length) * 100).toFixed(2));
}

/**
 * Computes Word Error Rate (WER) between reference and hypothesis text.
 */
export function computeWER(reference: string, hypothesis: string): number {
  const refWords = reference.trim().split(/\s+/).filter(Boolean);
  const hypWords = hypothesis.trim().split(/\s+/).filter(Boolean);

  if (refWords.length === 0) return hypWords.length === 0 ? 0 : 100;

  const m = refWords.length;
  const n = hypWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = refWords[i - 1] === hypWords[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return Number(((dp[m][n] / m) * 100).toFixed(2));
}
