import type { Company } from './types';
import nasl from './nasl-real-estate';

export * from './types';

export const companies: Company[] = [nasl];

export const getCompany = (id: string) => companies.find((c) => c.id === id);

export const getProject = (companyId: string, projectId: string) =>
  getCompany(companyId)?.projects.find((p) => p.id === projectId);
