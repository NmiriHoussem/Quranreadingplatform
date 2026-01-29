import { toHijri } from 'hijri-date/lib/safe';

/**
 * Weekday names in Arabic
 */
const HIJRI_WEEKDAYS_AR = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت'
];

/**
 * Weekday names in English
 */
const HIJRI_WEEKDAYS_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

/**
 * Month names in Arabic
 */
const HIJRI_MONTHS_AR = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة'
];

/**
 * Month names in English
 */
const HIJRI_MONTHS_EN = [
  'Muharram',
  'Safar',
  'Rabi\' al-Awwal',
  'Rabi\' al-Thani',
  'Jumada al-Ula',
  'Jumada al-Akhirah',
  'Rajab',
  'Sha\'ban',
  'Ramadan',
  'Shawwal',
  'Dhul-Qa\'dah',
  'Dhul-Hijjah'
];

/**
 * Convert Gregorian date to Hijri date using Kuwaiti algorithm
 * This is a reliable algorithm used by Islamic organizations
 */
function gregorianToHijri(date: Date): { year: number; month: number; day: number } {
  // Kuwaiti algorithm for Hijri calendar conversion
  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();
  
  if (month < 3) {
    year--;
    month += 12;
  }
  
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524;
  
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l1 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l1) / 5316) * Math.floor((50 * l1) / 17719) + 
            Math.floor(l1 / 5670) * Math.floor((43 * l1) / 15238);
  const l2 = l1 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - 
             Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  
  const hijriMonth = Math.floor((24 * l2) / 709);
  const hijriDay = l2 - Math.floor((709 * hijriMonth) / 24);
  const hijriYear = 30 * n + j - 30;
  
  return {
    year: hijriYear,
    month: hijriMonth,
    day: hijriDay
  };
}

export interface HijriDateInfo {
  day: number;
  month: number;
  year: number;
  weekday: number;
  weekdayName: string;
  monthName: string;
  formattedDate: string;
}

/**
 * Get Hijri date information for today
 * @param language - 'ar' for Arabic, 'en' for English
 * @returns Hijri date information
 */
export function getHijriDate(language: 'ar' | 'en' = 'ar'): HijriDateInfo {
  const today = new Date();
  const hijri = gregorianToHijri(today);
  
  const day = hijri.day;
  const month = hijri.month - 1; // Convert from 1-indexed (1 = Muharram) to 0-indexed
  const year = hijri.year;
  const weekday = today.getDay(); // 0 = Sunday
  
  const weekdayName = language === 'ar' 
    ? HIJRI_WEEKDAYS_AR[weekday] 
    : HIJRI_WEEKDAYS_EN[weekday];
  
  const monthName = language === 'ar'
    ? HIJRI_MONTHS_AR[month]
    : HIJRI_MONTHS_EN[month];
  
  // Format the date
  const formattedDate = language === 'ar'
    ? `${weekdayName}، ${day} ${monthName} ${year}`
    : `${weekdayName}, ${day} ${monthName} ${year}`;
  
  return {
    day,
    month,
    year,
    weekday,
    weekdayName,
    monthName,
    formattedDate
  };
}

/**
 * Check if today is a special Islamic date
 * Returns special message if it's a significant day
 */
export function getSpecialIslamicDay(language: 'ar' | 'en' = 'ar'): string | null {
  const hijri = getHijriDate(language);
  
  // Ramadan
  if (hijri.month === 8) {
    if (hijri.day === 1) {
      return language === 'ar' ? 'أول يوم رمضان - رمضان كريم' : 'First day of Ramadan - Ramadan Kareem';
    }
    if (hijri.day === 27) {
      return language === 'ar' ? 'ليلة القدر المباركة' : 'Laylat al-Qadr';
    }
    return language === 'ar' ? 'رمضان كريم' : 'Ramadan Kareem';
  }
  
  // Eid al-Fitr (1st of Shawwal)
  if (hijri.month === 9 && hijri.day === 1) {
    return language === 'ar' ? 'عيد الفطر المبارك' : 'Eid al-Fitr';
  }
  
  // 15th of Sha'ban
  if (hijri.month === 7 && hijri.day === 15) {
    return language === 'ar' ? 'ليلة النصف من شعبان' : '15th of Sha\'ban';
  }
  
  // First 10 days of Dhul-Hijjah
  if (hijri.month === 11 && hijri.day <= 10) {
    if (hijri.day === 9) {
      return language === 'ar' ? 'يوم عرفة' : 'Day of Arafah';
    }
    if (hijri.day === 10) {
      return language === 'ar' ? 'عيد الأضحى المبارك' : 'Eid al-Adha';
    }
    return language === 'ar' ? 'أيام عشر ذي الحجة' : 'First 10 days of Dhul-Hijjah';
  }
  
  // Ashura (10th of Muharram)
  if (hijri.month === 0 && hijri.day === 10) {
    return language === 'ar' ? 'يوم عاشوراء' : 'Day of Ashura';
  }
  
  return null;
}