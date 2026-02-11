import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: string | number) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  
  if (num < 0.01) return '$' + num.toFixed(6);
  if (num < 1) return '$' + num.toFixed(4);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatCompactNumber(value: string | number) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '-';

    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 2,
    }).format(num);
}

export function formatPercent(value: string | number) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '-';
    
    return (num > 0 ? '+' : '') + num.toFixed(2) + '%';
}
