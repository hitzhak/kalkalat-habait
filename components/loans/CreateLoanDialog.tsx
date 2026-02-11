'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { createLoan } from '@/app/actions/loans';
import { toast } from 'sonner';
import { LoanType } from '@/types';

export function CreateLoanDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // שדות הטופס
  const [name, setName] = useState('');
  const [type, setType] = useState<LoanType>(LoanType.BANK);
  const [originalAmount, setOriginalAmount] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [totalPayments, setTotalPayments] = useState('');
  const [notes, setNotes] = useState('');

  // איפוס הטופס
  const resetForm = () => {
    setName('');
    setType(LoanType.BANK);
    setOriginalAmount('');
    setMonthlyPayment('');
    setInterestRate('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setTotalPayments('');
    setNotes('');
  };

  // שמירת הלוואה
  const handleSubmit = async () => {
    // ולידציה בסיסית
    if (!name.trim()) {
      toast.error('נא להזין שם להלוואה');
      return;
    }
    if (!originalAmount || Number(originalAmount) <= 0) {
      toast.error('נא להזין סכום מקורי תקין');
      return;
    }
    if (!monthlyPayment || Number(monthlyPayment) <= 0) {
      toast.error('נא להזין תשלום חודשי תקין');
      return;
    }

    setLoading(true);

    const result = await createLoan({
      name: name.trim(),
      type,
      originalAmount: Number(originalAmount),
      monthlyPayment: Number(monthlyPayment),
      interestRate: interestRate ? Number(interestRate) : undefined,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      totalPayments: totalPayments ? Number(totalPayments) : undefined,
      notes: notes.trim() || undefined,
    });

    setLoading(false);

    if (result.success) {
      toast.success('ההלוואה נוספה בהצלחה');
      resetForm();
      setOpen(false);
    } else {
      toast.error(result.error || 'שגיאה בהוספת ההלוואה');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          הלוואה חדשה
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>הוספת הלוואה חדשה</DialogTitle>
          <DialogDescription>הזן את פרטי ההלוואה, המשכנתא או החוב</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* שם ההלוואה */}
          <div className="space-y-2">
            <Label htmlFor="name">שם ההלוואה *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='לדוגמה: "משכנתא - בנק הפועלים"'
            />
          </div>

          {/* סוג ההלוואה */}
          <div className="space-y-2">
            <Label htmlFor="type">סוג ההלוואה *</Label>
            <Select value={type} onValueChange={(value) => setType(value as LoanType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MORTGAGE">משכנתא</SelectItem>
                <SelectItem value="BANK">הלוואת בנק</SelectItem>
                <SelectItem value="EXTERNAL">חוץ בנקאי</SelectItem>
                <SelectItem value="CREDIT">כרטיס אשראי</SelectItem>
                <SelectItem value="OTHER">אחר</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* שורה: סכום מקורי + תשלום חודשי */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originalAmount">סכום מקורי *</Label>
              <Input
                id="originalAmount"
                type="number"
                value={originalAmount}
                onChange={(e) => setOriginalAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyPayment">תשלום חודשי *</Label>
              <Input
                id="monthlyPayment"
                type="number"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* שורה: ריבית + מספר תשלומים */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interestRate">ריבית שנתית (%) - אופציונלי</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="לדוגמה: 3.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalPayments">מספר תשלומים - אופציונלי</Label>
              <Input
                id="totalPayments"
                type="number"
                value={totalPayments}
                onChange={(e) => setTotalPayments(e.target.value)}
                placeholder="לדוגמה: 240"
              />
            </div>
          </div>

          {/* שורה: תאריך התחלה + תאריך סיום */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">תאריך התחלה *</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">תאריך סיום - אופציונלי</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* הערות */}
          <div className="space-y-2">
            <Label htmlFor="notes">הערות - אופציונלי</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערות או פרטים נוספים על ההלוואה"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            ביטול
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'שומר...' : 'שמור הלוואה'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
