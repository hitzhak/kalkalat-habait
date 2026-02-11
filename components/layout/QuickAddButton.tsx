'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuickAddButton() {
  const handleClick = () => {
    console.log('open quick add');
  };

  return (
    <Button
      onClick={handleClick}
      size="icon"
      className="fixed bottom-20 left-4 z-50 h-14 w-14 rounded-full shadow-lg md:bottom-6 md:right-6 md:left-auto"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
