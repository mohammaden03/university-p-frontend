import React, { useState } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  ArrowRight,
  Layers,
  Upload,
  ScanText,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ZoomIn,
  Trash2,
} from 'lucide-react';
import { manuscriptsApi, pagesApi, jobsApi } from '../api';
import { ManuscriptPage } from '../types';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Skeleton, EmptyState } from '../components/ui/MiscComponents';
import { ImageZoomViewer } from '../components/manuscript/ImageZoomViewer';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const ManuscriptDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { canEdit, isAdmin } = useAuth();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newPageNumber, setNewPageNumber] = useState<number>(1);
  const [newPageNotes, setNewPageNotes] = useState('');
  const [newPageUrl, setNewPageUrl] = useState('');
  const [selectedPreviewPage, setSelectedPreviewPage] = useState<ManuscriptPage | null>(null);
  const [deletingPage, setDeletingPage] = useState<ManuscriptPage | null>(null);

  // Queries
  const { data: manuscript, isLoading: isMsLoading } = useQuery({
    queryKey: ['manuscript', id],
    queryFn: () => manuscriptsApi.getById(id!),
    enabled: !!id,
  });

  const { data: pages, isLoading: isPagesLoading } = useQuery({
    queryKey: ['manuscript-pages', id],
    queryFn: () => pagesApi.getByManuscriptId(id!),
    enabled: !!id,
  });

  // Upload page mutation
  const uploadPageMutation = useMutation({
    mutationFn: async () => {
      return pagesApi.uploadPage({
        manuscriptId: id!,
        pageNumber: newPageNumber,
        imageUrl:
          newPageUrl ||
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=85',
        notes: newPageNotes,
      });
    },
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({ queryKey: ['manuscript-pages', id] });
      queryClient.invalidateQueries({ queryKey: ['manuscript', id] });
      showToast(`برگه شماره ${newPage.pageNumber} با موفقیت بارگذاری گردید.`, 'success');
      setIsUploadModalOpen(false);
      setNewPageNotes('');
    },
    onError: (err: any) => {
      showToast(err.message || 'خطا در بارگذاری برگه نسخه', 'error');
    },
  });

  // Start Recognition Mutation
  const startJobMutation = useMutation({
    mutationFn: async (pageId: string) => {
      return jobsApi.createJob({
        pageId,
        manuscriptId: id!,
        language: manuscript?.language || 'fa',
        modelName: 'PersianHTR-Transformer-v2.3',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manuscript-pages', id] });
      showToast('پردازش HTR آغاز شد. سیستم در حال استخراج و نویسه‌خوانی متن است.', 'info');
    },
    onError: (err: any) => {
      showToast(err.message || 'خطا در آغاز فرآیند بازشناسی', 'error');
    },
  });

  // Delete Page Mutation
  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      return pagesApi.delete(pageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manuscript-pages', id] });
      showToast('برگه مورد نظر حذف گردید.', 'success');
      setDeletingPage(null);
    },
  });

  if (isMsLoading || isPagesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!manuscript) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-stone-200">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="font-bold text-sm text-stone-800">نسخه خطی یافت نشد</h3>
        <NavLink to="/manuscripts" className="text-xs text-teal-800 hover:underline mt-2 inline-block">
          بازگشت به کتابخانه نسخ خطی ←
        </NavLink>
      </div>
    );
  }

  const scriptLabels: Record<string, string> = {
    nastaliq: 'نستعلیق',
    naskh: 'نسخ',
    shekasteh: 'شکسته نستعلیق',
    kufic: 'کوفی',
    thuluth: 'ثلث',
    taliq: 'تعلیق',
    muhaqqaq: 'محقق',
    other: 'سایر',
  };

  const periodLabels: Record<string, string> = {
    timurid: 'عصر تیموری',
    safavid: 'عصر صفوی',
    ilkanid: 'عصر ایلخانی',
    abbasid: 'عصر عباسی',
    seljuk: 'عصر سلجوقی',
    qajar: 'عصر قاجار',
    other: 'سایر',
  };

  const pageStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success" size="sm">تأیید نهایی</Badge>;
      case 'reviewed':
        return <Badge variant="info" size="sm">بازبینی‌شده</Badge>;
      case 'recognized':
        return <Badge variant="warning" size="sm">بازشناسی خام HTR</Badge>;
      case 'processing':
        return <Badge variant="warning" size="sm">در حال پردازش...</Badge>;
      case 'failed':
        return <Badge variant="danger" size="sm">خطای بازشناسی</Badge>;
      default:
        return <Badge variant="default" size="sm">در انتظار پردازش</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Return */}
      <div className="flex items-center justify-between">
        <NavLink
          to="/manuscripts"
          className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-teal-800 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به کتابخانه نسخ خطی</span>
        </NavLink>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              size="sm"
              icon={<Upload className="w-4 h-4" />}
              onClick={() => {
                setNewPageNumber((pages?.length || 0) + 1);
                setIsUploadModalOpen(true);
              }}
            >
              بارگذاری برگ یا تصویر جدید
            </Button>
          )}
        </div>
      </div>

      {/* Bibliographic Card */}
      <Card className="bg-white border-stone-200">
        <div className="flex flex-col md:flex-row gap-6">
          <img
            src={manuscript.coverImageUrl}
            alt={manuscript.title}
            className="w-full md:w-48 h-64 object-cover rounded-lg border border-stone-300 shadow-sm shrink-0"
          />

          <div className="flex-1 text-right flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" size="sm">
                  {scriptLabels[manuscript.scriptType] || manuscript.scriptType}
                </Badge>
                <Badge variant="default" size="sm">
                  {periodLabels[manuscript.historicalPeriod] || manuscript.historicalPeriod}
                </Badge>
                <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                  {manuscript.catalogId}
                </span>
              </div>

              <h1 className="text-xl font-bold text-stone-900 font-calligraphy">
                {manuscript.title}
              </h1>
              <p className="text-xs text-stone-600 font-medium mt-1">
                پدیدآور / کاتب: {manuscript.author}
              </p>

              <p className="text-xs text-stone-700 mt-3 leading-relaxed">
                {manuscript.description}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="block text-stone-500 text-[11px]">محل نگهداری</span>
                <span className="font-semibold text-stone-800">{manuscript.repositoryName}</span>
              </div>
              <div>
                <span className="block text-stone-500 text-[11px]">زبان اثر</span>
                <span className="font-semibold text-stone-800">
                  {manuscript.language === 'fa' ? 'فارسی' : manuscript.language === 'ar' ? 'عربی' : 'ترکیبی'}
                </span>
              </div>
              <div>
                <span className="block text-stone-500 text-[11px]">تعداد اوراق ثبت‌شده</span>
                <span className="font-mono font-bold text-stone-800">{pages?.length || 0} برگه</span>
              </div>
              <div>
                <span className="block text-stone-500 text-[11px]">ارجاع منبع</span>
                <span className="font-semibold text-stone-800 truncate block">
                  {manuscript.sourceReference || 'ثبت گنجینه'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Pages Section Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-base font-bold text-stone-900">
            اوراق و صفحات دیجیتال‌شده ({pages?.length || 0})
          </h2>
          <p className="text-xs text-stone-500">
            برای مشاهده متن بازشناسی شده یا شروع تصحیح، روی برگه مورد نظر کلیک نمایید.
          </p>
        </div>
      </div>

      {/* Pages Grid */}
      {!pages || pages.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-6 h-6" />}
          title="هنوز برگه یا تصویری برای این نسخه خطی بارگذاری نشده است"
          description="برای شروع نویسه‌خوانی و تصحیح هوشمند، نخستین برگه این نسخه را بارگذاری کنید."
          action={
            canEdit ? (
              <Button
                size="sm"
                icon={<Upload className="w-4 h-4" />}
                onClick={() => setIsUploadModalOpen(true)}
              >
                بارگذاری نخستین برگه
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {pages.map((page) => (
            <div
              key={page.id}
              className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs hover:border-teal-700/60 transition-all flex flex-col justify-between"
            >
              <div className="relative group bg-stone-900 h-56 overflow-hidden">
                <img
                  src={page.imageUrl}
                  alt={`برگه ${page.pageNumber}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute top-2 right-2">
                  <span className="bg-stone-900/90 text-amber-200 font-mono text-xs px-2.5 py-1 rounded shadow-md">
                    برگه {page.pageNumber}
                  </span>
                </div>

                <div className="absolute top-2 left-2">
                  {pageStatusBadge(page.status)}
                </div>

                {/* Quick overlay buttons */}
                <div className="absolute inset-0 bg-stone-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setSelectedPreviewPage(page)}
                    className="p-2 bg-stone-800 text-stone-100 hover:bg-stone-700 rounded-full shadow-md"
                    title="مشاهده تصویر بزرگ همراه با کادرها"
                    aria-label="بزرگ‌نمایی تصویر"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <NavLink
                    to={`/transcription/${page.id}`}
                    className="p-2 bg-teal-800 text-amber-100 hover:bg-teal-900 rounded-full shadow-md"
                    title="ورود به کارگاه تصحیح و رونویسی"
                    aria-label="ورود به کارگاه تصحیح"
                  >
                    <FileText className="w-4 h-4" />
                  </NavLink>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800">برگه شماره {page.pageNumber}</span>
                    {page.confidence && (
                      <span className="font-mono text-[11px] text-emerald-800 font-bold">
                        اطمینان: {page.confidence}%
                      </span>
                    )}
                  </div>
                  {page.notes && (
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                      {page.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  {page.status === 'pending' || page.status === 'failed' ? (
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full text-xs"
                      isLoading={startJobMutation.isPending}
                      onClick={() => startJobMutation.mutate(page.id)}
                      icon={<ScanText className="w-3.5 h-3.5" />}
                    >
                      شروع بازشناسی HTR
                    </Button>
                  ) : (
                    <NavLink
                      to={`/transcription/${page.id}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-teal-800 hover:bg-teal-900 text-amber-50 text-xs font-semibold rounded-md shadow-2xs transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>کارگاه تصحیح متن</span>
                    </NavLink>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => setDeletingPage(page)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                      title="حذف برگه"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Page Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={`بارگذاری برگه جدید برای «${manuscript.title}»`}
        subtitle="تصویر اسکن‌شده یا دیجیتال باکیفیت صفحه را ثبت نمایید."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsUploadModalOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              isLoading={uploadPageMutation.isPending}
              onClick={() => uploadPageMutation.mutate()}
            >
              ثبت و بارگذاری برگه
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="شماره برگه (Page Number)"
            type="number"
            min={1}
            value={newPageNumber}
            onChange={(e) => setNewPageNumber(Number(e.target.value))}
            required
          />

          <Input
            label="نشانی تصویر برگه (URL)"
            isLtr
            value={newPageUrl}
            onChange={(e) => setNewPageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
            helperText="در محیط دانشگاهی می‌توانید نشانی مستقیم اسکن یا فایل بارگذاری شده را وارد کنید."
          />

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              یادداشت یا توضیحات نسخه (اختیاری)
            </label>
            <textarea
              rows={2}
              value={newPageNotes}
              onChange={(e) => setNewPageNotes(e.target.value)}
              placeholder="مثال: سرلوح مذهب، حاشیه منقش، ریختگی اندک در سطر پنجم..."
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-xs text-right focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
        </div>
      </Modal>

      {/* High-Resolution Zoom Preview Modal */}
      <Modal
        isOpen={!!selectedPreviewPage}
        onClose={() => setSelectedPreviewPage(null)}
        title={`پیش‌نمایش باکیفیت برگه ${selectedPreviewPage?.pageNumber}`}
        subtitle={manuscript.title}
        maxWidth="2xl"
      >
        {selectedPreviewPage && (
          <div className="h-[65vh]">
            <ImageZoomViewer
              imageUrl={selectedPreviewPage.imageUrl}
              altText={`برگه ${selectedPreviewPage.pageNumber}`}
            />
          </div>
        )}
      </Modal>

      {/* Delete Page Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingPage}
        onClose={() => setDeletingPage(null)}
        onConfirm={() => deletingPage && deletePageMutation.mutate(deletingPage.id)}
        title="حذف برگه نسخه خطی"
        message={`آیا از حذف برگه شماره ${deletingPage?.pageNumber} اطمینان دارید؟ تمامی رونویسی‌ها و سطور بازشناسی‌شده این صفحه حذف خواهند شد.`}
        confirmLabel="حذف برگه"
        variant="danger"
        isLoading={deletePageMutation.isPending}
      />
    </div>
  );
};
