/**
 * بيانات التجربة (وضع العرض). تنحمّل لما ما يكون Supabase مربوط، وتتحدّث تواريخها حسب اليوم
 * عشان رحلة العلا تكون دايماً «بعد 9 أيام» وجدة «انتهت قبل يومين».
 */
import type { Db, Place, City, User, CountryInfo } from './types';
import { addDays, toISO } from '../lib/format';

export const ME = 'u_me';
const now = Date.now();
const t = (d: Date) => toISO(d);
const today = new Date();
const D = (n: number) => t(addDays(today, n));
const base = { updatedAt: now };

const users: User[] = [
  {
    ...base, id: ME, name: 'تركي العتيبي', handle: 'turki.travels', color: '#3b6cf0',
    bio: 'أحب الصحراء والقهوة المختصة والمطاعم الشعبية. أكتب عن رحلاتي داخل المملكة وبرّا.',
    city: 'الرياض', languages: ['عربي', 'English'], travelSince: 2019, verified: true, localExpertCity: 'الرياض',
    coverScene: 'desert', interests: ['طبيعة', 'أكل', 'تاريخ'], cuisines: ['سعودي', 'إيطالي'], dietary: ['حلال'],
    travelerType: 'group', budget: 'mid', pace: 'balanced', privacyTrips: 'followers', showHere: false, isAdmin: true,
  },
  { ...base, id: 'u_sara', name: 'سارة', handle: 'sara.goes', color: '#1f9d63', bio: 'رحالة ومصوّرة', city: 'الرياض', languages: ['عربي'], travelSince: 2017, verified: true, coverScene: 'sea', interests: ['أكل', 'تصوير'], cuisines: [], dietary: [], privacyTrips: 'followers', showHere: true },
  { ...base, id: 'u_khalid', name: 'خالد', handle: 'khalid', color: '#e07b24', bio: 'مغامرات برية', city: 'الرياض', languages: ['عربي'], travelSince: 2020, verified: false, coverScene: 'desert', interests: ['مغامرات'], cuisines: [], dietary: [], privacyTrips: 'followers', showHere: true },
  { ...base, id: 'u_fahad', name: 'فهد', handle: 'fahad.f', color: '#2a9bb0', bio: '', city: 'جدة', languages: ['عربي'], travelSince: 2021, verified: false, coverScene: 'sea', interests: ['بحر'], cuisines: [], dietary: [], privacyTrips: 'followers', showHere: true },
  { ...base, id: 'u_noura', name: 'نورة', handle: 'noura', color: '#b2449a', bio: '', city: 'الرياض', languages: ['عربي'], travelSince: 2022, verified: false, coverScene: 'city', interests: ['تسوّق'], cuisines: [], dietary: [], privacyTrips: 'private', showHere: false },
  { ...base, id: 'u_munira', name: 'منيرة الدوسري', handle: 'munira', color: '#6a5cf0', bio: 'محبة الرحلات البرية', city: 'الدمام', languages: ['عربي'], travelSince: 2016, verified: true, coverScene: 'green', interests: ['طبيعة'], cuisines: [], dietary: [], privacyTrips: 'public', showHere: true },
  { ...base, id: 'u_abdullah', name: 'عبدالله', handle: 'abdullah.t', color: '#ab5637', bio: '', city: 'المدينة', languages: ['عربي'], travelSince: 2018, verified: false, coverScene: 'old', interests: ['تاريخ'], cuisines: [], dietary: [], privacyTrips: 'followers', showHere: true },
];

