import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Trash2,
  Edit3,
  ExternalLink,
  Layers,
  Scroll,
  AlertTriangle,
} from 'lucide-react';
import { manuscriptsApi } from '../api';
import { Manuscript, ManuscriptLanguage, ScriptType, HistoricalPeriod } from '../types';
import { manuscriptSchema, ManuscriptFormData } from '../utils/validation';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Skeleton, EmptyState } from '../components/ui/MiscComponents';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const ManuscriptLibraryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { canEdit, isAdmin } = useAuth();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState<string>('all');
  const [scriptType, setScriptType] = useState<string>('all');
  const [historicalPeriod, setHistoricalPeriod] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingManuscript, setEditingManuscript] = useState<Manuscript | null>(null);
  const [deletingManuscript, setDeletingManuscript] = useState<Manuscript | null>(null);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ManuscriptFormData>({
    resolver: zodResolver(manuscriptSchema),
    defaultValues: {
      language: 'fa',
      historicalPeriod: 'timurid',
      scriptType: 'nastaliq',
      coverImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    },
  });

  // Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['manuscripts', { search, language, scriptType, historicalPeriod, page }],
    queryFn: () =>
      manuscriptsApi.getAll({
        search: search || undefined,
        language: language === 'all' ? undefined : (language as ManuscriptLanguage),
        scriptType: scriptType === 'all' ? undefined : (scriptType as ScriptType),
        historicalPeriod: historicalPeriod === 'all' ? undefined : (historicalPeriod as HistoricalPeriod),
        page,
        limit: 8,
      }),
  });

  // Create / Edit Mutation
  const saveMutation = useMutation({
    mutationFn: async (formData: ManuscriptFormData) => {
      if (editingManuscript) {
        return manuscriptsApi.update(editingManuscript.id, formData);
      }
      return manuscriptsApi.create(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manuscripts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      showToast(
        editingManuscript ? 'اطلاعات نسخه با موفقیت ویرایش گردید.' : 'نسخه خطی جدید به گنجینه افزوده شد.',
        'success'
      );
      closeFormModal();
    },
    onError: (err: any) => {
      showToast(err.message || 'خطا در ذخیره‌سازی اطلاعات نسخه', 'error');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return manuscriptsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manuscripts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      showToast('نسخه خطی با موفقیت حذف گردید.', 'success');
      setDeletingManuscript(null);
    },
    onError: (err: any) => {
      showToast(err.message || 'خطا در حذف نسخه خطی', 'error');
    },
  });

  const openCreateModal = () => {
    setEditingManuscript(null);
    reset({
      title: '',
      author: '',
      description: '',
      repositoryName: 'کتابخانه ملی ایران',
      catalogId: '',
      language: 'fa',
      historicalPeriod: 'timurid',
      scriptType: 'nastaliq',
      sourceReference: '',
      coverImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (ms: Manuscript) => {
    setEditingManuscript(ms);
    reset({
      title: ms.title,
      author: ms.author,
      description: ms.description,
      repositoryName: ms.repositoryName,
      catalogId: ms.catalogId,
      language: ms.language,
      historicalPeriod: ms.historicalPeriod,
      scriptType: ms.scriptType,
      sourceReference: ms.sourceReference || '',
      coverImageUrl: ms.coverImageUrl || '',
    });
    setIsCreateModalOpen(true);
  };

  const closeFormModal = () => {
    setIsCreateModalOpen(false);
    setEditingManuscript(null);
  };

  const onFormSubmit = (values: ManuscriptFormData) => {
    saveMutation.mutate(values);
  };

  const scriptLabels: Record<string, string> = {
    nastaliq: 'نستعلیق',
    naskh: 'نسخ',
    shekasteh: 'شکسته نستعلیق',
    kufic: 'کوفی',
    thuluth: 'ثلث',
    taliq: 'تعلیق',
    muhaqqaq: 'محقق',
    other: 'سایر خطوط',
  };

  const periodLabels: Record<string, string> = {
    timurid: 'عصر تیموری',
    safavid: 'عصر صفوی',
    ilkanid: 'عصر ایلخانی',
    qajar: 'عصر قاجار',
    abbasid: 'عصر عباسی',
    seljuk: 'عصر سلجوقی',
    other: 'سایر دوره‌ها',
  };

  const languageLabels: Record<string, string> = {
    fa: 'فارسی',
    ar: 'عربی',
    mixed: 'فارسی و عربی',
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h2 className="text-lg font-bold text-stone-900 font-calligraphy">
            گنجینه و کتابخانه نسخه‌های خطی
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            فهرست دست‌نوشته‌های کهن، دیوان‌های مصور و اوراق دیجیتال‌شده دانشگاهی
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-stone-200/70 p-1 rounded-lg border border-stone-300">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
              }`}
              title="نمایش شبکه‌ای"
              aria-label="نمایش شبکه‌ای"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
              }`}
              title="نمایش جدولی"
              aria-label="نمایش جدولی"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          {canEdit && (
            <Button onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
              ثبت نسخه خطی جدید
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
        <div className="relative">
          <Input
            placeholder="جستجوی عنوان، کاتب یا شماره بازیابی..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pr-8 text-xs"
          />
          <Search className="w-4 h-4 text-stone-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        <Select
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'همه زبان‌ها' },
            { value: 'fa', label: 'فارسی' },
            { value: 'ar', label: 'عربی' },
            { value: 'mixed', label: 'ترکیبی (فارسی-عربی)' },
          ]}
          className="text-xs"
        />

        <Select
          value={scriptType}
          onChange={(e) => {
            setScriptType(e.target.value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'همه سبک‌های خط' },
            { value: 'nastaliq', label: 'خط نستعلیق' },
            { value: 'shekasteh', label: 'خط شکسته نستعلیق' },
            { value: 'naskh', label: 'خط نسخ' },
            { value: 'kufic', label: 'خط کوفی' },
            { value: 'thuluth', label: 'خط ثلث' },
            { value: 'taliq', label: 'خط تعلیق' },
          ]}
          className="text-xs"
        />

        <Select
          value={historicalPeriod}
          onChange={(e) => {
            setHistoricalPeriod(e.target.value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'همه دوره‌های تاریخی' },
            { value: 'timurid', label: 'عصر تیموری' },
            { value: 'safavid', label: 'عصر صفوی' },
            { value: 'ilkanid', label: 'عصر ایلخانی' },
            { value: 'abbasid', label: 'عصر عباسی' },
            { value: 'seljuk', label: 'عصر سلجوقی' },
            { value: 'qajar', label: 'عصر قاجار' },
          ]}
          className="text-xs"
        />
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-right">
          <p className="text-sm font-semibold">خطا در بارگذاری فهرست نسخه‌های خطی</p>
          <p className="text-xs mt-1">لطفاً اتصال سرور و سرویس NestJS را بررسی نمایید.</p>
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-6 h-6" />}
          title="هیچ نسخه خطی یافت نشد"
          description="با فیلترهای کنونی اثری پیدا نشد یا هنوز نسخه‌ای به این بخش افزوده نشده است."
          action={
            canEdit ? (
              <Button onClick={openCreateModal} size="sm">
                افزودن اولین نسخه خطی
              </Button>
            ) : null
          }
        />
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data.items.map((ms) => (
            <div
              key={ms.id}
              className="group bg-white rounded-xl border border-stone-200/90 hover:border-teal-700/60 transition-all shadow-xs overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 bg-stone-100 overflow-hidden border-b border-stone-200">
                  <img
                    src={ms.coverImageUrl}
                    alt={ms.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <Badge variant="default" size="sm">
                      {scriptLabels[ms.scriptType] || ms.scriptType}
                    </Badge>
                  </div>
                  <div className="absolute bottom-2 left-2.5 bg-stone-900/80 text-amber-200 text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-xs">
                    {ms.catalogId}
                  </div>
                </div>

                <div className="p-4">
                  <NavLink
                    to={`/manuscripts/${ms.id}`}
                    className="font-bold text-sm text-stone-900 hover:text-teal-800 line-clamp-1 leading-snug block"
                  >
                    {ms.title}
                  </NavLink>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-1">{ms.author}</p>

                  <p className="text-xs text-stone-600 mt-2.5 line-clamp-2 leading-relaxed">
                    {ms.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-stone-100 text-[11px] text-stone-500">
                    <span className="truncate">{ms.repositoryName}</span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-[#FAF8F5] border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-stone-600">
                  <Layers className="w-3.5 h-3.5 text-stone-400" />
                  <span>{ms.digitizedPagesCount || 1} برگه</span>
                </div>

                <div className="flex items-center gap-1">
                  {canEdit && (
                    <button
                      onClick={() => openEditModal(ms)}
                      className="p-1.5 text-stone-500 hover:text-teal-700 hover:bg-stone-200 rounded"
                      title="ویرایش مشخصات نسخه"
                      aria-label="ویرایش نسخه"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => setDeletingManuscript(ms)}
                      className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                      title="حذف نسخه"
                      aria-label="حذف نسخه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <NavLink
                    to={`/manuscripts/${ms.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:text-teal-900 mr-1"
                  >
                    <span>جزئیات</span>
                    <ExternalLink className="w-3 h-3" />
                  </NavLink>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#FAF8F5] border-b border-stone-200 text-stone-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">عنوان و پدیدآور</th>
                  <th className="py-3 px-4">شماره بازیابی</th>
                  <th className="py-3 px-4">زبان و خط</th>
                  <th className="py-3 px-4">دوره تاریخی</th>
                  <th className="py-3 px-4">محل نگهداری</th>
                  <th className="py-3 px-4">تعداد صفحات</th>
                  <th className="py-3 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {data.items.map((ms) => (
                  <tr key={ms.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <NavLink
                        to={`/manuscripts/${ms.id}`}
                        className="font-bold text-stone-900 hover:text-teal-800 block"
                      >
                        {ms.title}
                      </NavLink>
                      <span className="text-[11px] text-stone-500">{ms.author}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-600">{ms.catalogId}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" size="sm">
                          {languageLabels[ms.language] || ms.language}
                        </Badge>
                        <Badge variant="default" size="sm">
                          {scriptLabels[ms.scriptType] || ms.scriptType}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4">{periodLabels[ms.historicalPeriod] || ms.historicalPeriod}</td>
                    <td className="py-3 px-4 text-stone-600 truncate max-w-[180px]">
                      {ms.repositoryName}
                    </td>
                    <td className="py-3 px-4 font-mono">{ms.digitizedPagesCount || 1}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <NavLink
                          to={`/manuscripts/${ms.id}`}
                          className="p-1 text-teal-800 hover:bg-teal-50 rounded"
                          title="مشاهده جزئیات و صفحات"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </NavLink>
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(ms)}
                            className="p-1 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded"
                            title="ویرایش مشخصات"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setDeletingManuscript(ms)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                            title="حذف نسخه"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
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
            صفحه {page} از {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
          >
            صفحه بعد
          </Button>
        </div>
      )}

      {/* Create / Edit Manuscript Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeFormModal}
        title={editingManuscript ? 'ویرایش اطلاعات نسخه خطی' : 'ثبت نسخه خطی جدید در سامانه'}
        subtitle="مشخصات کتاب‌شناختی، اسنادی و سبک‌شناسی نسخه را وارد نمایید."
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeFormModal}>
              انصراف
            </Button>
            <Button
              size="sm"
              isLoading={isSubmitting || saveMutation.isPending}
              onClick={handleSubmit(onFormSubmit)}
            >
              {editingManuscript ? 'بروزرسانی نسخه' : 'ثبت نسخه خطی'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="عنوان نسخه خطی"
              required
              error={errors.title?.message}
              {...register('title')}
              placeholder="مثال: شاهنامه بایسنقری"
            />
            <Input
              label="پدیدآور یا کاتب"
              required
              error={errors.author?.message}
              {...register('author')}
              placeholder="مثال: ابوالقاسم فردوسی / کاتب: جعفر بایسنقری"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="زبان متن"
              required
              error={errors.language?.message}
              {...register('language')}
              options={[
                { value: 'fa', label: 'فارسی' },
                { value: 'ar', label: 'عربی' },
                { value: 'mixed', label: 'ترکیبی (فارسی و عربی)' },
              ]}
            />
            <Select
              label="سبک خط (اسکریپت)"
              required
              error={errors.scriptType?.message}
              {...register('scriptType')}
              options={[
                { value: 'nastaliq', label: 'نستعلیق' },
                { value: 'shekasteh', label: 'شکسته نستعلیق' },
                { value: 'naskh', label: 'نسخ' },
                { value: 'kufic', label: 'کوفی' },
                { value: 'thuluth', label: 'ثلث' },
                { value: 'taliq', label: 'تعلیق' },
                { value: 'muhaqqaq', label: 'محقق' },
                { value: 'other', label: 'سایر' },
              ]}
            />
            <Select
              label="دوره تاریخی"
              required
              error={errors.historicalPeriod?.message}
              {...register('historicalPeriod')}
              options={[
                { value: 'timurid', label: 'عصر تیموری' },
                { value: 'safavid', label: 'عصر صفوی' },
                { value: 'ilkanid', label: 'عصر ایلخانی' },
                { value: 'abbasid', label: 'عصر عباسی' },
                { value: 'seljuk', label: 'عصر سلجوقی' },
                { value: 'qajar', label: 'عصر قاجار' },
                { value: 'other', label: 'سایر' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="محل نگهداری / کتابخانه"
              required
              error={errors.repositoryName?.message}
              {...register('repositoryName')}
              placeholder="مثال: کتابخانه ملی ایران، کاخ گلستان"
            />
            <Input
              label="شناسه بازیابی / شماره ثبت"
              required
              isLtr
              error={errors.catalogId?.message}
              {...register('catalogId')}
              placeholder="مثال: IR-GST-716"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              شرح مختصر و ویژگی‌های نسخه
              <span className="text-rose-600 mr-1">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700 text-right"
              {...register('description')}
              placeholder="شرح آرایه‌های تذهیب، مشخصات کاغذ، حواشی و نوع مرکب..."
            />
            {errors.description && (
              <p className="text-xs text-rose-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="ارجاع منبع / فهرست‌نامه"
              error={errors.sourceReference?.message}
              {...register('sourceReference')}
              placeholder="مثال: فهرست نسخ خطی کتابخانه مجلس، ج ۵"
            />
            <Input
              label="نشانی تصویر جلد (URL)"
              isLtr
              error={errors.coverImageUrl?.message}
              {...register('coverImageUrl')}
              placeholder="https://..."
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingManuscript}
        onClose={() => setDeletingManuscript(null)}
        onConfirm={() => deletingManuscript && deleteMutation.mutate(deletingManuscript.id)}
        title="تأیید حذف نسخه خطی"
        message={`آیا از حذف نسخه «${deletingManuscript?.title}» از پایگاه داده اطمینان دارید؟ تمام برگه‌ها و نتایج رونویسی مرتبط با آن نیز بایگانی یا حذف خواهند شد.`}
        confirmLabel="حذف دائمی"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
