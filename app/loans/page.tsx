import { getLoans, getLoansSummary } from '@/app/actions/loans';
import { LoanCard } from '@/components/loans/LoanCard';
import { DbConnectionError } from '@/components/DbConnectionError';
import { Loan } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingDown, Wallet } from 'lucide-react';
import { CreateLoanDialog } from '@/components/loans/CreateLoanDialog';

export const revalidate = 30;

export default async function LoansPage() {
  try {
    const [loansResult, summaryResult] = await Promise.all([getLoans(), getLoansSummary()]);

    const loans = (loansResult.success ? loansResult.data : []) || [];
    const summary = summaryResult.success ? summaryResult.data : null;

    return (
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex justify-between items-center animate-fade-in-up">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">הלוואות וחובות</h1>
          <p className="text-slate-500 mt-1">ניהול הלוואות, משכנתאות ותשלומים</p>
        </div>
        <CreateLoanDialog />
      </div>

      {/* סיכום עליון */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up animate-delay-1">
          {/* סה"כ חובות */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                סה&quot;כ חובות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-3xl font-bold text-red-600">
                {summary.totalDebt.toLocaleString('he-IL')}₪
              </div>
              <p className="text-xs text-slate-500 mt-1">{summary.loansCount} הלוואות פעילות</p>
            </CardContent>
          </Card>

          {/* תשלום חודשי כולל */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                תשלום חודשי כולל
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-3xl font-bold">{summary.totalMonthlyPayment.toLocaleString('he-IL')}₪</div>
              <p className="text-xs text-slate-500 mt-1">סכום כולל לתשלום חודשי</p>
            </CardContent>
          </Card>

          {/* צפי סיום */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                צפי סיום כל החובות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">
                {summary.estimatedEndDate
                  ? new Date(summary.estimatedEndDate).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: 'long',
                    })
                  : 'לא צוין'}
              </div>
              <p className="text-xs text-slate-500 mt-1">תאריך סיום משוער</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* רשימת הלוואות */}
      <div className="animate-fade-in-up animate-delay-2">
        <h2 className="text-xl font-semibold mb-4">ההלוואות שלי</h2>
        {loans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-slate-400 mb-4">
                <TrendingDown className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">אין הלוואות רשומות</h3>
              <p className="text-slate-500 mb-4">התחל לנהל את ההלוואות שלך על ידי הוספת הלוואה ראשונה</p>
              <CreateLoanDialog />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loans.map((loan: Loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
  } catch {
    return <DbConnectionError />;
  }
}
