import React, { useState } from 'react';
import { Settings, Server, Shield, Keyboard, Info, CheckCircle2, RefreshCw } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiStatus, setApiStatus] = useState<'idle' | 'online' | 'offline'>('online');

  const testConnection = async () => {
    setIsTestingApi(true);
    try {
      await apiClient.get('/stats');
      setApiStatus('online');
      showToast('اتصال به سرور API با موفقیت تأیید شد.', 'success');
    } catch {
      setApiStatus('offline');
      showToast('خطا در برقراری ارتباط با سرور API', 'error');
    } finally {
      setIsTestingApi(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-stone-900 font-calligraphy">
          تنظیمات سامانه و مشخصات پژوهشی
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          پیکربندی ارتباط با سرویس‌های بک‌اند، اتصالات API، میانبرهای صفحه‌کلید و اطلاعات نشست
        </p>
      </div>

      {/* Backend API Connectivity Box */}
      <Card>
        <CardHeader
          title="پیکربندی ارتباط با بک‌اند (NestJS & Python Worker)"
          subtitle="بررسی وضعیت درگاه‌های ارتباطی و متغیرهای محیطی"
          action={
            <Button
              variant="outline"
              size="sm"
              isLoading={isTestingApi}
              onClick={testConnection}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              آزمون اتصال سرور
            </Button>
          }
        />

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAF8F5] border border-stone-200">
            <div>
              <span className="font-semibold text-stone-800 block">نشانی پایه API (Base URL)</span>
              <span className="font-mono text-stone-500 text-[11px] ltr-preserve block mt-0.5">
                {API_BASE_URL}
              </span>
            </div>
            <Badge variant={apiStatus === 'online' ? 'success' : 'danger'} size="sm">
              {apiStatus === 'online' ? 'سرور فعال (Connected)' : 'عدم اتصال (Offline)'}
            </Badge>
          </div>

          <p className="text-stone-500 text-[11px] leading-relaxed">
            این واسط کاربری از طریق متغیر محیطی <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-stone-800">VITE_API_BASE_URL</code> به
            بک‌اند اختصاصی متصل می‌گردد و از معماری مایکروسرویس جهت تبادل پیام با سرویس پایتون استفاده می‌کند.
          </p>
        </div>
      </Card>

      {/* User Session Profile Card */}
      <Card>
        <CardHeader
          title="مشخصات حساب کاربری فعال"
          subtitle="اطلاعات نقش و هویت پژوهشگر در نشست کنونی"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
            <span className="text-stone-500 block text-[11px]">نام و نام خانوادگی</span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 block">{user?.fullName}</span>
          </div>
          <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
            <span className="text-stone-500 block text-[11px]">نشانی رایانامه</span>
            <span className="font-mono text-stone-800 text-xs mt-0.5 block ltr-preserve">
              {user?.email}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
            <span className="text-stone-500 block text-[11px]">مؤسسه / دانشگاه همکار</span>
            <span className="font-semibold text-stone-800 mt-0.5 block">
              {user?.institution || 'دانشگاه تهران'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
            <span className="text-stone-500 block text-[11px]">نقش دسترسی</span>
            <span className="font-semibold text-teal-900 mt-0.5 block">
              {user?.role === 'admin' ? 'مدیر ارشد سامانه' : user?.role === 'researcher' ? 'پژوهشگر ارشد' : 'مصحح و برچسب‌گذار'}
            </span>
          </div>
        </div>
      </Card>

      {/* Persian Calligraphy Shortcuts Reference */}
      <Card>
        <CardHeader
          title="کلیدهای میانبر کارگاه تصحیح و علائم خطاطی"
          subtitle="جهت تسریع در فرآیند ویرایش، اِعراب‌گذاری و تطبیق اوراق خطی"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-stone-200 bg-[#FAF9F6]">
            <span>واگرد ویرایش متن (Undo)</span>
            <kbd className="font-mono bg-white px-2 py-0.5 rounded border border-stone-300 text-stone-700 shadow-2xs">
              Ctrl + Z
            </kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-stone-200 bg-[#FAF9F6]">
            <span>تکرار مجدد ویرایش (Redo)</span>
            <kbd className="font-mono bg-white px-2 py-0.5 rounded border border-stone-300 text-stone-700 shadow-2xs">
              Ctrl + Y
            </kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-stone-200 bg-[#FAF9F6]">
            <span>بزرگ‌نمایی تصویر نسخه</span>
            <kbd className="font-mono bg-white px-2 py-0.5 rounded border border-stone-300 text-stone-700 shadow-2xs">
              چرخ ماوس (Scroll)
            </kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-stone-200 bg-[#FAF9F6]">
            <span>جابجایی در تصویر زوم‌شده</span>
            <kbd className="font-mono bg-white px-2 py-0.5 rounded border border-stone-300 text-stone-700 shadow-2xs">
              کلیک و کشیدن (Drag)
            </kbd>
          </div>
        </div>
      </Card>
    </div>
  );
};