const M = (b: number[]) => b;
const cities: City[] = [
  { ...base, id: 'c_riyadh', name: 'الرياض', country: 'السعودية', countryCode: 'SA', region: 'منطقة الرياض', scene: 'city', lat: 24.7136, lng: 46.6753, blurb: 'موسم الرياض والفعاليات كل ليلة.', bestMonths: M([2, 2, 2, 1, 0, 0, 0, 0, 0, 1, 2, 2]), budgetPerDay: 700, tempNow: 26, tempNight: 16, ourRating: 4.6, ourCount: 940, googleRating: 4.5, googleCount: 52000, group: 'saudi' },
  { ...base, id: 'c_alula', name: 'العلا', country: 'السعودية', countryCode: 'SA', region: 'منطقة المدينة المنورة', scene: 'desert', lat: 26.6084, lng: 37.9232, blurb: 'متحف مفتوح بين الصخور، وأحلى وقت له الشتاء.', bestMonths: M([2, 2, 1, 0, 0, 0, 0, 0, 0, 1, 2, 2]), budgetPerDay: 650, flightFromRUH: 80, tempNow: 24, tempNight: 14, ourRating: 4.8, ourCount: 312, googleRating: 4.6, googleCount: 18000, group: 'saudi' },
  { ...base, id: 'c_jeddah', name: 'جدة', country: 'السعودية', countryCode: 'SA', region: 'منطقة مكة المكرمة', scene: 'sea', lat: 21.5433, lng: 39.1728, blurb: 'البحر والبلد التاريخية وأمسيات الكورنيش.', bestMonths: M([2, 2, 2, 1, 0, 0, 0, 0, 0, 1, 2, 2]), budgetPerDay: 600, flightFromRUH: 95, tempNow: 31, tempNight: 25, ourRating: 4.5, ourCount: 610, googleRating: 4.4, googleCount: 40000, group: 'saudi' },
  { ...base, id: 'c_abha', name: 'أبها', country: 'السعودية', countryCode: 'SA', region: 'منطقة عسير', scene: 'green', lat: 18.2164, lng: 42.5053, blurb: 'جبال خضراء وطقس منعش حتى بالصيف.', bestMonths: M([1, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1]), budgetPerDay: 500, flightFromRUH: 100, tempNow: 19, tempNight: 11, ourRating: 4.7, ourCount: 280, googleRating: 4.6, googleCount: 15000, group: 'saudi' },
  { ...base, id: 'c_redsea', name: 'البحر الأحمر', country: 'السعودية', countryCode: 'SA', region: 'تبوك', scene: 'sea', lat: 25.6, lng: 36.9, blurb: 'غوص وشواطئ بكر، وموسمه الحين.', bestMonths: M([2, 2, 2, 2, 1, 0, 0, 0, 1, 2, 2, 2]), budgetPerDay: 1400, tempNow: 28, tempNight: 22, ourRating: 4.9, ourCount: 120, googleRating: 4.8, googleCount: 3000, group: 'saudi' },
  { ...base, id: 'c_dubai', name: 'دبي', country: 'الإمارات', countryCode: 'AE', region: 'دبي', scene: 'night', lat: 25.2048, lng: 55.2708, blurb: 'تسوّق وفعاليات وشواطئ قريبة.', bestMonths: M([2, 2, 2, 1, 0, 0, 0, 0, 0, 1, 2, 2]), budgetPerDay: 1100, flightFromRUH: 110, tempNow: 29, tempNight: 22, ourRating: 4.6, ourCount: 800, googleRating: 4.6, googleCount: 90000, group: 'gulf' },
  { ...base, id: 'c_london', name: 'لندن', country: 'المملكة المتحدة', countryCode: 'GB', region: 'إنجلترا', scene: 'city', lat: 51.5072, lng: -0.1276, blurb: 'متاحف وحدائق وأسواق.', bestMonths: M([0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 1]), budgetPerDay: 1800, flightFromRUH: 400, tempNow: 9, tempNight: 4, ourRating: 4.5, ourCount: 430, googleRating: 4.6, googleCount: 120000, group: 'europe' },
  { ...base, id: 'c_tbilisi', name: 'تبليسي', country: 'جورجيا', countryCode: 'GE', region: 'جورجيا', scene: 'mountain', lat: 41.7151, lng: 44.8271, blurb: 'طبيعة وجبال وأسعار مناسبة.', bestMonths: M([0, 0, 1, 2, 2, 2, 2, 2, 2, 1, 0, 0]), budgetPerDay: 600, flightFromRUH: 210, tempNow: 10, tempNight: 3, ourRating: 4.4, ourCount: 220, googleRating: 4.5, googleCount: 30000, group: 'asia' },
];

