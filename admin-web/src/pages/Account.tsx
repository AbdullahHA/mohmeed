import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Account() {
  const { session, profile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const provider = session?.user.app_metadata?.provider;
  const signInMethod = provider === 'google' ? 'جوجل (Google)' : 'بريد إلكتروني وكلمة مرور';

  const canSubmit = newPassword.length >= 6 && newPassword === confirmPassword && !saving;

  const handleChangePassword = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    setSuccess(true);
  };

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-xl font-bold text-foreground">إعدادات الحساب</h1>

      <div className="surface-card mb-6 flex flex-col gap-3 p-5">
        <h2 className="text-sm font-bold text-foreground">بيانات الحساب</h2>
        <InfoRow label="الاسم" value={profile?.name ?? '—'} />
        <InfoRow label="المعرّف" value={profile?.username ? `@${profile.username}` : '—'} />
        <InfoRow label="البريد الإلكتروني" value={session?.user.email ?? '—'} dir="ltr" />
        <InfoRow label="طريقة الدخول" value={signInMethod} />
      </div>

      <div className="surface-card flex flex-col gap-4 p-5">
        <h2 className="text-sm font-bold text-foreground">تغيير كلمة المرور</h2>
        {provider === 'google' ? (
          <p className="text-xs text-muted-foreground">
            حسابك مربوط بجوجل، ما فيه كلمة مرور منفصلة تقدر تغيّرها من هنا — غيّرها من إعدادات حساب جوجل نفسه.
          </p>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">كلمة المرور الجديدة</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                dir="ltr"
                className="input"
                placeholder="6 أحرف على الأقل"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">تأكيد كلمة المرور</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                dir="ltr"
                className="input"
              />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword ? (
              <p className="text-sm text-destructive">كلمتا المرور غير متطابقتين</p>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {success ? <p className="text-sm text-success-ink">تم تغيير كلمة المرور بنجاح</p> : null}
            <div>
              <button
                onClick={handleChangePassword}
                disabled={!canSubmit}
                className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, dir }: { label: string; value: string; dir?: 'ltr' | 'rtl' }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground" dir={dir}>
        {value}
      </span>
    </div>
  );
}
