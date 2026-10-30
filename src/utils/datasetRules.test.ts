import test from 'node:test';
import assert from 'node:assert/strict';
import { checkDataLeakage, validateDatasetReadiness, DatasetSample } from './datasetRules';

const mockSamples: DatasetSample[] = [
  {
    id: 's1',
    manuscriptId: 'ms-baysunghur',
    pageId: 'p1',
    pageNumber: 1,
    language: 'fa',
    status: 'approved',
    split: 'train',
    groundTruthText: 'به نام خداوند جان و خرد',
    originalAiText: 'به نام خداوند جان و خرد',
  },
  {
    id: 's2',
    manuscriptId: 'ms-baysunghur',
    pageId: 'p2',
    pageNumber: 2,
    language: 'fa',
    status: 'reviewed',
    split: 'unassigned',
    groundTruthText: 'کزین برتر اندیشه برنگذرد',
    originalAiText: 'کزین برتر اندیشه برنگذرد',
  },
  {
    id: 's3',
    manuscriptId: 'ms-hafez',
    pageId: 'p10',
    pageNumber: 1,
    language: 'fa',
    status: 'approved',
    split: 'test',
    groundTruthText: 'الا یا ایها الساقی ادر کأسا و ناولها',
    originalAiText: 'الا یا ایها الساقی',
  },
];

test('checkDataLeakage warns when assigning same manuscript across train and test', () => {
  // s2 has manuscriptId 'ms-baysunghur', which is already in 'train' via s1
  const leakWarning = checkDataLeakage('s2', 'test', mockSamples);
  assert.equal(leakWarning.hasLeakage, true);
  assert.match(leakWarning.message || '', /نشت داده/);

  // Assigning s2 to train should have no cross-split leakage
  const safeAssignment = checkDataLeakage('s2', 'train', mockSamples);
  assert.equal(safeAssignment.hasLeakage, false);
});

test('validateDatasetReadiness correctly identifies ready or unapproved datasets', () => {
  const readySamples: DatasetSample[] = [
    {
      id: '1',
      manuscriptId: 'm1',
      pageId: 'p1',
      pageNumber: 1,
      language: 'fa',
      status: 'approved',
      split: 'train',
      groundTruthText: 'متن تایید شده',
      originalAiText: 'متن تایید شده',
    },
    {
      id: '2',
      manuscriptId: 'm2',
      pageId: 'p2',
      pageNumber: 1,
      language: 'ar',
      status: 'approved',
      split: 'test',
      groundTruthText: 'نص موثق',
      originalAiText: 'نص موثق',
    },
  ];

  const check = validateDatasetReadiness(readySamples);
  assert.equal(check.isReady, true);
  assert.equal(check.errors.length, 0);

  // If one in train is not approved
  readySamples[0].status = 'draft';
  const unreadyCheck = validateDatasetReadiness(readySamples);
  assert.equal(unreadyCheck.isReady, false);
  assert.ok(unreadyCheck.errors.length > 0);
});
