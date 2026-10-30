import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ScanText,
  Search,
  Database,
  History,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Scroll,
  ShieldCheck,
  User as UserIcon,
  Server,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';

export const AppLayout: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'داشبورد پژوهشی', icon: LayoutDashboard },
    { to: '/manuscripts', label: 'کتابخانه نسخ خطی', icon: BookOpen },
    { to: '/upload', label: 'بارگذاری و بازشناسی HTR', icon: ScanText },
    { to: '/search', label: 'جستجوی پیشرفته متنی', icon: Search },
    { to: '/datasets', label: 'مدیریت دادگان و آموزش', icon: Database },
    { to: '/history', label: 'تاریخچه پردازش‌ها', icon: History },
    ...(isAdmin ? [{ to: '/users', label: 'مدیریت کاربران', icon: Users }] : []),
    { to: '/settings', label: 'تنظیمات و سامانه', icon: Settings },
  ];

  // Helper for dynamic breadcrumbs
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'داشبورد پژوهشی';
    if (path.startsWith('/manuscripts/')) return 'جزئیات نسخه خطی';
    if (path === '/manuscripts') return 'کتابخانه نسخ خطی';
    if (path.startsWith('/transcription/')) return 'کارگاه تصحیح و رونویسی';
    if (path === '/upload') return 'بارگذاری و بازشناسی متن';
    if (path === '/search') return 'جستجوی پیشرفته در اسناد';
    if (path === '/datasets') return 'مدیریت و برچسب‌گذاری دادگان';
    if (path === '/history') return 'تاریخچه پردازش‌های HTR';
    if (path === '/users') return 'مدیریت کاربران';
    if (path === '/settings') return 'تنظیمات سامانه';
    return 'صفحه';
  };

  const roleLabels: Record<string, string> = {
    admin: 'مدیر سامانه',
    researcher: 'پژوهشگر ارشد',
    annotator: 'مصحح و برچسب‌گذار',
  };

  return (
    <div className="flex h-screen bg-[#FBF9F5] text-stone-900 overflow-hidden font-sans">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#1C2024] text-stone-300 border-l border-stone-800 z-20 shrink-0">
        {/* Academic Platform Header */}
        <div className="p-5 border-b border-stone-800/80 bg-[#16191C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-800 flex items-center justify-center text-amber-100 shadow-md border border-teal-700/60">
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-stone-100 text-sm leading-snug tracking-tight">
                سامانه هوشمند نسخ خطی
              </h1>
              <p className="text-[11px] text-teal-400 font-medium mt-0.5 font-mono">
                HTR &amp; OCR Platform
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              بک‌اند متصل (NestJS)
            </span>
            <span className="font-mono text-stone-500 text-[10px]">v2.4-ai</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-teal-900/70 text-amber-200 border border-teal-700/50 shadow-xs'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-stone-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3.5 border-t border-stone-800/80 bg-[#17191D]">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-stone-900/60 border border-stone-800">
            <div className="w-8 h-8 rounded-full bg-teal-900/80 text-teal-200 flex items-center justify-center text-xs font-bold border border-teal-700/50">
              {user?.fullName ? user.fullName[0] : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-stone-100 truncate">{user?.fullName || 'کاربر پژوهشگر'}</p>
              <p className="text-[10px] text-stone-400 truncate">
                {roleLabels[user?.role || 'researcher']}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
              title="خروج از سامانه"
              aria-label="خروج از سامانه"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-950/70 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-[#1C2024] text-stone-300 flex flex-col transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scroll className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-sm text-stone-100">سامانه نسخ خطی</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 text-stone-400 hover:text-stone-100"
            aria-label="بستن منو"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-900/80 text-amber-200'
                      : 'text-stone-300 hover:bg-stone-800'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-stone-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-rose-300 hover:bg-rose-950/50 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج از حساب</span>
          </button>
        </div>
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-stone-200/90 bg-[#FDFBF7]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-md hover:bg-stone-200 lg:hidden text-stone-700"
              aria-label="باز کردن منو"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <span className="font-semibold text-stone-900">{getBreadcrumb()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/upload"
              className="hidden sm:flex items-center gap-1.5 text-xs bg-teal-800 hover:bg-teal-900 text-amber-50 px-3 py-1.5 rounded-md font-medium shadow-2xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>پردازش جدید HTR</span>
            </NavLink>
            <div className="h-5 w-px bg-stone-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-700 font-medium hidden md:inline">
                {user?.fullName || 'کاربر مهمان'}
              </span>
              <Badge variant="info" size="sm">
                {roleLabels[user?.role || 'researcher']}
              </Badge>
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
