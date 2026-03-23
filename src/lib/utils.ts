import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isTokenValid(token: string | null): boolean {
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}

export const PAYMENT_STATUS = {
  PAID: 1,
  WAITING_PAYMENT: 2,
  WAITING_APPROVAL: 3,
  PARTIALLY_PAID: 4,
  CANCELLED: 5,
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  [PAYMENT_STATUS.PAID]: 'PAID',
  [PAYMENT_STATUS.WAITING_PAYMENT]: 'WAITING PAYMENT',
  [PAYMENT_STATUS.WAITING_APPROVAL]: 'WAITING APPROVAL',
  [PAYMENT_STATUS.PARTIALLY_PAID]: 'PARTIALLY PAID',
  [PAYMENT_STATUS.CANCELLED]: 'CANCELLED',
};
