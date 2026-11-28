import { Platform } from 'react-native';
import { supabase } from './supabase';

// Minimal first-party event log (table: analytics_events). Fire-and-forget
// by design — a failed analytics write must never surface to the user or
// block the action it's describing.
export function logEvent(name: string, props?: Record<string, unknown>) {
  supabase.auth.getSession().then(({ data }) => {
    const profileId = data.session?.user?.id;
    if (!profileId) return;
    supabase
      .from('analytics_events')
      .insert({ profile_id: profileId, name, props: props ?? {}, platform: Platform.OS })
      .then(() => {});
  });
}
