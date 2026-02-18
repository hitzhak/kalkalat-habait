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
  getSettingsPageData,
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
  ChevronDown,
  ChevronLeft,
  ChevronsUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { CategoryType } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BudgetAllocation } from '@/components/settings/BudgetAllocation';

// פורמט מטבע
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Reusable type for category data
type CategoryData = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: string;
  isFixed: boolean;
  isDefault: boolean;
  isActive: boolean;
  parentId: string | null;
  parentName: string | null;
  sortOrder: number;
  transactionCount: number;
  budgetItemCount: number;
};

function CategoryRow({
  category,
  onEdit,
  onToggleActive,
  indent,
}: {
  category: CategoryData;
  onEdit: (cat: CategoryData) => void;
  onToggleActive: (id: string) => void;
  indent: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-accent/50 transition-colors gap-2 ${
        indent ? 'mr-4 sm:mr-6 border-dashed' : ''
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div
          className={`${indent ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-10 sm:h-10'} rounded-full flex items-center justify-center text-white shrink-0`}
          style={{ backgroundColor: category.color || '#0891B2' }}
        >
          {category.icon ? (
            <span className={indent ? 'text-xs sm:text-sm' : 'text-sm sm:text-lg'}>{category.icon}</span>
          ) : (
            <span className={indent ? 'text-xs sm:text-sm' : 'text-sm sm:text-lg'}>📁</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className={`font-medium truncate ${indent ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>{category.name}</span>
            {category.isDefault && (
              <span className="text-[10px] sm:text-xs bg-muted px-1.5 sm:px-2 py-0.5 rounded shrink-0">מערכת</span>
            )}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">
            {category.transactionCount} עסקאות • {category.budgetItemCount} תקציבים
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {!category.isDefault && (
          <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0" onClick={() => onEdit(category)}>
            <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        )}
        <Switch
          checked={category.isActive}
          onCheckedChange={() => onToggleActive(category.id)}
          disabled={category.isDefault && !category.isActive}
          className="scale-90 sm:scale-100"
        />
      </div>
    </div>
  );
}

function CategoryGroup({
  parent,
  children,
  isOpen,
  onToggleOpen,
  onEdit,
  onToggleActive,
}: {
  parent: CategoryData;
  children: CategoryData[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onEdit: (cat: CategoryData) => void;
  onToggleActive: (id: string) => void;
}) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggleOpen}>
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-2 sm:p-3 bg-muted/30 hover:bg-muted/50 transition-colors gap-2">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 text-right">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: parent.color || '#0891B2' }}
              >
                {parent.icon ? (
                  <span className="text-sm sm:text-lg">{parent.icon}</span>
                ) : (
                  <span className="text-sm sm:text-lg">📁</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="font-semibold truncate text-sm sm:text-base">{parent.name}</span>
                  {children.length > 0 && (
                    <span className="text-[10px] sm:text-xs bg-primary/10 text-primary px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                      {children.length}
                    </span>
                  )}
                  {parent.isDefault && (
                    <span className="text-[10px] sm:text-xs bg-muted px-1.5 sm:px-2 py-0.5 rounded shrink-0">מערכת</span>
                  )}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">
                  {parent.isFixed ? 'קבועה' : 'משתנה'} • {parent.transactionCount} עסקאות
                </div>
              </div>
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {!parent.isDefault && (
              <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0" onClick={() => onEdit(parent)}>
                <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            )}
            <Switch
              checked={parent.isActive}
              onCheckedChange={() => onToggleActive(parent.id)}
              disabled={parent.isDefault && !parent.isActive}
              className="scale-90 sm:scale-100"
            />
          </div>
        </div>
        <CollapsibleContent>
          {children.length > 0 && (
            <div className="p-1.5 sm:p-2 space-y-1 bg-background">
              {children.map((child) => (
                <CategoryRow
                  key={child.id}
                  category={child}
                  onEdit={onEdit}
                  onToggleActive={onToggleActive}
                  indent={true}
                />
              ))}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function SettingsPage() {
  // State for General Settings
  const [payday, setPayday] = useState(11);
  const [savingSettings, setSavingSettings] = useState(false);

  // State for Categories
  const [categories, setCategories] = useState<Array<{
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    type: string;
    isFixed: boolean;
    isDefault: boolean;
    isActive: boolean;
    parentId: string | null;
    parentName: string | null;
    sortOrder: number;
    transactionCount: number;
    budgetItemCount: number;
  }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<typeof categories[number] | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon: '',
    color: '',
    type: CategoryType.EXPENSE,
    isFixed: false,
    parentId: null as string | null,
    sortOrder: 0,
  });

  // Derived: parent categories (for collapsible groups and parent selector)
  const parentCategories = categories.filter((c) => !c.parentId);

  // Build child map for grouped display
  const childrenByParent = categories.reduce<Record<string, typeof categories>>((acc, cat) => {
    if (cat.parentId) {
      if (!acc[cat.parentId]) acc[cat.parentId] = [];
      acc[cat.parentId].push(cat);
    }
    return acc;
  }, {});

  const incomeParents = parentCategories.filter((c) => c.type === CategoryType.INCOME);
  const expenseParents = parentCategories.filter((c) => c.type === CategoryType.EXPENSE);

  // Orphan children (parent was filtered out or child has no matching parent in list)
  const incomeOrphans = categories.filter(
    (c) => c.parentId && c.type === CategoryType.INCOME && !parentCategories.find((p) => p.id === c.parentId)
  );
  const expenseOrphans = categories.filter(
    (c) => c.parentId && c.type === CategoryType.EXPENSE && !parentCategories.find((p) => p.id === c.parentId)
  );

  // State for collapsible categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(parentCategories.map((c) => c.id)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // State for Backup/Restore
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // טעינה מאוחדת של כל נתוני ההגדרות (2 round-trips → 1)
  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      setLoadingCategories(true);
      const { settings, categories: cats } = await getSettingsPageData();
      setPayday(settings.payday);
      setCategories(cats);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בטעינת ההגדרות';
      toast.error(message);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await getAllCategoriesForManagement();
      setCategories(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בטעינת הקטגוריות';
      toast.error(message);
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בשמירת ההגדרות';
      toast.error(message);
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בעדכון הקטגוריה';
      toast.error(message);
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
      sortOrder: 0,
    });
    setCategoryDialogOpen(true);
  };

  // פתיחת דיאלוג עריכת קטגוריה
  const handleOpenEditCategory = (category: typeof categories[number]) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      icon: category.icon || '',
      color: category.color || '',
      type: category.type as CategoryType,
      isFixed: category.isFixed,
      parentId: category.parentId,
      sortOrder: category.sortOrder || 0,
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בשמירת הקטגוריה';
      toast.error(message);
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בייצוא הגיבוי';
      toast.error(message);
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
      await loadAllSettings();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בייבוא הגיבוי';
      toast.error(message);
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
      await loadAllSettings();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה באיפוס הנתונים';
      toast.error(message);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      {/* כותרת ראשית */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 sm:h-8 sm:w-8 shrink-0" />
          הגדרות
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">ניהול הגדרות האפליקציה והנתונים</p>
      </div>

      {/* 1. הגדרות כלליות */}
      <Card>
        <CardHeader>
          <CardTitle>הגדרות כלליות</CardTitle>
          <CardDescription>הגדרות בסיסיות של האפליקציה</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payday">יום חיוב הוצאות קבועות</Label>
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
                ברירת מחדל: 11
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              ביום זה מחויבות כל ההוצאות הקבועות (משכנתא, ביטוחים, חוגים וכו&apos;).
              ההכנסות (משכורות, קצבאות) מגיעות לפני תאריך זה.
              המערכת מחשבת את היתרה הפנויה להוצאות משתנות לפי הנוסחה:
              הכנסות &minus; הוצאות קבועות = נותר להוצאות שבועיות.
            </p>
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

      {/* 2. תקציב חודשי */}
      <BudgetAllocation />

      {/* 3. ניהול קטגוריות */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>ניהול קטגוריות</CardTitle>
              <CardDescription>הוסף, ערוך או הפעל/כבה קטגוריות</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={expandedCategories.size > 0 ? collapseAll : expandAll}>
                <ChevronsUpDown className="ml-1 h-4 w-4" />
                {expandedCategories.size > 0 ? 'כווץ הכל' : 'הרחב הכל'}
              </Button>
              <Button size="sm" onClick={handleOpenNewCategory}>
                <Plus className="ml-1 h-4 w-4" />
                קטגוריה חדשה
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingCategories ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              אין קטגוריות להצגה
            </p>
          ) : (
            <Tabs defaultValue="expenses" className="w-full">
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="expenses">
                  הוצאות ({expenseParents.length})
                </TabsTrigger>
                <TabsTrigger value="income">
                  הכנסות ({incomeParents.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="expenses">
                <div className="space-y-2">
                  {expenseParents.map((parent) => {
                    const children = childrenByParent[parent.id] || [];
                    return (
                      <CategoryGroup
                        key={parent.id}
                        parent={parent}
                        children={children}
                        isOpen={expandedCategories.has(parent.id)}
                        onToggleOpen={() => toggleExpanded(parent.id)}
                        onEdit={handleOpenEditCategory}
                        onToggleActive={handleToggleCategory}
                      />
                    );
                  })}
                  {expenseOrphans.map((cat) => (
                    <CategoryRow key={cat.id} category={cat} onEdit={handleOpenEditCategory} onToggleActive={handleToggleCategory} indent={false} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="income">
                <div className="space-y-2">
                  {incomeParents.map((parent) => {
                    const children = childrenByParent[parent.id] || [];
                    return (
                      <CategoryGroup
                        key={parent.id}
                        parent={parent}
                        children={children}
                        isOpen={expandedCategories.has(parent.id)}
                        onToggleOpen={() => toggleExpanded(parent.id)}
                        onEdit={handleOpenEditCategory}
                        onToggleActive={handleToggleCategory}
                      />
                    );
                  })}
                  {incomeOrphans.map((cat) => (
                    <CategoryRow key={cat.id} category={cat} onEdit={handleOpenEditCategory} onToggleActive={handleToggleCategory} indent={false} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Dialog לעריכת/יצירת קטגוריה */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[500px]">
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
