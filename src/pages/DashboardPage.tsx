import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  ScanText,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Database,
  ArrowLeft,
  Sparkles,
  Layers,
  ScrollText,
  Check,
  TrendingUp,
} from 'lucide-react';
import { statsApi } from '../api';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/MiscComponents';

export const DashboardPage: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => statsApi.getDashboardStats(),
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-right">
        <h3 className="font-bold text-sm">خطا در بارگذاری اطلاعات داشبورد</h3>
        <p className="text-xs mt-1">امکان اتصال به سرویس آمار و تحلیل نسخ خطی میسر نشد.</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'کل نسخه‌های خطی',
      value: stats.totalManuscripts,
      unit: 'نسخه ثبت‌شده',
      icon: BookOpen,
      color: 'bg-teal-50 text-teal-800 border-teal-200',
      badge: 'گنجینه دانشگاهی',
    },
    {
      title: 'صفحات دیجیتال شده',
      value: stats.totalDigitizedPages,
      unit: 'برگه سند',
      icon: Layers,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      badge: 'کیفیت بالا',
    },
    {
      title: 'بازشناسی‌های موفق HTR',
      value: stats.completedJobs,
      unit: 'فرآیند تکمیل‌شده',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badge: 'دقت میانگین ۹۵٪',
    },
    {
      title: 'نمونه‌های مصوب دادگان',
      value: stats.approvedDatasetSamples,
      unit: 'برچسب استاندارد',
      icon: Database,
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      badge: 'آماده آموزش مدل',
    },
  ];

  const scriptNames: Record<string, string> = {
    nastaliq: 'نستعلیق',
    naskh: 'نسخ',
    shekasteh: 'شکسته نستعلیق',
    kufic: 'کوفی',
    thuluth: 'ثلث',
    taliq: 'تعلیق',
    other: 'سایر خطوط',
  };

  const periodNames: Record<string, string> = {
    timurid: 'عصر تیموری',
    safavid: 'عصر صفوی',
    ilkanid: 'عصر ایلخانی',
    qajar: 'عصر قاجار',
    abbasid: 'عصر عباسی',
    seljuk: 'عصر سلجوقی',
    other: 'کهن',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#19322E] via-[#162724] to-[#121A18] text-white p-6 sm:p-8 border border-teal-900/40 shadow-md">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/60 border border-teal-600/40 text-teal-200 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>پروژه دانشگاهی پردازش متون و نسخه‌های خطی اسلامی</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-calligraphy tracking-wide text-amber-100">
            سامانه هوشمند بازشناسی، رونویسی و جستجوی نسخ کهن
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
            محیط یکپارچه پژوهشی برای تبدیل تصاویر نسخه‌های خطی فارسی و عربی به متن دیجیتال قابل جستجو با اتکا به مدل‌های یادگیری عمیق ترنسفورمر، تصحیح همگام و تولید پیکره‌های متنی معتبر.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <NavLink
              to="/upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg text-xs shadow-md transition-colors"
            >
              <ScanText className="w-4 h-4" />
              <span>بارگذاری و بازشناسی برگه جدید</span>
            </NavLink>
            <NavLink
              to="/search"
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-800/80 hover:bg-stone-700/80 text-stone-200 border border-stone-600/50 rounded-lg text-xs font-medium transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>جستجو در متن نسخه‌ها</span>
            </NavLink>
            <NavLink
              to="/manuscripts"
              className="inline-flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-stone-800/40 text-stone-300 rounded-lg text-xs font-medium transition-colors"
            >
              <span>مشاهده گنجینه نسخ</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </NavLink>
          </div>
        </div>

        {/* Decorative Calligraphic Watermark */}
        <div className="absolute left-4 bottom-2 text-8xl font-calligraphy text-amber-500/5 select-none pointer-events-none hidden sm:block">
          خط و کتابت
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="relative overflow-hidden hover:border-teal-700/40 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-stone-600">{card.title}</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-stone-900 font-mono tracking-tight">
                      {card.value}
                    </span>
                    <span className="text-xs text-stone-600">{card.unit}</span>
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg border ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-600">
                <span>{card.badge}</span>
                <span className="font-mono text-emerald-800 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  فعال
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Grid: Recent Manuscripts & Processing History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Manuscripts (2 cols) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="نسخه‌های خطی اخیراً ثبت‌شده"
              subtitle="گزیده‌ای از کهن‌ترین آثار وارد شده به گنجینه پژوهشی"
              action={
                <NavLink
                  to="/manuscripts"
                  className="text-xs text-teal-800 hover:text-teal-900 font-semibold flex items-center gap-1"
                >
                  <span>مشاهده همه</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </NavLink>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats.recentManuscripts.map((ms) => (
                <div
                  key={ms.id}
                  className="group flex gap-3.5 p-3 rounded-lg border border-stone-200/90 bg-[#FAF8F5] hover:border-teal-700/60 transition-all shadow-2xs"
                >
                  <img
                    src={ms.coverImageUrl}
                    alt={ms.title}
                    className="w-16 h-20 object-cover rounded-md border border-stone-300 shadow-2xs shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <NavLink
                        to={`/manuscripts/${ms.id}`}
                        className="font-bold text-xs text-stone-900 hover:text-teal-800 line-clamp-1 block leading-snug"
                      >
                        {ms.title}
                      </NavLink>
                      <p className="text-[11px] text-stone-600 line-clamp-1 mt-0.5">{ms.author}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <Badge variant="outline" size="sm">
                        {scriptNames[ms.scriptType] || ms.scriptType}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {periodNames[ms.historicalPeriod] || ms.historicalPeriod}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Jobs (1 col) */}
        <div>
          <Card>
            <CardHeader
              title="آخرین فرآیندهای HTR"
              subtitle="وضعیت پردازش صفحات در حال اجرا"
              action={
                <NavLink
                  to="/history"
                  className="text-xs text-teal-800 hover:text-teal-900 font-semibold flex items-center gap-1"
                >
                  <span>تاریخچه</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </NavLink>
              }
            />

            <div className="space-y-3">
              {stats.recentJobs.map((job) => {
                const statusBadge = {
                  completed: { label: 'تکمیل‌شده', variant: 'success' as const },
                  processing: { label: 'در حال پردازش', variant: 'warning' as const },
                  queued: { label: 'در صف', variant: 'info' as const },
                  failed: { label: 'خطا', variant: 'danger' as const },
                  cancelled: { label: 'لغو شده', variant: 'default' as const },
                }[job.status];

                return (
                  <div
                    key={job.id}
                    className="p-2.5 rounded-lg border border-stone-200/80 bg-white text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-900 truncate max-w-[150px]">
                        {job.manuscriptTitle || `نسخه #${job.manuscriptId.slice(-4)}`}
                      </span>
                      <Badge variant={statusBadge.variant} size="sm">
                        {statusBadge.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-stone-600 text-[11px]">
                      <span>برگه {job.pageNumber}</span>
                      <span className="font-mono text-[10px]">{job.modelName.split('-')[0]}</span>
                    </div>
                    {job.transcriptionId && (
                      <NavLink
                        to={`/transcription/${job.pageId}`}
                        className="text-[11px] text-teal-800 hover:underline block text-left font-medium pt-1"
                      >
                        مشاهده متن رونویسی ←
                      </NavLink>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