const P = (p: Omit<Place, 'updatedAt'>): Place => ({ ...p, updatedAt: now });
const places: Place[] = [
  // العلا
  P({ id: 'p_oldtown', name: 'البلدة القديمة', category: 'landmarks', cityId: 'c_alula', kind: 'معلم تاريخي', priceLevel: 1, rating: 4.8, ratingCount: 6200, lat: 26.6245, lng: 37.9155, address: 'البلدة القديمة، العلا', open: '09:00', close: '18:00', amenities: ['parking', 'family', 'wheelchair'], tags: ['تاريخ', 'تصوير'], scene: 'old', description: 'أزقة طينية عمرها قرون، أحلاها العصر.', durationMin: 120, bestTime: 'العصر' }),
  P({ id: 'p_elephant', name: 'جبل الفيل', category: 'nature', cityId: 'c_alula', kind: 'طبيعة', priceLevel: 1, rating: 4.9, ratingCount: 9100, lat: 26.6542, lng: 37.9576, address: 'شمال شرق العلا', open: '15:00', close: '23:59', amenities: ['parking', 'family'], tags: ['غروب', 'طبيعة'], scene: 'desert', description: 'صخرة على شكل فيل، والغروب عندها ما ينتسى.', durationMin: 90, bestTime: 'الغروب' }),
  P({ id: 'p_hegra', name: 'هيجرا (مدائن صالح)', category: 'landmarks', cityId: 'c_alula', kind: 'موقع تراث عالمي', priceLevel: 3, rating: 4.9, ratingCount: 7400, lat: 26.7917, lng: 37.9542, address: 'هيجرا، العلا', open: '08:00', close: '17:00', amenities: ['parking', 'reservation', 'family'], tags: ['تاريخ'], scene: 'old', description: 'أول موقع سعودي في قائمة اليونسكو. التذاكر لازم مسبقاً.', durationMin: 180, ticketFrom: 95 }),
  P({ id: 'p_maraya', name: 'مطعم مرايا', category: 'food', cityId: 'c_alula', kind: 'مطعم فاخر', cuisine: 'عالمي', priceLevel: 4, avgMin: 250, avgMax: 450, rating: 4.7, ratingCount: 1300, lat: 26.6, lng: 37.83, address: 'مرايا، وادي عشار', phone: '+966920000000', website: 'https://www.experiencealula.com', open: '18:00', close: '23:00', amenities: ['parking', 'reservation', 'halal'], tags: ['أزواج', 'إطلالة'], scene: 'food', description: 'أكبر مبنى مرايا بالعالم، والعشاء فيه تجربة.', durationMin: 120 }),
  P({ id: 'p_sahl', name: 'سهل العلا', category: 'food', cityId: 'c_alula', kind: 'مطعم شعبي', cuisine: 'سعودي', priceLevel: 2, avgMin: 60, avgMax: 110, rating: 4.5, ratingCount: 870, lat: 26.62, lng: 37.92, address: 'شارع الملك فيصل، العلا', open: '12:00', close: '24:00', amenities: ['parking', 'family', 'halal', 'kids'], tags: ['عائلي'], scene: 'food', description: 'أكل شعبي وجلسات عربية.', durationMin: 75 }),
  P({ id: 'p_dar', name: 'كافيه الدار', category: 'cafe', cityId: 'c_alula', kind: 'قهوة مختصة', priceLevel: 2, avgMin: 25, avgMax: 45, rating: 4.6, ratingCount: 540, lat: 26.625, lng: 37.917, address: 'البلدة القديمة', open: '07:00', close: '23:00', amenities: ['wifi', 'family'], tags: ['قهوة'], scene: 'old', description: 'قهوة مختصة بإطلالة على البلدة القديمة.', durationMin: 45 }),
  P({ id: 'p_stars', name: 'جولة النجوم', category: 'experiences', cityId: 'c_alula', kind: 'تجربة ليلية', priceLevel: 3, rating: 4.8, ratingCount: 410, lat: 26.7, lng: 37.98, address: 'غراء، العلا', open: '20:00', close: '23:59', amenities: ['reservation', 'family'], tags: ['ليلي'], scene: 'night', description: 'تلسكوبات وقصص عن السماء بعيداً عن الأضواء.', durationMin: 120, ticketFrom: 180 }),
  P({ id: 'p_nuzul', name: 'نُزل الصحراء', category: 'hotels', cityId: 'c_alula', kind: 'منتجع', priceLevel: 4, avgMin: 900, avgMax: 1600, rating: 4.7, ratingCount: 620, lat: 26.58, lng: 37.88, address: 'حي العُذيب، العلا', phone: '+966500000000', open: '00:00', close: '23:59', amenities: ['parking', 'wifi', 'family', 'wheelchair'], tags: ['إقامة'], scene: 'desert', description: 'خيام فاخرة وسط الصخور.', durationMin: 0, affiliateUrl: 'https://www.booking.com' }),
  // الرياض
  P({ id: 'p_beefbar', name: 'بيف بار', category: 'food', cityId: 'c_riyadh', kind: 'مطعم فاخر', cuisine: 'إيطالي', priceLevel: 3, avgMin: 80, avgMax: 150, rating: 4.7, ratingCount: 1200, lat: 24.69, lng: 46.68, address: 'حي العليا، الرياض', phone: '+966111111111', website: 'https://beefbar.com', menuUrl: 'https://beefbar.com/menu', open: '17:00', close: '24:00', amenities: ['parking', 'wifi', 'family', 'wheelchair', 'reservation', 'halal'], tags: ['عائلي', 'أزواج'], scene: 'food', description: 'ستيك ممتاز وخدمة سريعة. يزحم في الويكند.', durationMin: 120, trending: true }),
  P({ id: 'p_najd', name: 'مطعم نجد فيلج', category: 'food', cityId: 'c_riyadh', kind: 'مطعم شعبي', cuisine: 'سعودي', priceLevel: 1, avgMin: 40, avgMax: 70, rating: 4.5, ratingCount: 860, lat: 24.71, lng: 46.66, address: 'طريق التخصصي، الرياض', open: '12:00', close: '25:00', amenities: ['parking', 'family', 'halal', 'kids'], tags: ['عائلي', 'شعبي'], scene: 'food', description: 'جلسات أرضية وعائلية وأكل نجدي.', durationMin: 90, featured: true }),
  P({ id: 'p_diriyah', name: 'طريق الدرعية التاريخي', category: 'landmarks', cityId: 'c_riyadh', kind: 'معلم', priceLevel: 1, rating: 4.8, ratingCount: 14000, lat: 24.734, lng: 46.575, address: 'الدرعية', open: '16:00', close: '24:00', amenities: ['parking', 'family', 'wheelchair', 'prayer'], tags: ['تاريخ'], scene: 'old', description: 'حي الطريف ومطاعم البجيري.', durationMin: 150, featured: true }),
  P({ id: 'p_boulevard', name: 'بوليفارد سيتي', category: 'events', cityId: 'c_riyadh', kind: 'موسم الرياض', priceLevel: 2, rating: 4.6, ratingCount: 30000, lat: 24.77, lng: 46.6, address: 'حطين، الرياض', open: '16:00', close: '26:00', amenities: ['parking', 'family', 'kids', 'prayer'], tags: ['فعاليات'], scene: 'night', description: 'فعاليات وعروض كل ليلة.', durationMin: 180, eventDates: 'كل يوم · 4 م – 2 ص', ticketFrom: 19, trending: true }),
  P({ id: 'p_brunch', name: 'برنش الجمعة عند المسبح', category: 'experiences', cityId: 'c_riyadh', kind: 'تجربة', priceLevel: 3, rating: 4.4, ratingCount: 210, lat: 24.69, lng: 46.7, address: 'بجانب المسبح الخارجي، الرياض', open: '13:00', close: '17:00', amenities: ['parking', 'family', 'kids', 'halal'], tags: ['عائلي'], scene: 'sea', description: 'برنش الغروب مع أنشطة للأطفال.', durationMin: 180, eventDates: 'كل جمعة · 1 – 5 م', ticketFrom: 158 }),
  P({ id: 'p_specialty', name: 'محمصة الأرض', category: 'cafe', cityId: 'c_riyadh', kind: 'قهوة مختصة', priceLevel: 2, avgMin: 20, avgMax: 40, rating: 4.6, ratingCount: 990, lat: 24.72, lng: 46.64, address: 'حي الملقا', open: '06:00', close: '24:00', amenities: ['wifi', 'parking'], tags: ['قهوة'], scene: 'old', description: 'محاصيل مختارة ومكان هادي للشغل.', durationMin: 45 }),
  P({ id: 'p_edge', name: 'حافة العالم', category: 'nature', cityId: 'c_riyadh', kind: 'طبيعة', priceLevel: 1, rating: 4.7, ratingCount: 11000, lat: 24.95, lng: 45.99, address: 'شمال غرب الرياض', open: '06:00', close: '18:00', amenities: ['parking'], tags: ['مغامرات', 'طبيعة'], scene: 'desert', description: 'منحدرات طويق. يحتاج سيارة دفع رباعي.', durationMin: 240 }),
  // جدة
  P({ id: 'p_balad', name: 'جدة التاريخية (البلد)', category: 'landmarks', cityId: 'c_jeddah', kind: 'معلم', priceLevel: 1, rating: 4.7, ratingCount: 21000, lat: 21.485, lng: 39.187, address: 'البلد، جدة', open: '16:00', close: '24:00', amenities: ['family', 'prayer'], tags: ['تاريخ'], scene: 'old', description: 'رواشين وبيوت قديمة وأسواق.', durationMin: 150 }),
  P({ id: 'p_corniche', name: 'كورنيش جدة', category: 'nature', cityId: 'c_jeddah', kind: 'بحر', priceLevel: 1, rating: 4.6, ratingCount: 26000, lat: 21.6, lng: 39.11, address: 'الكورنيش الشمالي', open: '00:00', close: '23:59', amenities: ['parking', 'family', 'kids', 'wheelchair'], tags: ['بحر'], scene: 'sea', description: 'أفضل وقت بعد المغرب.', durationMin: 90 }),
  P({ id: 'p_sail', name: 'الإبحار بالقوارب الشراعية', category: 'experiences', cityId: 'c_jeddah', kind: 'تجربة', priceLevel: 3, rating: 4.8, ratingCount: 320, lat: 21.62, lng: 39.1, address: 'نادي جدة لليخوت', open: '08:00', close: '18:00', amenities: ['reservation', 'kids'], tags: ['بحر', 'مغامرات'], scene: 'sea', description: 'دروس إبحار لكل المستويات.', durationMin: 120, ticketFrom: 200 }),
  // دبي
  P({ id: 'p_globalvillage', name: 'القرية العالمية', category: 'events', cityId: 'c_dubai', kind: 'فعالية موسمية', priceLevel: 2, rating: 4.6, ratingCount: 80000, lat: 25.07, lng: 55.31, address: 'دبي لاند', open: '16:00', close: '24:00', amenities: ['parking', 'family', 'kids', 'halal', 'prayer'], tags: ['عائلي'], scene: 'night', description: 'أجنحة من كل العالم.', durationMin: 240, ticketFrom: 25 }),
  P({ id: 'p_alserkal', name: 'السركال أفنيو', category: 'shopping', cityId: 'c_dubai', kind: 'فن وتسوّق', priceLevel: 2, rating: 4.5, ratingCount: 4000, lat: 25.14, lng: 55.22, address: 'القوز', open: '10:00', close: '20:00', amenities: ['parking', 'wifi'], tags: ['فن'], scene: 'city', description: 'معارض ومقاهي مستقلة.', durationMin: 120 }),
  // لندن
  P({ id: 'p_bm', name: 'المتحف البريطاني', category: 'landmarks', cityId: 'c_london', kind: 'متحف', priceLevel: 1, rating: 4.7, ratingCount: 150000, lat: 51.519, lng: -0.127, address: 'Great Russell St', open: '10:00', close: '17:00', amenities: ['wheelchair', 'family', 'wifi'], tags: ['تاريخ'], scene: 'city', description: 'الدخول مجاني.', durationMin: 180 }),
  P({ id: 'p_halal_london', name: 'مطعم ماي فير حلال', category: 'food', cityId: 'c_london', kind: 'مطعم', cuisine: 'لبناني', priceLevel: 3, avgMin: 120, avgMax: 220, rating: 4.5, ratingCount: 2100, lat: 51.51, lng: -0.15, address: 'Mayfair', open: '12:00', close: '23:30', amenities: ['halal', 'family'], tags: ['حلال'], scene: 'food', description: 'أكل لبناني حلال.', durationMin: 90 }),
  // أبها
  P({ id: 'p_soudah', name: 'السودة', category: 'nature', cityId: 'c_abha', kind: 'جبال', priceLevel: 1, rating: 4.8, ratingCount: 9000, lat: 18.27, lng: 42.37, address: 'السودة، عسير', open: '00:00', close: '23:59', amenities: ['parking', 'family'], tags: ['طبيعة'], scene: 'green', description: 'ضباب وغابات على قمم الجبال.', durationMin: 180 }),
  // تبليسي
  P({ id: 'p_narikala', name: 'قلعة ناريكالا', category: 'landmarks', cityId: 'c_tbilisi', kind: 'قلعة', priceLevel: 1, rating: 4.7, ratingCount: 24000, lat: 41.688, lng: 44.809, address: 'المدينة القديمة', open: '09:00', close: '21:00', amenities: ['family'], tags: ['تاريخ'], scene: 'mountain', description: 'إطلالة على المدينة كلها.', durationMin: 90 }),
];

