// قالب مشروع جديد: انسخ هذا المجلد وغيّر اسمه (مثلاً: nasl-gardens)
// ثم عدّل البيانات وأضف المشروع في ../index.ts
import type { Project } from '../../../types';

const project: Project = {
  id: 'project-id',
  name: 'اسم المشروع',
  description: 'وصف المشروع',
  city: 'الرياض',
  district: 'الحي',
  status: 'تحت الإنشاء',
  type: 'سكني',
  units: 0,
  priceFrom: 0,
  images: [],
};

export default project;
