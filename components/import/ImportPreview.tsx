'use client';

import { useState, useMemo } from 'react';
import { ImportRow, ImportPreviewData, ImportRowStatus, ConfidenceLevel } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeftRight,
  RefreshCw,
  Filter,
} from 'lucide-react';

interface CategoryOption {
  id: string;
  name: string;
  type: string;
  children?: { id: string; name: string }[];
}

interface ImportPreviewProps {
  data: ImportPreviewData;
  categories: CategoryOption[];
  onRowsChange: (rows: ImportRow[]) => void;
}

const STATUS_CONFIG: Record<ImportRowStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}> = {
  new: {
    label: 'חדש',
    color: 'text-green-700',
    bgColor: 'bg-green-50 hover:bg-green-100/80',
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />,
  },
  duplicate: {
    label: 'כפילות',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 hover:bg-gray-100/80',
    icon: <XCircle className="h-3.5 w-3.5 text-gray-400" />,
  },
  suspect: {
    label: 'לבדיקה',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100/80',
    icon: <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />,
  },
  transfer: {
    label: 'העברה',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 hover:bg-amber-100/80',
    icon: <ArrowLeftRight className="h-3.5 w-3.5 text-amber-600" />,
  },
  recurring_match: {
    label: 'קבועה',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 hover:bg-blue-100/80',
    icon: <RefreshCw className="h-3.5 w-3.5 text-blue-600" />,
  },
};

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, {
  label: string;
  className: string;
}> = {
  high: { label: 'V', className: 'text-green-600 font-bold' },
  low: { label: '?', className: 'text-yellow-600 font-bold' },
  unknown: { label: '!', className: 'text-red-600 font-bold' },
};

type FilterValue = 'all' | 'review' | 'new';

