import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ALL_ROLES, type AdminRole } from '../lib/roles';

const STORAGE_KEY = 'yn-admin-preview-role';

type PreviewRoleState = {
  realRole: AdminRole;
  displayRole: AdminRole;
  isPreviewing: boolean;
  canPreview: boolean;
  previewRole: AdminRole | null;
  setPreviewRole: (role: AdminRole | null) => void;
};

const PreviewRoleContext = createContext<PreviewRoleState | undefined>(undefined);

// Owner-only "preview as role" — purely a client-side display filter over
// nav/page visibility, for an owner to sanity-check what each role's UI
// looks like. It never touches Supabase or admin_role: the real RLS
// permission boundary is completely unaffected, so a previewing owner
// still has their full real access underneath — this only changes what
// the UI *shows*, never what it *allows*.
export function PreviewRoleProvider({ realRole, children }: { realRole: AdminRole; children: ReactNode }) {
  const canPreview = realRole === 'owner';
  const [previewRole, setPreviewRoleState] = useState<AdminRole | null>(() => {
    if (realRole !== 'owner') return null;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved && (ALL_ROLES as string[]).includes(saved) ? (saved as AdminRole) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!canPreview && previewRole) setPreviewRoleState(null);
  }, [canPreview, previewRole]);

  const setPreviewRole = (role: AdminRole | null) => {
    if (!canPreview) return;
    setPreviewRoleState(role);
    try {
      if (role) sessionStorage.setItem(STORAGE_KEY, role);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* best-effort only */
    }
  };

  const displayRole = canPreview && previewRole ? previewRole : realRole;

  return (
    <PreviewRoleContext.Provider
      value={{ realRole, displayRole, isPreviewing: displayRole !== realRole, canPreview, previewRole, setPreviewRole }}
    >
      {children}
    </PreviewRoleContext.Provider>
  );
}

export function usePreviewRole(): PreviewRoleState {
  const ctx = useContext(PreviewRoleContext);
  if (!ctx) throw new Error('usePreviewRole must be used inside PreviewRoleProvider');
  return ctx;
}