const countries: CountryInfo[] = [
  { ...base, id: 'GE', code: 'GE', name: 'جورجيا', visaSA: 'بدون تأشيرة (سنة)', visaGCC: 'بدون تأشيرة', passportMonths: 3, currency: 'GEL', plugs: 'C / F', sim: 'eSIM متوفرة من المطار', emergency: '112', embassy: 'سفارة المملكة في باكو تغطي جورجيا · +994 12 497 2300', sourceUrl: 'https://www.mofa.gov.sa' },
  { ...base, id: 'GB', code: 'GB', name: 'المملكة المتحدة', visaSA: 'تصريح سفر إلكتروني (ETA)', visaGCC: 'تصريح ETA', passportMonths: 6, currency: 'GBP', plugs: 'G', sim: 'eSIM متوفرة', emergency: '999', embassy: '30 Charles St, London · +44 20 7917 3000', sourceUrl: 'https://www.gov.uk/eta' },
  { ...base, id: 'AE', code: 'AE', name: 'الإمارات', visaSA: 'بدون تأشيرة (بالهوية)', visaGCC: 'بدون تأشيرة', passportMonths: 0, currency: 'AED', plugs: 'G', sim: 'شريحة من المطار', emergency: '999', embassy: 'أبوظبي · +971 2 444 5700', sourceUrl: 'https://www.mofa.gov.sa' },
  { ...base, id: 'SA', code: 'SA', name: 'السعودية', visaSA: '—', visaGCC: 'بدون تأشيرة', passportMonths: 0, currency: 'SAR', plugs: 'G', sim: '—', emergency: '911', embassy: '—', sourceUrl: 'https://www.my.gov.sa' },
];

