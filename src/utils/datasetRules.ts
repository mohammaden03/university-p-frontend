/**
 * Business rules and validation checks for HTR dataset preparation,
 * split allocations, and data-leakage prevention.
 */

export interface DatasetSample {
  id: string;
  manuscriptId: string;
  pageId: string;
  pageNumber: number;
  language: 'fa' | 'ar' | 'mixed';
  status: 'draft' | 'reviewed' | 'approved';
  split: 'train' | 'validation' | 'test' | 'unassigned';
  groundTruthText: string;
  originalAiText: string;
}

export interface DataLeakageWarning {
  hasLeakage: boolean;
  manuscriptId?: string;
  message?: string;
  conflictingSplits?: Array<'train' | 'validation' | 'test'>;
}

/**
 * Checks if assigning a manuscript page to a specific split causes
 * data leakage (i.e. pages belonging to the same manuscript being split across
 * both training and validation/test sets).
 */
export function checkDataLeakage(
  sampleId: string,
  targetSplit: 'train' | 'validation' | 'test' | 'unassigned',
  allSamples: DatasetSample[]
): DataLeakageWarning {
  if (targetSplit === 'unassigned') {
    return { hasLeakage: false };
  }

  const currentSample = allSamples.find((s) => s.id === sampleId);
  if (!currentSample) {
    return { hasLeakage: false };
  }

  const manuscriptId = currentSample.manuscriptId;

  // Find all other samples from the same manuscript that have an assigned split
  const relatedSamples = allSamples.filter(
    (s) => s.manuscriptId === manuscriptId && s.id !== sampleId && s.split !== 'unassigned'
  );

  const existingSplits = new Set<string>(relatedSamples.map((s) => s.split));

  // If target is train and existing splits include test or validation, or vice-versa
  if (targetSplit === 'train' && (existingSplits.has('test') || existingSplits.has('validation'))) {
    const conflicting = Array.from(existingSplits) as Array<'train' | 'validation' | 'test'>;
    return {
      hasLeakage: true,
      manuscriptId,
      conflictingSplits: conflicting,
      message: `هشدار نشت داده (Data Leakage): صفحات دیگری از این نسخه خطی در بخش‌های [${conflicting.join('، ')}] قرار دارند. تفکیک برگه‌های یک نسخه میان آموزش و آزمون دقت ارزیابی مدل HTR را مخدوش می‌کند.`,
    };
  }

  if ((targetSplit === 'test' || targetSplit === 'validation') && existingSplits.has('train')) {
    return {
      hasLeakage: true,
      manuscriptId,
      conflictingSplits: ['train'],
      message: `هشدار نشت داده (Data Leakage): صفحاتی از این نسخه خطی قبلاً به مجموعه داده آموزش (Train) اختصاص یافته‌اند. اختصاص این برگه به [${targetSplit}] منجر به همپوشانی سبکی/کاتبی می‌گردد.`,
    };
  }

  return { hasLeakage: false };
}

/**
 * Validates whether the dataset is ready for model training export.
 * Rules:
 * 1. Must have at least 1 sample in 'train' and 'test' or 'validation'
 * 2. Only 'approved' samples may be exported for training
 * 3. Train split must have non-empty ground truth text
 */
export function validateDatasetReadiness(samples: DatasetSample[]): {
  isReady: boolean;
  errors: string[];
  stats: {
    trainCount: number;
    validationCount: number;
    testCount: number;
    approvedCount: number;
  };
} {
  const errors: string[] = [];
  const trainSamples = samples.filter((s) => s.split === 'train');
  const valSamples = samples.filter((s) => s.split === 'validation');
  const testSamples = samples.filter((s) => s.split === 'test');
  const approvedSamples = samples.filter((s) => s.status === 'approved');

  if (trainSamples.length === 0) {
    errors.push('هیچ نمونه‌ای به مجموعه آموزش (Train) اختصاص نیافته است.');
  }

  if (testSamples.length === 0 && valSamples.length === 0) {
    errors.push('حداقل یک نمونه باید در مجموعه آزمون (Test) یا اعتبارسنجی (Validation) موجود باشد.');
  }

  const unapprovedInTrain = trainSamples.filter((s) => s.status !== 'approved');
  if (unapprovedInTrain.length > 0) {
    errors.push(`${unapprovedInTrain.length} نمونه در مجموعه آموزش هنوز تایید نهایی (Approved) نشده‌اند.`);
  }

  const emptyTextSamples = trainSamples.filter((s) => !s.groundTruthText || s.groundTruthText.trim().length === 0);
  if (emptyTextSamples.length > 0) {
    errors.push(`${emptyTextSamples.length} نمونه دارای متن برچسب‌گذاری شده تهی هستند.`);
  }

  return {
    isReady: errors.length === 0,
    errors,
    stats: {
      trainCount: trainSamples.length,
      validationCount: valSamples.length,
      testCount: testSamples.length,
      approvedCount: approvedSamples.length,
    },
  };
}
