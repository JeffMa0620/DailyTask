import { format, isSameWeek, parseISO, subDays } from 'date-fns';

export function todayKey(date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function yesterdayKey(date: string): string {
  return format(subDays(parseISO(date), 1), 'yyyy-MM-dd');
}

export function isYesterday(previous: string | undefined, current: string): boolean {
  return previous === yesterdayKey(current);
}

export function isSameLocalWeek(a: string | undefined, b: string): boolean {
  return Boolean(a) && isSameWeek(parseISO(a!), parseISO(b), { weekStartsOn: 1 });
}
