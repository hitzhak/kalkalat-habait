'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import {
  getSettings,
  updateSettings,
  getAllCategoriesForManagement,
  createCategory,
  updateCategory,
  toggleCategory,
  exportAllData,
  importData,
  resetAllData,
} from '@/app/actions/settings';
import {
  Settings,
  Save,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit2,
  Info,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { CategoryType } from '@/types';
import { Separator } from '@/components/ui/separator';

// פורמט מטבע
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SettingsPage() {
  // State for General Settings
  const [payday, setPayday] = useState(11);
  const [savingSettings, setSavingSettings] = useState(false);

  // State for Categories
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon: '',
    color: '',
    type: CategoryType.EXPENSE,
    isFixed: false,
    parentId: null as string | null,
  });

  // State for Backup/Restore
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // טעינת הגדרות
  useEffect(() => {
    loadSettings();
    loadCategories();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setPayday(settings.payday);
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בטעינת ההגדרות');
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await getAllCategoriesForManagement();
      setCategories(data);
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בטעינת הקטגוריות');
    } finally {
      setLoadingCategories(false);
    }
  };

  // שמירת הגדרות
  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await updateSettings({ payday, currency: 'ILS', startMonth: 1, weekStartDay: 0 });
      toast.success('ההגדרות נשמרו בהצלחה');
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בשמירת ההגדרות');
    } finally {
      setSavingSettings(false);
    }
  };

  // Toggle קטגוריה
  const handleToggleCategory = async (id: string) => {
    try {
      await toggleCategory(id);
      await loadCategories();
      toast.success('הקטגוריה עודכנה');
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בעדכון הקטגוריה');
    }
  };

  // פתיחת דיאלוג קטגוריה חדשה
  const handleOpenNewCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      icon: '',
      color: '',
      type: CategoryType.EXPENSE,
      isFixed: false,
      parentId: null,
    });
    setCategoryDialogOpen(true);
  };

  // פתיחת דיאלוג עריכת קטגוריה
  const handleOpenEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      icon: category.icon || '',
      color: category.color || '',
      type: category.type,
      isFixed: category.isFixed,
      parentId: category.parentId,
    });
    setCategoryDialogOpen(true);
  };

  // שמירת קטגוריה
  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryForm);
        toast.success('הקטגוריה עודכנה בהצלחה');
      } else {
        await createCategory(categoryForm);
        toast.success('הקטגוריה נוצרה בהצלחה');
      }
      setCategoryDialogOpen(false);
      await loadCategories();
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בשמירת הקטגוריה');
    }
  };

  // ייצוא גיבוי
  const handleExportBackup = async () => {
    try {
      setExporting(true);
      const result = await exportAllData();
      
      // יצירת קובץ JSON והורדה
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('הגיבוי הורד בהצלחה');
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בייצוא הגיבוי');
    } finally {
      setExporting(false);
    }
  };

  // ייבוא גיבוי
  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const text = await file.text();
      const jsonData = JSON.parse(text);

      // אישור כפול
      const confirmed = window.confirm(
        '⚠️ אזהרה: פעולה זו תחליף את כל הנתונים הקיימים!\n\nהאם אתה בטוח שברצונך להמשיך?'
      );

      if (!confirmed) {
        return;
      }

      await importData(jsonData);
      toast.success('הנתונים יובאו בהצלחה');
      
      // רענון הנתונים
      await loadSettings();
      await loadCategories();
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בייבוא הגיבוי');
    } finally {
      setImporting(false);
      // איפוס input
      event.target.value = '';
    }
  };

  // איפוס נתונים
  const handleResetData = async () => {
    try {
      await resetAllData();
      toast.success('כל הנתונים אופסו בהצלחה');
      setResetDialogOpen(false);
      
      // רענון הנתונים
      await loadSettings();
      await loadCategories();
    } catch (error: any) {
      toast.error(error.message || 'שגיאה באיפוס הנתונים');
    }
  };

  // קבלת קטגוריות ראשיות לסלקט
  const parentCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* כותרת ראשית */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          הגדרות
        </h1>
        <p className="text-muted-foreground mt-1">ניהול הגדרות האפליקציה והנתונים</p>
      </div>

      {/* 1. הגדרות כלליות */}
      <Card>
        <CardHeader>
          <CardTitle>הגדרות כלליות</CardTitle>
          <CardDescription>הגדרות בסיסיות של האפליקציה</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payday">יום המשכורת</Label>
            <div className="flex items-center gap-4">
              <Input
                id="payday"
                type="number"
                min="1"
                max="31"
                value={payday}
                onChange={(e) => setPayday(parseInt(e.target.value) || 11)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                יום בחודש שבו מתקבלת המשכורת (ברירת מחדל: 11)
              </span>
            </div>
          </div>

          <Button onClick={handleSaveSettings} disabled={savingSettings}>
            {savingSettings ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                שמור הגדרות
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 2. ניהול קטגוריות */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ניהול קטגוריות</CardTitle>
              <CardDescription>הוסף, ערוך או הפעל/כבה קטגוריות</CardDescription>
            </div>
            <Button onClick={handleOpenNewCategory}>
              <Plus className="ml-2 h-4 w-4" />
              קטגוריה חדשה
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingCategories ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {categories.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  אין קטגוריות להצגה
                </p>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                        style={{
                          backgroundColor: category.color || '#0891B2',
                        }}
                      >
                        {category.icon ? (
                          <span className="text-lg">{category.icon}</span>
                        ) : (
                          <span className="text-lg">📁</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{category.name}</span>
                          {category.isDefault && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              מערכת
                            </span>
                          )}
                          {category.parentName && (
                            <span className="text-xs text-muted-foreground">
                              ← {category.parentName}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {category.type === CategoryType.INCOME ? 'הכנסה' : 'הוצאה'} •{' '}
                          {category.transactionCount} עסקאות •{' '}
                          {category.budgetItemCount} תקציבים
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!category.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditCategory(category)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={category.isActive}
                          onCheckedChange={() => handleToggleCategory(category.id)}
                          disabled={category.isDefault && !category.isActive}
                        />
                        <span className="text-sm text-muted-foreground w-12">
                          {category.isActive ? 'פעיל' : 'כבוי'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog לעריכת/יצירת קטגוריה */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'עריכת קטגוריה' : 'קטגוריה חדשה'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'ערוך את פרטי הקטגוריה'
                : 'הוסף קטגוריה חדשה למערכת'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">שם הקטגוריה *</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="לדוגמה: אוכל ומכולת"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-icon">אייקון (אופציונלי)</Label>
              <Input
                id="category-icon"
                value={categoryForm.icon}
                onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                placeholder="לדוגמה: 🛒 או ShoppingCart"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-color">צבע (HEX) (אופציונלי)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="category-color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  placeholder="#0891B2"
                />
                {categoryForm.color && (
                  <div
                    className="w-10 h-10 rounded border"
                    style={{ backgroundColor: categoryForm.color }}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-type">סוג</Label>
              <select
                id="category-type"
                value={categoryForm.type}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, type: e.target.value as CategoryType })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value={CategoryType.INCOME}>הכנסה</option>
                <option value={CategoryType.EXPENSE}>הוצאה</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={categoryForm.isFixed}
                onCheckedChange={(checked) =>
                  setCategoryForm({ ...categoryForm, isFixed: checked })
                }
              />
              <Label htmlFor="category-fixed">הוצאה/הכנסה קבועה</Label>
            </div>

            {parentCategories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="category-parent">קטגוריית אב (אופציונלי)</Label>
                <select
                  id="category-parent"
                  value={categoryForm.parentId || ''}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      parentId: e.target.value || null,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">ללא קטגוריית אב</option>
                  {parentCategories
                    .filter((c) => c.type === categoryForm.type)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSaveCategory} disabled={!categoryForm.name}>
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. גיבוי ושחזור */}
      <Card>
        <CardHeader>
          <CardTitle>גיבוי ושחזור</CardTitle>
          <CardDescription>
            ייצא את כל הנתונים לגיבוי או ייבא נתונים מקובץ גיבוי
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleExportBackup} disabled={exporting} variant="outline">
              {exporting ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מייצא...
                </>
              ) : (
                <>
                  <Download className="ml-2 h-4 w-4" />
                  ייצוא גיבוי
                </>
              )}
            </Button>

            <label>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                disabled={importing}
                className="hidden"
              />
              <Button
                asChild
                variant="outline"
                disabled={importing}
                className="w-full sm:w-auto"
              >
                <span>
                  {importing ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      מייבא...
                    </>
                  ) : (
                    <>
                      <Upload className="ml-2 h-4 w-4" />
                      ייבוא גיבוי
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>

          <Separator />

          <div>
            <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="ml-2 h-4 w-4" />
                  איפוס כל הנתונים
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>⚠️ אזהרה: איפוס נתונים</AlertDialogTitle>
                  <AlertDialogDescription>
                    פעולה זו תמחק את כל הנתונים במערכת:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>כל העסקאות</li>
                      <li>כל התקציבים</li>
                      <li>כל מטרות החיסכון</li>
                      <li>כל ההלוואות</li>
                      <li>קטגוריות מותאמות אישית</li>
                    </ul>
                    <strong className="block mt-3">
                      פעולה זו לא ניתנת לביטול!
                    </strong>
                    האם אתה בטוח שברצונך להמשיך?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetData} className="bg-destructive">
                    מחק הכל
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* 4. אודות */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            אודות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">כלכלת הבית v1.0</h3>
            <p className="text-muted-foreground mt-1">
              נבנה עם ❤️ לניהול תקציב משפחתי
            </p>
          </div>
          <Separator />
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>תכונות עיקריות:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>ניהול הכנסות והוצאות</li>
              <li>תקציב חודשי מפורט</li>
              <li>מטרות חיסכון</li>
              <li>ניהול הלוואות</li>
              <li>דוחות וניתוחים</li>
              <li>גיבוי ושחזור נתונים</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
