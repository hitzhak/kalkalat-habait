'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TransactionForm } from '@/components/transactions/TransactionForm';

export function QuickAddButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:bottom-6 md:right-6 hover:scale-110 active:scale-95 transition-transform duration-200 animate-in fade-in zoom-in"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <TransactionForm open={open} onOpenChange={setOpen} />
    </>
  );
}
