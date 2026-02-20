'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Building2, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BankInfo {
  name: string;
  icon: 'bank' | 'cc';
  steps: string[];
}

const BANKS: BankInfo[] = [
  {
    name: 'בנק לאומי',
    icon: 'bank',
    steps: [
      'כנסו לחשבון באתר או באפליקציה',
      'לחצו על "תנועות בחשבון"',
      'בחרו את טווח התאריכים הרצוי',
      'לחצו על "ייצוא ל-Excel" (אייקון למעלה)',
    ],
  },
  {
    name: 'בנק הפועלים',
    icon: 'bank',
    steps: [
      'כנסו לאתר הבנק → עו"ש → תנועות',
      'בחרו תאריכים ולחצו "הצג"',
      'לחצו על אייקון ה-Excel בפינה הימנית העליונה',
    ],
  },
  {
    name: 'בנק דיסקונט',
    icon: 'bank',
    steps: [
      'כנסו לאתר → חשבון עו"ש → תנועות אחרונות',
      'בחרו תקופה ולחצו "הצג"',
      'לחצו "ייצוא" → Excel',
    ],
  },
  {
    name: 'בנק מזרחי טפחות',
    icon: 'bank',
    steps: [
      'כנסו לאתר → עו"ש → פירוט תנועות',
      'בחרו תאריכים',
      'לחצו על כפתור "ייצוא לאקסל"',
    ],
  },
  {
    name: 'כאל (CAL)',
    icon: 'cc',
    steps: [
      'כנסו לאתר cal.co.il → פירוט חיובים',
      'בחרו חודש חיוב',
      'לחצו "ייצוא לאקסל" בתחתית הדף',
    ],
  },
  {
    name: 'מקס (max)',
    icon: 'cc',
    steps: [
      'כנסו לאתר max.co.il → פעולות בכרטיס',
      'בחרו חודש',
      'לחצו על אייקון ה-Excel',
    ],
  },
  {
    name: 'ישראכרט',
    icon: 'cc',
    steps: [
      'כנסו לאתר isracard.co.il → פירוט עסקאות',
      'בחרו חודש חיוב',
      'לחצו "ייצוא לאקסל"',
    ],
  },
];

export function ImportInstructions() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-1.5">
      <p className="text-sm text-muted-foreground mb-2">
        הוראות ייצוא Excel לפי בנק/חברת אשראי:
      </p>
      {BANKS.map((bank, i) => (
        <div key={bank.name} className="rounded-lg border">
          <button
            type="button"
            className="flex w-full items-center justify-between p-3 text-sm font-medium hover:bg-secondary/50 transition-colors"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <div className="flex items-center gap-2">
              {bank.icon === 'bank' ? (
                <Building2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              )}
              <span>{bank.name}</span>
            </div>
            {openIndex === i ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <div
            className={cn(
              'overflow-hidden transition-all duration-200',
              openIndex === i ? 'max-h-60 pb-3 px-3' : 'max-h-0'
            )}
          >
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground pr-2">
              {bank.steps.map((step, j) => (
                <li key={j}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      ))}
    </div>
  );
}
