import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loginSchema,
  registerSchema,
  manuscriptSchema,
  pageUploadSchema,
  revisionSchema,
} from './validation';

test('loginSchema validates email and password length', () => {
  // Invalid empty inputs
  const emptyRes = loginSchema.safeParse({ email: '', password: '' });
  assert.equal(emptyRes.success, false);

  // Invalid email
  const badEmailRes = loginSchema.safeParse({ email: 'invalid-email', password: '123' });
  assert.equal(badEmailRes.success, false);

  // Valid credentials
  const validRes = loginSchema.safeParse({ email: 'researcher@univ.ac.ir', password: 'validPassword123' });
  assert.equal(validRes.success, true);
});

test('registerSchema requires full name and valid role', () => {
  const invalidRes = registerSchema.safeParse({
    fullName: 'A',
    email: 'bad',
    password: 'short',
    role: 'invalid_role',
  });
  assert.equal(invalidRes.success, false);

  const validRes = registerSchema.safeParse({
    fullName: 'دکتر علوی',
    email: 'alavi@tehran.ac.ir',
    password: 'secretPassword',
    institution: 'دانشگاه تهران',
    role: 'researcher',
  });
  assert.equal(validRes.success, true);
});

test('manuscriptSchema validates required bibliographic fields and script type', () => {
  const invalidMs = manuscriptSchema.safeParse({
    title: '',
    author: '',
    catalogId: '',
  });
  assert.equal(invalidMs.success, false);

  const validMs = manuscriptSchema.safeParse({
    title: 'شاهنامه بایسنقری',
    author: 'فردوسی / کاتب: جعفر بایسنقری',
    language: 'fa',
    description: 'نسخه نفیس با نگاره‌های کهن و خط نستعلیق',
    repositoryName: 'کاخ گلستان',
    catalogId: 'IR-GST-716',
    historicalPeriod: 'timurid',
    scriptType: 'nastaliq',
    coverImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
  });
  assert.equal(validMs.success, true);
});

test('pageUploadSchema validates page numbers and language', () => {
  const invalid = pageUploadSchema.safeParse({
    manuscriptId: '',
    pageNumber: 0,
    language: 'fa',
    modelName: '',
  });
  assert.equal(invalid.success, false);

  const valid = pageUploadSchema.safeParse({
    manuscriptId: 'ms-1',
    pageNumber: 2,
    language: 'fa',
    modelName: 'PersianHTR-Transformer-v2.3',
  });
  assert.equal(valid.success, true);
});

test('revisionSchema ensures non-empty transcription text', () => {
  const invalid = revisionSchema.safeParse({ text: '', status: 'reviewed' });
  assert.equal(invalid.success, false);

  const valid = revisionSchema.safeParse({
    text: 'به نام خداوند جان و خرد',
    note: 'تصحیح اعراب',
    status: 'reviewed',
  });
  assert.equal(valid.success, true);
});
