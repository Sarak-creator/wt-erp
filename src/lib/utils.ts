import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatKHR(amount: number): string {
  // Typical rate: 1 USD = 4,100 KHR
  const khr = Math.round(amount * 4100);
  return new Intl.NumberFormat('km-KH').format(khr) + ' ៛';
}
