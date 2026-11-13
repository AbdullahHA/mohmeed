import type { ReactNode } from 'react';
import { usePreviewRole } from '../context/PreviewRoleContext';
import { canAccess, ROLE_LABELS, type PageKey } from '../lib/roles';

export default function RequireRole({ page, children }: { page: PageKey; children: ReactNode }) {
  const { displayRole: role } = usePreviewRole();

  if (!canAccess(role, page)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm font-semibold text-foreground">ما عندك صلاحية الوصول لهذي الصفحة</p>
        <p className="text-xs text-muted-foreground">دورك الحالي: {ROLE_LABELS[role]}</p>
      </div>
    );
  }

  return <>{children}</>;
}
