'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';
import { TransactionForm } from '@/components/transactions/TransactionForm';

export function QuickAddButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-20 left-4 z-50 h-12 w-12 rounded-full shadow-lg bg-cyan-600 hover:bg-cyan-700 md:bottom-6 md:left-6 hover:scale-110 active:scale-95 transition-transform duration-200"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Suspense fallback={null}>
        <TransactionForm open={open} onOpenChange={setOpen} />
      </Suspense>
    </>
  );
}
