'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ImportPreview } from '@/components/import/ImportPreview';

import { getSourceLabels } from '@/app/actions/import';
import { confirmImport } from '@/app/actions/import';
import { getCategoryTree } from '@/app/actions/categories';
import { ImportPreviewData, ImportRow, ImportFileType } from '@/types';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'type' | 'upload' | 'preview' | 'confirm';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const FILE_TYPES: { value: ImportFileType; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    value: 'excel',
    label: 'Excel / CSV',
    icon: <FileSpreadsheet className="h-8 w-8" />,
    desc: 'מומלץ — דיוק מקסימלי',
  },
  {
    value: 'pdf',
    label: 'PDF',
    icon: <FileText className="h-8 w-8" />,
    desc: 'דיוק גבוה (~98%)',
  },
  {
    value: 'screenshot',
    label: 'צילום מסך',
    icon: <ImageIcon className="h-8 w-8" />,
    desc: 'דיוק נמוך יותר',
  },
];

const ACCEPT_MAP: Record<ImportFileType, string> = {
  excel: '.xlsx,.xls,.csv',
  pdf: '.pdf',
  screenshot: '.png,.jpg,.jpeg',
};

export function ImportDialog({ open, onOpenChange, onSuccess }: ImportDialogProps) {
  const [step, setStep] = useState<Step>('type');
  const [fileType, setFileType] = useState<ImportFileType>('excel');
  const [file, setFile] = useState<File | null>(null);
  const [sourceLabel, setSourceLabel] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [savedLabels, setSavedLabels] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; type: string; children?: { id: string; name: string }[] }>
  >([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (open) {
      getSourceLabels().then(setSavedLabels).catch(() => {});
      getCategoryTree().then((cats) => {
        setCategories(
          cats.map((c: any) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            children: c.children?.map((s: any) => ({ id: s.id, name: s.name })),
          }))
        );
      }).catch(() => {});
    }
  }, [open]);

  const resetState = useCallback(() => {
    setStep('type');
    setFileType('excel');
    setFile(null);
    setSourceLabel('');
    setCustomLabel('');
    setIsProcessing(false);
    setPreviewData(null);
    setIsImporting(false);
  }, []);

  const handleClose = (val: boolean) => {
    if (!val) resetState();
    onOpenChange(val);
  };

  const effectiveLabel = sourceLabel === '__custom__' ? customLabel.trim() : sourceLabel;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleProcess = async () => {
    if (!file || !effectiveLabel) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sourceLabel', effectiveLabel);
      formData.append('fileType', fileType);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'שגיאה בעיבוד הקובץ');
      }

      setPreviewData(result);
      setStep('preview');

      if (result.aiError) {
        toast({
          title: 'סיווג אוטומטי נכשל',
          description: result.aiError + ' — יש לבחור קטגוריות ידנית.',
          variant: 'destructive',
          duration: 10000,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה בעיבוד הקובץ';
      toast({
        title: 'שגיאה',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRowsChange = (rows: ImportRow[]) => {
    if (previewData) {
      const newCount = rows.filter(r => r.isSelected).length;
      setPreviewData({
        ...previewData,
        rows,
        summary: {
          ...previewData.summary,
          newCount,
        },
      });
    }
  };

  const selectedCount = previewData?.rows.filter(r => r.isSelected).length || 0;
  const missingCategory = previewData?.rows.some(r => r.isSelected && !r.categoryId) || false;

  const handleConfirm = async () => {
    if (!previewData || !file) return;

    setIsImporting(true);
    try {
      const result = await confirmImport(
        previewData.rows,
        effectiveLabel,
        file.name,
        fileType,
      );

      toast({
        title: 'הייבוא הושלם',
        description: result.message,
      });

      handleClose(false);
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה בייבוא';
      toast({
        title: 'שגיאה',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const stepIndex = ['type', 'upload', 'preview', 'confirm'].indexOf(step);
  const progress = ((stepIndex + 1) / 4) * 100;

  const Content = () => (
    <div className="space-y-4">
      {/* Progress */}
      <div className="space-y-1">
        <Progress value={progress} className="h-1.5" />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span className={step === 'type' ? 'font-bold text-foreground' : ''}>סוג קובץ</span>
          <span className={step === 'upload' ? 'font-bold text-foreground' : ''}>העלאה</span>
          <span className={step === 'preview' ? 'font-bold text-foreground' : ''}>סקירה</span>
          <span className={step === 'confirm' ? 'font-bold text-foreground' : ''}>אישור</span>
        </div>
      </div>

      {/* Step 1: File Type */}
      {step === 'type' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {FILE_TYPES.map((ft) => (
              <button
                key={ft.value}
                type="button"
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center',
                  fileType === ft.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                )}
                onClick={() => setFileType(ft.value)}
              >
                <div className={cn(
                  'p-2 rounded-lg',
                  fileType === ft.value ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {ft.icon}
                </div>
                <span className="text-sm font-medium">{ft.label}</span>
                <span className="text-[10px] text-muted-foreground">{ft.desc}</span>
              </button>
            ))}
          </div>

          {(fileType === 'pdf' || fileType === 'screenshot') && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">
              <Shield className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">הודעת פרטיות: </span>
                {fileType === 'pdf'
                  ? 'תוכן ה-PDF יישלח לעיבוד בשרתי OpenAI. הנתונים לא נשמרים ולא משמשים לאימון מודלים.'
                  : 'תמונת המסך תישלח לעיבוד בשרתי OpenAI. מומלץ להשתמש ב-Excel לדיוק מקסימלי ופרטיות.'}
              </div>
            </div>
          )}

          <Button className="w-full" onClick={() => setStep('upload')}>
            המשך
            <ArrowLeft className="h-4 w-4 mr-2" />
          </Button>
        </div>
      )}

      {/* Step 2: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          {/* Source label */}
          <div className="space-y-2">
            <Label>תיוג מקור הקובץ *</Label>
            <Select value={sourceLabel} onValueChange={setSourceLabel}>
              <SelectTrigger>
                <SelectValue placeholder="בחר מקור..." />
              </SelectTrigger>
              <SelectContent>
                {savedLabels.map(label => (
                  <SelectItem key={label} value={label}>{label}</SelectItem>
                ))}
                <SelectItem value="כרטיס אשראי (בעל)">כרטיס אשראי (בעל)</SelectItem>
                <SelectItem value="כרטיס אשראי (אישה)">כרטיס אשראי (אישה)</SelectItem>
                <SelectItem value="חשבון בנק">חשבון בנק</SelectItem>
                <SelectItem value="__custom__">שם מותאם...</SelectItem>
              </SelectContent>
            </Select>
            {sourceLabel === '__custom__' && (
              <Input
                placeholder='למשל: "כאל של יוסי"'
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
              />
            )}
            <p className="text-xs text-muted-foreground">
              התיוג מזהה את מקור העסקאות ומונע כפילויות בין בני זוג
            </p>
          </div>

          {/* File upload */}
          <div className="space-y-2">
            <Label>בחירת קובץ *</Label>
            <label
              className={cn(
                'flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
                file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/50'
              )}
            >
              {file ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB — לחץ להחלפה
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">גרור קובץ לכאן או לחץ לבחירה</span>
                  <span className="text-xs text-muted-foreground">מקסימום 10MB</span>
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept={ACCEPT_MAP[fileType]}
                onChange={handleFileChange}
              />
            </label>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep('type')}>
              <ArrowRight className="h-4 w-4 ml-2" />
              חזור
            </Button>
            <Button
              className="flex-1"
              disabled={!file || !effectiveLabel || isProcessing}
              onClick={handleProcess}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  מעבד...
                </>
              ) : (
                <>
                  עבד את הקובץ
                  <ArrowLeft className="h-4 w-4 mr-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && previewData && (
        <div className="space-y-4">
          <ImportPreview
            data={previewData}
            categories={categories}
            onRowsChange={handleRowsChange}
          />

          {missingCategory && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>יש עסקאות נבחרות ללא קטגוריה — יש לבחור קטגוריה לפני הייבוא</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep('upload')}>
              <ArrowRight className="h-4 w-4 ml-2" />
              חזור
            </Button>
            <Button
              className="flex-1"
              disabled={selectedCount === 0 || missingCategory}
              onClick={() => setStep('confirm')}
            >
              המשך לאישור ({selectedCount})
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 'confirm' && previewData && (
        <div className="space-y-4">
          <div className="rounded-xl border p-4 space-y-3">
            <h3 className="font-bold text-lg">סיכום ייבוא</h3>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">קובץ: </span>
                <span className="font-medium">{file?.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">מקור: </span>
                <span className="font-medium">{effectiveLabel}</span>
              </div>
              <div>
                <span className="text-muted-foreground">עסקאות לייבוא: </span>
                <span className="font-bold text-primary">{selectedCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">נדלגו: </span>
                <span>{previewData.summary.totalFound - selectedCount}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep('preview')}>
              <ArrowRight className="h-4 w-4 ml-2" />
              חזור
            </Button>
            <Button
              className="flex-1"
              disabled={isImporting}
              onClick={handleConfirm}
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  מייבא...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                  ייבא {selectedCount} עסקאות
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ייבוא עסקאות</DialogTitle>
            <DialogDescription>ייבוא עסקאות מחשבון בנק או כרטיס אשראי</DialogDescription>
          </DialogHeader>
          <Content />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>ייבוא עסקאות</SheetTitle>
          <SheetDescription>ייבוא עסקאות מחשבון בנק או כרטיס אשראי</SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          <Content />
        </div>
      </SheetContent>
    </Sheet>
  );
}
