import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Scroll, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { registerSchema, RegisterFormData } from '../utils/validation';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { useToast } from '../context/ToastContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerAuth } = useAuth();
  const { showToast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      institution: 'دانشگاه تهران',
      role: 'researcher',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setErrorMessage(null);
    try {
      await registerAuth(data);
      showToast('حساب پژوهشگر با موفقیت ایجاد شد.', 'success');
      navigate('/', { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ثبت‌نام کاربر.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-teal-800 text-amber-100 flex items-center justify-center mx-auto shadow-lg border border-teal-700/60 mb-3">
          <Scroll className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 font-calligraphy">
          ثبت‌نام پژوهشگر جدید
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          عضویت در سامانه دانشگاهی بازشناسی و رونویسی نسخ خطی
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
              label="نام و نام خانوادگی"
              required
              error={errors.fullName?.message}
              {...register('fullName')}
              placeholder="دکتر سارا مؤمنی"
            />

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
              placeholder="حداقل ۶ نویسه"
            />

            <Input
              label="دانشگاه یا پژوهشکده متبوع"
              error={errors.institution?.message}
              {...register('institution')}
              placeholder="مثال: دانشگاه فردوسی مشهد، فرهنگستان زبان و ادب"
            />

            <Select
              label="نقش درخواستی"
              required
              error={errors.role?.message}
              {...register('role')}
              options={[
                { value: 'researcher', label: 'پژوهشگر ارشد (Researcher)' },
                { value: 'annotator', label: 'مصحح و برچسب‌گذار متن (Annotator)' },
              ]}
            />

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                تکمیل ثبت‌نام و ورود
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-stone-500">
            <span>قبلاً ثبت‌نام کرده‌اید؟ </span>
            <NavLink to="/login" className="font-semibold text-teal-800 hover:underline">
              ورود به سامانه
            </NavLink>
          </div>
        </Card>
      </div>
    </div>
  );
};
