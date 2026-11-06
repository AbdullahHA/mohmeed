import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { logAction } from '../lib/auditLog';
import { useToast } from '../context/ToastContext';
import DataTable, { type DataTableColumn } from '../components/DataTable';

type Post = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string;
  hidden: boolean;
  created_at: string;
  user_name?: string;
};

type Review = {
  id: string;
  place_id: string;
  user_id: string;
  stars: number;
  note: string | null;
  hidden: boolean;
  created_at: string;
  user_name?: string;
  place_name?: string;
};

type Tab = 'posts' | 'reviews';

export default function PostsReviews() {
  const [tab, setTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const { showToast } = useToast();

  const loadPosts = async () => {
    const { data } = await supabase
      .from('travel_posts')
      .select('id,user_id,image_url,caption,hidden,created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    const rows = data ?? [];
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const { data: profiles } = userIds.length ? await supabase.from('profiles').select('id,name').in('id', userIds) : { data: [] };
    const names: Record<string, string> = {};
    (profiles ?? []).forEach((p: any) => (names[p.id] = p.name));
    setPosts(rows.map((r) => ({ ...r, user_name: names[r.user_id] })));
  };

  const loadReviews = async () => {
    const { data } = await supabase
      .from('place_quick_ratings')
      .select('id,place_id,user_id,stars,note,hidden,created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    const rows = data ?? [];
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const placeIds = Array.from(new Set(rows.map((r) => r.place_id)));
    const [{ data: profiles }, { data: places }] = await Promise.all([
      userIds.length ? supabase.from('profiles').select('id,name').in('id', userIds) : Promise.resolve({ data: [] }),
      placeIds.length ? supabase.from('places').select('id,name').in('id', placeIds) : Promise.resolve({ data: [] }),
    ]);
    const names: Record<string, string> = {};
    (profiles ?? []).forEach((p: any) => (names[p.id] = p.name));
    const placeNames: Record<string, string> = {};
    (places ?? []).forEach((p: any) => (placeNames[p.id] = p.name));
    setReviews(rows.map((r) => ({ ...r, user_name: names[r.user_id], place_name: placeNames[r.place_id] })));
  };

  useEffect(() => {
    loadPosts();
    loadReviews();
  }, []);

  const toggleHiddenPost = async (p: Post) => {
    const { error } = await supabase.from('travel_posts').update({ hidden: !p.hidden }).eq('id', p.id);
    if (error) {
      showToast(`تعذّر تحديث المنشور: ${error.message}`);
      return;
    }
    logAction({ type: 'mod', action: p.hidden ? 'إظهار منشور' : 'إخفاء منشور', target: p.caption || p.id });
    loadPosts();
  };

  const deletePost = async (p: Post) => {
    if (!confirm('حذف هذا المنشور نهائيًا؟')) return;
    const { error } = await supabase.from('travel_posts').delete().eq('id', p.id);
    if (error) {
      showToast(`تعذّر حذف المنشور: ${error.message}`);
      return;
    }
    logAction({ type: 'mod', action: 'حذف منشور', target: p.caption || p.id });
    loadPosts();
  };

  const toggleHiddenReview = async (r: Review) => {
    const { error } = await supabase.from('place_quick_ratings').update({ hidden: !r.hidden }).eq('id', r.id);
    if (error) {
      showToast(`تعذّر تحديث التقييم: ${error.message}`);
      return;
    }
    logAction({ type: 'mod', action: r.hidden ? 'إظهار تقييم' : 'إخفاء تقييم', target: r.place_name ?? r.place_id });
    loadReviews();
  };

  const deleteReview = async (r: Review) => {
    if (!confirm('حذف هذا التقييم نهائيًا؟')) return;
    const { error } = await supabase.from('place_quick_ratings').delete().eq('id', r.id);
    if (error) {
      showToast(`تعذّر حذف التقييم: ${error.message}`);
      return;
    }
    logAction({ type: 'mod', action: 'حذف تقييم', target: r.place_name ?? r.place_id });
    loadReviews();
  };

  const postColumns: DataTableColumn<Post>[] = [
    {
      key: 'content',
      label: 'المنشور',
      render: (p) => (
        <div className="flex items-center gap-3">
          <img src={p.image_url} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
          <div>
            <div className="max-w-xs truncate text-foreground">{p.caption || <span className="text-muted-foreground">بدون نص</span>}</div>
            <div className="text-xs text-muted-foreground">{p.user_name} · {new Date(p.created_at).toLocaleDateString('ar-SA')}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (p) =>
        p.hidden ? (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">مخفي</span>
        ) : (
          <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-bold text-success-ink">ظاهر</span>
        ),
    },
    {
      key: 'actions',
      label: '',
      render: (p) => (
        <div className="flex gap-2">
          <button onClick={() => toggleHiddenPost(p)} className="rounded-md border border-border px-2.5 py-1 text-xs font-bold text-foreground hover:bg-muted">
            {p.hidden ? 'إظهار' : 'إخفاء'}
          </button>
          <button onClick={() => deletePost(p)} className="text-xs font-semibold text-destructive">
            حذف
          </button>
        </div>
      ),
    },
  ];

  const reviewColumns: DataTableColumn<Review>[] = [
    {
      key: 'content',
      label: 'التقييم',
      render: (r) => (
        <div>
          <div className="flex items-center gap-1 font-bold text-foreground">
            {r.place_name ?? r.place_id} <span className="text-gold-ink">{'★'.repeat(r.stars)}</span>
          </div>
          {r.note ? <div className="max-w-xs truncate text-xs text-muted-foreground">{r.note}</div> : null}
          <div className="text-xs text-muted-foreground">{r.user_name} · {new Date(r.created_at).toLocaleDateString('ar-SA')}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (r) =>
        r.hidden ? (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">مخفي</span>
        ) : (
          <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-bold text-success-ink">ظاهر</span>
        ),
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex gap-2">
          <button onClick={() => toggleHiddenReview(r)} className="rounded-md border border-border px-2.5 py-1 text-xs font-bold text-foreground hover:bg-muted">
            {r.hidden ? 'إظهار' : 'إخفاء'}
          </button>
          <button onClick={() => deleteReview(r)} className="text-xs font-semibold text-destructive">
            حذف
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-foreground">المنشورات والتقييمات</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        المنشورات = صور المسافرين بصفحة الوجهة. التقييمات = تقييمات ما بعد الزيارة السريعة على الأماكن (نجوم + ملاحظة) — ما فيه
        تقييمات نصية منفصلة بالتطبيق حاليًا، فهذي أقرب بيانات حقيقية لمفهوم "تقييم".
      </p>

      <div className="mb-4 flex gap-1">
        <button
          onClick={() => setTab('posts')}
          className={`rounded-full px-4 py-1.5 text-xs font-bold ${tab === 'posts' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
        >
          المنشورات
        </button>
        <button
          onClick={() => setTab('reviews')}
          className={`rounded-full px-4 py-1.5 text-xs font-bold ${tab === 'reviews' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
        >
          التقييمات
        </button>
      </div>

      {tab === 'posts' ? (
        <DataTable columns={postColumns} rows={posts} rowKey={(p) => p.id} emptyMessage="ما فيه منشورات بعد" />
      ) : (
        <DataTable columns={reviewColumns} rows={reviews} rowKey={(r) => r.id} emptyMessage="ما فيه تقييمات بعد" />
      )}
    </div>
  );
}
