export const budgetColors = {
  healthy: '#00C875',
  warning: '#FDAB3D',
  danger: '#E2445C',
  exceeded: '#872637',
};

export const transactionColors = {
  income: '#00C875',
  expense: '#E2445C',
  fixed: '#676879',
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
  if (percentUsed <= 60) return 'bg-income-500';
  if (percentUsed <= 85) return 'bg-warning-500';
  return 'bg-expense-500';
}

export function getBudgetTailwindText(percentUsed: number): string {
  if (percentUsed <= 60) return 'text-income-600';
  if (percentUsed <= 85) return 'text-warning-600';
  return 'text-expense-600';
}
