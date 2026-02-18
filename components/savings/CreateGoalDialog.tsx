"use client";

import { useState } from "react";
import { createSavingsGoal } from "@/app/actions/savings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as Icons from "lucide-react";

// אייקונים אפשריים למטרות
const AVAILABLE_ICONS = [
  { name: "Target", label: "יעד" },
  { name: "Plane", label: "טיול" },
  { name: "Car", label: "רכב" },
  { name: "Home", label: "דירה" },
  { name: "Heart", label: "חתונה" },
  { name: "Baby", label: "תינוק" },
  { name: "GraduationCap", label: "לימודים" },
  { name: "Laptop", label: "מחשב" },
  { name: "Smartphone", label: "טלפון" },
  { name: "Gift", label: "מתנה" },
  { name: "Wallet", label: "קרן חירום" },
  { name: "Bike", label: "אופניים" },
];

// צבעים אפשריים
const AVAILABLE_COLORS = [
  { value: "#0891B2", label: "כחול" },
  { value: "#10B981", label: "ירוק" },
  { value: "#F59E0B", label: "כתום" },
  { value: "#EF4444", label: "אדום" },
  { value: "#8B5CF6", label: "סגול" },
  { value: "#EC4899", label: "ורוד" },
  { value: "#6366F1", label: "אינדיגו" },
  { value: "#14B8A6", label: "טורקיז" },
];

export function CreateGoalDialog() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Target");
  const [selectedColor, setSelectedColor] = useState("#0891B2");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !targetAmount || Number(targetAmount) <= 0) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות הנדרשים",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await createSavingsGoal({
        name,
        targetAmount: Number(targetAmount),
        targetDate: targetDate ? new Date(targetDate) : null,
        icon: selectedIcon,
        color: selectedColor,
      });

      toast({
        title: "מטרה נוצרה בהצלחה",
        description: `מטרת החיסכון "${name}" נוצרה`,
      });

      // איפוס הטופס
      setName("");
      setTargetAmount("");
      setTargetDate("");
      setSelectedIcon("Target");
      setSelectedColor("#0891B2");
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן ליצור מטרת חיסכון",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="w-4 h-4 ml-2" />
          מטרה חדשה
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>יצירת מטרת חיסכון חדשה</DialogTitle>
          <DialogDescription>
            הגדר מטרת חיסכון חדשה ועקוב אחר ההתקדמות שלך
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* שם המטרה */}
          <div className="space-y-2">
            <Label htmlFor="name">שם המטרה *</Label>
            <Input
              id="name"
              placeholder="למשל: טיול משפחתי, רכב חדש..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* סכום יעד */}
          <div className="space-y-2">
            <Label htmlFor="target">סכום יעד (₪) *</Label>
            <Input
              id="target"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </div>

          {/* תאריך יעד */}
          <div className="space-y-2">
            <Label htmlFor="date">תאריך יעד (אופציונלי)</Label>
            <Input
              id="date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              המערכת תחשב אוטומטית את ההפקדה החודשית הנדרשת
            </p>
          </div>

          {/* בחירת אייקון */}
          <div className="space-y-3">
            <Label>אייקון</Label>
            <div className="grid grid-cols-6 gap-2">
              {AVAILABLE_ICONS.map((icon) => {
                const IconComponent = Icons[
                  icon.name as keyof typeof Icons
                ] as React.ComponentType<any>;
                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => setSelectedIcon(icon.name)}
                    className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                      selectedIcon === icon.name
                        ? "border-cyan-600 bg-cyan-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    title={icon.label}
                  >
                    <IconComponent className="w-6 h-6 mx-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* בחירת צבע */}
          <div className="space-y-3">
            <Label>צבע</Label>
            <div className="flex gap-2 flex-wrap">
              {AVAILABLE_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                    selectedColor === color.value
                      ? "border-slate-800 ring-2 ring-slate-300"
                      : "border-slate-200"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* תצוגה מקדימה */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-sm text-slate-600 mb-3">תצוגה מקדימה:</p>
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: `${selectedColor}20`,
                  color: selectedColor,
                }}
              >
                {(() => {
                  const IconComponent = Icons[
                    selectedIcon as keyof typeof Icons
                  ] as React.ComponentType<any>;
                  return <IconComponent className="w-6 h-6" />;
                })()}
              </div>
              <div>
                <p className="font-semibold text-slate-800">
                  {name || "שם המטרה"}
                </p>
                <p className="text-sm text-slate-600">
                  יעד:{" "}
                  {targetAmount
                    ? `₪${Number(targetAmount).toLocaleString("he-IL")}`
                    : "₪0"}
                </p>
              </div>
            </div>
          </div>

          {/* כפתורים */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              disabled={isLoading}
            >
              {isLoading ? "יוצר..." : "צור מטרה"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
