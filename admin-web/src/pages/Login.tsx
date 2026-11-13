import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);
    if (signInError) setError('بيانات الدخول غير صحيحة');
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    const { error: googleError } = await signInWithGoogle();
    setGoogleLoading(false);
    if (googleError) setError('تعذّر تسجيل الدخول بجوجل');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={handleSubmit} className="surface-card w-full max-w-sm p-6">
        <h1 className="mb-1 text-xl font-bold text-foreground">لوحة إدارة يلا نسافر</h1>
        <p className="mb-6 text-sm text-muted-foreground">سجّل دخولك بحساب إداري</p>

        <label className="mb-1 block text-xs font-semibold text-muted-foreground">البريد الإلكتروني</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          dir="ltr"
        />

        <label className="mb-1 block text-xs font-semibold text-muted-foreground">كلمة المرور</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          dir="ltr"
        />

        {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>

        <div className="my-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">أو</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full rounded-md border border-input bg-card py-2 text-sm font-bold text-foreground disabled:opacity-50"
        >
          {googleLoading ? 'جاري التحويل...' : 'الدخول بحساب Google'}
        </button>
      </form>
    </div>
  );
}
