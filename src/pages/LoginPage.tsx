import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Scroll, Lock, Mail, ArrowLeft, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginSchema, LoginFormData } from '../utils/validation';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@manuscript-htr.ir',
      password: 'admin123',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    try {
      await login(data);
      showToast('ورود با موفقیت انجام شد. به سامانه نسخ خطی خوش آمدید.', 'success');
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ورود به سامانه.');
    }
  };

  // Quick fill demo credentials for convenience
  const fillCredentials = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-teal-800 text-amber-100 flex items-center justify-center mx-auto shadow-lg border border-teal-700/60 mb-3">
          <Scroll className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 font-calligraphy">
          سامانه هوشمند نسخ خطی اسلامی
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          ورود به پنل پژوهشی بازشناسی خودکار متن (HTR / OCR)
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="bg-white border-stone-200/90 shadow-md p-6 sm:p-8">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs text-right leading-relaxed">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="نشانی رایانامه (Email)"
              isLtr
              required
              error={errors.email?.message}
              {...register('email')}
              placeholder="name@university.ac.ir"
            />

            <Input
              label="رمز عبور"
              type="password"
              isLtr
              required
              error={errors.password?.message}
              {...register('password')}
              placeholder="••••••••"
            />

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                ورود به سامانه پژوهشی
              </Button>
            </div>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-6 pt-5 border-t border-stone-100 text-right">
            <span className="text-[11px] font-semibold text-stone-500 block mb-2">
              حساب‌های کاربری آزمایشی دانشگاهی (ورود سریع):
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@manuscript-htr.ir', 'admin123')}
                className="p-2 text-center rounded border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 text-rose-900 text-[11px] font-medium transition-colors"
              >
                مدیر ارشد
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('researcher@manuscript-htr.ir', 'research123')}
                className="p-2 text-center rounded border border-teal-200 bg-teal-50/50 hover:bg-teal-100/60 text-teal-900 text-[11px] font-medium transition-colors"
              >
                پژوهشگر
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('annotator@manuscript-htr.ir', 'annot123')}
                className="p-2 text-center rounded border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-amber-900 text-[11px] font-medium transition-colors"
              >
                مصحح
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-stone-500">
            <span>حساب کاربری ندارید؟ </span>
            <NavLink to="/register" className="font-semibold text-teal-800 hover:underline">
              ثبت‌نام پژوهشگر جدید
            </NavLink>
          </div>
        </Card>
      </div>
    </div>
  );
};
