export type Feature = {
  id: string;
  icon: string;
  title: string;
  body: string;
};

export const features: Feature[] = [
  {
    id: 'suggestions',
    icon: 'compass-outline',
    title: 'اقتراحات ذكية للأماكن',
    body: 'قل لنا الشهر والميزانية والذوق، ونعطيك وجهات ومعالم تناسبك — بدون حجوزات ولا تعقيد.',
  },
  {
    id: 'chat',
    icon: 'chatbubbles-outline',
    title: 'شات مع الرفيق والمسافرين',
    body: 'اسأل عن أفضل فندق في الحي، أو مطعم مفتوح متأخر، واحصل على إجابة مباشرة وتجارب حقيقية.',
  },
  {
    id: 'friends',
    icon: 'people-outline',
    title: 'قروب الأصدقاء',
    body: 'أضف أصدقاءك للرحلة، شاركوا الاقتراحات، وصوتوا على الأماكن قبل ما تنطلقون.',
  },
  {
    id: 'budget',
    icon: 'wallet-outline',
    title: 'ميزانية مقسّمة',
    body: 'حدد ميزانية الرحلة ووزعها على الفنادق والمطاعم والتنقل، وشوف المتبقي لحظة بلحظة.',
  },
  {
    id: 'itinerary',
    icon: 'calendar-outline',
    title: 'جدول يوم بيوم',
    body: 'رتب أيامك بين المعالم والمطاعم وأوقات الراحة، مع اقتراحات بديلة لكل يوم.',
  },
  {
    id: 'share',
    icon: 'share-social-outline',
    title: 'مشاركة الجدول',
    body: 'شارك جدولك برابط واحد مع العائلة أو المتابعين، ويقدرون ينسخونه لرحلتهم.',
  },
];
