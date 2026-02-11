'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { CategoryType } from '@/types';

// ========== Zod Schemas ==========

const GetCategoriesSchema = z.object({
  type: z.nativeEnum(CategoryType).optional(),
});

// ========== Server Actions ==========

/**
 * 1. קבלת קטגוריות (אופציונלי: לפי סוג INCOME/EXPENSE)
 * מחזיר קטגוריות כולל תתי-קטגוריות
 */
export async function getCategories(type?: CategoryType) {
  try {
    // ולידציה
    if (type) {
      GetCategoriesSchema.parse({ type });
    }

    // שליפת קטגוריות
    const categories = await prisma.category.findMany({
      where: {
        ...(type && { type }),
        isActive: true,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
        children: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            type: true,
            isFixed: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });

    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('שגיאה בטעינת הקטגוריות');
  }
}

/**
 * 2. קבלת עץ קטגוריות מלא
 * מחזיר רק קטגוריות ראשיות עם ה-children שלהן (עץ היררכי)
 */
export async function getCategoryTree() {
  try {
    // שליפת קטגוריות ראשיות בלבד (parentId = null)
    const categories = await prisma.category.findMany({
      where: {
        parentId: null,
        isActive: true,
      },
      include: {
        children: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            type: true,
            isFixed: true,
            parentId: true,
            sortOrder: true,
            isActive: true,
            isDefault: true,
            createdAt: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: [
        {
          type: 'asc', // INCOME קודם, אחר כך EXPENSE
        },
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });

    return categories;
  } catch (error) {
    console.error('Error fetching category tree:', error);
    throw new Error('שגיאה בטעינת עץ הקטגוריות');
  }
}

/**
 * 3. קבלת קטגוריה בודדת לפי ID
 * (פונקציה נוספת שימושית)
 */
export async function getCategoryById(id: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
        children: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            type: true,
            isFixed: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    if (!category) {
      throw new Error('הקטגוריה לא נמצאה');
    }

    return category;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw new Error('שגיאה בטעינת הקטגוריה');
  }
}

/**
 * 4. קבלת קטגוריות ראשיות בלבד (ללא children)
 * שימושי לבחירה מהירה בטפסים
 */
export async function getParentCategories(type?: CategoryType) {
  try {
    // ולידציה
    if (type) {
      GetCategoriesSchema.parse({ type });
    }

    const categories = await prisma.category.findMany({
      where: {
        parentId: null,
        isActive: true,
        ...(type && { type }),
      },
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
        type: true,
        isFixed: true,
        sortOrder: true,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });

    return categories;
  } catch (error) {
    console.error('Error fetching parent categories:', error);
    throw new Error('שגיאה בטעינת הקטגוריות הראשיות');
  }
}

/**
 * 5. קבלת תתי-קטגוריות לקטגוריה מסוימת
 */
export async function getSubCategories(parentId: string) {
  try {
    const subCategories = await prisma.category.findMany({
      where: {
        parentId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
        type: true,
        isFixed: true,
        sortOrder: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return subCategories;
  } catch (error) {
    console.error('Error fetching sub-categories:', error);
    throw new Error('שגיאה בטעינת תתי-הקטגוריות');
  }
}
