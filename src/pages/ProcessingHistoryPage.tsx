import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import {
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import { jobsApi } from '../api';
import { JobStatus, RecognitionJob } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Skeleton, EmptyState } from '../components/ui/MiscComponents';
import { useToast } from '../context/ToastContext';

export const ProcessingHistoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['jobs-history', { statusFilter, languageFilter, page }],
    queryFn: () =>
      jobsApi.getAll({
        status: statusFilter === 'all' ? undefined : (statusFilter as JobStatus),
        language: languageFilter === 'all' ? undefined : languageFilter,
        page,
        limit: 12,
      }),
    refetchInterval: 8000,
  });

  const retryMutation = useMutation({
    mutationFn: (jobId: string) => jobsApi.retryJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs-history'] });
      showToast('فرآیند پردازش مجدد در صف سرور قرار گرفت.', 'info');
    },
    onError: (err: any) => {
      showToast(err.message || 'خطا در اجرای مجدد پردازش', 'error');
    },
  });

  const statusBadges: Record<JobStatus, { label: string; variant: any; icon: any }> = {
    completed: { label: 'تکمیل‌شده', variant: 'success', icon: CheckCircle2 },
    processing: { label: 'در حال نویسه‌خوانی', variant: 'warning', icon: Clock },
    queued: { label: 'در صف پردازش', variant: 'info', icon: Clock },
    failed: { label: 'خطای پردازش', variant: 'danger', icon: AlertCircle },
    cancelled: { label: 'لغو شده', variant: 'default', icon: AlertCircle },
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-stone-900 font-calligraphy">
          تاریخچه و صف فرآیندهای بازشناسی خودکار متن (HTR Jobs)
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          گزارش کامل اجرای مدل‌های ترنسفورمر، مدت زمان استخراج، کدهای رهگیری و وضعیت خطاهای احتمالی
        </p>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
        <Select
          label="وضعیت فرآیند"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'همه وضعیت‌ها' },
            { value: 'completed', label: 'تکمیل‌شده' },
            { value: 'processing', label: 'در حال پردازش' },
            { value: 'queued', label: 'در صف' },
            { value: 'failed', label: 'خطا و ناموفق' },
          ]}
          className="text-xs"
        />

        <Select
          label="زبان متن"
          value={languageFilter}
          onChange={(e) => {
            setLanguageFilter(e.target.value);
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
      </div>

      {/* Jobs Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 rounded-md" />
            ))}
          </div>
        ) : !jobsData || jobsData.items.length === 0 ? (
          <EmptyState
            icon={<History className="w-6 h-6" />}
            title="هیچ فرآیندی با این فیلترها یافت نشد"
            className="m-6"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#FAF8F5] border-b border-stone-200 text-stone-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">شناسه فرآیند (Job ID)</th>
                  <th className="py-3 px-4">نسخه و شماره برگه</th>
                  <th className="py-3 px-4">مدل HTR</th>
                  <th className="py-3 px-4">وضعیت</th>
                  <th className="py-3 px-4">زمان ثبت و اتمام</th>
                  <th className="py-3 px-4">مدت زمان</th>
                  <th className="py-3 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {jobsData.items.map((job) => {
                  const badgeInfo = statusBadges[job.status];
                  const Icon = badgeInfo.icon;
                  return (
                    <tr key={job.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-stone-600">
                        {job.id}
                      </td>

                      <td className="py-3 px-4 font-semibold text-stone-900">
                        <div>
                          {job.manuscriptTitle || `نسخه #${job.manuscriptId.slice(-4)}`}
                        </div>
                        <span className="text-[11px] text-stone-500 font-normal">
                          برگه شماره {job.pageNumber}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {job.modelName}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={badgeInfo.variant} size="sm">
                          <Icon className="w-3.5 h-3.5 ml-1" />
                          <span>{badgeInfo.label}</span>
                        </Badge>
                        {job.errorMessage && (
                          <p className="text-[10px] text-rose-600 mt-0.5">{job.errorMessage}</p>
                        )}
                      </td>

                      <td className="py-3 px-4 text-stone-600 font-mono text-[11px]">
                        <div>{new Date(job.startedAt).toLocaleTimeString('fa-IR')}</div>
                        <span className="text-[10px] text-stone-400">
                          {new Date(job.startedAt).toLocaleDateString('fa-IR')}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-stone-600">
                        {job.durationMs ? `${(job.durationMs / 1000).toFixed(1)} ثانیه` : '—'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {job.status === 'completed' ? (
                            <NavLink
                              to={`/transcription/${job.pageId}`}
                              className="inline-flex items-center gap-1 text-teal-800 hover:text-teal-900 font-semibold p-1 hover:bg-teal-50 rounded"
                              title="مشاهده نتیجه در کارگاه تصحیح"
                            >
                              <span>مشاهده متن</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </NavLink>
                          ) : job.status === 'failed' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryMutation.mutate(job.id)}
                              isLoading={retryMutation.isPending}
                              icon={<RotateCcw className="w-3 h-3 text-rose-600" />}
                            >
                              تلاش مجدد
                            </Button>
                          ) : (
                            <span className="text-stone-400 text-[11px]">در جریان...</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
