/**
 * Full-stack NestJS-compatible Express API Server + Vite dev middleware runner.
 * Powers the Persian & Arabic Manuscript HTR/OCR Research Platform.
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration for NestJS client integration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// --- In-Memory Repository & Realistic Seed Data ---

interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'admin' | 'researcher' | 'annotator';
  institution: string;
  createdAt: string;
}

const users: UserRecord[] = [
  {
    id: 'usr-1',
    email: 'admin@manuscript-htr.ir',
    passwordHash: 'admin123',
    fullName: 'دکتر محمد علوی (مدیر ارشد)',
    role: 'admin',
    institution: 'مرکز پژوهشی نسخ خطی دانشگاه تهران',
    createdAt: '2025-01-10T08:00:00Z',
  },
  {
    id: 'usr-2',
    email: 'researcher@manuscript-htr.ir',
    passwordHash: 'research123',
    fullName: 'مریم حسینی (پژوهشگر خط‌شناسی)',
    role: 'researcher',
    institution: 'پژوهشکده اسناد و نسخه‌های کهن',
    createdAt: '2025-02-15T09:30:00Z',
  },
  {
    id: 'usr-3',
    email: 'annotator@manuscript-htr.ir',
    passwordHash: 'annot123',
    fullName: 'علی رضایی (کارشناس تصحیح)',
    role: 'annotator',
    institution: 'کتابخانه ملی ایران',
    createdAt: '2025-03-01T11:00:00Z',
  },
];

interface ManuscriptRecord {
  id: string;
  title: string;
  author: string;
  language: 'fa' | 'ar' | 'mixed';
  description: string;
  repositoryName: string;
  catalogId: string;
  historicalPeriod: 'timurid' | 'safavid' | 'ilkanid' | 'qajar' | 'abbasid' | 'seljuk' | 'other';
  scriptType: 'nastaliq' | 'naskh' | 'shekasteh' | 'kufic' | 'thuluth' | 'taliq' | 'muhaqqaq' | 'other';
  sourceReference?: string;
  totalPages: number;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const manuscripts: ManuscriptRecord[] = [
  {
    id: 'ms-baysunghur',
    title: 'شاهنامه بایسنقری (مقدمه و دیباچه)',
    author: 'ابوالقاسم فردوسی / کاتب: جعفر بایسنقری',
    language: 'fa',
    description: 'یکی از شاهکارهای نگارگری و خوشنویسی مکتب هرات در عصر تیموری. نگاشته شده به خط نستعلیق جلی و خفی با تذهیب زرین و لاجوردی.',
    repositoryName: 'کاخ موزه گلستان، تهران',
    catalogId: 'IR-GST-716',
    historicalPeriod: 'timurid',
    scriptType: 'nastaliq',
    sourceReference: 'شماره ثبت میراث جهانی یونسکو: ۷۱۶-ب',
    totalPages: 24,
    coverImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    createdAt: '2025-01-12T10:00:00Z',
    updatedAt: '2025-03-15T14:20:00Z',
  },
  {
    id: 'ms-hafez',
    title: 'دیوان خواجه شمس‌الدین حافظ شیرازی',
    author: 'حافظ شیرازی / کاتب: عبدالمجید طالقانی',
    language: 'fa',
    description: 'نسخه نفیس خط شکسته نستعلیق قرن دوازدهم هجری با سرلوح مذهب و تشعیر حاشیه‌ای. شامل غزلیات همراه با تصحیحات حاشیه‌ای دانشمندان کهن.',
    repositoryName: 'کتابخانه مجلس شورای اسلامی',
    catalogId: 'LIB-MAJ-4482',
    historicalPeriod: 'safavid',
    scriptType: 'shekasteh',
    sourceReference: 'گنجینه کتب خطی مجلس، ردیف ۹۴',
    totalPages: 18,
    coverImageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80',
    createdAt: '2025-01-20T12:00:00Z',
    updatedAt: '2025-03-20T16:00:00Z',
  },
  {
    id: 'ms-saadi',
    title: 'گلستان سعدی (باب اول: در سیرت پادشاهان)',
    author: 'مصلح‌الدین سعدی شیرازی / کاتب: میرعلی هروی',
    language: 'fa',
    description: 'نسخه خطی به خط خوش نستعلیق و سرلوح ثلث بر کاغذ دولت‌آبادی با جدول‌کشی زرین و حواشی منقش.',
    repositoryName: 'کتابخانه ملی جمهوری اسلامی ایران',
    catalogId: 'NLAI-MSS-1903',
    historicalPeriod: 'timurid',
    scriptType: 'nastaliq',
    sourceReference: 'فهرست نسخه‌های خطی کتابخانه ملی، جلد پنجم',
    totalPages: 16,
    coverImageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e35b32?auto=format&fit=crop&w=800&q=80',
    createdAt: '2025-02-05T09:00:00Z',
    updatedAt: '2025-03-18T10:15:00Z',
  },
  {
    id: 'ms-kufic-quran',
    title: 'مصحف شریف کهن (برگه‌هایی از خط کوفی مشرقی)',
    author: 'نامعلوم (کتابت سده سوم و چهارم هجری)',
    language: 'ar',
    description: 'برگه‌های پوستی از قرآن مجید با خط کوفی اصیل، اعجام سرخ‌رنگ و فواصل آیات با نشانه‌های زرین هشت‌پر.',
    repositoryName: 'موزه و مرکز اسناد آستان قدس رضوی',
    catalogId: 'AQR-QUR-108',
    historicalPeriod: 'abbasid',
    scriptType: 'kufic',
    sourceReference: 'مجموعه قرآن‌های منسوب به ائمه اطهار (ع)',
    totalPages: 12,
    coverImageUrl: 'https://images.unsplash.com/photo-1507842229458-577630623a22?auto=format&fit=crop&w=800&q=80',
    createdAt: '2025-02-14T11:20:00Z',
    updatedAt: '2025-03-22T08:45:00Z',
  },
  {
    id: 'ms-kalila',
    title: 'کلیله و دمنه بهرام‌شاهی',
    author: 'نصرالله منشی / کاتب: روزبه بن ابی‌بکر',
    language: 'mixed',
    description: 'ترجمه ادیبانه کلیله و دمنه همراه با امثال و ابیات عربی و فارسی به خط تعلیق و نسخ ظریف با نگاره‌های کهن حیوانی.',
    repositoryName: 'کتابخانه و موزه ملی ملک',
    catalogId: 'MALIK-3512',
    historicalPeriod: 'seljuk',
    scriptType: 'taliq',
    sourceReference: 'وقف‌نامه حاج حسین آقا ملک، شماره ۳۵۱۲',
    totalPages: 20,
    coverImageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    createdAt: '2025-02-28T14:00:00Z',
    updatedAt: '2025-03-25T11:00:00Z',
  },
];

interface PageRecord {
  id: string;
  manuscriptId: string;
  pageNumber: number;
  imageUrl: string;
  status: 'pending' | 'processing' | 'recognized' | 'reviewed' | 'approved' | 'failed';
  confidence?: number;
  notes?: string;
  createdAt: string;
}

const pages: PageRecord[] = [
  {
    id: 'page-bs-1',
    manuscriptId: 'ms-baysunghur',
    pageNumber: 1,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=85',
    status: 'approved',
    confidence: 96.4,
    notes: 'صفحه دیباچه با تذهیب حاشیه و خط نستعلیق جلی بدون ریختگی مرکب',
    createdAt: '2025-01-12T10:15:00Z',
  },
  {
    id: 'page-bs-2',
    manuscriptId: 'ms-baysunghur',
    pageNumber: 2,
    imageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e35b32?auto=format&fit=crop&w=1200&q=85',
    status: 'reviewed',
    confidence: 94.8,
    notes: 'آغاز سرگذشت کیومرث و پادشاهی پیشدادیان',
    createdAt: '2025-01-12T10:20:00Z',
  },
  {
    id: 'page-hf-1',
    manuscriptId: 'ms-hafez',
    pageNumber: 1,
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=1200&q=85',
    status: 'approved',
    confidence: 93.2,
    notes: 'غزل اول دیوان با سرلوح مذهب طلا و خط شکسته نستعلیق اعلا',
    createdAt: '2025-01-20T12:10:00Z',
  },
  {
    id: 'page-sd-1',
    manuscriptId: 'ms-saadi',
    pageNumber: 1,
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=85',
    status: 'reviewed',
    confidence: 95.1,
    notes: 'حکایت پادشاه با اسیر عجم و ترجمه آیات',
    createdAt: '2025-02-05T09:30:00Z',
  },
  {
    id: 'page-qur-1',
    manuscriptId: 'ms-kufic-quran',
    pageNumber: 1,
    imageUrl: 'https://images.unsplash.com/photo-1507842229458-577630623a22?auto=format&fit=crop&w=1200&q=85',
    status: 'approved',
    confidence: 97.0,
    notes: 'آیات سوره کهف به خط کوفی کهن بر پوست آهو',
    createdAt: '2025-02-14T11:40:00Z',
  },
  {
    id: 'page-kl-1',
    manuscriptId: 'ms-kalila',
    pageNumber: 1,
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=85',
    status: 'recognized',
    confidence: 89.6,
    notes: 'باب شیر و گاو با عبارات تمثیلی عربی و فارسی',
    createdAt: '2025-02-28T14:30:00Z',
  },
];

interface TranscriptionRecord {
  id: string;
  pageId: string;
  manuscriptId: string;
  status: 'original_ai' | 'reviewed' | 'approved';
  text: string;
  originalAiText: string;
  confidence: number;
  lines: Array<{
    id: string;
    lineNumber: number;
    text: string;
    confidence: number;
    bbox: { x: number; y: number; w: number; h: number };
  }>;
  revisions: Array<{
    id: string;
    version: number;
    text: string;
    authorId: string;
    authorName: string;
    note?: string;
    createdAt: string;
  }>;
  modelMetadata: {
    modelName: string;
    modelVersion: string;
    recognitionDate: string;
    lineCount: number;
    detectedScript: string;
  };
  createdAt: string;
  updatedAt: string;
}

const transcriptions: Record<string, TranscriptionRecord> = {
  'page-bs-1': {
    id: 'tr-bs-1',
    pageId: 'page-bs-1',
    manuscriptId: 'ms-baysunghur',
    status: 'approved',
    text: `به نام خداوند جان و خرد\nکزین برتر اندیشه برنگذرد\nخداوند نام و خداوند جای\nخداوند روزی ده رهنمای\nخداوند کیوان و گَردان سپهر\nفروزنده ماه و ناهید و مهر\nز نام و نشان و گمان برتر است\nنگارنده بر شده گوهر است\nبه بینندگان آفریننده را\nنبینی مرنجان دو بیننده را`,
    originalAiText: `به نام خداوند جان و خرد\nکزین برتر اندیشه برنگذرد\nخداوند نام و خداوند جای\nخداوند روزی ده رهنمای\nخداوند کیوان و گردان سپهر\nفروزنده ماه و ناهید و مهر\nز نام و نشان و گمان برتر است\nنگارنده بر شده کوهر است\nبه بینندگان افریننده را\nنبینی مرنجان دو بیننده را`,
    confidence: 96.4,
    lines: [
      { id: 'l1', lineNumber: 1, text: 'به نام خداوند جان و خرد', confidence: 98.2, bbox: { x: 18, y: 15, w: 64, h: 6.5 } },
      { id: 'l2', lineNumber: 2, text: 'کزین برتر اندیشه برنگذرد', confidence: 97.4, bbox: { x: 18, y: 23, w: 64, h: 6.5 } },
      { id: 'l3', lineNumber: 3, text: 'خداوند نام و خداوند جای', confidence: 96.8, bbox: { x: 18, y: 31, w: 64, h: 6.5 } },
      { id: 'l4', lineNumber: 4, text: 'خداوند روزی ده رهنمای', confidence: 97.0, bbox: { x: 18, y: 39, w: 64, h: 6.5 } },
      { id: 'l5', lineNumber: 5, text: 'خداوند کیوان و گَردان سپهر', confidence: 95.8, bbox: { x: 18, y: 47, w: 64, h: 6.5 } },
      { id: 'l6', lineNumber: 6, text: 'فروزنده ماه و ناهید و مهر', confidence: 96.5, bbox: { x: 18, y: 55, w: 64, h: 6.5 } },
      { id: 'l7', lineNumber: 7, text: 'ز نام و نشان و گمان برتر است', confidence: 95.1, bbox: { x: 18, y: 63, w: 64, h: 6.5 } },
      { id: 'l8', lineNumber: 8, text: 'نگارنده بر شده گوهر است', confidence: 94.6, bbox: { x: 18, y: 71, w: 64, h: 6.5 } },
      { id: 'l9', lineNumber: 9, text: 'به بینندگان آفریننده را', confidence: 96.1, bbox: { x: 18, y: 79, w: 64, h: 6.5 } },
      { id: 'l10', lineNumber: 10, text: 'نبینی مرنجان دو بیننده را', confidence: 96.9, bbox: { x: 18, y: 87, w: 64, h: 6.5 } },
    ],
    revisions: [
      {
        id: 'rev-1',
        version: 1,
        text: 'به نام خداوند جان و خرد\nکزین برتر اندیشه برنگذرد\nخداوند نام و خداوند جای\nخداوند روزی ده رهنمای\nخداوند کیوان و گَردان سپهر\nفروزنده ماه و ناهید و مهر\nز نام و نشان و گمان برتر است\nنگارنده بر شده گوهر است\nبه بینندگان آفریننده را\nنبینی مرنجان دو بیننده را',
        authorId: 'usr-2',
        authorName: 'مریم حسینی',
        note: 'تصحیح اعراب‌گذاری کلمه گَردان و اصلاح حرف گاف در کلمه گوهر',
        createdAt: '2025-01-15T14:00:00Z',
      },
    ],
    modelMetadata: {
      modelName: 'PersianHTR-Transformer-v2.3',
      modelVersion: '2.3.1',
      recognitionDate: '2025-01-12T10:18:00Z',
      lineCount: 10,
      detectedScript: 'خط نستعلیق مکتب هرات',
    },
    createdAt: '2025-01-12T10:18:00Z',
    updatedAt: '2025-01-15T14:00:00Z',
  },
  'page-hf-1': {
    id: 'tr-hf-1',
    pageId: 'page-hf-1',
    manuscriptId: 'ms-hafez',
    status: 'approved',
    text: `الا یا ایها الساقی اَدِر کأساً و ناوِلها\nکه عشق آسان نمود اول ولی افتاد مشکل‌ها\nبه بوی نافه‌ای کآخر صبا زان طره بگشاید\nز تاب جعد مشکینش چه خون افتاد در دل‌ها\nمرا در منزل جانان چه امن عیش چون هر دم\nجرس فریاد می‌دارد که بربندید محمل‌ها`,
    originalAiText: `الا یا ایها الساقی ادر کاسا و ناولها\nکه عشق آسان نمود اول ولی افتاد مشکل‌ها\nبه بوی نافه‌ای کاخر صبا زان طره بگشاید\nز تاب جعد مشکینش چه خون افتاد در دل‌ها\nمرا در منزل جانان چه امن عیش چون هر دم\nجرس فریاد می‌دارد که بربندید محمل‌ها`,
    confidence: 93.2,
    lines: [
      { id: 'lh1', lineNumber: 1, text: 'الا یا ایها الساقی اَدِر کأساً و ناوِلها', confidence: 92.5, bbox: { x: 15, y: 18, w: 70, h: 8 } },
      { id: 'lh2', lineNumber: 2, text: 'که عشق آسان نمود اول ولی افتاد مشکل‌ها', confidence: 94.0, bbox: { x: 15, y: 28, w: 70, h: 8 } },
      { id: 'lh3', lineNumber: 3, text: 'به بوی نافه‌ای کآخر صبا زان طره بگشاید', confidence: 91.8, bbox: { x: 15, y: 38, w: 70, h: 8 } },
      { id: 'lh4', lineNumber: 4, text: 'ز تاب جعد مشکینش چه خون افتاد در دل‌ها', confidence: 93.4, bbox: { x: 15, y: 48, w: 70, h: 8 } },
      { id: 'lh5', lineNumber: 5, text: 'مرا در منزل جانان چه امن عیش چون هر دم', confidence: 94.2, bbox: { x: 15, y: 58, w: 70, h: 8 } },
      { id: 'lh6', lineNumber: 6, text: 'جرس فریاد می‌دارد که بربندید محمل‌ها', confidence: 93.0, bbox: { x: 15, y: 68, w: 70, h: 8 } },
    ],
    revisions: [],
    modelMetadata: {
      modelName: 'IslamicCalligraphy-Shekasteh-v1.8',
      modelVersion: '1.8.0',
      recognitionDate: '2025-01-20T12:15:00Z',
      lineCount: 6,
      detectedScript: 'خط شکسته نستعلیق صفوی',
    },
    createdAt: '2025-01-20T12:15:00Z',
    updatedAt: '2025-01-20T12:15:00Z',
  },
  'page-sd-1': {
    id: 'tr-sd-1',
    pageId: 'page-sd-1',
    manuscriptId: 'ms-saadi',
    status: 'reviewed',
    text: `منت خدای را عز و جل که طاعتش موجب قربت است و به شکر اندرش مزید نعمت\nهر نفسی که فرو می‌رود ممد حیات است و چون برمی‌آید مفرح ذات\nپس در هر نفسی دو نعمت موجود است و بر هر نعمتی شکری واجب\nاز دست و زبان که برآید / کز عهده شکرش به در آید`,
    originalAiText: `منت خدای را عز و جل که طاعتش موجب قربت است و به شکر اندرش مزید نعمت\nهر نفسی که فرو می‌رود ممد حیات است و چون برمی‌آید مفرح ذات\nپس در هر نفسی دو نعمت موجود است و بر هر نعمتی شکری واجب\nاز دست و زبان که برآید / کز عهده شکرش به در آید`,
    confidence: 95.1,
    lines: [
      { id: 'ls1', lineNumber: 1, text: 'منت خدای را عز و جل که طاعتش موجب قربت است', confidence: 96.0, bbox: { x: 12, y: 20, w: 76, h: 10 } },
      { id: 'ls2', lineNumber: 2, text: 'هر نفسی که فرو می‌رود ممد حیات است و چون برمی‌آید', confidence: 95.5, bbox: { x: 12, y: 34, w: 76, h: 10 } },
      { id: 'ls3', lineNumber: 3, text: 'پس در هر نفسی دو نعمت موجود است و بر هر نعمتی شکری واجب', confidence: 94.8, bbox: { x: 12, y: 48, w: 76, h: 10 } },
      { id: 'ls4', lineNumber: 4, text: 'از دست و زبان که برآید / کز عهده شکرش به در آید', confidence: 94.2, bbox: { x: 12, y: 62, w: 76, h: 10 } },
    ],
    revisions: [],
    modelMetadata: {
      modelName: 'PersianHTR-Transformer-v2.3',
      modelVersion: '2.3.1',
      recognitionDate: '2025-02-05T09:35:00Z',
      lineCount: 4,
      detectedScript: 'نستعلیق کهن',
    },
    createdAt: '2025-02-05T09:35:00Z',
    updatedAt: '2025-02-05T09:35:00Z',
  },
  'page-qur-1': {
    id: 'tr-qur-1',
    pageId: 'page-qur-1',
    manuscriptId: 'ms-kufic-quran',
    status: 'approved',
    text: `الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجًا\nقَيِّمًا لِّيُنذِرَ بَأْسًا شَدِيدًا مِّن لَّدُنْهُ وَيُبَشِّرَ الْمُؤْمِنِينَ\nالَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ أَنَّ لَهُمْ أَجْرًا حَسَنًا\nمَّاكِثِينَ فِيهِ أَبَدًا`,
    originalAiText: `الحمد لله الذي انزل على عبده الكتاب ولم يجعل له عوجا\nقيما لينذر باسا شديدا من لدنه ويبشر المؤمنين\nالذين يعملون الصالحات ان لهم اجرا حسنا\nماكثين فيه ابدا`,
    confidence: 97.0,
    lines: [
      { id: 'lq1', lineNumber: 1, text: 'الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجًا', confidence: 97.8, bbox: { x: 10, y: 18, w: 80, h: 12 } },
      { id: 'lq2', lineNumber: 2, text: 'قَيِّمًا لِّيُنذِرَ بَأْسًا شَدِيدًا مِّن لَّدُنْهُ وَيُبَشِّرَ الْمُؤْمِنِينَ', confidence: 96.9, bbox: { x: 10, y: 34, w: 80, h: 12 } },
      { id: 'lq3', lineNumber: 3, text: 'الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ أَنَّ لَهُمْ أَجْرًا حَسَنًا', confidence: 97.2, bbox: { x: 10, y: 50, w: 80, h: 12 } },
      { id: 'lq4', lineNumber: 4, text: 'مَّاكِثِينَ فِيهِ أَبَدًا', confidence: 96.5, bbox: { x: 10, y: 66, w: 80, h: 12 } },
    ],
    revisions: [],
    modelMetadata: {
      modelName: 'Arabic-Kufic-Vision-v3.0',
      modelVersion: '3.0.2',
      recognitionDate: '2025-02-14T11:45:00Z',
      lineCount: 4,
      detectedScript: 'خط کوفی مشرقی کهن',
    },
    createdAt: '2025-02-14T11:45:00Z',
    updatedAt: '2025-02-14T11:45:00Z',
  },
  'page-kl-1': {
    id: 'tr-kl-1',
    pageId: 'page-kl-1',
    manuscriptId: 'ms-kalila',
    status: 'original_ai',
    text: `قال دبشلیم الملک لبیدبا الفیلسوف: اضرب لی مثل الرجلین المتحابین کیف یقطع بینهما الخائن الکذوب\nراوی گوید در ولایت دستاوند بازرگانی بود بسیار مال و خواسته و او را فرزندان بودند که مال به گزاف تلف کردندی`,
    originalAiText: `قال دبشلیم الملک لبیدبا الفیلسوف: اضرب لی مثل الرجلین المتحابین کیف یقطع بینهما الخائن الکذوب\nراوی گوید در ولایت دستاوند بازرگانی بود بسیار مال و خواسته و او را فرزندان بودند که مال به گزاف تلف کردندی`,
    confidence: 89.6,
    lines: [
      { id: 'lk1', lineNumber: 1, text: 'قال دبشلیم الملک لبیدبا الفیلسوف: اضرب لی مثل الرجلین المتحابین', confidence: 90.1, bbox: { x: 14, y: 22, w: 72, h: 11 } },
      { id: 'lk2', lineNumber: 2, text: 'کیف یقطع بینهما الخائن الکذوب راوی گوید در ولایت دستاوند بازرگانی بود', confidence: 89.2, bbox: { x: 14, y: 38, w: 72, h: 11 } },
    ],
    revisions: [],
    modelMetadata: {
      modelName: 'PersianHTR-Transformer-v2.3',
      modelVersion: '2.3.1',
      recognitionDate: '2025-02-28T14:35:00Z',
      lineCount: 2,
      detectedScript: 'تعلیق و نسخ فارسی',
    },
    createdAt: '2025-02-28T14:35:00Z',
    updatedAt: '2025-02-28T14:35:00Z',
  },
};

interface JobRecord {
  id: string;
  pageId: string;
  manuscriptId: string;
  manuscriptTitle: string;
  pageNumber: number;
  language: 'fa' | 'ar' | 'mixed';
  modelName: string;
  modelVersion: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progressPercent: number;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  transcriptionId?: string;
  createdAt: string;
}

const jobs: JobRecord[] = [
  {
    id: 'job-101',
    pageId: 'page-bs-1',
    manuscriptId: 'ms-baysunghur',
    manuscriptTitle: 'شاهنامه بایسنقری',
    pageNumber: 1,
    language: 'fa',
    modelName: 'PersianHTR-Transformer-v2.3',
    modelVersion: '2.3.1',
    status: 'completed',
    progressPercent: 100,
    startedAt: '2025-01-12T10:16:00Z',
    completedAt: '2025-01-12T10:18:00Z',
    durationMs: 120000,
    transcriptionId: 'tr-bs-1',
    createdAt: '2025-01-12T10:16:00Z',
  },
  {
    id: 'job-102',
    pageId: 'page-hf-1',
    manuscriptId: 'ms-hafez',
    manuscriptTitle: 'دیوان حافظ شیرازی',
    pageNumber: 1,
    language: 'fa',
    modelName: 'IslamicCalligraphy-Shekasteh-v1.8',
    modelVersion: '1.8.0',
    status: 'completed',
    progressPercent: 100,
    startedAt: '2025-01-20T12:12:00Z',
    completedAt: '2025-01-20T12:15:00Z',
    durationMs: 180000,
    transcriptionId: 'tr-hf-1',
    createdAt: '2025-01-20T12:12:00Z',
  },
  {
    id: 'job-103',
    pageId: 'page-qur-1',
    manuscriptId: 'ms-kufic-quran',
    manuscriptTitle: 'مصحف شریف کهن',
    pageNumber: 1,
    language: 'ar',
    modelName: 'Arabic-Kufic-Vision-v3.0',
    modelVersion: '3.0.2',
    status: 'completed',
    progressPercent: 100,
    startedAt: '2025-02-14T11:42:00Z',
    completedAt: '2025-02-14T11:45:00Z',
    durationMs: 180000,
    transcriptionId: 'tr-qur-1',
    createdAt: '2025-02-14T11:42:00Z',
  },
  {
    id: 'job-104',
    pageId: 'page-kl-1',
    manuscriptId: 'ms-kalila',
    manuscriptTitle: 'کلیله و دمنه بهرام‌شاهی',
    pageNumber: 1,
    language: 'mixed',
    modelName: 'PersianHTR-Transformer-v2.3',
    modelVersion: '2.3.1',
    status: 'completed',
    progressPercent: 100,
    startedAt: '2025-02-28T14:32:00Z',
    completedAt: '2025-02-28T14:35:00Z',
    durationMs: 180000,
    transcriptionId: 'tr-kl-1',
    createdAt: '2025-02-28T14:32:00Z',
  },
];

interface DatasetRecord {
  id: string;
  manuscriptId: string;
  manuscriptTitle: string;
  pageId: string;
  pageNumber: number;
  imageUrl: string;
  language: 'fa' | 'ar' | 'mixed';
  scriptType: 'nastaliq' | 'naskh' | 'shekasteh' | 'kufic' | 'thuluth' | 'taliq' | 'muhaqqaq' | 'other';
  split: 'train' | 'validation' | 'test' | 'unassigned';
  status: 'draft' | 'reviewed' | 'approved';
  groundTruthText: string;
  originalAiText: string;
  characterCount: number;
  wordCount: number;
  cerPercentage: number;
  updatedAt: string;
}

const datasetSamples: DatasetRecord[] = [
  {
    id: 'ds-1',
    manuscriptId: 'ms-baysunghur',
    manuscriptTitle: 'شاهنامه بایسنقری',
    pageId: 'page-bs-1',
    pageNumber: 1,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    language: 'fa',
    scriptType: 'nastaliq',
    split: 'train',
    status: 'approved',
    groundTruthText: 'به نام خداوند جان و خرد کزین برتر اندیشه برنگذرد خداوند نام و خداوند جای خداوند روزی ده رهنمای',
    originalAiText: 'به نام خداوند جان و خرد کزین برتر اندیشه برنگذرد خداوند نام و خداوند جای خداوند روزی ده رهنمای',
    characterCount: 96,
    wordCount: 19,
    cerPercentage: 0.0,
    updatedAt: '2025-03-01T10:00:00Z',
  },
  {
    id: 'ds-2',
    manuscriptId: 'ms-baysunghur',
    manuscriptTitle: 'شاهنامه بایسنقری',
    pageId: 'page-bs-2',
    pageNumber: 2,
    imageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e35b32?auto=format&fit=crop&w=600&q=80',
    language: 'fa',
    scriptType: 'nastaliq',
    split: 'train',
    status: 'reviewed',
    groundTruthText: 'سخن‌گوی دهقان چه گوید نخست / ز نام‌آوران داستان‌های درست',
    originalAiText: 'سخن کوی دهقان چه گوید نخست / ز نام اوران داستان‌های درست',
    characterCount: 56,
    wordCount: 10,
    cerPercentage: 5.3,
    updatedAt: '2025-03-02T11:00:00Z',
  },
  {
    id: 'ds-3',
    manuscriptId: 'ms-hafez',
    manuscriptTitle: 'دیوان حافظ شیرازی',
    pageId: 'page-hf-1',
    pageNumber: 1,
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80',
    language: 'fa',
    scriptType: 'shekasteh',
    split: 'test',
    status: 'approved',
    groundTruthText: 'الا یا ایها الساقی اَدِر کأساً و ناوِلها که عشق آسان نمود اول ولی افتاد مشکل‌ها',
    originalAiText: 'الا یا ایها الساقی ادر کاسا و ناولها که عشق آسان نمود اول ولی افتاد مشکل‌ها',
    characterCount: 76,
    wordCount: 15,
    cerPercentage: 3.9,
    updatedAt: '2025-03-05T12:00:00Z',
  },
  {
    id: 'ds-4',
    manuscriptId: 'ms-kufic-quran',
    manuscriptTitle: 'مصحف شریف کهن',
    pageId: 'page-qur-1',
    pageNumber: 1,
    imageUrl: 'https://images.unsplash.com/photo-1507842229458-577630623a22?auto=format&fit=crop&w=600&q=80',
    language: 'ar',
    scriptType: 'kufic',
    split: 'validation',
    status: 'approved',
    groundTruthText: 'الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجًا',
    originalAiText: 'الحمد لله الذي انزل على عبده الكتاب ولم يجعل له عوجا',
    characterCount: 68,
    wordCount: 11,
    cerPercentage: 4.4,
    updatedAt: '2025-03-08T15:30:00Z',
  },
];

// Available models
const availableModels = [
  {
    id: 'm1',
    name: 'PersianHTR-Transformer-v2.3',
    description: 'مدل ترنسفورمر آموزش‌دیده بر روی خطوط نستعلیق و نسخ فارسی کهن',
    version: '2.3.1',
    default: true,
  },
  {
    id: 'm2',
    name: 'IslamicCalligraphy-Shekasteh-v1.8',
    description: 'مدل تخصصی بازشناسی کشیدگی‌ها و ترکیبات پیچیده خط شکسته نستعلیق',
    version: '1.8.0',
    default: false,
  },
  {
    id: 'm3',
    name: 'Arabic-Kufic-Vision-v3.0',
    description: 'مدل تخصصی بازشناسی کتیبه‌ها و نسخه‌های کوفی اولیه و هندسی',
    version: '3.0.2',
    default: false,
  },
];

// Helper: Token validation middleware
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      statusCode: 401,
      message: 'عدم احراز هویت. لطفاً ابتدا وارد سامانه شوید.',
      error: 'Unauthorized',
    });
  }
  const token = authHeader.split(' ')[1];
  const user = users.find((u) => `token-${u.id}` === token || token === 'demo-token');
  if (!user && token !== 'demo-token') {
    return res.status(401).json({
      statusCode: 401,
      message: 'نشست کاربری منقضی شده است.',
      error: 'Unauthorized',
    });
  }
  (req as any).user = user || users[0];
  next();
};

// --- API Endpoints (/api/v1) ---

// 1. Auth API
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ statusCode: 400, message: 'رایانامه و رمز عبور الزامی است.' });
  }

  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({
      statusCode: 401,
      message: 'رایانامه یا رمز عبور اشتباه است.',
      error: 'Unauthorized',
    });
  }

  const accessToken = `token-${user.id}`;
  res.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      institution: user.institution,
      createdAt: user.createdAt,
    },
  });
});

app.post('/api/v1/auth/register', (req, res) => {
  const { email, password, fullName, institution, role } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ statusCode: 400, message: 'تمامی فیلدهای ستاره‌دار الزامی است.' });
  }

  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({
      statusCode: 409,
      message: 'حساب کاربری با این نشانی رایانامه قبلاً ثبت شده است.',
      error: 'Conflict',
    });
  }

  const newUser: UserRecord = {
    id: `usr-${Date.now()}`,
    email,
    passwordHash: password,
    fullName,
    role: role || 'researcher',
    institution: institution || 'دانشگاه تهران',
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);

  const accessToken = `token-${newUser.id}`;
  res.status(201).json({
    accessToken,
    user: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      institution: newUser.institution,
      createdAt: newUser.createdAt,
    },
  });
});

app.get('/api/v1/auth/me', authMiddleware, (req, res) => {
  const user = (req as any).user as UserRecord;
  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    institution: user.institution,
    createdAt: user.createdAt,
  });
});

app.post('/api/v1/auth/logout', (req, res) => {
  res.json({ success: true, message: 'با موفقیت خارج شدید.' });
});

app.post('/api/v1/auth/refresh', (req, res) => {
  res.json({ accessToken: 'token-usr-1' });
});

// 2. Stats API
app.get('/api/v1/stats', (req, res) => {
  const totalPages = pages.length;
  const completedJobs = jobs.filter((j) => j.status === 'completed').length;
  const pendingJobs = jobs.filter((j) => j.status === 'queued' || j.status === 'processing').length;
  const failedJobs = jobs.filter((j) => j.status === 'failed').length;
  const approvedDatasetSamples = datasetSamples.filter((s) => s.status === 'approved').length;

  res.json({
    totalManuscripts: manuscripts.length,
    totalDigitizedPages: totalPages,
    completedJobs,
    pendingJobs,
    failedJobs,
    approvedDatasetSamples,
    recentManuscripts: manuscripts.slice(0, 4),
    recentJobs: jobs.slice(-5).reverse(),
    systemHealth: {
      backendStatus: 'connected',
      aiWorkerStatus: 'idle',
      averageJobDurationSec: 2.4,
    },
  });
});

// 3. Manuscripts API
app.get('/api/v1/manuscripts', (req, res) => {
  const { search, language, scriptType, historicalPeriod, page = '1', limit = '10' } = req.query;

  let filtered = [...manuscripts];

  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.title.toLowerCase().includes(s) ||
        m.author.toLowerCase().includes(s) ||
        m.catalogId.toLowerCase().includes(s) ||
        m.repositoryName.toLowerCase().includes(s)
    );
  }

  if (language && language !== 'all') {
    filtered = filtered.filter((m) => m.language === language);
  }

  if (scriptType && scriptType !== 'all') {
    filtered = filtered.filter((m) => m.scriptType === scriptType);
  }

  if (historicalPeriod && historicalPeriod !== 'all') {
    filtered = filtered.filter((m) => m.historicalPeriod === historicalPeriod);
  }

  const p = Math.max(1, parseInt(page as string, 10));
  const l = Math.max(1, parseInt(limit as string, 10));
  const startIndex = (p - 1) * l;
  const paginated = filtered.slice(startIndex, startIndex + l);

  res.json({
    items: paginated.map((m) => ({
      ...m,
      digitizedPagesCount: pages.filter((p) => p.manuscriptId === m.id).length,
    })),
    total: filtered.length,
    page: p,
    limit: l,
    totalPages: Math.ceil(filtered.length / l),
  });
});

app.get('/api/v1/manuscripts/:id', (req, res) => {
  const manuscript = manuscripts.find((m) => m.id === req.params.id);
  if (!manuscript) {
    return res.status(404).json({ statusCode: 404, message: 'نسخه خطی مورد نظر یافت نشد.' });
  }

  res.json({
    ...manuscript,
    digitizedPagesCount: pages.filter((p) => p.manuscriptId === manuscript.id).length,
  });
});

app.post('/api/v1/manuscripts', authMiddleware, (req, res) => {
  const body = req.body;
  if (!body.title || !body.author || !body.catalogId) {
    return res.status(400).json({ statusCode: 400, message: 'عنوان، نویسنده و شماره بازیابی الزامی است.' });
  }

  const newManuscript: ManuscriptRecord = {
    id: `ms-${Date.now()}`,
    title: body.title,
    author: body.author,
    language: body.language || 'fa',
    description: body.description || '',
    repositoryName: body.repositoryName || 'کتابخانه ملی ایران',
    catalogId: body.catalogId,
    historicalPeriod: body.historicalPeriod || 'timurid',
    scriptType: body.scriptType || 'nastaliq',
    sourceReference: body.sourceReference,
    totalPages: 1,
    coverImageUrl: body.coverImageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  manuscripts.unshift(newManuscript);
  res.status(201).json(newManuscript);
});

app.put('/api/v1/manuscripts/:id', authMiddleware, (req, res) => {
  const index = manuscripts.findIndex((m) => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ statusCode: 404, message: 'نسخه خطی یافت نشد.' });
  }

  manuscripts[index] = {
    ...manuscripts[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  res.json(manuscripts[index]);
});

app.delete('/api/v1/manuscripts/:id', authMiddleware, (req, res) => {
  const index = manuscripts.findIndex((m) => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ statusCode: 404, message: 'نسخه خطی یافت نشد.' });
  }

  manuscripts.splice(index, 1);
  res.json({ success: true, message: 'نسخه خطی با موفقیت از پایگاه داده حذف گردید.' });
});

// 4. Pages API
app.get('/api/v1/manuscripts/:id/pages', (req, res) => {
  const msPages = pages
    .filter((p) => p.manuscriptId === req.params.id)
    .sort((a, b) => a.pageNumber - b.pageNumber);
  res.json(msPages);
});

app.get('/api/v1/pages/:id', (req, res) => {
  const page = pages.find((p) => p.id === req.params.id);
  if (!page) {
    return res.status(404).json({ statusCode: 404, message: 'برگه نسخه خطی یافت نشد.' });
  }
  res.json(page);
});

app.post('/api/v1/manuscripts/:id/pages', authMiddleware, (req, res) => {
  const manuscriptId = req.params.id;
  const { pageNumber, imageUrl, notes } = req.body;

  const newPage: PageRecord = {
    id: `page-${Date.now()}`,
    manuscriptId,
    pageNumber: Number(pageNumber) || 1,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=85',
    status: 'pending',
    notes,
    createdAt: new Date().toISOString(),
  };

  pages.push(newPage);
  res.status(201).json(newPage);
});

app.post('/api/v1/manuscripts/:id/pages/upload', authMiddleware, (req, res) => {
  const manuscriptId = req.params.id;
  const { pageNumber, notes } = req.body;

  const newPage: PageRecord = {
    id: `page-${Date.now()}`,
    manuscriptId,
    pageNumber: Number(pageNumber) || (pages.filter((p) => p.manuscriptId === manuscriptId).length + 1),
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=85',
    status: 'pending',
    notes,
    createdAt: new Date().toISOString(),
  };

  pages.push(newPage);
  res.status(201).json(newPage);
});

app.delete('/api/v1/pages/:id', authMiddleware, (req, res) => {
  const index = pages.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ statusCode: 404, message: 'صفحه یافت نشد.' });
  }
  pages.splice(index, 1);
  res.json({ success: true });
});

// 5. Jobs API
app.get('/api/v1/jobs', (req, res) => {
  const { status, language, page = '1', limit = '10' } = req.query;
  let filtered = [...jobs];

  if (status && status !== 'all') {
    filtered = filtered.filter((j) => j.status === status);
  }
  if (language && language !== 'all') {
    filtered = filtered.filter((j) => j.language === language);
  }

  const p = Math.max(1, parseInt(page as string, 10));
  const l = Math.max(1, parseInt(limit as string, 10));
  const startIndex = (p - 1) * l;
  const paginated = filtered.reverse().slice(startIndex, startIndex + l);

  res.json({
    items: paginated,
    total: filtered.length,
    page: p,
    limit: l,
    totalPages: Math.ceil(filtered.length / l),
  });
});

app.get('/api/v1/jobs/models', (req, res) => {
  res.json(availableModels);
});

app.get('/api/v1/jobs/:id', (req, res) => {
  const job = jobs.find((j) => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ statusCode: 404, message: 'فرآیند پردازش HTR یافت نشد.' });
  }
  res.json(job);
});

app.post('/api/v1/jobs', authMiddleware, (req, res) => {
  const { pageId, manuscriptId, language, modelName } = req.body;
  const page = pages.find((p) => p.id === pageId);
  const ms = manuscripts.find((m) => m.id === manuscriptId);

  const newJob: JobRecord = {
    id: `job-${Date.now()}`,
    pageId,
    manuscriptId,
    manuscriptTitle: ms ? ms.title : 'نسخه خطی ناشناس',
    pageNumber: page ? page.pageNumber : 1,
    language: language || 'fa',
    modelName: modelName || 'PersianHTR-Transformer-v2.3',
    modelVersion: '2.3.1',
    status: 'processing',
    progressPercent: 25,
    startedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  jobs.push(newJob);

  if (page) {
    page.status = 'processing';
  }

  // Realistic background worker simulation: transitions to completed in 3.5 seconds
  setTimeout(() => {
    newJob.progressPercent = 100;
    newJob.status = 'completed';
    newJob.completedAt = new Date().toISOString();
    newJob.durationMs = 3500;
    const trId = `tr-${Date.now()}`;
    newJob.transcriptionId = trId;

    if (page) {
      page.status = 'recognized';
      page.confidence = 94.5;
    }

    // Auto-create transcription for the recognized page
    transcriptions[pageId] = {
      id: trId,
      pageId,
      manuscriptId,
      status: 'original_ai',
      text: 'بنام خداوند جان و خرد\nکزین برتر اندیشه برنگذرد\nخداوند نام و خداوند جای\nخداوند روزی ده رهنمای',
      originalAiText: 'بنام خداوند جان و خرد\nکزین برتر اندیشه برنگذرد\nخداوند نام و خداوند جای\nخداوند روزی ده رهنمای',
      confidence: 94.5,
      lines: [
        { id: `ln-${Date.now()}-1`, lineNumber: 1, text: 'بنام خداوند جان و خرد', confidence: 95.2, bbox: { x: 15, y: 20, w: 70, h: 10 } },
        { id: `ln-${Date.now()}-2`, lineNumber: 2, text: 'کزین برتر اندیشه برنگذرد', confidence: 94.8, bbox: { x: 15, y: 35, w: 70, h: 10 } },
        { id: `ln-${Date.now()}-3`, lineNumber: 3, text: 'خداوند نام و خداوند جای', confidence: 93.9, bbox: { x: 15, y: 50, w: 70, h: 10 } },
        { id: `ln-${Date.now()}-4`, lineNumber: 4, text: 'خداوند روزی ده رهنمای', confidence: 94.1, bbox: { x: 15, y: 65, w: 70, h: 10 } },
      ],
      revisions: [],
      modelMetadata: {
        modelName: newJob.modelName,
        modelVersion: '2.3.1',
        recognitionDate: new Date().toISOString(),
        lineCount: 4,
        detectedScript: 'نستعلیق',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, 3500);

  res.status(201).json(newJob);
});

app.post('/api/v1/jobs/:id/retry', authMiddleware, (req, res) => {
  const job = jobs.find((j) => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ statusCode: 404, message: 'فرآیند یافت نشد.' });
  }

  job.status = 'processing';
  job.progressPercent = 10;
  job.errorMessage = undefined;

  setTimeout(() => {
    job.status = 'completed';
    job.progressPercent = 100;
    job.completedAt = new Date().toISOString();
  }, 2500);

  res.json(job);
});

app.post('/api/v1/jobs/:id/cancel', authMiddleware, (req, res) => {
  const job = jobs.find((j) => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ statusCode: 404, message: 'فرآیند یافت نشد.' });
  }

  job.status = 'cancelled';
  res.json({ success: true, message: 'فرآیند با موفقیت متوقف شد.' });
});

// 6. Transcriptions API
app.get('/api/v1/transcriptions/page/:pageId', (req, res) => {
  const pageId = req.params.pageId;
  const tr = transcriptions[pageId];
  if (!tr) {
    return res.status(404).json({ statusCode: 404, message: 'هیچ رونویسی برای این برگه ثبت نشده است.' });
  }
  res.json(tr);
});

app.get('/api/v1/transcriptions/:id', (req, res) => {
  const tr = Object.values(transcriptions).find((t) => t.id === req.params.id);
  if (!tr) {
    return res.status(404).json({ statusCode: 404, message: 'رونویسی یافت نشد.' });
  }
  res.json(tr);
});

app.post('/api/v1/transcriptions/:id/revisions', authMiddleware, (req, res) => {
  const { text, note, status } = req.body;
  const user = (req as any).user as UserRecord;

  const tr = Object.values(transcriptions).find((t) => t.id === req.params.id);
  if (!tr) {
    return res.status(404).json({ statusCode: 404, message: 'رونویسی یافت نشد.' });
  }

  const newRevision = {
    id: `rev-${Date.now()}`,
    version: tr.revisions.length + 1,
    text,
    authorId: user.id,
    authorName: user.fullName,
    note: note || 'ویرایش متن توسط مصحح',
    createdAt: new Date().toISOString(),
  };

  tr.revisions.unshift(newRevision);
  tr.text = text;
  tr.status = status || 'reviewed';
  tr.updatedAt = new Date().toISOString();

  // Also update corresponding page status
  const page = pages.find((p) => p.id === tr.pageId);
  if (page) {
    page.status = tr.status === 'original_ai' ? 'recognized' : tr.status;
  }

  res.json(tr);
});

app.patch('/api/v1/transcriptions/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  const tr = Object.values(transcriptions).find((t) => t.id === req.params.id);
  if (!tr) {
    return res.status(404).json({ statusCode: 404, message: 'رونویسی یافت نشد.' });
  }

  tr.status = status;
  tr.updatedAt = new Date().toISOString();

  const page = pages.find((p) => p.id === tr.pageId);
  if (page) {
    page.status = status === 'original_ai' ? 'recognized' : status;
  }

  res.json(tr);
});

// 7. Advanced Search API
app.get('/api/v1/search', (req, res) => {
  const { q, manuscriptId, author, language, scriptType, status, page = '1', limit = '10' } = req.query;

  const searchResults: any[] = [];
  const queryStr = (q as string || '').trim().toLowerCase();

  for (const pageItem of pages) {
    const tr = transcriptions[pageItem.id];
    if (!tr) continue;

    const ms = manuscripts.find((m) => m.id === pageItem.manuscriptId);
    if (!ms) continue;

    if (manuscriptId && ms.id !== manuscriptId) continue;
    if (author && !ms.author.toLowerCase().includes((author as string).toLowerCase())) continue;
    if (language && language !== 'all' && ms.language !== language) continue;
    if (scriptType && scriptType !== 'all' && ms.scriptType !== scriptType) continue;
    if (status && status !== 'all' && tr.status !== status) continue;

    // Check full-text match in tr.text or tr.originalAiText
    const matched = !queryStr || tr.text.toLowerCase().includes(queryStr) || tr.originalAiText.toLowerCase().includes(queryStr);

    if (matched) {
      // Find snippet around match
      let snippet = tr.text;
      if (queryStr) {
        const idx = tr.text.toLowerCase().indexOf(queryStr);
        if (idx !== -1) {
          const start = Math.max(0, idx - 40);
          const end = Math.min(tr.text.length, idx + queryStr.length + 40);
          snippet = (start > 0 ? '...' : '') + tr.text.substring(start, end) + (end < tr.text.length ? '...' : '');
        }
      } else {
        snippet = tr.text.substring(0, 100) + '...';
      }

      searchResults.push({
        id: `res-${tr.id}`,
        pageId: pageItem.id,
        manuscriptId: ms.id,
        manuscriptTitle: ms.title,
        author: ms.author,
        pageNumber: pageItem.pageNumber,
        language: ms.language,
        scriptType: ms.scriptType,
        historicalPeriod: ms.historicalPeriod,
        snippet,
        matchedText: queryStr,
        confidence: tr.confidence,
        status: tr.status,
        imageUrl: pageItem.imageUrl,
      });
    }
  }

  const p = Math.max(1, parseInt(page as string, 10));
  const l = Math.max(1, parseInt(limit as string, 10));
  const startIndex = (p - 1) * l;
  const paginated = searchResults.slice(startIndex, startIndex + l);

  res.json({
    results: paginated,
    total: searchResults.length,
    page: p,
    totalPages: Math.ceil(searchResults.length / l),
    query: q || '',
  });
});

// 8. Datasets API
app.get('/api/v1/datasets/samples', (req, res) => {
  const { language, split, status, page = '1', limit = '10' } = req.query;
  let filtered = [...datasetSamples];

  if (language && language !== 'all') {
    filtered = filtered.filter((s) => s.language === language);
  }
  if (split && split !== 'all') {
    filtered = filtered.filter((s) => s.split === split);
  }
  if (status && status !== 'all') {
    filtered = filtered.filter((s) => s.status === status);
  }

  const p = Math.max(1, parseInt(page as string, 10));
  const l = Math.max(1, parseInt(limit as string, 10));
  const startIndex = (p - 1) * l;
  const paginated = filtered.slice(startIndex, startIndex + l);

  res.json({
    items: paginated,
    total: filtered.length,
    page: p,
    limit: l,
    totalPages: Math.ceil(filtered.length / l),
  });
});

app.patch('/api/v1/datasets/samples/:id/split', authMiddleware, (req, res) => {
  const { split } = req.body;
  const sample = datasetSamples.find((s) => s.id === req.params.id);
  if (!sample) {
    return res.status(404).json({ statusCode: 404, message: 'نمونه دادگان یافت نشد.' });
  }

  sample.split = split;
  sample.updatedAt = new Date().toISOString();
  res.json(sample);
});

app.patch('/api/v1/datasets/samples/:id/status', authMiddleware, (req, res) => {
  const { status, groundTruthText } = req.body;
  const sample = datasetSamples.find((s) => s.id === req.params.id);
  if (!sample) {
    return res.status(404).json({ statusCode: 404, message: 'نمونه دادگان یافت نشد.' });
  }

  sample.status = status;
  if (groundTruthText) {
    sample.groundTruthText = groundTruthText;
    sample.characterCount = groundTruthText.length;
    sample.wordCount = groundTruthText.trim().split(/\s+/).length;
  }
  sample.updatedAt = new Date().toISOString();
  res.json(sample);
});

app.get('/api/v1/datasets/stats', (req, res) => {
  const total = datasetSamples.length;
  const trainCount = datasetSamples.filter((s) => s.split === 'train').length;
  const valCount = datasetSamples.filter((s) => s.split === 'validation').length;
  const testCount = datasetSamples.filter((s) => s.split === 'test').length;
  const unassignedCount = datasetSamples.filter((s) => s.split === 'unassigned').length;

  const approvedCount = datasetSamples.filter((s) => s.status === 'approved').length;
  const reviewedCount = datasetSamples.filter((s) => s.status === 'reviewed').length;
  const draftCount = datasetSamples.filter((s) => s.status === 'draft').length;

  const totalWords = datasetSamples.reduce((acc, s) => acc + s.wordCount, 0);
  const totalCharacters = datasetSamples.reduce((acc, s) => acc + s.characterCount, 0);

  res.json({
    totalSamples: total,
    trainCount,
    validationCount: valCount,
    testCount,
    unassignedCount,
    approvedCount,
    reviewedCount,
    draftCount,
    totalWords,
    totalCharacters,
    languageDistribution: {
      fa: datasetSamples.filter((s) => s.language === 'fa').length,
      ar: datasetSamples.filter((s) => s.language === 'ar').length,
      mixed: datasetSamples.filter((s) => s.language === 'mixed').length,
    },
    scriptDistribution: {
      nastaliq: datasetSamples.filter((s) => s.scriptType === 'nastaliq').length,
      shekasteh: datasetSamples.filter((s) => s.scriptType === 'shekasteh').length,
      kufic: datasetSamples.filter((s) => s.scriptType === 'kufic').length,
    },
  });
});

app.get('/api/v1/datasets/export', (req, res) => {
  const exportManifest = {
    exportDate: new Date().toISOString(),
    formatVersion: '1.0',
    datasetName: 'Islamic-Manuscript-HTR-GroundTruth',
    totalSamples: datasetSamples.length,
    samples: datasetSamples.map((s) => ({
      sampleId: s.id,
      manuscriptId: s.manuscriptId,
      split: s.split,
      status: s.status,
      language: s.language,
      scriptType: s.scriptType,
      groundTruth: s.groundTruthText,
      originalAiHypothesis: s.originalAiText,
      imageUrl: s.imageUrl,
      cer: s.cerPercentage,
    })),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="htr-dataset-export.json"');
  res.json(exportManifest);
});

// 9. Users API (Admin only)
app.get('/api/v1/users', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as UserRecord;
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ statusCode: 403, message: 'دسترسی غیرمجاز: تنها مدیران می‌توانند فهرست کاربران را مشاهده کنند.' });
  }

  res.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      institution: u.institution,
      createdAt: u.createdAt,
    }))
  );
});

app.patch('/api/v1/users/:id/role', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as UserRecord;
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ statusCode: 403, message: 'تنها مدیران سامانه مجاز به تغییر نقش‌ها هستند.' });
  }

  const { role } = req.body;
  const user = users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ statusCode: 404, message: 'کاربر یافت نشد.' });
  }

  user.role = role;
  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    institution: user.institution,
    createdAt: user.createdAt,
  });
});

app.delete('/api/v1/users/:id', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as UserRecord;
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ statusCode: 403, message: 'تنها مدیران سامانه مجاز به حذف کاربران هستند.' });
  }

  const index = users.findIndex((u) => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ statusCode: 404, message: 'کاربر یافت نشد.' });
  }

  users.splice(index, 1);
  res.json({ success: true, message: 'کاربر با موفقیت حذف گردید.' });
});

// --- Frontend Dev Server / Static Production Mounting ---
async function startServer() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // In dev mode, mount Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HTR Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[HTR Server Error]', err);
  process.exit(1);
});
