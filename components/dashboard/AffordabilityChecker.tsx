'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { Search } from 'lucide-react';

interface CategoryBudget {
  id: string;
  name: string;
  icon: string | null;
  remaining: number;
  plannedAmount: number;
}

interface AffordabilityCheckerProps {
  categories: CategoryBudget[];
  totalRemaining: number;
  onCheck?: (amount: number) => void;
}

export function AffordabilityChecker({ categories, totalRemaining, onCheck }: AffordabilityCheckerProps) {
  const [amount, setAmount] = useState('');
  const [checkedAmount, setCheckedAmount] = useState<number | null>(null);

  const handleCheck = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    setCheckedAmount(num);
    onCheck?.(num);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCheck();
  };

  const clearCheck = () => {
    setAmount('');
    setCheckedAmount(null);
    onCheck?.(0);
  };

  return (
    <Card className="border-dashed border-cyan-300 bg-cyan-50/30">
      <CardContent className="py-4 px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600 shrink-0">💡 רוצה להוציא</span>
          <div className="relative flex-1 max-w-[160px]">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₪</span>
            <Input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (!e.target.value) setCheckedAmount(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="0"
              className="pr-8 h-9 text-lg font-bold bg-white"
            />
          </div>
          <Button
            size="sm"
            onClick={handleCheck}
            disabled={!amount || parseFloat(amount) <= 0}
            className="bg-cyan-600 hover:bg-cyan-700 h-9"
          >
            <Search className="h-4 w-4 ml-1" />
            בדוק
          </Button>
          {checkedAmount && (
            <Button size="sm" variant="ghost" onClick={clearCheck} className="h-9 text-xs text-slate-500">
              נקה
            </Button>
          )}
        </div>

        {checkedAmount !== null && (
          <div className="mt-3 space-y-1.5">
            {/* Overall check */}
            <div className={`text-sm font-medium px-2 py-1 rounded ${
              checkedAmount <= totalRemaining ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
            }`}>
              {checkedAmount <= totalRemaining
                ? `✅ מהתקציב הכללי: ${formatCurrency(totalRemaining)} → ${formatCurrency(totalRemaining - checkedAmount)}`
                : `❌ חריגה מהתקציב! נשאר רק ${formatCurrency(totalRemaining)}`
              }
            </div>

            {/* Per-category check */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {categories
                .filter(c => c.plannedAmount > 0)
                .map(cat => {
                  const canAfford = cat.remaining >= checkedAmount;
                  const willBeWarning = canAfford && (cat.remaining - checkedAmount) < (cat.plannedAmount * 0.2);
                  let indicator = '✅';
                  let textColor = 'text-green-700';
                  let bg = 'bg-green-50';
                  if (!canAfford) {
                    indicator = '❌';
                    textColor = 'text-red-700';
                    bg = 'bg-red-50';
                  } else if (willBeWarning) {
                    indicator = '⚠️';
                    textColor = 'text-yellow-700';
                    bg = 'bg-yellow-50';
                  }

                  return (
                    <div key={cat.id} className={`${bg} rounded px-2 py-1.5 ${textColor}`}>
                      <div className="flex items-center gap-1 text-xs">
                        <span>{indicator}</span>
                        <span className="truncate font-medium">{cat.name}</span>
                      </div>
                      <div className="text-[11px] opacity-80 mt-0.5">
                        נשאר: {formatCurrency(cat.remaining)}
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
