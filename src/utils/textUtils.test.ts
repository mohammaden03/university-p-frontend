import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePersianArabicText,
  extractSearchSnippet,
  computeCER,
  computeWER,
  levenshteinDistance,
} from './textUtils';

test('normalizePersianArabicText unifies Arabic and Persian character variants and removes diacritics', () => {
  // Test diacritics removal and character normalization
  const input = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ كِتَابٌ عَلِيّ';
  const normalized = normalizePersianArabicText(input);
  assert.equal(normalized, 'بسم الله الرحمن الرحیم کتاب علی');

  // Test Yeh/Kaf and numeral normalization
  const arabicVariants = 'يوسف كتب ١٢٣٤٥';
  assert.equal(normalizePersianArabicText(arabicVariants), 'یوسف کتب ۱۲۳۴۵');
});

test('extractSearchSnippet finds query position and extracts context window', () => {
  const text = 'به نام خداوند جان و خرد کزین برتر اندیشه برنگذرد خداوند نام و خداوند جای خداوند روزی ده رهنمای';
  const result = extractSearchSnippet(text, 'اندیشه برنگذرد', 20);

  assert.equal(result.hasMatch, true);
  assert.match(result.snippet, /اندیشه برنگذرد/);
});

test('levenshteinDistance calculates correct edit distance', () => {
  assert.equal(levenshteinDistance('نستعلیق', 'نستعلیق'), 0);
  assert.equal(levenshteinDistance('نستعلیق', 'نستعلیق خط'), 3);
  assert.equal(levenshteinDistance('کتاب', 'کتابه'), 1);
});

test('computeCER and computeWER calculate error rates properly', () => {
  const groundTruth = 'به نام خداوند جان و خرد';
  const aiOutputExact = 'به نام خداوند جان و خرد';
  assert.equal(computeCER(groundTruth, aiOutputExact), 0);
  assert.equal(computeWER(groundTruth, aiOutputExact), 0);

  const aiOutputWithDiff = 'به نام خداوند جان و خرداد';
  const cer = computeCER(groundTruth, aiOutputWithDiff);
  assert.ok(cer > 0 && cer < 20);
});
