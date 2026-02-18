'use client';

import { useState } from 'react';
import { CategoryCard, BudgetCategoryData } from '@/components/dashboard/CategoryCard';
import { CategoryDetail } from '@/components/dashboard/CategoryDetail';
import { Wallet } from 'lucide-react';
import Link from 'next/link';

interface CategoryGridProps {
  categories: BudgetCategoryData[];
  totalRemaining: number;
  totalBudget: number;
  totalSpent: number;
}

export function RemainingBudget({ categories }: CategoryGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategoryData | null>(null);

  const activeCategories = categories
    .filter(c => c.plannedAmount > 0)
    .sort((a, b) => b.remaining - a.remaining);

  const exhaustedCategories = categories
    .filter(c => c.plannedAmount > 0 && c.remaining <= 0);

  if (categories.length === 0 || activeCategories.length === 0) {
    return (
      <div className="text-center py-8">
        <Wallet className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">לא הוגדר תקציב עדיין</p>
        <p className="text-sm text-slate-400 mt-1">הגדר תקציב חודשי כדי לעקוב אחר ההוצאות</p>
        <Link
          href="/settings"
          className="inline-block mt-4 text-sm font-medium text-cyan-600 hover:text-cyan-700"
        >
          הגדר תקציב &larr;
        </Link>
      </div>
    );
  }

  const displayCategories = activeCategories.filter(c => c.remaining > 0);

  return (
    <>
      <div className="category-grid grid grid-cols-2 md:grid-cols-3 gap-3">
        {displayCategories.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            onClick={setSelectedCategory}
          />
        ))}
      </div>

      {exhaustedCategories.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-slate-400 mb-2">קטגוריות שמוצו:</p>
          <div className="flex flex-wrap gap-2">
            {exhaustedCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-full hover:bg-red-100 transition-colors"
              >
                {cat.name} ({cat.remaining < 0 ? '-' : ''}₪{Math.abs(cat.remaining)})
              </button>
            ))}
          </div>
        </div>
      )}

      <CategoryDetail
        category={selectedCategory}
        open={selectedCategory !== null}
        onClose={() => setSelectedCategory(null)}
      />
    </>
  );
}
