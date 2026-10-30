import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, ShieldCheck, UserCheck, Trash2, ShieldAlert } from 'lucide-react';
import { usersApi } from '../api';
import { UserRole, User } from '../types';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton, EmptyState } from '../components/ui/MiscComponents';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { isAdmin } = useAuth();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => usersApi.getAll(),
    enabled: isAdmin,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      usersApi.updateRole(userId, role),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      showToast(`نقش کاربری «${updated.fullName}» به‌روزرسانی گردید.`, 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'خطا در تغییر نقش کاربر', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => usersApi.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      showToast('کاربر با موفقیت حذف گردید.', 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'خطا در حذف کاربر', 'error');
    },
  });

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-stone-200">
        <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="font-bold text-sm text-stone-900">دسترسی غیرمجاز (۴۰۳)</h3>
        <p className="text-xs text-stone-500 mt-1">
          بخش مدیریت کاربران و دسترسی‌ها صرفاً برای مدیران سامانه فعال است.
        </p>
      </div>
    );
  }

  const roleLabels: Record<UserRole, { label: string; variant: any }> = {
    admin: { label: 'مدیر سامانه (Admin)', variant: 'danger' },
    researcher: { label: 'پژوهشگر ارشد (Researcher)', variant: 'info' },
    annotator: { label: 'مصحح و برچسب‌گذار (Annotator)', variant: 'warning' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-stone-900 font-calligraphy">
          مدیریت کاربران، سطوح دسترسی و پژوهشگران
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          نظارت بر حساب‌های کاربری، تخصیص نقش‌های پژوهشی و مجوزهای ویرایش متون و برچسب‌های آموزشی
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-md" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-rose-800 text-xs text-right">
            خطا در دریافت فهرست کاربران از سرور.
          </div>
        ) : !users || users.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="هیچ کاربری یافت نشد"
            className="m-6"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#FAF8F5] border-b border-stone-200 text-stone-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">کاربر</th>
                  <th className="py-3 px-4">رایانامه (Email)</th>
                  <th className="py-3 px-4">مؤسسه / دانشگاه</th>
                  <th className="py-3 px-4">نقش فعلی</th>
                  <th className="py-3 px-4">تغییر سطح دسترسی</th>
                  <th className="py-3 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-teal-800 text-amber-100 flex items-center justify-center font-bold text-xs">
                          {u.fullName[0]}
                        </div>
                        <div>
                          <span className="font-bold text-stone-900 block">{u.fullName}</span>
                          <span className="font-mono text-[10px] text-stone-400">{u.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-stone-600 ltr-preserve">
                      {u.email}
                    </td>

                    <td className="py-3 px-4 text-stone-700">{u.institution || 'دانشگاه تهران'}</td>

                    <td className="py-3 px-4">
                      <Badge variant={roleLabels[u.role].variant} size="sm">
                        {roleLabels[u.role].label}
                      </Badge>
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          updateRoleMutation.mutate({
                            userId: u.id,
                            role: e.target.value as UserRole,
                          })
                        }
                        className="rounded border border-stone-300 bg-white px-2 py-1 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                      >
                        <option value="admin">مدیر سامانه (Admin)</option>
                        <option value="researcher">پژوهشگر ارشد (Researcher)</option>
                        <option value="annotator">مصحح (Annotator)</option>
                      </select>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => deleteMutation.mutate(u.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                        title="حذف حساب کاربر"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
