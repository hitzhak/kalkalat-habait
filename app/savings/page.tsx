import { getSavingsGoals } from "@/app/actions/savings";
import { SavingsGoalCard } from "@/components/savings/SavingsGoalCard";
import { DbConnectionError } from "@/components/DbConnectionError";

export const revalidate = 30;

import { CreateGoalDialog } from "@/components/savings/CreateGoalDialog";
import { Target } from "lucide-react";

export default async function SavingsPage() {
  try {
    const goals = await getSavingsGoals();

    return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">מטרות חיסכון</h1>
          <p className="text-slate-600 mt-1">עקוב אחר יעדי החיסכון שלך</p>
        </div>

        <CreateGoalDialog />
      </div>

      {/* Grid של מטרות */}
      {goals.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in-up animate-delay-1">
          {goals.map((goal) => (
            <SavingsGoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      ) : (
        // Empty state
        <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in-up animate-delay-1">
          <div className="w-24 h-24 bg-cyan-50 rounded-full flex items-center justify-center mb-6">
            <Target className="w-12 h-12 text-cyan-600" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">
            אין עדיין מטרות חיסכון
          </h2>
          <p className="text-slate-600 text-center max-w-md mb-6">
            התחל לחסוך למטרות שחשובות לך - טיול משפחתי, רכב חדש, קרן חירום או כל
            יעד אחר
          </p>
          <CreateGoalDialog />
        </div>
      )}

      {/* סיכום כללי */}
      {goals.length > 0 && (
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-100 animate-fade-in-up animate-delay-2">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            סיכום חיסכון
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-600">סה&quot;כ מטרות</p>
              <p className="text-2xl font-bold text-slate-800">
                {goals.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">סה&quot;כ נחסך</p>
              <p className="text-2xl font-bold text-emerald-600">
                {goals
                  .reduce((sum, g) => sum + Number(g.currentAmount), 0)
                  .toLocaleString("he-IL")}
                ₪
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">יעד כולל</p>
              <p className="text-2xl font-bold text-cyan-600">
                {goals
                  .reduce((sum, g) => sum + Number(g.targetAmount), 0)
                  .toLocaleString("he-IL")}
                ₪
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  } catch {
    return <DbConnectionError />;
  }
}
