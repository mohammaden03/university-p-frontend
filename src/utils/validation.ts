import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'نشانی رایانامه الزامی است')
    .email('فرمت نشانی رایانامه نامعتبر است'),
  password: z
    .string()
    .min(6, 'رمز عبور باید حداقل ۶ نویسه باشد'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'نام و نام خانوادگی باید حداقل ۲ نویسه باشد')
    .max(100, 'نام نمی‌تواند بیش از ۱۰۰ نویسه باشد'),
  email: z
    .string()
    .min(1, 'نشانی رایانامه الزامی است')
    .email('فرمت نشانی رایانامه نامعتبر است'),
  password: z
    .string()
    .min(6, 'رمز عبور باید حداقل ۶ نویسه باشد'),
  institution: z
    .string()
    .optional(),
  role: z.enum(['admin', 'researcher', 'annotator'] as const),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const manuscriptSchema = z.object({
  title: z
    .string()
    .min(2, 'عنوان نسخه خطی الزامی است')
    .max(200, 'عنوان نمی‌تواند بیش از ۲۰۰ نویسه باشد'),
  author: z
    .string()
    .min(2, 'نام پدیدآور یا کاتب الزامی است (یا «نامعلوم»)'),
  language: z.enum(['fa', 'ar', 'mixed'] as const),
  description: z
    .string()
    .min(5, 'شرح مختصر نسخه خطی الزامی است'),
  repositoryName: z
    .string()
    .min(2, 'محل نگهداری / کتابخانه الزامی است'),
  catalogId: z
    .string()
    .min(1, 'شناسه یا شماره بازیابی نسخه الزامی است'),
  historicalPeriod: z.enum(['timurid', 'safavid', 'ilkanid', 'qajar', 'abbasid', 'seljuk', 'other'] as const),
  scriptType: z.enum(['nastaliq', 'naskh', 'shekasteh', 'kufic', 'thuluth', 'taliq', 'muhaqqaq', 'other'] as const),
  sourceReference: z
    .string()
    .optional(),
  coverImageUrl: z
    .string()
    .url('نشانی تصویر جلد باید یک پیوند معتبر باشد')
    .optional()
    .or(z.literal('')),
});

export type ManuscriptFormData = z.infer<typeof manuscriptSchema>;

export const pageUploadSchema = z.object({
  manuscriptId: z.string().min(1, 'انتخاب نسخه خطی الزامی است'),
  pageNumber: z.coerce.number().min(1, 'شماره صفحه باید حداقل ۱ باشد'),
  language: z.enum(['fa', 'ar', 'mixed']),
  modelName: z.string().min(1, 'انتخاب مدل بازشناسی الزامی است'),
  notes: z.string().optional(),
});

export type PageUploadFormData = z.infer<typeof pageUploadSchema>;

export const revisionSchema = z.object({
  text: z.string().min(1, 'متن رونویسی نمی‌تواند خالی باشد'),
  note: z.string().optional(),
  status: z.enum(['reviewed', 'approved']).default('reviewed'),
});

export type RevisionFormData = z.infer<typeof revisionSchema>;