export function ImportPreview({ data, categories, onRowsChange }: ImportPreviewProps) {
  const [filter, setFilter] = useState<FilterValue>('all');

  const filteredRows = useMemo(() => {
    switch (filter) {
      case 'new':
        return data.rows.filter(r => r.status === 'new');
      case 'review':
        return data.rows.filter(r => ['suspect', 'transfer', 'recurring_match'].includes(r.status));
      default:
        return data.rows;
    }
  }, [data.rows, filter]);

  const toggleRow = (index: number) => {
    const updated = data.rows.map(r =>
      r.index === index ? { ...r, isSelected: !r.isSelected } : r
    );
    onRowsChange(updated);
  };

  const updateRowCategory = (rowIndex: number, categoryId: string) => {
    const parentCat = categories.find(c => c.id === categoryId);
    const isSubCategory = !parentCat;

    let newCatId = categoryId;
    let newCatName: string | null = null;
    let newSubCatId: string | null = null;
    let newSubCatName: string | null = null;

    if (isSubCategory) {
      for (const cat of categories) {
        const sub = cat.children?.find(s => s.id === categoryId);
        if (sub) {
          newCatId = cat.id;
          newCatName = cat.name;
          newSubCatId = sub.id;
          newSubCatName = sub.name;
          break;
        }
      }
    } else {
      newCatName = parentCat?.name || null;
    }

    const updated = data.rows.map(r =>
      r.index === rowIndex
        ? {
            ...r,
            categoryId: newCatId,
            categoryName: newCatName,
            subCategoryId: newSubCatId,
            subCategoryName: newSubCatName,
            confidence: 'high' as ConfidenceLevel,
          }
        : r
    );
    onRowsChange(updated);
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return dateStr;
  };

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
        <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
          <div className="text-muted-foreground text-xs">נמצאו</div>
          <div className="font-bold text-lg">{data.summary.totalFound}</div>
        </div>
        <div className="rounded-lg bg-green-50 p-2.5 text-center">
          <div className="text-green-700 text-xs">חדשות</div>
          <div className="font-bold text-lg text-green-700">{data.summary.newCount}</div>
        </div>
        <div className="rounded-lg bg-gray-100 p-2.5 text-center">
          <div className="text-gray-500 text-xs">כפילויות</div>
          <div className="font-bold text-lg text-gray-500">{data.summary.duplicateCount}</div>
        </div>
        {data.summary.suspectCount > 0 && (
          <div className="rounded-lg bg-yellow-50 p-2.5 text-center">
            <div className="text-yellow-700 text-xs">לבדיקה</div>
            <div className="font-bold text-lg text-yellow-700">{data.summary.suspectCount}</div>
          </div>
        )}
        {data.summary.transferCount > 0 && (
          <div className="rounded-lg bg-amber-50 p-2.5 text-center">
            <div className="text-amber-700 text-xs">העברות</div>
            <div className="font-bold text-lg text-amber-700">{data.summary.transferCount}</div>
          </div>
        )}
        {data.summary.recurringMatchCount > 0 && (
          <div className="rounded-lg bg-blue-50 p-2.5 text-center">
            <div className="text-blue-700 text-xs">קבועות</div>
            <div className="font-bold text-lg text-blue-700">{data.summary.recurringMatchCount}</div>
          </div>
        )}
      </div>

      {data.summary.dateRange.from && (
        <p className="text-xs text-muted-foreground text-center">
          תקופה: {formatDate(data.summary.dateRange.from)} — {formatDate(data.summary.dateRange.to)}
        </p>
      )}

      {data.aiError && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium">סיווג אוטומטי לא זמין: </span>
            {data.aiError}
            <span className="block text-xs mt-1 text-amber-600">יש לבחור קטגוריה ידנית לכל עסקה.</span>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className="text-xs h-7"
        >
          <Filter className="h-3 w-3 ml-1" />
          הכל ({data.rows.length})
        </Button>
        <Button
          size="sm"
          variant={filter === 'new' ? 'default' : 'outline'}
          onClick={() => setFilter('new')}
          className="text-xs h-7"
        >
          חדשות ({data.summary.newCount})
        </Button>
        {(data.summary.suspectCount + data.summary.transferCount + data.summary.recurringMatchCount > 0) && (
          <Button
            size="sm"
            variant={filter === 'review' ? 'default' : 'outline'}
            onClick={() => setFilter('review')}
            className="text-xs h-7"
          >
            לבדיקה ({data.summary.suspectCount + data.summary.transferCount + data.summary.recurringMatchCount})
          </Button>
        )}
      </div>

      {/* Rows table */}
      <ScrollArea className="h-[350px] rounded-lg border">
        <div className="min-w-[600px]">
          {/* Header */}
          <div className="sticky top-0 z-10 grid grid-cols-[32px_60px_1fr_80px_100px_50px] gap-2 px-3 py-2 bg-muted/80 backdrop-blur text-xs font-medium text-muted-foreground border-b">
            <div></div>
            <div>תאריך</div>
            <div>תיאור</div>
            <div className="text-left">סכום</div>
            <div>קטגוריה</div>
            <div className="text-center">ביטחון</div>
          </div>

          {/* Rows */}
          {filteredRows.map((row) => {
            const statusCfg = STATUS_CONFIG[row.status];
            const confCfg = CONFIDENCE_CONFIG[row.confidence];
            const displayCategory = row.subCategoryName
              ? `${row.categoryName} > ${row.subCategoryName}`
              : row.categoryName || '—';

            return (
              <div
                key={row.index}
                className={cn(
                  'grid grid-cols-[32px_60px_1fr_80px_100px_50px] gap-2 px-3 py-2 border-b text-sm transition-colors items-center',
                  statusCfg.bgColor,
                  !row.isSelected && 'opacity-50'
                )}
              >
                {/* Checkbox */}
                <div>
                  <input
                    type="checkbox"
                    checked={row.isSelected}
                    onChange={() => toggleRow(row.index)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>

                {/* Date */}
                <div className="text-xs tabular-nums">{formatDate(row.date)}</div>

                {/* Description */}
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    {statusCfg.icon}
                    <span className="truncate text-xs sm:text-sm">{row.sourceDescription}</span>
                  </div>
                  {row.duplicateReason && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{row.duplicateReason}</p>
                  )}
                  {row.notes && (
                    <p className="text-[10px] text-blue-600 mt-0.5">{row.notes}</p>
                  )}
                </div>

                {/* Amount */}
                <div className={cn(
                  'text-left font-medium tabular-nums text-xs',
                  row.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                )}>
                  {'\u2066'}{row.type === 'INCOME' ? '+' : '-'}₪{row.amount.toLocaleString('he-IL')}{'\u2069'}
                </div>

                {/* Category */}
                <div>
                  {row.confidence === 'unknown' || !row.categoryId ? (
                    <Select onValueChange={(val) => updateRowCategory(row.index, val)}>
                      <SelectTrigger className="h-7 text-[10px] border-red-300">
                        <SelectValue placeholder="בחר..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter(c => (row.type === 'INCOME' ? c.type === 'INCOME' : c.type === 'EXPENSE'))
                          .map(cat => (
                            <div key={cat.id}>
                              <SelectItem value={cat.id} className="font-medium">
                                {cat.name}
                              </SelectItem>
                              {cat.children?.map(sub => (
                                <SelectItem key={sub.id} value={sub.id} className="pr-6 text-xs">
                                  {sub.name}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <button
                      type="button"
                      className="text-[10px] sm:text-xs truncate max-w-full text-right hover:underline"
                      title="לחץ לשינוי קטגוריה"
                      onClick={() => {
                        const updated = data.rows.map(r =>
                          r.index === row.index ? { ...r, categoryId: null, categoryName: null, subCategoryId: null, subCategoryName: null, confidence: 'unknown' as ConfidenceLevel } : r
                        );
                        onRowsChange(updated);
                      }}
                    >
                      {displayCategory}
                    </button>
                  )}
                </div>

                {/* Confidence */}
                <div className="text-center">
                  <Badge variant="outline" className={cn('text-[10px] px-1.5', confCfg.className)}>
                    {confCfg.label}
                  </Badge>
                </div>
              </div>
            );
          })}

          {filteredRows.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              אין עסקאות בפילטר הנוכחי
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
