export type AdminRole = 'owner' | 'mod' | 'editor' | 'analyst' | 'support';

export const ALL_ROLES: AdminRole[] = ['owner', 'mod', 'editor', 'analyst', 'support'];

export const ROLE_LABELS: Record<AdminRole, string> = {
  owner: 'مالك النظام',
  mod: 'مشرف محتوى',
  editor: 'محرر محتوى',
  analyst: 'محلل بيانات',
  support: 'دعم المستخدمين',
};

// A legacy admin (is_admin = true, admin_role not set yet) is treated as
// owner at this app layer only — the real security boundary is still
// is_admin in RLS, this just decides what the nav/UI shows.
export function effectiveRole(adminRole: string | null): AdminRole {
  if (adminRole && (ALL_ROLES as string[]).includes(adminRole)) return adminRole as AdminRole;
  return 'owner';
}

export type PageKey =
  | '/'
  | '/destinations'
  | '/country-info'
  | '/places'
  | '/communities'
  | '/community-requests'
  | '/community-reports'
  | '/users'
  | '/notifications'
  | '/events'
  | '/curated-lists'
  | '/support'
  | '/flags'
  | '/team'
  | '/audit'
  | '/system-health'
  | '/account';

export const PAGE_ROLES: Record<PageKey, AdminRole[] | '*'> = {
  '/': '*',
  '/destinations': ['owner', 'editor', 'mod'],
  '/country-info': ['owner', 'editor'],
  '/places': ['owner', 'editor', 'mod'],
  '/communities': ['owner', 'mod'],
  '/community-requests': ['owner', 'mod'],
  '/community-reports': ['owner', 'mod', 'support'],
  '/users': ['owner', 'mod', 'support'],
  '/notifications': ['owner', 'editor'],
  '/events': ['owner', 'editor', 'mod'],
  '/curated-lists': ['owner', 'editor'],
  '/support': ['owner', 'mod', 'support'],
  '/flags': ['owner'],
  '/team': ['owner'],
  '/audit': ['owner'],
  '/system-health': ['owner', 'analyst'],
  '/account': '*',
};

export function canAccess(role: AdminRole, page: PageKey): boolean {
  const allowed = PAGE_ROLES[page];
  return allowed === '*' || allowed.includes(role);
}
