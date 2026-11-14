import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type GoogleResult = {
  id: string;
  name: string;
  address: string;
  category: 'restaurant' | 'cafe' | 'hotel' | 'shopping' | 'attraction' | 'other';
  lat: number | null;
  lng: number | null;
};

type OurType = 'food' | 'cafe' | 'events' | 'experiences' | 'shopping' | 'nature' | 'landmarks' | 'hotels';

const CATEGORY_TO_TYPE: Record<GoogleResult['category'], OurType> = {
  restaurant: 'food',
  cafe: 'cafe',
  hotel: 'hotels',
  shopping: 'shopping',
  attraction: 'landmarks',
  other: 'experiences',
};

function slugify(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ\s]/g, '')
    .replace(/\s+/g, '-');
  return base || `place-${Date.now()}`;
}

export default function ImportFromGooglePlaces({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GoogleResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    const { data, error: fnError } = await supabase.functions.invoke('places-search', { body: { query: query.trim() } });
    setSearching(false);
    if (fnError) {
      setError('تعذّر البحث — تأكد إن خدمة Google Places مفعّلة.');
      return;
    }
    setResults(data?.results ?? []);
  };

  const importResult = (r: GoogleResult) => {
    navigate('/places/new', {
      state: {
        id: slugify(r.name),
        name: r.name,
        description: r.address,
        type: CATEGORY_TO_TYPE[r.category],
        latitude: r.lat != null ? String(r.lat) : '',
        longitude: r.lng != null ? String(r.lng) : '',
      },
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-24" onClick={onClose}>
      <div className="surface-card w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border p-4">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="اسم المكان، مثل: مطعم نرموز الرياض"
            className="input flex-1"
          />
          <button
            onClick={search}
            disabled={searching || !query.trim()}
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            {searching ? 'جاري البحث...' : 'بحث'}
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {error ? <div className="p-3 text-sm text-destructive">{error}</div> : null}
          {results === null ? (
            <div className="p-3 text-sm text-muted-foreground">ابحث باسم المكان في Google Places.</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">ما فيه نتائج.</div>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                onClick={() => importResult(r)}
                className="flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-right hover:bg-muted"
              >
                <span className="text-sm font-bold text-foreground">{r.name}</span>
                <span className="text-xs text-muted-foreground">{r.address}</span>
              </button>
            ))
          )}
        </div>
        <div className="border-t border-border p-3 text-[11px] text-muted-foreground">
          يعبّي الاسم والموقع والنوع تلقائيًا — الصورة والوصف والسعر تضيفها يدويًا بعد الاستيراد.
        </div>
      </div>
    </div>,
    document.body
  );
}
