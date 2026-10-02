import { formatInTimeZone } from 'date-fns-tz';
import { getISOWeek, getISOWeekYear } from 'date-fns';

export const TZ = 'Africa/Johannesburg';
export const sastDate = (d: Date = new Date()) => formatInTimeZone(d, TZ, 'yyyy-MM-dd');
export const isoWeekKey = (dateStr: string) => {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, '0')}`;
};
