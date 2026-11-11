export type ProjectStatus = 'قيد التخطيط' | 'تحت الإنشاء' | 'جاهز' | 'مباع بالكامل';

export type Project = {
  id: string;
  name: string;
  description: string;
  city: string;
  district?: string;
  status: ProjectStatus;
  /** نوع المشروع: سكني، تجاري، فلل، شقق… */
  type: string;
  units?: number;
  priceFrom?: number;
  images: string[];
  coordinate?: { latitude: number; longitude: number };
};

export type Company = {
  id: string;
  name: string;
  description: string;
  logo?: string;
  phone?: string;
  email?: string;
  website?: string;
  projects: Project[];
};
