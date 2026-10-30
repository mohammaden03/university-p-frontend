import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Database,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ShieldCheck,
  Edit3,
  ExternalLink,
  SplitSquareVertical,
  Check,
  FileCheck,
} from 'lucide-react';
import { datasetsApi } from '../api';
import { DatasetItem, DatasetSplit, DatasetStatus } from '../types';
import { checkDataLeakage, validateDatasetReadiness, DatasetSample } from '../utils/datasetRules';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Skeleton, EmptyState } from '../components/ui/MiscComponents';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const DatasetPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { canEdit } = useAuth();

  // Filters
  const [splitFilter, setSplitFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);

  // Split Change with Data-Leakage Detector Modal
  const [pendingSplitChange, setPendingSplitChange] = useState<{
    sample: DatasetItem;
    targetSplit: DatasetSplit;
    warningMessage?: string;
  } | null>(null);

  // Review & Ground Truth Edit Modal
  const [editingSample, setEditingSample] = useState<DatasetItem | null>(null);
  const [groundTruthText, setGroundTruthText] = useState<string>('');
  const [editStatus, setEditStatus] = useState<DatasetStatus>('approved');

  // Queries
  const { data: samplesData, isLoading } = useQuery({
    queryKey: ['dataset-samples', { splitFilter, statusFilter, languageFilter, page }],
    queryFn: () =>
      datasetsApi.getSamples({
        split: splitFilter === 'all' ? undefined : (splitFilter as DatasetSplit),
        status: statusFilter === 'all' ? undefined : (statusFilter as DatasetStatus),
        language: languageFilter === 'all' ? undefined : languageFilter,
        page,
        limit: 10,
      }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['dataset-stats'],
    queryFn: () => datasetsApi.getStats(),
  });

  // Mutations
  const updateSplitMutation = useMutation({
    mutationFn: async ({ sampleId, split }: { sampleId: string; split: DatasetSplit }) => {
      return datasetsApi.updateSplit(sampleId, split);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataset-samples'] });
      queryClient.invalidateQueries({ queryKey: ['dataset-stats'] });
      showToast('مجموعه داده برگه با موفقیت به‌روزرسانی شد.', 'success');
      setPendingSplitChange(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      sampleId,
      status,
      text,
    }: {
      sampleId: string;
      status: DatasetStatus;
      text?: string;
    }) => {
      return datasetsApi.updateStatus(sampleId, status, text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataset-samples'] });
      queryClient.invalidateQueries({ queryKey: ['dataset-stats'] });
      showToast('برچسب استاندارد برگه با موفقیت ثبت و تأیید شد.', 'success');
      setEditingSample(null);
    },
  });

  // Handler for split change with data leakage check
  const handleSplitChangeRequest = (sample: DatasetItem, newSplit: DatasetSplit) => {
    if (!samplesData?.items) return;

    // Convert dataset items to domain dataset samples for rule check
    const domainSamples: DatasetSample[] = samplesData.items.map((s) => ({
      id: s.id,
      manuscriptId: s.manuscriptId,
      pageId: s.pageId,
      pageNumber: s.pageNumber,
      language: s.language,
      status: s.status,
      split: s.split,
      groundTruthText: s.groundTruthText,
      originalAiText: s.originalAiText,
    }));

    const leakageCheck = checkDataLeakage(sample.id, newSplit, domainSamples);

    if (leakageCheck.hasLeakage) {
      setPendingSplitChange({
        sample,
        targetSplit: newSplit,
        warningMessage: leakageCheck.message,
      });
    } else {
      updateSplitMutation.mutate({ sampleId: sample.id, split: newSplit });
    }
  };

  const openEditModal = (sample: DatasetItem) => {
    setEditingSample(sample);
    setGroundTruthText(sample.groundTruthText || sample.originalAiText);
    setEditStatus(sample.status);
  };

  const handleExport = async () => {
    try {
      const blob = await datasetsApi.exportDataset('json');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `htr-persian-dataset-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('فایل استاندارد دادگان HTR با فرمت JSON دانلود شد.', 'success');
    } catch {
      showToast('خطا در استخراج فایل دادگان', 'error');
    }
  };

  const splitLabels: Record<DatasetSplit, { label: string; variant: any }> = {
    train: { label: 'آموزش (Train)', variant: 'train' },
    validation: { label: 'اعتبارسنجی (Validation)', variant: 'val' },
    test: { label: 'ارزیابی نهایی (Test)', variant: 'test' },
    unassigned: { label: 'تعیین‌نشده', variant: 'unassigned' },
  };

  const statusLabels: Record<DatasetStatus, { label: string; variant: any }> = {
    approved: { label: 'تأیید نهایی (Approved)', variant: 'success' },
    reviewed: { label: 'بازبینی اولیه', variant: 'info' },
    draft: { label: 'پیش‌نویس خام', variant: 'warning' },
  };

  return (
    <div className="space-y-6">
      {/* Page Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-calligraphy">
            مدیریت دادگان آموزشی HTR و برچسب‌گذاری مرجع (Ground Truth)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            تفکیک استاندارد برگه‌ها به بخش‌های آموزش، اعتبارسنجی و ارزیابی با جلوگیری هوشمند از نشت داده (Data Leakage)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            icon={<Download className="w-4 h-4 text-teal-800" />}
          >
            خروجی استاندارد پیکره (JSON)
          </Button>
        </div>
      </div>

      {/* Dataset Statistics Cards */}
      {statsData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card className="p-3 text-center bg-white">
            <span className="block text-[11px] text-stone-500">کل نمونه‌های دادگان</span>
            <span className="text-xl font-bold font-mono text-stone-900 mt-1 block">
              {statsData.totalSamples}
            </span>
          </Card>
          <Card className="p-3 text-center bg-blue-50/40 border-blue-200">
            <span className="block text-[11px] text-blue-800">مجموعه آموزش (Train)</span>
            <span className="text-xl font-bold font-mono text-blue-900 mt-1 block">
              {statsData.trainCount}
            </span>
          </Card>
          <Card className="p-3 text-center bg-purple-50/40 border-purple-200">
            <span className="block text-[11px] text-purple-800">اعتبارسنجی (Val)</span>
            <span className="text-xl font-bold font-mono text-purple-900 mt-1 block">
              {statsData.validationCount}
            </span>
          </Card>
          <Card className="p-3 text-center bg-amber-50/40 border-amber-200">
            <span className="block text-[11px] text-amber-800">آزمون (Test)</span>
            <span className="text-xl font-bold font-mono text-amber-900 mt-1 block">
              {statsData.testCount}
            </span>
          </Card>
          <Card className="p-3 text-center bg-emerald-50/40 border-emerald-200">
            <span className="block text-[11px] text-emerald-800">تأیید نهایی (Approved)</span>
            <span className="text-xl font-bold font-mono text-emerald-900 mt-1 block">
              {statsData.approvedCount}
            </span>
          </Card>
          <Card className="p-3 text-center bg-stone-50 border-stone-200">
            <span className="block text-[11px] text-stone-600">مجموع واژگان برچسب‌خورده</span>
            <span className="text-xl font-bold font-mono text-stone-900 mt-1 block">
              {statsData.totalWords}
            </span>
          </Card>
        </div>
      )}

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
        <Select
          label="بخش مجموعه داده (Split)"
          value={splitFilter}
          onChange={(e) => {
            setSplitFilter(e.target.value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'همه بخش‌ها (All Splits)' },
            { value: 'train', label: 'آموزش (Train)' },
            { value: 'validation', label: 'اعتبارسنجی (Validation)' },
            { value: 'test', label: 'آزمون نهایی (Test)' },
            { value: 'unassigned', label: 'تخصیص‌نیافته' },
          ]}
          className="text-xs"
        />

        <Select
          label="وضعیت برچسب‌گذاری (Status)"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'همه وضعیت‌ها' },
            { value: 'approved', label: 'تأیید نهایی (Approved)' },
            { value: 'reviewed', label: 'بازبینی اولیه (Reviewed)' },
            { value: 'draft', label: 'پیش‌نویس خام (Draft)' },
          ]}
          className="text-xs"
        />

        <Select
          label="زبان"
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

      {/* Samples Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-md" />
            ))}
          </div>
        ) : !samplesData || samplesData.items.length === 0 ? (
          <EmptyState
            icon={<Database className="w-6 h-6" />}
            title="هیچ نمونه دادگانی با این فیلترها یافت نشد"
            className="m-6"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#FAF8F5] border-b border-stone-200 text-stone-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">برگه و تصویر</th>
                  <th className="py-3 px-4">نسخه خطی</th>
                  <th className="py-3 px-4">متن مرجع و برچسب (Ground Truth)</th>
                  <th className="py-3 px-4">وضعیت تایید</th>
                  <th className="py-3 px-4">تخصیص بخش (Split)</th>
                  <th className="py-3 px-4 text-center">عملیات مصحح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {samplesData.items.map((sample) => (
                  <tr key={sample.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={sample.imageUrl}
                          alt="برگه"
                          className="w-10 h-14 object-cover rounded border border-stone-300"
                        />
                        <span className="font-mono font-bold text-stone-800">
                          برگه {sample.pageNumber}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-stone-900 max-w-[150px] truncate">
                      {sample.manuscriptTitle}
                    </td>

                    <td className="py-3 px-4 max-w-sm">
                      <div className="line-clamp-2 font-calligraphy text-xs leading-relaxed text-stone-800 bg-[#FAF9F6] p-2 rounded border border-stone-200">
                        {sample.groundTruthText || sample.originalAiText}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-stone-500 mt-1 font-mono">
                        <span>{sample.characterCount} نویسه</span>
                        <span>{sample.wordCount} واژه</span>
                        {sample.cerPercentage !== undefined && (
                          <span className="text-emerald-700">CER: {sample.cerPercentage}%</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant={statusLabels[sample.status].variant} size="sm">
                        {statusLabels[sample.status].label}
                      </Badge>
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={sample.split}
                        disabled={!canEdit}
                        onChange={(e) =>
                          handleSplitChangeRequest(sample, e.target.value as DatasetSplit)
                        }
                        className="rounded border border-stone-300 bg-white px-2 py-1 text-xs text-stone-800 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700"
                      >
                        <option value="train">آموزش (Train)</option>
                        <option value="validation">اعتبارسنجی (Validation)</option>
                        <option value="test">آزمون نهایی (Test)</option>
                        <option value="unassigned">تعیین‌نشده</option>
                      </select>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(sample)}
                            className="p-1 text-teal-800 hover:bg-teal-50 rounded"
                            title="بازبینی و اصلاح برچسب مرجع"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <NavLink
                          to={`/transcription/${sample.pageId}`}
                          className="p-1 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded"
                          title="ورود به کارگاه تصحیح"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </NavLink>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Data Leakage Warning Confirmation Dialog */}
      {pendingSplitChange && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setPendingSplitChange(null)}
          onConfirm={() => {
            updateSplitMutation.mutate({
              sampleId: pendingSplitChange.sample.id,
              split: pendingSplitChange.targetSplit,
            });
          }}
          title="هشدار نشت داده (Data Leakage Warning)"
          message={
            pendingSplitChange.warningMessage ||
            'صفحات دیگری از این نسخه خطی در بخش‌های دیگر قرار دارند. آیا از انتقال به این مجموعه مطمئن هستید؟'
          }
          confirmLabel="تأیید انتقال علی‌رغم ریسک نشت داده"
          cancelLabel="انصراف"
          variant="warning"
          isLoading={updateSplitMutation.isPending}
        />
      )}

      {/* Review Ground-Truth Modal */}
      <Modal
        isOpen={!!editingSample}
        onClose={() => setEditingSample(null)}
        title="بازبینی و تأیید برچسب استاندارد (Ground Truth Review)"
        subtitle={`نسخه: ${editingSample?.manuscriptTitle} — برگه ${editingSample?.pageNumber}`}
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditingSample(null)}>
              انصراف
            </Button>
            <Button
              size="sm"
              isLoading={updateStatusMutation.isPending}
              onClick={() => {
                if (!editingSample) return;
                updateStatusMutation.mutate({
                  sampleId: editingSample.id,
                  status: editStatus,
                  text: groundTruthText,
                });
              }}
            >
              ثبت و ذخیره برچسب
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              متن تصحیح‌شده و اعتبارسنجی‌شده (Ground Truth)
            </label>
            <textarea
              rows={5}
              value={groundTruthText}
              onChange={(e) => setGroundTruthText(e.target.value)}
              className="w-full rounded-md border border-stone-300 p-3 font-calligraphy text-sm leading-relaxed text-right focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              وضعیت تأیید برای آموزش مدل
            </label>
            <Select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as DatasetStatus)}
              options={[
                { value: 'approved', label: 'تأیید نهایی (Approved - آماده استفاده در ترین)' },
                { value: 'reviewed', label: 'بازبینی‌شده (Reviewed)' },
                { value: 'draft', label: 'پیش‌نویس خام (Draft)' },
              ]}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
