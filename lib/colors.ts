export const budgetColors = {
  healthy: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
  exceeded: '#991b1b',
};

export const transactionColors = {
  income: '#22c55e',
  expense: '#ef4444',
  fixed: '#6b7280',
};

export function getBudgetColor(percentUsed: number): string {
  if (percentUsed <= 60) return budgetColors.healthy;
  if (percentUsed <= 85) return budgetColors.warning;
  return budgetColors.danger;
}

export function getBudgetStatus(percentUsed: number): 'healthy' | 'warning' | 'danger' | 'exceeded' {
  if (percentUsed <= 60) return 'healthy';
  if (percentUsed <= 85) return 'warning';
  if (percentUsed <= 100) return 'danger';
  return 'exceeded';
}

export function getBudgetTailwindBg(percentUsed: number): string {
  if (percentUsed <= 60) return 'bg-green-500';
  if (percentUsed <= 85) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function getBudgetTailwindText(percentUsed: number): string {
  if (percentUsed <= 60) return 'text-green-600';
  if (percentUsed <= 85) return 'text-yellow-600';
  return 'text-red-600';
}
