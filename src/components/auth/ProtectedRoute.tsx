import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-stone-600">در حال بررسی نشست کاربری...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-stone-200 max-w-lg mx-auto my-12">
        <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="font-bold text-sm text-stone-900">عدم دسترسی به این بخش (۴۰۳ Forbidden)</h3>
        <p className="text-xs text-stone-500 mt-1">
          مشاهده این بخش صرفاً برای حساب‌های کاربری با نقش مدیر سامانه مجاز است.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
