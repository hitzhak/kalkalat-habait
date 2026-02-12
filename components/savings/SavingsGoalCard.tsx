"use client";

import { useState } from "react";
import { SavingsGoal } from "@/types";
import * as Icons from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { addDeposit, deleteSavingsGoal } from "@/app/actions/savings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface SavingsGoalCardProps {
  goal: SavingsGoal;
}

export function SavingsGoalCard({ goal }: SavingsGoalCardProps) {
  const { toast } = useToast();
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDate, setDepositDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [depositNotes, setDepositNotes] = useState("");

  // חישוב אחוז התקדמות
  const progress = Math.min(
    (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100,
    100
  );

  // חישוב סכום נותר
  const remaining = Math.max(
    Number(goal.targetAmount) - Number(goal.currentAmount),
    0
  );

  // חישוב סכום חודשי נדרש
  const calculateMonthlyRequired = () => {
    if (!goal.targetDate) return null;

    const now = new Date();
    const target = new Date(goal.targetDate);
    const monthsRemaining = Math.max(
      Math.ceil(
        (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
      ),
      1
    );

    return Math.ceil(remaining / monthsRemaining);
  };

  const monthlyRequired = calculateMonthlyRequired();

  // בחירת אייקון
  const IconComponent =
    (Icons[goal.icon as keyof typeof Icons] as React.ComponentType<any>) ||
    Icons.Target;

  // טיפול בהפקדה
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!depositAmount || Number(depositAmount) <= 0) {
      toast({
        title: "שגיאה",
        description: "יש להזין סכום תקין",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await addDeposit({
        goalId: goal.id,
        amount: Number(depositAmount),
        date: new Date(depositDate),
        notes: depositNotes || undefined,
      });

      toast({
        title: "הפקדה נוספה בהצלחה",
        description: `הופקדו ${Number(depositAmount).toLocaleString("he-IL")}₪`,
      });

      setIsDepositOpen(false);
      setDepositAmount("");
      setDepositNotes("");
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להוסיף הפקדה",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // טיפול במחיקה
  const handleDelete = async () => {
    setIsLoading(true);

    try {
      await deleteSavingsGoal(goal.id);

      toast({
        title: "מטרה נמחקה",
        description: "מטרת החיסכון נמחקה בהצלחה",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את המטרה",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* כותרת */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-lg"
              style={{
                backgroundColor: `${goal.color}20`,
                color: goal.color || "#0891B2",
              }}
            >
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800">
                {goal.name}
              </h3>
              {goal.isCompleted && (
                <span className="text-sm text-emerald-600 font-medium">
                  ✓ הושלמה
                </span>
              )}
            </div>
          </div>

          {/* תפריט פעולות */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-slate-400">
                <Icons.Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>מחיקת מטרת חיסכון</AlertDialogTitle>
                <AlertDialogDescription>
                  האם אתה בטוח שברצונך למחוק את המטרה &quot;{goal.name}&quot;? פעולה זו
                  תמחק גם את כל ההפקדות הקשורות אליה.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ביטול</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600"
                >
                  מחק
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* פס התקדמות */}
        <div className="space-y-2">
          <Progress
            value={progress}
            className="h-3"
            style={
              {
                "--progress-background": goal.color || "#0891B2",
              } as React.CSSProperties
            }
          />
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-slate-700">
              {Number(goal.currentAmount).toLocaleString("he-IL")}₪ מתוך{" "}
              {Number(goal.targetAmount).toLocaleString("he-IL")}₪
            </span>
            <span className="text-slate-500">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* פרטים נוספים */}
        <div className="space-y-2 text-sm">
          {goal.targetDate && (
            <div className="flex items-center gap-2 text-slate-600">
              <Icons.Calendar className="w-4 h-4" />
              <span>
                יעד:{" "}
                {format(new Date(goal.targetDate), "MMMM yyyy", { locale: he })}
              </span>
            </div>
          )}

          {monthlyRequired && monthlyRequired > 0 && !goal.isCompleted && (
            <div className="flex items-center gap-2 text-slate-600">
              <Icons.TrendingUp className="w-4 h-4" />
              <span>
                נדרש: {monthlyRequired.toLocaleString("he-IL")}₪/חודש
              </span>
            </div>
          )}

          {goal.isCompleted && (
            <div className="flex items-center gap-2 text-emerald-600">
              <Icons.CheckCircle2 className="w-4 h-4" />
              <span>מטרה הושגה! 🎉</span>
            </div>
          )}
        </div>

        {/* כפתור הפקדה */}
        {!goal.isCompleted && (
          <Sheet open={isDepositOpen} onOpenChange={setIsDepositOpen}>
            <SheetTrigger asChild>
              <Button
                className="w-full"
                style={{
                  backgroundColor: goal.color || "#0891B2",
                }}
              >
                <Icons.Plus className="w-4 h-4 ml-2" />
                הפקדה
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh]">
              <SheetHeader>
                <SheetTitle>הוספת הפקדה - {goal.name}</SheetTitle>
                <SheetDescription>
                  הזן את סכום ההפקדה והתאריך
                </SheetDescription>
              </SheetHeader>

              <form onSubmit={handleDeposit} className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">סכום (₪)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="text-lg"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">תאריך</Label>
                  <Input
                    id="date"
                    type="date"
                    value={depositDate}
                    onChange={(e) => setDepositDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">הערות (אופציונלי)</Label>
                  <Textarea
                    id="notes"
                    placeholder="הערות על ההפקדה..."
                    value={depositNotes}
                    onChange={(e) => setDepositNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsDepositOpen(false)}
                  >
                    ביטול
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading}
                    style={{
                      backgroundColor: goal.color || "#0891B2",
                    }}
                  >
                    {isLoading ? "מוסיף..." : "הוסף הפקדה"}
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </Card>
  );
}
