/**
 * One-time cleanup script: deduplicate categories with same (name, type, parentId, householdId).
 * Keeps one category per group, reassigns transactions/budgets to it, deletes duplicates.
 * Run: npx tsx prisma/fix-duplicate-categories.ts
 * Run BEFORE prisma migrate if you have duplicate categories.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type CategoryKey = string;
function toKey(
  name: string,
  type: string,
  parentId: string | null,
  householdId: string | null
): CategoryKey {
  return `${name}|${type}|${parentId ?? ''}|${householdId ?? ''}`;
}

async function main() {
  console.log('🔍 בודק כפילויות בקטגוריות...');

  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: {
        select: { transactions: true, budgetItems: true },
      },
    },
  });

  const byKey = new Map<CategoryKey, typeof categories>();
  for (const c of categories) {
    const key = toKey(c.name, c.type, c.parentId, c.householdId);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(c);
  }

  const duplicates = [...byKey.values()].filter((arr) => arr.length > 1);
  if (duplicates.length === 0) {
    console.log('✅ לא נמצאו כפילויות. אין צורך בניקוי.');
    return;
  }

  console.log(`📦 נמצאו ${duplicates.length} קבוצות עם כפילויות`);

  for (const group of duplicates) {
    const [keep, ...toRemove] = group;
    console.log(`  מרוכזים: "${keep.name}" (${keep.type}) → שומרים ${keep.id}, מוחקים ${toRemove.length}`);

    for (const dup of toRemove) {
      await prisma.$transaction([
        prisma.transaction.updateMany({ where: { categoryId: dup.id }, data: { categoryId: keep.id } }),
        prisma.budgetItem.updateMany({ where: { categoryId: dup.id }, data: { categoryId: keep.id } }),
        prisma.category.updateMany({
          where: { parentId: dup.id },
          data: { parentId: keep.id },
        }),
        prisma.category.delete({ where: { id: dup.id } }),
      ]);
    }
  }

  console.log('🎉 ניקוי כפילויות הושלם');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ שגיאה:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
