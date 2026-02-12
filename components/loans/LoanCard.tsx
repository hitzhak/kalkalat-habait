'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LoanType } from '@/types';
import {
  Home,
  Landmark,
  UserCircle,
  CreditCard,
  FileText,
  Plus,
  Info,
  Trash2,
  Edit,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { addLoanPayment, deleteLoan } from '@/app/actions/loans';
import { toast } from 'sonner';

type Loan = {
  id: string;
  name: string;
  type: LoanType;
  originalAmount: any;
  remainingAmount: any;
  monthlyPayment: any;
  interestRate: any;
  startDate: Date;
  endDate: Date | null;
  totalPayments: number | null;
  remainingPayments: number | null;
  notes: string | null;
  isActive: boolean;
};

interface LoanCardProps {
  loan: Loan;
}

// אייקון לפי סוג ההלוואה
const getLoanIcon = (type: LoanType) => {
  switch (type) {
    case 'MORTGAGE':
      return <Home className="h-6 w-6" />;
    case 'BANK':
      return <Landmark className="h-6 w-6" />;
    case 'EXTERNAL':
      return <UserCircle className="h-6 w-6" />;
    case 'CREDIT':
      return <CreditCard className="h-6 w-6" />;
    default:
      return <FileText className="h-6 w-6" />;
  }
};

// טקסט לפי סוג ההלוואה
const getLoanTypeText = (type: LoanType) => {
  switch (type) {
    case 'MORTGAGE':
      return 'משכנתא';
    case 'BANK':
      return 'הלוואת בנק';
    case 'EXTERNAL':
      return 'חוץ בנקאי';
    case 'CREDIT':
      return 'כרטיס אשראי';
    default:
      return 'אחר';
  }
};

export function LoanCard({ loan }: LoanCardProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // טופס תשלום
  const [paymentAmount, setPaymentAmount] = useState(Number(loan.monthlyPayment).toString());
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestAmount, setInterestAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // חישוב אחוז מה שכבר שולם
  const paidPercentage =
    ((Number(loan.originalAmount) - Number(loan.remainingAmount)) / Number(loan.originalAmount)) * 100;

  // טיפול ברישום תשלום
  const handleAddPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('נא להזין סכום תשלום תקין');
      return;
    }

    setLoading(true);
    const result = await addLoanPayment(
      loan.id,
      Number(paymentAmount),
      new Date(paymentDate),
      principalAmount ? Number(principalAmount) : undefined,
      interestAmount ? Number(interestAmount) : undefined,
      paymentNotes || undefined
    );

    setLoading(false);

    if (result.success) {
      toast.success('התשלום נרשם בהצלחה');
      setPaymentDialogOpen(false);
      // איפוס הטופס
      setPaymentAmount(Number(loan.monthlyPayment).toString());
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPrincipalAmount('');
      setInterestAmount('');
      setPaymentNotes('');
    } else {
      toast.error(result.error || 'שגיאה ברישום התשלום');
    }
  };

  // טיפול במחיקת הלוואה
  const handleDeleteLoan = async () => {
    setLoading(true);
    const result = await deleteLoan(loan.id);
    setLoading(false);

    if (result.success) {
      toast.success('ההלוואה נמחקה בהצלחה');
      setDeleteDialogOpen(false);
    } else {
      toast.error(result.error || 'שגיאה במחיקת ההלוואה');
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">{getLoanIcon(loan.type)}</div>
            <div>
              <CardTitle className="text-lg">{loan.name}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {getLoanTypeText(loan.type)}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>פרטי הלוואה</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-slate-500">שם:</div>
                    <div className="font-medium">{loan.name}</div>
                    
                    <div className="text-slate-500">סוג:</div>
                    <div>{getLoanTypeText(loan.type)}</div>
                    
                    <div className="text-slate-500">סכום מקורי:</div>
                    <div>{Number(loan.originalAmount).toLocaleString('he-IL')}₪</div>
                    
                    <div className="text-slate-500">יתרה:</div>
                    <div className="font-semibold text-red-600">
                      {Number(loan.remainingAmount).toLocaleString('he-IL')}₪
                    </div>
                    
                    <div className="text-slate-500">תשלום חודשי:</div>
                    <div>{Number(loan.monthlyPayment).toLocaleString('he-IL')}₪</div>
                    
                    {loan.interestRate && (
                      <>
                        <div className="text-slate-500">ריבית:</div>
                        <div>{Number(loan.interestRate).toFixed(2)}%</div>
                      </>
                    )}
                    
                    {loan.totalPayments && (
                      <>
                        <div className="text-slate-500">סה&quot;כ תשלומים:</div>
                        <div>{loan.totalPayments}</div>
                      </>
                    )}
                    
                    {loan.remainingPayments !== null && (
                      <>
                        <div className="text-slate-500">תשלומים שנותרו:</div>
                        <div>{loan.remainingPayments}</div>
                      </>
                    )}
                    
                    <div className="text-slate-500">תאריך התחלה:</div>
                    <div>{new Date(loan.startDate).toLocaleDateString('he-IL')}</div>
                    
                    {loan.endDate && (
                      <>
                        <div className="text-slate-500">תאריך סיום:</div>
                        <div>{new Date(loan.endDate).toLocaleDateString('he-IL')}</div>
                      </>
                    )}
                  </div>
                  
                  {loan.notes && (
                    <div className="pt-3 border-t">
                      <div className="text-sm text-slate-500 mb-1">הערות:</div>
                      <p className="text-sm">{loan.notes}</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>מחיקת הלוואה</DialogTitle>
                  <DialogDescription>האם אתה בטוח שברצונך למחוק את ההלוואה? פעולה זו אינה ניתנת לביטול.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    ביטול
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteLoan} disabled={loading}>
                    {loading ? 'מוחק...' : 'מחק'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* יתרה ותשלום חודשי */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-slate-500 mb-1">יתרה</div>
            <div className="text-xl font-bold text-red-600">
              {Number(loan.remainingAmount).toLocaleString('he-IL')}₪
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500 mb-1">תשלום חודשי</div>
            <div className="text-xl font-semibold">{Number(loan.monthlyPayment).toLocaleString('he-IL')}₪</div>
          </div>
        </div>

        {/* ריבית ותשלומים שנותרו */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">ריבית: </span>
            <span className="font-medium">
              {loan.interestRate ? `${Number(loan.interestRate).toFixed(2)}%` : 'לא צוין'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">נותרו: </span>
            <span className="font-medium">
              {loan.remainingPayments !== null ? `${loan.remainingPayments} תשלומים` : 'לא צוין'}
            </span>
          </div>
        </div>

        {/* פס התקדמות */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">שולם מתוך הסכום המקורי</span>
            <span className="font-medium">{paidPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={paidPercentage} className="h-2" />
          <div className="text-xs text-slate-500 text-center">
            שולם {(Number(loan.originalAmount) - Number(loan.remainingAmount)).toLocaleString('he-IL')}₪ מתוך{' '}
            {Number(loan.originalAmount).toLocaleString('he-IL')}₪
          </div>
        </div>

        {/* כפתורים */}
        <div className="flex gap-2 pt-2">
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1" variant="default">
                <Plus className="h-4 w-4 ml-2" />
                רישום תשלום
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>רישום תשלום להלוואה</DialogTitle>
                <DialogDescription>{loan.name}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">סכום תשלום *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="סכום"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">תאריך תשלום *</Label>
                  <Input id="date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="principal">קרן (אופציונלי)</Label>
                    <Input
                      id="principal"
                      type="number"
                      value={principalAmount}
                      onChange={(e) => setPrincipalAmount(e.target.value)}
                      placeholder="סכום קרן"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interest">ריבית (אופציונלי)</Label>
                    <Input
                      id="interest"
                      type="number"
                      value={interestAmount}
                      onChange={(e) => setInterestAmount(e.target.value)}
                      placeholder="סכום ריבית"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">הערות (אופציונלי)</Label>
                  <Textarea
                    id="notes"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="הערות לתשלום"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                  ביטול
                </Button>
                <Button onClick={handleAddPayment} disabled={loading}>
                  {loading ? 'שומר...' : 'שמור תשלום'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => setDetailsDialogOpen(true)}>
            פירוט
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
