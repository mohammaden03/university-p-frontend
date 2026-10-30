import React, { useState, useEffect } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  BookOpen,
  Filter,
  ExternalLink,
  FileText,
  Sparkles,
  Layers,
  Calendar,
  Feather,
  ArrowLeft,
  X,
} from 'lucide-react';
import { searchApi, manuscriptsApi } from '../api';
import { ManuscriptLanguage, HistoricalPeriod, ScriptType } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Skeleton, EmptyState } from '../components/ui/MiscComponents';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial values from URL query parameters
  const initialQuery = searchParams.get('q') || '';
  const initialManuscriptId = searchParams.get('manuscriptId') || 'all';
  const initialLanguage = searchParams.get('language') || 'all';
  const initialScript = searchParams.get('scriptType') || 'all';
  const initialPeriod = searchParams.get('historicalPeriod') || 'all';
  const initialStatus = searchParams.get('status') || 'all';
  const initialPage = Number(searchParams.get('page')) || 1;

  // Local state
  const [searchTerm, setSearchTerm] = useState<string>(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQuery);
  const [selectedManuscript, setSelectedManuscript] = useState<string>(initialManuscriptId);
  const [language, setLanguage] = useState<string>(initialLanguage);
  const [scriptType, setScriptType] = useState<string>(initialScript);
  const [period, setPeriod] = useState<string>(initialPeriod);
  const [status, setStatus] = useState<string>(initialStatus);
  const [page, setPage] = useState<number>(initialPage);

  // Debounce search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sync state to URL search parameters
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedQuery) params.q = debouncedQuery;
    if (selectedManuscript !== 'all') params.manuscriptId = selectedManuscript;
    if (language !== 'all') params.language = language;
    if (scriptType !== 'all') params.scriptType = scriptType;
    if (period !== 'all') params.historicalPeriod = period;
    if (status !== 'all') params.status = status;
    if (page > 1) params.page = String(page);

    setSearchParams(params, { replace: true });
  }, [debouncedQuery, selectedManuscript, language, scriptType, period, status, page, setSearchParams]);

  // Manuscripts dropdown list query
  const { data: manuscriptsData } = useQuery({
    queryKey: ['manuscripts-search-options'],
    queryFn: () => manuscriptsApi.getAll({ limit: 100 }),
  });

  // Full-text search query
  const { data: searchResults, isLoading, isFetching } = useQuery({
    queryKey: [
      'search-results',
      { debouncedQuery, selectedManuscript, language, scriptType, period, status, page },
    ],
    queryFn: () =>
      searchApi.search({
        q: debouncedQuery,
        manuscriptId: selectedManuscript === 'all' ? undefined : selectedManuscript,
        language: language === 'all' ? undefined : (language as ManuscriptLanguage),
        scriptType: scriptType === 'all' ? undefined : (scriptType as ScriptType),
        historicalPeriod: period === 'all' ? undefined : (period as HistoricalPeriod),
        status: status === 'all' ? undefined : (status as any),
        page,
        limit: 10,
      }),
  });

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedQuery('');
    setSelectedManuscript('all');
    setLanguage('all');
    setScriptType('all');
    setPeriod('all');
    setStatus('all');
    setPage(1);
  };

  const scriptLabels: Record<string, string> = {
    nastaliq: 'نستعلیق',
    naskh: 'نسخ',
    shekasteh: 'شکسته نستعلیق',
    kufic: 'کوفی',
    thuluth: 'ثلث',
    taliq: 'تعلیق',
  };

  const statusLabels: Record<string, string> = {
    approved: 'تأییدشده',
    reviewed: 'بازبینی‌شده',
    original_ai: 'خام هوش مصنوعی',
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-stone-900 font-calligraphy">
          جستجوی پیشرفته در کلمات و عبارات نسخ خطی
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          پژوهش تمام‌متن (Full-Text Search) در میان اشعار، احادیث، حکایات و حواشی نسخه‌های کهن
        </p>
      </div>

      {/* Main Search Input & Filters Box */}
      <Card className="space-y-4">
        <div className="relative">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="کلمه، عبارت، مصرع یا نام شخصیت مورد نظر را بنویسید (مثال: خرد، عیش، طاعتش، دبشلیم)..."
            className="pr-10 py-3 text-sm font-calligraphy font-semibold bg-[#FAF9F6]"
          />
          <Search className="w-5 h-5 text-stone-400 absolute right-3 top-3.5 pointer-events-none" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-3.5 text-stone-400 hover:text-stone-700"
              aria-label="پاک‌کردن متن جستجو"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-stone-100">
          <Select
            label="نسخه خطی"
            value={selectedManuscript}
            onChange={(e) => {
              setSelectedManuscript(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'همه نسخه‌ها' },
              ...(manuscriptsData?.items?.map((m) => ({
                value: m.id,
                label: m.title,
              })) || []),
            ]}
            className="text-xs"
          />

          <Select
            label="زبان"
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'همه زبان‌ها' },
              { value: 'fa', label: 'فارسی' },
              { value: 'ar', label: 'عربی' },
              { value: 'mixed', label: 'ترکیبی' },
            ]}
            className="text-xs"
          />

          <Select
            label="نوع خط"
            value={scriptType}
            onChange={(e) => {
              setScriptType(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'همه خطوط' },
              { value: 'nastaliq', label: 'نستعلیق' },
              { value: 'shekasteh', label: 'شکسته نستعلیق' },
              { value: 'naskh', label: 'نسخ' },
              { value: 'kufic', label: 'کوفی' },
            ]}
            className="text-xs"
          />

          <Select
            label="وضعیت تصحیح"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'همه وضعیت‌ها' },
              { value: 'approved', label: 'فقط تأیید نهایی' },
              { value: 'reviewed', label: 'بازبینی‌شده' },
              { value: 'original_ai', label: 'خام HTR' },
            ]}
            className="text-xs"
          />

          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={clearFilters}
            >
              پاک‌سازی فیلترها
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-stone-600">
          <div>
            {isLoading || isFetching ? (
              <span className="flex items-center gap-1.5 text-teal-800">
                <span className="w-2 h-2 rounded-full bg-teal-700 animate-ping" />
                در حال جستجو در پایگاه اسناد...
              </span>
            ) : (
              <span>
                یافت شد: <strong className="font-mono text-stone-900">{searchResults?.total || 0}</strong> مورد
                {debouncedQuery && <span> برای عبارت «{debouncedQuery}»</span>}
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : !searchResults || searchResults.results.length === 0 ? (
          <EmptyState
            icon={<Search className="w-6 h-6" />}
            title="هیچ نتیجه‌ای مطابق جستجو یافت نشد"
            description="واژه‌های متفاوتی را امتحان کنید یا فیلترهای سبک خط و دوره تاریخی را تغییر دهید."
            action={
              <Button size="sm" variant="outline" onClick={clearFilters}>
                حذف فیلترها
              </Button>
            }
          />
        ) : (
          <div className="space-y-3.5">
            {searchResults.results.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white rounded-xl border border-stone-200/90 hover:border-teal-700/60 transition-all shadow-2xs flex flex-col sm:flex-row gap-4 justify-between"
              >
                <div className="flex gap-3.5 flex-1 min-w-0">
                  <img
                    src={item.imageUrl}
                    alt={item.manuscriptTitle}
                    className="w-16 h-20 object-cover rounded-md border border-stone-300 shadow-2xs shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <NavLink
                          to={`/manuscripts/${item.manuscriptId}`}
                          className="font-bold text-xs text-stone-900 hover:text-teal-800"
                        >
                          {item.manuscriptTitle}
                        </NavLink>
                        <span className="text-stone-300">•</span>
                        <span className="text-[11px] text-stone-500">برگه {item.pageNumber}</span>
                        <Badge variant="outline" size="sm">
                          {scriptLabels[item.scriptType] || item.scriptType}
                        </Badge>
                        <Badge
                          variant={
                            item.status === 'approved'
                              ? 'success'
                              : item.status === 'reviewed'
                              ? 'info'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {statusLabels[item.status] || item.status}
                        </Badge>
                      </div>

                      {/* Matched Snippet */}
                      <p className="font-calligraphy text-sm leading-relaxed text-stone-800 bg-[#FAF8F5] p-2.5 rounded-md border border-stone-200/60 mt-1">
                        {item.snippet}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-stone-500 mt-2">
                      <span>پدیدآور: {item.author}</span>
                      {item.confidence && (
                        <span className="font-mono text-emerald-800">
                          اطمینان بازشناسی: {item.confidence}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-r border-stone-100 pt-2 sm:pt-0 sm:pr-4">
                  <NavLink
                    to={`/transcription/${item.pageId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-amber-50 text-xs font-semibold rounded-md shadow-2xs transition-colors whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>مشاهده در کارگاه تصحیح</span>
                  </NavLink>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {searchResults && searchResults.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              صفحه قبل
            </Button>
            <span className="text-xs text-stone-600 font-mono px-3">
              صفحه {page} از {searchResults.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= searchResults.totalPages}
              onClick={() => setPage((p) => Math.min(searchResults.totalPages, p + 1))}
            >
              صفحه بعد
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
