import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumberId(value: string | number | null | undefined): string {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '-') return '-';

  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw;

  let normalized = digits;
  if (normalized.startsWith('0')) {
    normalized = `62${normalized.slice(1)}`;
  } else if (!normalized.startsWith('62')) {
    normalized = `62${normalized}`;
  }

  const localNumber = normalized.slice(2);
  if (!localNumber) return '+62';

  const groups: string[] = [];
  if (localNumber.length <= 3) {
    groups.push(localNumber);
  } else {
    groups.push(localNumber.slice(0, 3));
    let index = 3;
    while (index < localNumber.length) {
      groups.push(localNumber.slice(index, index + 4));
      index += 4;
    }
  }

  return `+62 ${groups.join(' ')}`.trim();
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
