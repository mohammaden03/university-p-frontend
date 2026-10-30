import React, { useState, useEffect, useRef } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Save,
  CheckCircle2,
  Clock,
  History,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Eye,
  SlidersHorizontal,
  SplitSquareVertical,
  Check,
  AlertTriangle,
  Info,
  Layers,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { transcriptionsApi, pagesApi, manuscriptsApi } from '../api';
import { TranscriptionLine, TranscriptionRevision } from '../types';
import { computeCER, computeWER } from '../utils/textUtils';
import { ImageZoomViewer } from '../components/manuscript/ImageZoomViewer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Tabs } from '../components/ui/MiscComponents';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const TranscriptionEditorPage: React.FC = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { canEdit, user } = useAuth();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'editor' | 'compare' | 'history'>('editor');

  // Text editor state
  const [editedText, setEditedText] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [activeLine, setActiveLine] = useState<TranscriptionLine | null>(null);
  const [revisionNote, setRevisionNote] = useState<string>('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<'reviewed' | 'approved'>('reviewed');

  // Undo / Redo stack
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Queries
  const { data: page, isLoading: isPageLoading } = useQuery({
    queryKey: ['page', pageId],
    queryFn: () => pagesApi.getById(pageId!),
    enabled: !!pageId,
  });

  const { data: transcription, isLoading: isTrLoading } = useQuery({
    queryKey: ['transcription', pageId],
    queryFn: () => transcriptionsApi.getByPageId(pageId!),
    enabled: !!pageId,
  });

  const { data: manuscript } = useQuery({
    queryKey: ['manuscript', page?.manuscriptId],
    queryFn: () => manuscriptsApi.getById(page!.manuscriptId),
    enabled: !!page?.manuscriptId,
  });

  // Sync transcription text on load
  useEffect(() => {
    if (transcription) {
      setEditedText(transcription.text);
      setIsDirty(false);
      setHistoryStack([transcription.text]);
      setHistoryIndex(0);
    }
  }, [transcription]);

  // Warn on unsaved changes when navigating away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Text change handler with history stack tracking
  const handleTextChange = (newVal: string) => {
    setEditedText(newVal);
    setIsDirty(newVal !== transcription?.text);

    // Debounced history record
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(newVal);
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = historyStack[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setEditedText(prev);
      setIsDirty(prev !== transcription?.text);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const next = historyStack[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setEditedText(next);
      setIsDirty(next !== transcription?.text);
    }
  };

  // Diacritics insertion helper
  const insertDiacritic = (symbol: string) => {
    const textarea = document.getElementById('transcription-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = editedText.substring(0, start);
    const after = editedText.substring(end);
    const updated = before + symbol + after;

    handleTextChange(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + symbol.length, start + symbol.length);
    }, 50);
  };

  // Save Revision Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!transcription) return;
      return transcriptionsApi.saveRevision(transcription.id, {
        text: editedText,
        note: revisionNote || 'تصحیح و ویرایش خطوط توسط مصحح',
        status: targetStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcription', pageId] });
      queryClient.invalidateQueries({ queryKey: ['page', pageId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsDirty(false);
      setIsSaveModalOpen(false);
      setRevisionNote('');
      showToast('ویرایش جدید با موفقیت در تاریخچه بازنگری‌ها ثبت گردید.', 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'خطا در ثبت ویرایش متن', 'error');
    },
  });

  // Calculate CER and WER between original AI and current edited version
  const originalAi = transcription?.originalAiText || '';
  const currentText = editedText;
  const cer = computeCER(currentText, originalAi);
  const wer = computeWER(currentText, originalAi);

  if (isPageLoading || isTrLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-stone-600">در حال بارگذاری کارگاه تصحیح و رونویسی...</p>
        </div>
      </div>
    );
  }

  if (!page || !transcription) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-stone-200">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <h3 className="font-bold text-sm text-stone-800">رونویسی برای این برگه یافت نشد</h3>
        <p className="text-xs text-stone-500 mt-1">
          ممکن است فرآیند بازشناسی هنوز آغاز نشده باشد.
        </p>
        <Button
          size="sm"
          className="mt-4"
          onClick={() => navigate(`/upload?manuscriptId=${page?.manuscriptId || ''}`)}
        >
          شروع پردازش هوشمند
        </Button>
      </div>
    );
  }

  // Persian diacritics list
  const diacritics = [
    { label: 'فتحه', char: 'َ' },
    { label: 'ضمه', char: 'ُ' },
    { label: 'کسره', char: 'ِ' },
    { label: 'تنوین نصب', char: 'ً' },
    { label: 'تنوین ضم', char: 'ٌ' },
    { label: 'تنوین کسر', char: 'ٍ' },
    { label: 'تشدید', char: 'ّ' },
    { label: 'سکون', char: 'ْ' },
    { label: 'الف مقصوره', char: 'ٰ' },
    { label: 'همزه روی ی', char: 'ٔ' },
    { label: 'ممیز مصراع', char: ' / ' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <NavLink
            to={`/manuscripts/${transcription.manuscriptId}`}
            className="p-1.5 hover:bg-stone-200 rounded-md text-stone-600 transition-colors"
            title="بازگشت به مشخصات نسخه"
          >
            <ArrowRight className="w-4 h-4" />
          </NavLink>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-stone-900 text-sm font-calligraphy">
                کارگاه تصحیح و مقابله: برگه {page.pageNumber} — {manuscript?.title || 'نسخه خطی'}
              </h2>
              {isDirty ? (
                <Badge variant="warning" size="sm">
                  تغییرات ذخیره‌نشده
                </Badge>
              ) : (
                <Badge variant="success" size="sm">
                  ذخیره‌شده
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-stone-500 font-mono mt-0.5">
              مدل: {transcription.modelMetadata.modelName} | خط تشخیص‌داده‌شده: {transcription.modelMetadata.detectedScript || 'نستعلیق'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              size="sm"
              disabled={!isDirty}
              onClick={() => setIsSaveModalOpen(true)}
              icon={<Save className="w-4 h-4" />}
            >
              ذخیره ویرایش مصحح
            </Button>
          )}
        </div>
      </div>

      {/* Main Two-Panel Focus Layout (Image vs Text) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-12rem)]">
        {/* Left Panel: Manuscript Image Viewer (6 cols) */}
        <div className="lg:col-span-6 h-full flex flex-col">
          <ImageZoomViewer
            imageUrl={page.imageUrl}
            altText={`برگه ${page.pageNumber}`}
            lines={transcription.lines}
            activeLineId={activeLine?.id}
            onLineClick={(line) => setActiveLine(line)}
          />
        </div>

        {/* Right Panel: Transcription Workspace (6 cols) */}
        <div className="lg:col-span-6 h-full flex flex-col bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
          {/* Top Panel Tabs */}
          <div className="flex items-center justify-between border-b border-stone-200 px-4 bg-[#FAF8F5]">
            <Tabs
              tabs={[
                { id: 'editor', label: 'ویرایشگر هوشمند متن', icon: <FileText className="w-3.5 h-3.5" /> },
                {
                  id: 'compare',
                  label: 'مقابله تطبیقی با هوش مصنوعی',
                  icon: <SplitSquareVertical className="w-3.5 h-3.5" />,
                  badge: `CER ${cer}%`,
                },
                {
                  id: 'history',
                  label: 'تاریخچه بازنگری‌ها',
                  icon: <History className="w-3.5 h-3.5" />,
                  badge: transcription.revisions.length,
                },
              ]}
              activeTab={activeTab}
              onChange={(tab) => setActiveTab(tab as any)}
            />

            <div className="flex items-center gap-1.5 text-xs">
              {transcription.confidence && (
                <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                  اطمینان HTR: {transcription.confidence}%
                </span>
              )}
            </div>
          </div>

          {/* Tab 1: Smart Text Editor */}
          {activeTab === 'editor' && (
            <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
              {/* Diacritics Toolbar */}
              <div className="flex flex-wrap items-center gap-1 p-2 bg-[#FAF8F5] rounded-lg border border-stone-200 text-xs">
                <span className="text-[11px] font-semibold text-stone-500 ml-1">اعراب و نشانه‌ها:</span>
                {diacritics.map((dia) => (
                  <button
                    key={dia.char}
                    onClick={() => insertDiacritic(dia.char)}
                    title={dia.label}
                    className="px-2 py-1 bg-white hover:bg-teal-50 hover:text-teal-900 border border-stone-300 rounded text-xs font-mono font-bold transition-colors"
                  >
                    {dia.char}
                  </button>
                ))}

                <div className="mr-auto flex items-center gap-1">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-1 text-stone-600 hover:text-stone-900 disabled:opacity-40"
                    title="واگرد (Undo)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Active Selected Line Highlight Banner */}
              {activeLine && (
                <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-teal-900">سطر انتخابی {activeLine.lineNumber}: </span>
                    <span className="font-calligraphy text-teal-950 font-semibold">{activeLine.text}</span>
                  </div>
                  <span className="font-mono text-[10px] text-teal-700 bg-teal-100/60 px-1.5 py-0.5 rounded">
                    اطمینان سطر: {activeLine.confidence}%
                  </span>
                </div>
              )}

              {/* Main Editable Text Area */}
              <div className="flex-1 relative flex flex-col">
                <textarea
                  id="transcription-textarea"
                  dir="rtl"
                  value={editedText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="w-full flex-1 p-4 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-700 font-calligraphy text-base leading-loose text-stone-900 resize-none bg-[#FAF9F6]/50"
                  placeholder="متن بازشناسی شده توسط مدل HTR..."
                />
              </div>

              {/* Word / Char Counters */}
              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                <div className="flex items-center gap-3">
                  <span>تعداد کلمات: {editedText.trim().split(/\s+/).filter(Boolean).length}</span>
                  <span>تعداد نویسه‌ها: {editedText.length}</span>
                </div>
                <div className="flex items-center gap-1 text-teal-800">
                  <Info className="w-3.5 h-3.5" />
                  <span>برای انتخاب کادر بر روی تصویر، روی مستطیل‌های رنگی کلیک کنید.</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Side-by-Side Comparison (AI vs Human Corrected) */}
          {activeTab === 'compare' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-center">
                  <span className="block text-[11px] text-amber-800 font-medium">
                    نرخ خطای کاراکتر (CER)
                  </span>
                  <span className="text-xl font-bold font-mono text-amber-900">{cer}%</span>
                </div>
                <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-lg text-center">
                  <span className="block text-[11px] text-teal-800 font-medium">
                    نرخ خطای کلمه (WER)
                  </span>
                  <span className="text-xl font-bold font-mono text-teal-900">{wer}%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Original AI Output */}
                <div className="p-4 rounded-xl border border-stone-200 bg-stone-50">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200">
                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      خروجی اولیه مدل هوش مصنوعی
                    </span>
                    <Badge variant="warning" size="sm">
                      خام
                    </Badge>
                  </div>
                  <pre className="whitespace-pre-wrap font-calligraphy text-sm leading-loose text-stone-800 select-text">
                    {transcription.originalAiText}
                  </pre>
                </div>

                {/* Human-Edited Revision */}
                <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/30">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-teal-200">
                    <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      متن تصحیح‌شده توسط پژوهشگر
                    </span>
                    <Badge variant="success" size="sm">
                      مصحح
                    </Badge>
                  </div>
                  <pre className="whitespace-pre-wrap font-calligraphy text-sm leading-loose text-stone-900 select-text">
                    {editedText}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Revisions Timeline */}
          {activeTab === 'history' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {transcription.revisions.length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-xs">
                  هنوز هیچ ویرایش انسانی برای این برگه ثبت نشده است. متن فعلی، نسخه اولیه مدل HTR است.
                </div>
              ) : (
                transcription.revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-lg border border-stone-200 bg-[#FAF8F5] text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" size="sm">
                          نسخه {rev.version}
                        </Badge>
                        <span className="font-semibold text-stone-800">{rev.authorName}</span>
                      </div>
                      <span className="text-[11px] text-stone-500 font-mono">
                        {new Date(rev.createdAt).toLocaleDateString('fa-IR')}
                      </span>
                    </div>

                    {rev.note && (
                      <p className="text-xs text-stone-600 bg-white p-2 rounded border border-stone-200">
                        {rev.note}
                      </p>
                    )}

                    <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setEditedText(rev.text);
                          setIsDirty(true);
                          setActiveTab('editor');
                          showToast(`متن نسخه ${rev.version} در ویرایشگر بارگذاری شد.`, 'info');
                        }}
                        className="text-teal-800 hover:underline font-semibold"
                      >
                        بازیابی این نسخه در ویرایشگر ←
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Revision Modal */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title="ثبت ویرایش و بازنگری متن"
        subtitle="تغییرات شما به عنوان یک نسخه جدید در تاریخچه سند ذخیره خواهد شد."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsSaveModalOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              isLoading={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              ثبت و تأیید بازنگری
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              وضعیت اعتبارسنجی برگه
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as any)}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-xs bg-white text-right"
            >
              <option value="reviewed">بازبینی‌شده توسط مصحح (Reviewed)</option>
              <option value="approved">تأیید نهایی و آماده آموزش (Approved Ground Truth)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              یادداشت بازنگری (توضیح تغییرات اعمال‌شده)
            </label>
            <textarea
              rows={3}
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="مثال: اصلاح اعراب کلمات، تفکیک مصراع‌ها، رفع خطای بازشناسی کلمات مشکین و محمل‌ها..."
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-xs text-right focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
