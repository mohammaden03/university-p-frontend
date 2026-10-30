import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Upload,
  ScanText,
  FileCheck,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Clock,
  RotateCcw,
  Image as ImageIcon,
  BookOpen,
} from 'lucide-react';
import { manuscriptsApi, pagesApi, jobsApi } from '../api';
import { RecognitionJob, ManuscriptLanguage } from '../types';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';

export const UploadRecognitionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const preselectedMsId = searchParams.get('manuscriptId') || '';

  // Step state
  const [selectedManuscriptId, setSelectedManuscriptId] = useState<string>(preselectedMsId);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [language, setLanguage] = useState<ManuscriptLanguage>('fa');
  const [selectedModel, setSelectedModel] = useState<string>('PersianHTR-Transformer-v2.3');
  const [notes, setNotes] = useState<string>('');

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=85'
  );
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Job state
  const [activeJob, setActiveJob] = useState<RecognitionJob | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Fetch manuscripts list
  const { data: manuscriptsData, isLoading: isMsLoading } = useQuery({
    queryKey: ['manuscripts-all'],
    queryFn: () => manuscriptsApi.getAll({ limit: 50 }),
  });

  // Fetch models list
  const { data: models } = useQuery({
    queryKey: ['htr-models'],
    queryFn: () => jobsApi.getAvailableModels(),
  });

  // Sync preselected manuscript
  useEffect(() => {
    if (manuscriptsData?.items?.length && !selectedManuscriptId) {
      setSelectedManuscriptId(manuscriptsData.items[0].id);
    }
  }, [manuscriptsData, selectedManuscriptId]);

  // Polling for active job with bounded interval and safe cleanup
  useEffect(() => {
    if (!activeJob || activeJob.status === 'completed' || activeJob.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const updatedJob = await jobsApi.getById(activeJob.id);
        setActiveJob(updatedJob);

        if (updatedJob.status === 'completed') {
          showToast('بازشناسی HTR با موفقیت تکمیل شد!', 'success');
        } else if (updatedJob.status === 'failed') {
          showToast('پردازش بازشناسی با خطا مواجه شد.', 'error');
        }
      } catch (err) {
        console.error('Job polling error:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJob, showToast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];
    if (!validTypes.includes(file.type)) {
      showToast('فرمت تصویر نامعتبر است. فرمت‌های مجاز: JPEG، PNG، WebP، TIFF', 'error');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      showToast('حجم فایل تصویر نباید از ۲۵ مگابایت بیشتر باشد.', 'error');
      return;
    }

    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // Submit complete workflow
  const handleSubmitRecognition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManuscriptId) {
      showToast('لطفاً ابتدا نسخه خطی مورد نظر را انتخاب نمایید.', 'error');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(30);

      // 1. Upload or create page
      const createdPage = await pagesApi.uploadPage({
        manuscriptId: selectedManuscriptId,
        pageNumber,
        imageUrl: previewUrl,
        file: imageFile || undefined,
        notes,
      });

      setUploadProgress(70);

      // 2. Request HTR Job
      const newJob = await jobsApi.createJob({
        pageId: createdPage.id,
        manuscriptId: selectedManuscriptId,
        language,
        modelName: selectedModel,
      });

      setUploadProgress(100);
      setIsUploading(false);
      setActiveJob(newJob);

      showToast('تصویر بارگذاری شد و فرآیند بازشناسی آغاز گردید.', 'info');
    } catch (err: any) {
      setIsUploading(false);
      showToast(err.message || 'خطا در بارگذاری و آغاز بازشناسی', 'error');
    }
  };

  const handleRetryJob = async () => {
    if (!activeJob) return;
    try {
      const retried = await jobsApi.retryJob(activeJob.id);
      setActiveJob(retried);
      showToast('درخواست پردازش مجدد ثبت شد.', 'info');
    } catch (err: any) {
      showToast(err.message || 'خطا در تلاش مجدد', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-stone-900 font-calligraphy">
          بارگذاری تصویر نسخه و استخراج هوشمند متن (HTR)
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          تصویر برگه‌های کهن را بارگذاری نموده و با استفاده از مدل‌های اختصاصی ترنسفورمر، خطوط نستعلیق، شکسته یا کوفی را به متن قابل جستجو تبدیل کنید.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Main Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <Card>
            <form onSubmit={handleSubmitRecognition} className="space-y-4">
              <CardHeader
                title="مشخصات برگه و تنظیمات مدل بازشناسی"
                subtitle="انتخاب نسخه مرجع و پارامترهای موتور هوش مصنوعی"
              />

              {/* Manuscript Select */}
              <Select
                label="انتخاب نسخه خطی مرجع"
                required
                value={selectedManuscriptId}
                onChange={(e) => setSelectedManuscriptId(e.target.value)}
                options={
                  manuscriptsData?.items?.map((m) => ({
                    value: m.id,
                    label: `${m.title} (${m.catalogId})`,
                  })) || [{ value: '', label: 'در حال بارگذاری...' }]
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="شماره برگه / صفحه"
                  type="number"
                  min={1}
                  required
                  value={pageNumber}
                  onChange={(e) => setPageNumber(Number(e.target.value))}
                />

                <Select
                  label="زبان متن کتابت"
                  required
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as ManuscriptLanguage)}
                  options={[
                    { value: 'fa', label: 'فارسی' },
                    { value: 'ar', label: 'عربی' },
                    { value: 'mixed', label: 'ترکیبی (فارسی و عربی)' },
                  ]}
                />
              </div>

              {/* Model Select */}
              <Select
                label="مدل بازشناسی خط (HTR Model)"
                required
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                options={
                  models?.map((m) => ({
                    value: m.name,
                    label: `${m.name} — ${m.description}`,
                  })) || [
                    { value: 'PersianHTR-Transformer-v2.3', label: 'PersianHTR-Transformer-v2.3 (نستعلیق و نسخ)' },
                    { value: 'IslamicCalligraphy-Shekasteh-v1.8', label: 'IslamicCalligraphy-Shekasteh-v1.8 (شکسته نستعلیق)' },
                    { value: 'Arabic-Kufic-Vision-v3.0', label: 'Arabic-Kufic-Vision-v3.0 (کوفی کهن)' },
                  ]
                }
              />

              {/* Drag & Drop Upload Zone */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  تصویر برگه خطی (کیفیت اصلی)
                  <span className="text-rose-600 mr-1">*</span>
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-teal-700 bg-teal-50/50'
                      : 'border-stone-300 hover:border-teal-600 bg-[#FAF9F6]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/tiff"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-teal-800 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-stone-800">
                    برای بارگذاری تصویر برگه کلیک کنید یا فایل را بکشید و رها کنید
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    پشتیبانی از TIFF ،WebP ،PNG ،JPEG (حداکثر ۲۵ مگابایت)
                  </p>
                  {imageFile && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-900 text-xs font-medium rounded-full">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>{imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  توضیحات و یادداشت مصحح (اختیاری)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="نکات مربوط به خوانش، لکه‌های جوهر یا شکستگی کلمات..."
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-xs text-right focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isUploading || activeJob?.status === 'processing'}
                  disabled={!selectedManuscriptId || Boolean(activeJob && activeJob.status === 'processing')}
                  icon={<Sparkles className="w-4 h-4 text-amber-300" />}
                >
                  {isUploading
                    ? `در حال ارسال تصویر به سرور (${uploadProgress}%)...`
                    : activeJob?.status === 'processing'
                    ? 'سیستم در حال بازشناسی و تحلیل کلمات...'
                    : 'ارسال تصویر و آغاز بازشناسی HTR'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right/Preview & Live Processing Status (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Contained Image Preview */}
          <Card className="p-4">
            <CardHeader
              title="پیش‌نمایش تصویر انتخابی"
              subtitle="حفظ نسبت ابعاد اصلی بدون دفرمه شدن"
            />
            <div className="relative h-64 bg-stone-900 rounded-lg overflow-hidden flex items-center justify-center border border-stone-800">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="پیش‌نمایش برگه"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-stone-500 text-xs flex flex-col items-center gap-1">
                  <ImageIcon className="w-8 h-8" />
                  <span>هنوز تصویری انتخاب نشده است</span>
                </div>
              )}
            </div>
          </Card>

          {/* Real Processing Job Lifecycle Box */}
          {activeJob && (
            <Card
              className={`border-2 transition-all ${
                activeJob.status === 'completed'
                  ? 'border-emerald-500 bg-emerald-50/30'
                  : activeJob.status === 'failed'
                  ? 'border-rose-400 bg-rose-50/30'
                  : 'border-teal-600 bg-teal-50/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {activeJob.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : activeJob.status === 'failed' ? (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-teal-600 animate-spin" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">
                      {activeJob.status === 'completed'
                        ? 'بازشناسی متن با موفقیت پایان یافت'
                        : activeJob.status === 'failed'
                        ? 'خطا در پردازش تصویر توسط موتور HTR'
                        : 'سیستم در حال نویسه‌خوانی و استخراج سطور...'}
                    </h4>
                    <span className="text-[10px] text-stone-500 font-mono">
                      Job ID: {activeJob.id}
                    </span>
                  </div>
                </div>

                <Badge
                  variant={
                    activeJob.status === 'completed'
                      ? 'success'
                      : activeJob.status === 'failed'
                      ? 'danger'
                      : 'warning'
                  }
                  size="sm"
                >
                  {activeJob.status === 'completed'
                    ? 'تکمیل‌شده'
                    : activeJob.status === 'failed'
                    ? 'ناموفق'
                    : 'در حال پردازش'}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      activeJob.status === 'completed'
                        ? 'bg-emerald-600 w-full'
                        : activeJob.status === 'failed'
                        ? 'bg-rose-500 w-full'
                        : 'bg-teal-700 w-3/4 animate-pulse'
                    }`}
                  />
                </div>
              </div>

              {/* Actions based on state */}
              <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between">
                {activeJob.status === 'completed' ? (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/transcription/${activeJob.pageId}`)}
                    icon={<ArrowLeft className="w-4 h-4" />}
                  >
                    مشاهده و ویرایش نتیجه در کارگاه تصحیح
                  </Button>
                ) : activeJob.status === 'failed' ? (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleRetryJob}
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    تلاش مجدد پردازش
                  </Button>
                ) : (
                  <span className="text-xs text-stone-500 animate-pulse">
                    در حال دریافت نتایج بازشناسی از مدل ترنسفورمر...
                  </span>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