export const FX: Record<string, number> = { SAR: 1, AED: 1.02, USD: 3.75, EUR: 4.05, GBP: 4.75, GEL: 1.38, TRY: 0.11, EGP: 0.077 };

export function buildSeed(): Db {
  const ula = 'tr_ula', dalam = 'tr_dalam', jed = 'tr_jeddah';
  const ulaStart = D(9);
  const day = (n: number) => t(addDays(addDays(today, 9), n));
  return {
    users,
    follows: [
      ['u_sara', ME], [ME, 'u_sara'], ['u_khalid', ME], [ME, 'u_khalid'], ['u_fahad', ME], [ME, 'u_fahad'], [ME, 'u_noura'], ['u_noura', ME], ['u_munira', ME], [ME, 'u_munira'],
      ['u_sara', 'u_khalid'], ['u_khalid', 'u_sara'], ['u_abdullah', ME],
    ].map(([a, b], i) => ({ id: 'f' + i, followerId: a, followingId: b, updatedAt: now })),
    cities,
    places,
    trips: [
      { id: ula, title: 'رحلة العلا مع الشلة', cityId: 'c_alula', startDate: ulaStart, endDate: day(4), datesMode: 'fixed', travelerType: 'group', needs: [], ownerId: ME, visibility: 'followers', scene: 'desert', plannedBudget: 9000, inviteCode: 'K7Q2LM', published: false, createdAt: now - 864e5 * 20, updatedAt: now },
      { id: dalam, title: 'قروب الدلم', cityId: 'c_riyadh', startDate: null, endDate: null, datesMode: 'vote', flexDays: 2, travelerType: 'group', needs: [], ownerId: ME, visibility: 'private', scene: 'old', plannedBudget: 2500, inviteCode: 'D4LM9X', published: false, createdAt: now - 864e5 * 3, updatedAt: now },
      { id: jed, title: 'إجازة جدة الصيفية', cityId: 'c_jeddah', startDate: D(-5), endDate: D(-2), datesMode: 'fixed', travelerType: 'couple', needs: [], ownerId: ME, visibility: 'followers', scene: 'sea', plannedBudget: 4000, inviteCode: 'J3D8AA', published: true, createdAt: now - 864e5 * 40, updatedAt: now },
    ],
    members: [
      [ula, ME, 'organizer'], [ula, 'u_khalid', 'member'], [ula, 'u_fahad', 'member'],
      [dalam, ME, 'organizer'], [dalam, 'u_khalid', 'member'], [dalam, 'u_sara', 'member'], [dalam, 'u_noura', 'member'],
      [jed, ME, 'organizer'],
    ].map(([tripId, userId, role], i) => ({ id: 'm' + i, tripId, userId, role: role as 'organizer', updatedAt: now })),
    items: [
      { id: 'i1', tripId: ula, placeId: 'p_dar', day: day(0), slot: 'breakfast', time: '08:30', addedBy: ME, order: 0, updatedAt: now },
      { id: 'i2', tripId: ula, placeId: 'p_elephant', day: day(0), slot: 'afternoon', time: '16:30', addedBy: ME, order: 1, updatedAt: now },
      { id: 'i3', tripId: ula, placeId: 'p_oldtown', day: day(0), slot: 'evening', time: '19:00', addedBy: 'u_khalid', order: 2, updatedAt: now },
      { id: 'i4', tripId: ula, placeId: 'p_maraya', day: day(0), slot: 'dinner', time: '20:30', addedBy: 'u_fahad', via: 'poll', order: 3, updatedAt: now },
      { id: 'i5', tripId: ula, placeId: 'p_hegra', day: day(1), slot: 'morning', time: '09:00', addedBy: ME, order: 0, updatedAt: now },
      { id: 'i6', tripId: ula, placeId: 'p_stars', day: day(1), slot: 'evening', time: '22:00', addedBy: 'u_khalid', order: 1, updatedAt: now },
      { id: 'i7', tripId: ula, placeId: 'p_sahl', day: day(1), slot: 'lunch', time: '13:30', addedBy: ME, order: 2, updatedAt: now },
      { id: 'i8', tripId: jed, placeId: 'p_balad', day: D(-4), slot: 'evening', time: '18:00', addedBy: ME, order: 0, updatedAt: now },
      { id: 'i9', tripId: jed, placeId: 'p_corniche', day: D(-3), slot: 'evening', time: '19:30', addedBy: ME, order: 0, updatedAt: now },
    ],
    expenses: [
      { id: 'e1', tripId: ula, paidBy: ME, amount: 3780, currency: 'SAR', amountSar: 3780, fxRate: 1, category: 'stay', splitBetween: [ME, 'u_khalid', 'u_fahad'], note: 'نُزل الصحراء · 4 ليالي', createdAt: now - 864e5 * 6, updatedAt: now },
      { id: 'e2', tripId: ula, paidBy: 'u_khalid', amount: 640, currency: 'SAR', amountSar: 640, fxRate: 1, category: 'food', splitBetween: [ME, 'u_khalid', 'u_fahad'], note: 'عربون عشاء مرايا', fromChat: true, createdAt: now - 864e5 * 2, updatedAt: now },
      { id: 'e3', tripId: ula, paidBy: 'u_fahad', amount: 1050, currency: 'SAR', amountSar: 1050, fxRate: 1, category: 'activities', splitBetween: [ME, 'u_khalid', 'u_fahad'], note: 'تذاكر هيجرا', createdAt: now - 864e5, updatedAt: now },
      { id: 'e4', tripId: ula, paidBy: ME, amount: 1630, currency: 'SAR', amountSar: 1630, fxRate: 1, category: 'transport', splitBetween: [ME, 'u_khalid', 'u_fahad'], note: 'طيران الرياض ↔ العلا', createdAt: now - 864e5 * 8, updatedAt: now },
    ],
    checklist: [
      ['bookings', 'تذاكر الطيران', ME, true], ['bookings', 'السكن', ME, true], ['bookings', 'تذاكر هيجرا', 'u_fahad', true], ['bookings', 'حجز عشاء مرايا', 'u_khalid', false],
      ['bag', 'جاكيت خفيف للصحراء بالليل', ME, true], ['bag', 'حذاء مشي', 'u_khalid', false], ['bag', 'شاحن متنقل', null, false], ['bag', 'نظارة شمس', ME, true],
      ['docs', 'الهوية الوطنية', ME, true], ['docs', 'تأمين السيارة المستأجرة', 'u_fahad', true],
    ].map(([group, title, a, done], i) => ({ id: 'ck' + i, tripId: ula, group: group as 'bag', title: title as string, assigneeId: a as string | null, done: done as boolean, updatedAt: now })),
    docs: [
      { id: 'd1', tripId: ula, ownerId: ME, kind: 'flight', visibility: 'shared', title: 'الذهاب', data: { from: 'RUH', fromCity: 'الرياض', to: 'ULH', toCity: 'العلا', dep: '06:40', arr: '08:00', flight: 'SV 1532', gate: 'B12', seat: '14C', pnr: 'K7Q2LM' }, startsAt: ulaStart + 'T06:40', updatedAt: now },
      { id: 'd2', tripId: ula, ownerId: ME, kind: 'stay', visibility: 'shared', title: 'نُزل الصحراء', data: { nights: '4', checkin: '15:00', address: 'حي العُذيب، العلا', ref: '88213', phone: '+966500000000' }, startsAt: ulaStart + 'T15:00', updatedAt: now },
      { id: 'd3', tripId: ula, ownerId: 'u_fahad', kind: 'ticket', visibility: 'shared', title: 'تذاكر هيجرا', data: { when: '9:00 ص', count: '3', code: 'HEGRA-55120' }, startsAt: day(1) + 'T09:00', updatedAt: now },
      { id: 'd4', tripId: ula, ownerId: ME, kind: 'private', visibility: 'private', title: 'الجواز والتأمين', data: { passport: 'A12******', insurance: 'تكافل الراجحي · 7712' }, updatedAt: now },
    ],
    dateVotes: [
      ...[0, 1, 2, 3, 4, 5].map((n) => ({ id: 'dv_m' + n, tripId: dalam, userId: ME, date: D(12 + n), updatedAt: now })),
      ...[1, 2, 3, 4].map((n) => ({ id: 'dv_k' + n, tripId: dalam, userId: 'u_khalid', date: D(12 + n), updatedAt: now })),
      ...[2, 3, 4, 5, 6].map((n) => ({ id: 'dv_s' + n, tripId: dalam, userId: 'u_sara', date: D(12 + n), updatedAt: now })),
    ],
    chats: [
      { id: 'ch_guide', type: 'guide', memberIds: [ME], title: 'دليل السفر', updatedAt: now },
      { id: 'ch_ula', type: 'trip', tripId: ula, memberIds: [ME, 'u_khalid', 'u_fahad'], updatedAt: now },
      { id: 'ch_dalam', type: 'trip', tripId: dalam, memberIds: [ME, 'u_khalid', 'u_sara', 'u_noura'], updatedAt: now },
      { id: 'ch_sara', type: 'direct', memberIds: [ME, 'u_sara'], updatedAt: now },
      { id: 'ch_land', type: 'community', communityId: 'cm_land', memberIds: [ME, 'u_munira', 'u_khalid'], updatedAt: now },
      { id: 'ch_ulafans', type: 'community', communityId: 'cm_ula', memberIds: [ME, 'u_abdullah'], updatedAt: now },
    ],
    messages: [
      { id: 'ms1', chatId: 'ch_ula', senderId: 'u_khalid', kind: 'text', body: 'وين نتعشى أول ليلة؟', createdAt: now - 36e5 * 5, updatedAt: now },
      { id: 'ms2', chatId: 'ch_ula', senderId: 'u_fahad', kind: 'poll', pollId: 'pl1', createdAt: now - 36e5 * 4.9, updatedAt: now },
      { id: 'ms3', chatId: 'ch_ula', senderId: 'u_fahad', kind: 'place', placeId: 'p_oldtown', createdAt: now - 36e5 * 4, updatedAt: now },
      { id: 'ms4', chatId: 'ch_ula', senderId: ME, kind: 'text', body: 'ممتاز، حطيتها أول يوم 👌', createdAt: now - 36e5 * 3.8, updatedAt: now },
      { id: 'ms5', chatId: 'ch_ula', senderId: 'u_khalid', kind: 'expense', expenseId: 'e2', createdAt: now - 36e5 * 3, updatedAt: now },
      { id: 'ms6', chatId: 'ch_ula', senderId: 'u_khalid', kind: 'text', body: 'تمام، بحجز التذاكر اليوم', createdAt: now - 36e5 * 0.4, updatedAt: now },
      { id: 'ms7', chatId: 'ch_dalam', senderId: ME, kind: 'text', body: 'عيال تمام؟ حددوا الأيام اللي تناسبكم', createdAt: now - 864e5, updatedAt: now },
      { id: 'ms8', chatId: 'ch_sara', senderId: 'u_sara', kind: 'place', placeId: 'p_beefbar', createdAt: now - 36e5 * 2, updatedAt: now },
      { id: 'ms9', chatId: 'ch_land', senderId: 'u_munira', kind: 'text', body: 'جربناه قبل شهر، الطريق تمام بس خذ وقود زيادة', createdAt: now - 864e5 * 2, updatedAt: now },
      { id: 'ms10', chatId: 'ch_ulafans', senderId: 'u_abdullah', kind: 'text', body: 'الوضع الحين ممتاز؟', createdAt: now - 864e5 * 3, updatedAt: now },
      { id: 'ms11', chatId: 'ch_guide', senderId: 'guide', kind: 'text', body: 'مرحباً تركي 👋 أنا دليلك للسفر. اسألني عن أي وجهة، وأسوي لك خطة على قد ميزانيتك واهتماماتك.', createdAt: now - 864e5 * 5, updatedAt: now },
    ],
    polls: [
      { id: 'pl1', chatId: 'ch_ula', question: 'عشاء أول ليلة', options: [{ id: 'o1', label: 'مطعم مرايا', placeId: 'p_maraya' }, { id: 'o2', label: 'سهل العلا', placeId: 'p_sahl' }], votes: { [ME]: 'o1', u_fahad: 'o1', u_khalid: 'o2' }, closed: true, target: { tripId: ula, day: day(0), slot: 'dinner' }, createdBy: 'u_fahad', updatedAt: now },
    ],
    reads: [
      { id: 'r1', chatId: 'ch_ula', userId: ME, lastReadAt: now - 36e5 * 3.5, updatedAt: now },
      { id: 'r2', chatId: 'ch_dalam', userId: ME, lastReadAt: now, updatedAt: now },
      { id: 'r3', chatId: 'ch_land', userId: ME, lastReadAt: now, updatedAt: now },
      { id: 'r4', chatId: 'ch_ulafans', userId: ME, lastReadAt: now, updatedAt: now },
      { id: 'r5', chatId: 'ch_guide', userId: ME, lastReadAt: now, updatedAt: now },
    ],
    posts: [
      { id: 'po1', userId: 'u_sara', photos: ['desert', 'old', 'night'], body: '3 أيام في العلا بأقل من 2,000 ﷼ 🏜️ أحلى شي الغروب عند جبل الفيل', placeId: 'p_elephant', type: 'post', likes: [ME, 'u_khalid'], comments: 12, createdAt: now - 36e5 * 2, updatedAt: now },
      { id: 'po2', userId: ME, photos: ['sea', 'old'], body: 'جدة بعد المغرب شي ثاني 🌊', placeId: 'p_corniche', tripId: jed, type: 'post', likes: ['u_sara'], comments: 3, createdAt: now - 864e5 * 2, updatedAt: now },
      { id: 'po3', userId: 'u_munira', photos: ['green'], body: 'ضباب السودة الصبح 🌫️', placeId: 'p_soudah', type: 'post', likes: [], comments: 1, createdAt: now - 864e5 * 4, updatedAt: now },
      { id: 'po4', userId: ME, photos: ['food'], body: 'أفضل ستيك جربته بالرياض', placeId: 'p_beefbar', type: 'review', likes: ['u_sara', 'u_khalid'], comments: 2, createdAt: now - 864e5 * 9, updatedAt: now },
    ],
    reviews: [
      { id: 'rv1', userId: 'u_sara', placeId: 'p_beefbar', rating: 5, tags: ['يستاهل'], text: 'الستيك ممتاز والخدمة سريعة. احجز قبل بيوم في الويكند لأنه يزحم.', createdAt: now - 864e5 * 20, updatedAt: now },
      { id: 'rv2', userId: 'u_khalid', placeId: 'p_beefbar', rating: 5, tags: ['للعوائل'], text: 'مكان مرتب للعائلة.', createdAt: now - 864e5 * 30, updatedAt: now },
      { id: 'rv3', userId: 'u_munira', placeId: 'p_elephant', rating: 5, tags: ['يستاهل'], text: 'تعال قبل الغروب بساعة.', createdAt: now - 864e5 * 40, updatedAt: now },
    ],
    communities: [
      { id: 'cm_land', name: 'محبي الرحلات البرية', icon: 'sunny', color: '#d97a2b', description: 'طلعات برية ونصائح الطرق والتخييم.', status: 'approved', requestedBy: 'u_munira', memberIds: [ME, 'u_munira', 'u_khalid'], moderatorIds: ['u_munira'], updatedAt: now },
      { id: 'cm_ula', name: 'مسافرين العلا', icon: 'business', color: '#f0892a', description: 'كل شي عن العلا.', status: 'approved', requestedBy: 'u_abdullah', memberIds: [ME, 'u_abdullah'], moderatorIds: ['u_abdullah'], updatedAt: now },
      { id: 'cm_dive', name: 'غوص البحر الأحمر', icon: 'water', color: '#2a55d8', description: 'مواقع الغوص والمدربين.', status: 'approved', requestedBy: 'u_fahad', memberIds: ['u_fahad', 'u_sara'], moderatorIds: ['u_fahad'], updatedAt: now },
      { id: 'cm_food', name: 'عشاق الأكل', icon: 'restaurant', color: '#e07b24', description: 'مطاعم تستاهل في كل مدينة.', status: 'approved', requestedBy: 'u_sara', memberIds: ['u_sara'], moderatorIds: ['u_sara'], updatedAt: now },
      { id: 'cm_moms', name: 'سفر مع الأطفال', icon: 'people', color: '#1f9d63', description: 'وجهات وأماكن تناسب العائلة.', status: 'pending', requestedBy: 'u_noura', memberIds: ['u_noura'], moderatorIds: ['u_noura'], updatedAt: now },
    ],
    reports: [],
    notifications: [
      { id: 'n1', userId: ME, kind: 'invite', actorId: 'u_khalid', text: 'دعاك لرحلة «قروب الدلم»', createdAt: now - 3e5, read: false, refId: dalam, updatedAt: now },
      { id: 'n2', userId: ME, kind: 'poll', actorId: 'u_fahad', text: 'سوّى تصويت: عشاء أول ليلة', createdAt: now - 36e5, read: false, refId: 'ch_ula', updatedAt: now },
      { id: 'n3', userId: ME, kind: 'reminder', text: 'باقي 9 أيام على رحلة العلا، وفيه 4 مهام تجهيز ناقصة', createdAt: now - 36e5 * 6, read: true, refId: ula, updatedAt: now },
      { id: 'n4', userId: ME, kind: 'like', actorId: 'u_sara', text: 'أعجبها منشورك «جدة بعد المغرب»', createdAt: now - 864e5 * 1.5, read: true, refId: 'po2', updatedAt: now },
      { id: 'n5', userId: ME, kind: 'follow', actorId: 'u_abdullah', text: 'بدأ يتابعك', createdAt: now - 864e5 * 2, read: true, refId: 'u_abdullah', updatedAt: now },
      { id: 'n6', userId: ME, kind: 'overlap', actorId: 'u_sara', text: 'رايحة العلا بنفس أيام رحلتك', createdAt: now - 864e5 * 3, read: true, refId: ula, updatedAt: now },
    ],
    stories: [
      { id: 's1', title: 'فعاليات بوليفارد الرياض', scene: 'night', cityId: 'c_riyadh', slides: [{ title: 'موسم الرياض', text: 'فعاليات وعروض كل ليلة من 4 العصر.' }, { title: 'نصيحة', text: 'روح بعد العشاء عشان الزحمة تخف.' }], startsAt: D(-30), endsAt: D(60), updatedAt: now },
      { id: 's2', title: 'أمسيات كورنيش جدة', scene: 'sea', cityId: 'c_jeddah', slides: [{ title: 'الكورنيش', text: 'أحلى وقت بعد المغرب، والجو معتدل الحين.' }], startsAt: D(-30), endsAt: D(60), updatedAt: now },
      { id: 's3', title: 'طقس أبها المنعش', scene: 'green', cityId: 'c_abha', slides: [{ title: 'أبها', text: 'ضباب وغابات، خذ جاكيت.' }], startsAt: D(-30), endsAt: D(60), updatedAt: now },
      { id: 's4', title: 'شتاء العلا', scene: 'desert', cityId: 'c_alula', slides: [{ title: 'العلا', text: 'موسم العلا بدأ: مهرجانات ونجوم.' }], startsAt: D(-30), endsAt: D(60), updatedAt: now },
    ],
    checkins: [
      { id: 'ci1', userId: ME, placeId: 'p_balad', cityId: 'c_jeddah', createdAt: now - 864e5 * 4, updatedAt: now },
      { id: 'ci2', userId: 'u_sara', placeId: 'p_beefbar', cityId: 'c_riyadh', createdAt: now - 864e5 * 20, updatedAt: now },
      { id: 'ci3', userId: 'u_khalid', placeId: 'p_beefbar', cityId: 'c_riyadh', createdAt: now - 864e5 * 30, updatedAt: now },
    ],
    stamps: [
      ['c_jeddah', D(-4)], ['c_london', D(-90)], ['c_dubai', D(-200)], ['c_tbilisi', D(-300)], ['c_abha', D(-380)], ['c_riyadh', D(-500)],
    ].map(([cityId, date], i) => ({ id: 'st' + i, userId: ME, cityId, date, updatedAt: now })),
    countries,
    saved: [{ id: 'sv1', userId: ME, placeId: 'p_beefbar', updatedAt: now }, { id: 'sv2', userId: ME, placeId: 'p_hegra', updatedAt: now }],
    wishes: [{ id: 'w1', userId: ME, cityId: 'c_tbilisi', updatedAt: now }],
    shares: [],
    flags: [
      { id: 'sponsored_places', key: 'sponsored_places', enabled: false, updatedAt: now },
      { id: 'affiliate_booking', key: 'affiliate_booking', enabled: false, updatedAt: now },
      { id: 'premium', key: 'premium', enabled: false, updatedAt: now },
    ],
  };
}
