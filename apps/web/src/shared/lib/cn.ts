import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Склеивает className и разрешает конфликты Tailwind-классов */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
