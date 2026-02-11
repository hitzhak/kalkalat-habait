import { CategoryType } from '@/types';

// =========== קטגוריות ברירת מחדל ===========

export interface DefaultCategory {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  isFixed: boolean;
  subCategories?: string[];
}

// קטגוריות הכנסות (6)
export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  {
    name: 'משכורת 1',
    icon: 'Briefcase',
    color: '#10B981', // emerald-500
    type: CategoryType.INCOME,
    isFixed: true,
  },
  {
    name: 'משכורת 2',
    icon: 'Briefcase',
    color: '#10B981',
    type: CategoryType.INCOME,
    isFixed: true,
  },
  {
    name: 'קצבת ילדים',
    icon: 'Baby',
    color: '#10B981',
    type: CategoryType.INCOME,
    isFixed: true,
  },
  {
    name: 'עסק / פרילנס',
    icon: 'Store',
    color: '#10B981',
    type: CategoryType.INCOME,
    isFixed: false,
  },
  {
    name: 'הכנסה נוספת 1',
    icon: 'Coins',
    color: '#10B981',
    type: CategoryType.INCOME,
    isFixed: false,
  },
  {
    name: 'הכנסה נוספת 2',
    icon: 'Coins',
    color: '#10B981',
    type: CategoryType.INCOME,
    isFixed: false,
  },
];

// קטגוריות הוצאות (14)
export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  {
    name: 'תקשורת',
    icon: 'Smartphone',
    color: '#6366F1', // indigo-500
    type: CategoryType.EXPENSE,
    isFixed: true,
    subCategories: [
      'טלפון קווי',
      'סלולר',
      'אינטרנט',
      'טלוויזיה',
      'סטרימינג',
      'עיתונים',
      'אחסון ענן',
    ],
  },
  {
    name: 'דיור',
    icon: 'Home',
    color: '#8B5CF6', // violet-500
    type: CategoryType.EXPENSE,
    isFixed: true,
    subCategories: [
      'חשמל',
      'ארנונה',
      'גז',
      'מים',
      'שכר דירה',
      'משכנתא',
      'ועד בית',
      'אבטחה',
      'עוזרת',
      'גינון',
    ],
  },
  {
    name: 'ילדים וחינוך',
    icon: 'GraduationCap',
    color: '#EC4899', // pink-500
    type: CategoryType.EXPENSE,
    isFixed: false,
    subCategories: [
      'מטפלת',
      'מעון',
      'צהרון',
      'סל תרבות',
      'חוגים',
      'הוצאות גן',
      'אוניברסיטה',
    ],
  },
  {
    name: 'ביטוחים',
    icon: 'Shield',
    color: '#3B82F6', // blue-500
    type: CategoryType.EXPENSE,
    isFixed: true,
    subCategories: [
      'קופת חולים',
      'ביטוח בריאות',
      'ביטוח חיים',
      'ביטוח דירה',
      'ביטוח משכנתא',
    ],
  },
  {
    name: 'תחבורה',
    icon: 'Bus',
    color: '#EF4444', // red-500
    type: CategoryType.EXPENSE,
    isFixed: true,
    subCategories: ['ביטוח רכב', 'תחבורה ציבורית'],
  },
  {
    name: 'מימון ובנק',
    icon: 'Landmark',
    color: '#F59E0B', // amber-500
    type: CategoryType.EXPENSE,
    isFixed: true,
    subCategories: [
      'הלוואות בנק',
      'הלוואות חוץ-בנקאי',
      'חובות',
      'ריבית',
      'עמלות',
    ],
  },
  {
    name: 'חיסכון',
    icon: 'PiggyBank',
    color: '#10B981', // emerald-500
    type: CategoryType.EXPENSE,
    isFixed: false,
    subCategories: ['השתלמות', 'פיקדון', 'קופת גמל', 'אחר'],
  },
  {
    name: 'שונות',
    icon: 'Package',
    color: '#64748B', // slate-500
    type: CategoryType.EXPENSE,
    isFixed: false,
    subCategories: [
      'מזונות',
      'חניה',
      'כביש 6',
      'תרומות',
      'מנויים',
      'כושר',
      'מוצרים לבית',
      'הוצאות לא מתוכננות',
    ],
  },
  {
    name: 'אוכל וקניות',
    icon: 'ShoppingCart',
    color: '#22C55E', // green-500
    type: CategoryType.EXPENSE,
    isFixed: false,
    subCategories: ['מכולת', 'סופר', 'אוכל בחוץ', 'פארם', 'סיגריות'],
  },
  {
    name: 'טיפוח ויופי',
    icon: 'Sparkles',
    color: '#A855F7', // purple-500
    type: CategoryType.EXPENSE,
    isFixed: false,
    subCategories: ['טיפולים', 'מוצרים', 'מספרה'],
  },
  {
    name: 'הוצאות רפואיות',
    icon: 'HeartPulse',
    color: '#EF4444', // red-500
    type: CategoryType.EXPENSE,
    isFixed: false,
    subCategories: ['תרופות', 'שיניים', 'טיפולים'],
  },
  {
    name: 'רכב',
    icon: 'Car',
    color: '#06B6D4', // cyan-500
    type: CategoryType.EXPENSE,
    isFixed: false,
    subCategories: ['דלק', 'שטיפה', 'טיפולים'],
  },
  {
    name: 'תרבות ופנאי',
    icon: 'Drama',
    color: '#F97316', // orange-500
    type: CategoryType.EXPENSE,
    isFixed: false,
    subCategories: [
      'בילויים',
      'מתנות',
      'ימי הולדת',
      'צעצועים',
      'שמרטף',
      'דמי כיס',
    ],
  },
  {
    name: 'שונות נוספות',
    icon: 'Paperclip',
    color: '#94A3B8', // slate-400
    type: CategoryType.EXPENSE,
    isFixed: false,
    subCategories: [
      'חיות מחמד',
      'ביגוד',
      'מזומן ללא מעקב',
      'קלינאית',
    ],
  },
];

// כל הקטגוריות יחד
export const DEFAULT_CATEGORIES = [
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_EXPENSE_CATEGORIES,
];

// =========== התראות וגבולות ===========

export const ALERT_THRESHOLDS = {
  WARNING: 80, // 80% ניצול — צהוב
  DANGER: 95, // 95% ניצול — כתום
  EXCEEDED: 100, // 100%+ — אדום
};

// =========== הגדרות אפליקציה ===========

export const APP_CONFIG = {
  payday: 11, // יום המשכורת
  currency: 'ILS', // שקל חדש
  weekStartDay: 0, // 0 = ראשון
  startMonth: 1, // ינואר
};

// =========== צבעים ===========

export const COLORS = {
  primary: '#0891B2', // cyan-600
  success: '#10B981', // emerald-500
  danger: '#EF4444', // red-500
  warning: '#F59E0B', // amber-500
  info: '#3B82F6', // blue-500
  background: '#F8FAFC', // slate-50
  cardBg: '#FFFFFF', // white
  textPrimary: '#1E293B', // slate-800
  textSecondary: '#64748B', // slate-500
};
