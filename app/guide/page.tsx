'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen,
  Settings,
  PlusCircle,
  BarChart3,
  Wallet,
  RefreshCw,
  Target,
  Landmark,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    icon: Wallet,
    title: 'מה זה כלכלת הבית?',
    color: '#0073EA',
    content:
      'אפליקציה לניהול תקציב משפחתי חודשי. עוקבים אחרי הכנסות והוצאות, מגדירים תקציב לכל קטגוריה, ורואים בזמן אמת כמה נשאר להוציא.',
  },
  {
    icon: Settings,
    title: 'שלב 1: הגדרת תקציב',
    color: '#6366F1',
    content:
      'נכנסים להגדרות → תקציב חודשי, ומקצים סכום לכל קטגוריית הוצאה (סופר, דלק, חוגים וכו\'). אפשר להעתיק תקציב מחודש קודם בלחיצה אחת.',
  },
  {
    icon: PlusCircle,
    title: 'שלב 2: הזנת עסקאות',
    color: '#10B981',
    content:
      'לוחצים על כפתור ה-+ ומזינים את הסכום, בוחרים קטגוריה (הוצאה/הכנסה), ושומרים. אפשר לסמן עסקה כ"חוזרת כל חודש" וכ"הוצאה קבועה" כדי שתיווצר אוטומטית בחודש הבא.',
  },
  {
    icon: BarChart3,
    title: 'שלב 3: מעקב בדשבורד',
    color: '#F59E0B',
    content:
      'בדף הראשי רואים כמה מהתקציב נוצל, כמה נשאר, והתראות על קטגוריות שחרגו מהתקציב. יש גם בודק "האם אני יכול להרשות לעצמי?" — מזינים סכום ורואים מיד את ההשפעה.',
  },
  {
    icon: RefreshCw,
    title: 'עסקאות חוזרות',
    color: '#8B5CF6',
    content:
      'עסקאות שמסומנות כ"חוזרות" (משכנתא, ביטוחים, משכורת) ייווצרו אוטומטית בתחילת כל חודש חדש. לא צריך להזין אותן שוב — פשוט לאשר שהסכום לא השתנה.',
  },
  {
    icon: BarChart3,
    title: 'דוחות',
    color: '#EC4899',
    content:
      'בדף הדוחות רואים גרפים: הוצאות לפי קטגוריה (עוגה), הוצאות שבועיות (עמודות), מגמות לאורך זמן (קווים), והשוואה בין חודשים. אפשר לייצא לקובץ PDF או Excel.',
  },
  {
    icon: Target,
    title: 'מטרות חיסכון',
    color: '#14B8A6',
    content:
      'מגדירים מטרת חיסכון (טיול, רכב, דירה), סכום יעד ותאריך יעד. מפקידים כל חודש ורואים את ההתקדמות. המערכת מחשבת כמה צריך להפקיד כל חודש כדי להגיע ליעד בזמן.',
  },
  {
    icon: Landmark,
    title: 'הלוואות וחובות',
    color: '#EF4444',
    content:
      'מנהלים הלוואות (משכנתא, בנק, אשראי). רואים את סך החוב, התשלום החודשי הכולל, וצפי סיום. כל תשלום מתועד ומפחית אוטומטית מהיתרה.',
  },
];

const tips = [
  'הוצאות קבועות (משכנתא, ביטוחים, חוגים) מחויבות ביום ה-Payday שמוגדר בהגדרות.',
  'הנוסחה: הכנסות – הוצאות קבועות = נותר להוצאות שבועיות.',
  'מומלץ להתחיל עם הוצאות קבועות ולהזין אותן כ"חוזרות" — כך החודש הבא יהיה מוכן מראש.',
  'אפשר לגבות את כל הנתונים בכל זמן מדף ההגדרות (ייצוא/ייבוא JSON).',
];

export default function GuidePage() {
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6 max-w-3xl mx-auto pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 shrink-0 text-primary-500" />
          מדריך שימוש
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          כל מה שצריך לדעת כדי לנהל את התקציב המשפחתי
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <Card key={idx}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: section.color + '18', color: section.color }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">טיפים</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          חזרה לדשבורד
        </Link>
      </div>
    </div>
  );
}
