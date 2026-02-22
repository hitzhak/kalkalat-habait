import { PrismaClient } from '@prisma/client';
import { CategoryType } from '@/types';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 מתחיל Seed...');

  // =========== הכנסות (6 קטגוריות) ===========
  console.log('📥 יוצר קטגוריות הכנסות...');

  const incomeCategories = [
    {
      name: 'משכורת 1',
      icon: 'Briefcase',
      color: '#10B981',
      type: CategoryType.INCOME,
      isFixed: true,
      sortOrder: 1,
    },
    {
      name: 'משכורת 2',
      icon: 'Briefcase',
      color: '#10B981',
      type: CategoryType.INCOME,
      isFixed: true,
      sortOrder: 2,
    },
    {
      name: 'קצבת ילדים',
      icon: 'Baby',
      color: '#10B981',
      type: CategoryType.INCOME,
      isFixed: true,
      sortOrder: 3,
    },
    {
      name: 'עסק / פרילנס',
      icon: 'Store',
      color: '#10B981',
      type: CategoryType.INCOME,
      isFixed: false,
      sortOrder: 4,
    },
    {
      name: 'הכנסה נוספת 1',
      icon: 'Coins',
      color: '#10B981',
      type: CategoryType.INCOME,
      isFixed: false,
      sortOrder: 5,
    },
    {
      name: 'הכנסה נוספת 2',
      icon: 'Coins',
      color: '#10B981',
      type: CategoryType.INCOME,
      isFixed: false,
      sortOrder: 6,
    },
  ];

  for (const cat of incomeCategories) {
    await prisma.category.upsert({
      where: { name_type_parentId_householdId: { name: cat.name, type: cat.type, parentId: null, householdId: null } },
      create: cat,
      update: cat,
    });
  }

  console.log('✅ נוצרו 6 קטגוריות הכנסות');

  // =========== הוצאות (14 קטגוריות ראשיות + תתי-קטגוריות) ===========
  console.log('📤 יוצר קטגוריות הוצאות...');

  const expenseCategories = [
    {
      name: 'תקשורת',
      icon: 'Smartphone',
      color: '#6366F1',
      type: CategoryType.EXPENSE,
      isFixed: true,
      sortOrder: 1,
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
      color: '#8B5CF6',
      type: CategoryType.EXPENSE,
      isFixed: true,
      sortOrder: 2,
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
      color: '#EC4899',
      type: CategoryType.EXPENSE,
      isFixed: false,
      sortOrder: 3,
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
      color: '#3B82F6',
      type: CategoryType.EXPENSE,
      isFixed: true,
      sortOrder: 4,
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
      color: '#EF4444',
      type: CategoryType.EXPENSE,
      isFixed: true,
      sortOrder: 5,
      subCategories: ['ביטוח רכב', 'תחבורה ציבורית'],
    },
    {
      name: 'מימון ובנק',
      icon: 'Landmark',
      color: '#F59E0B',
      type: CategoryType.EXPENSE,
      isFixed: true,
      sortOrder: 6,
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
      color: '#10B981',
      type: CategoryType.EXPENSE,
      isFixed: false,
      sortOrder: 7,
      subCategories: ['השתלמות', 'פיקדון', 'קופת גמל', 'אחר'],
    },
    {
      name: 'שונות',
      icon: 'Package',
      color: '#64748B',
      type: CategoryType.EXPENSE,
      isFixed: false,
      sortOrder: 8,
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
      color: '#22C55E',
      type: CategoryType.EXPENSE,
      isFixed: false,
      sortOrder: 9,
      subCategories: ['מכולת', 'סופר', 'אוכל בחוץ', 'פארם', 'סיגריות'],
    },
    {
      name: 'טיפוח ויופי',
      icon: 'Sparkles',
      color: '#A855F7',
      type: CategoryType.EXPENSE,
      isFixed: false,
      sortOrder: 10,
      subCategories: ['טיפולים', 'מוצרים', 'מספרה'],
    },
    {
      name: 'הוצאות רפואיות',
      icon: 'HeartPulse',
      color: '#EF4444',
      type: CategoryType.EXPENSE,
      isFixed: false,
      sortOrder: 11,
      subCategories: ['תרופות', 'שיניים', 'טיפולים'],
    },
    {
      name: 'רכב',
      icon: 'Car',
      color: '#06B6D4',
      type: CategoryType.EXPENSE,
      isFixed: false,
      sortOrder: 12,
      subCategories: ['דלק', 'שטיפה', 'טיפולים'],
    },
    {
      name: 'תרבות ופנאי',
      icon: 'Drama',
      color: '#F97316',
      type: CategoryType.EXPENSE,
      isFixed: false,
      sortOrder: 13,
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
      color: '#94A3B8',
      type: CategoryType.EXPENSE,
      isFixed: false,
      sortOrder: 14,
      subCategories: [
        'חיות מחמד',
        'ביגוד',
        'מזומן ללא מעקב',
        'קלינאית',
      ],
    },
  ];

  let subCategoryCount = 0;

  for (const cat of expenseCategories) {
    const { subCategories, ...mainCategoryData } = cat;

    const mainCategory = await prisma.category.upsert({
      where: { name_type_parentId_householdId: { name: mainCategoryData.name, type: mainCategoryData.type, parentId: null, householdId: null } },
      create: mainCategoryData,
      update: mainCategoryData,
    });

    if (subCategories && subCategories.length > 0) {
      for (let i = 0; i < subCategories.length; i++) {
        await prisma.category.upsert({
          where: { name_type_parentId_householdId: { name: subCategories[i], type: CategoryType.EXPENSE, parentId: mainCategory.id, householdId: null } },
          create: {
            name: subCategories[i],
            icon: cat.icon,
            color: cat.color,
            type: CategoryType.EXPENSE,
            isFixed: cat.isFixed,
            parentId: mainCategory.id,
            sortOrder: i + 1,
          },
          update: {
            icon: cat.icon,
            color: cat.color,
            isFixed: cat.isFixed,
            sortOrder: i + 1,
          },
        });
        subCategoryCount++;
      }
    }
  }

  console.log(`✅ נוצרו 14 קטגוריות הוצאות ראשיות + ${subCategoryCount} תתי-קטגוריות`);

  // System categories have householdId: null + isDefault: true.
  // Each household gets its own AppSettings via lazy creation in getHouseholdId().
  // No system-level AppSettings needed.

  console.log('');
  console.log('🎉 Seed הושלם בהצלחה!');
  console.log('📊 סיכום:');
  console.log('   • 6 קטגוריות הכנסות');
  console.log(`   • 14 קטגוריות הוצאות + ${subCategoryCount} תתי-קטגוריות`);
  console.log('   • הגדרות נוצרות אוטומטית עבור כל משק בית חדש');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ שגיאה ב-Seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
