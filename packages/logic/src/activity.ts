import type { DbActivity } from '@minga/types';

export type ActivityClass = 'minga' | 'independent';

/**
 * An activity counts as a "Minga" activity when it was booked / linked through
 * a Minga expedition. The canonical signal is a non-null `expedition_id`; the
 * `is_independent` flag mirrors that (`is_independent === expedition_id == null`).
 */
export function isMingaActivity(
  activity: Pick<DbActivity, 'expedition_id' | 'is_independent'>,
): boolean {
  if (activity.expedition_id) return true;
  return activity.is_independent === false;
}

export function classifyActivity(
  activity: Pick<DbActivity, 'expedition_id' | 'is_independent'>,
): ActivityClass {
  return isMingaActivity(activity) ? 'minga' : 'independent';
}

export interface ActivityTotals {
  count: number;
  distanceKm: number;
  elevationM: number;
}

export interface ActivitySummary {
  all: ActivityTotals;
  minga: ActivityTotals;
  independent: ActivityTotals;
}

const emptyTotals = (): ActivityTotals => ({ count: 0, distanceKm: 0, elevationM: 0 });

function addTo(totals: ActivityTotals, a: Pick<DbActivity, 'distance_km' | 'elevation_gain_m'>) {
  totals.count += 1;
  totals.distanceKm += a.distance_km ?? 0;
  totals.elevationM += a.elevation_gain_m ?? 0;
}

/** Totals broken down by everything / with-Minga / independent. */
export function summarizeActivities(
  activities: Array<
    Pick<DbActivity, 'expedition_id' | 'is_independent' | 'distance_km' | 'elevation_gain_m'>
  >,
): ActivitySummary {
  const summary: ActivitySummary = {
    all: emptyTotals(),
    minga: emptyTotals(),
    independent: emptyTotals(),
  };
  for (const a of activities) {
    addTo(summary.all, a);
    if (isMingaActivity(a)) addTo(summary.minga, a);
    else addTo(summary.independent, a);
  }
  return summary;
}

export interface CalendarDay {
  /** Local date key, YYYY-MM-DD. */
  date: string;
  /** Number of activities started on this day. */
  count: number;
  mingaCount: number;
  independentCount: number;
  /**
   * Dominant class for coloring, or null when the day had no activity.
   * Ties resolve to 'minga' so paid trips stay visible.
   */
  dominant: ActivityClass | null;
}

export interface ActivityCalendar {
  days: CalendarDay[];
  /** Number of distinct days that had at least one activity. */
  activeDays: number;
  totalDays: number;
}

/** A single cell in a month grid (may be padding outside the month). */
export interface MonthDay {
  /** Local date key (YYYY-MM-DD), or null for padding cells. */
  date: string | null;
  /** Day of month (1-31), or 0 for padding cells. */
  day: number;
  count: number;
  mingaCount: number;
  independentCount: number;
  dominant: ActivityClass | null;
  inMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface MonthCalendar {
  year: number;
  /** 0-based month index (0 = January). */
  month: number;
  /** Rows of exactly 7 cells, Monday-first. */
  weeks: MonthDay[][];
  totals: {
    count: number;
    minga: number;
    independent: number;
    activeDays: number;
  };
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Bucket activities by local day, tracking Minga vs. independent counts. */
function indexActivitiesByDay(
  activities: Array<Pick<DbActivity, 'started_at' | 'expedition_id' | 'is_independent'>>,
): Map<string, { minga: number; independent: number }> {
  const buckets = new Map<string, { minga: number; independent: number }>();
  for (const a of activities) {
    if (!a.started_at) continue;
    const started = new Date(a.started_at);
    if (Number.isNaN(started.getTime())) continue;
    const key = toDateKey(started);
    const bucket = buckets.get(key) ?? { minga: 0, independent: 0 };
    if (isMingaActivity(a)) bucket.minga += 1;
    else bucket.independent += 1;
    buckets.set(key, bucket);
  }
  return buckets;
}

/** The {year, month} of the earliest activity, or null when there are none. */
export function earliestActivityMonth(
  activities: Array<Pick<DbActivity, 'started_at'>>,
): { year: number; month: number } | null {
  let min: Date | null = null;
  for (const a of activities) {
    if (!a.started_at) continue;
    const d = new Date(a.started_at);
    if (Number.isNaN(d.getTime())) continue;
    if (!min || d < min) min = d;
  }
  return min ? { year: min.getFullYear(), month: min.getMonth() } : null;
}

/**
 * Build a true month grid (Monday-first, padded to whole weeks) for the given
 * year/month, bucketing activities by their `started_at` day and tracking how
 * many were Minga vs. independent so each day can be styled by `dominant`.
 */
export function buildMonthCalendar(
  activities: Array<Pick<DbActivity, 'started_at' | 'expedition_id' | 'is_independent'>>,
  year: number,
  month: number,
  now: Date = new Date(),
): MonthCalendar {
  const buckets = indexActivitiesByDay(activities);
  const todayKey = toDateKey(now);

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first offset: JS getDay() has Sunday=0.
  const leading = (first.getDay() + 6) % 7;

  const padding = (): MonthDay => ({
    date: null,
    day: 0,
    count: 0,
    mingaCount: 0,
    independentCount: 0,
    dominant: null,
    inMonth: false,
    isToday: false,
    isFuture: false,
  });

  const cells: MonthDay[] = [];
  for (let i = 0; i < leading; i++) cells.push(padding());

  const totals = { count: 0, minga: 0, independent: 0, activeDays: 0 };
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const key = toDateKey(d);
    const bucket = buckets.get(key);
    const mingaCount = bucket?.minga ?? 0;
    const independentCount = bucket?.independent ?? 0;
    const count = mingaCount + independentCount;
    let dominant: ActivityClass | null = null;
    if (count > 0) dominant = mingaCount >= independentCount ? 'minga' : 'independent';
    if (count > 0) {
      totals.count += count;
      totals.minga += mingaCount;
      totals.independent += independentCount;
      totals.activeDays += 1;
    }
    cells.push({
      date: key,
      day,
      count,
      mingaCount,
      independentCount,
      dominant,
      inMonth: true,
      isToday: key === todayKey,
      isFuture: d > now,
    });
  }

  while (cells.length % 7 !== 0) cells.push(padding());

  const weeks: MonthDay[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return { year, month, weeks, totals };
}

/**
 * Build a contiguous day-by-day calendar ending today and spanning `days`
 * calendar days back, bucketing each activity by its `started_at` day and
 * tracking how many were Minga vs. independent. Suitable for a contribution-
 * style grid colored by `dominant`.
 */
export function buildActivityCalendar(
  activities: Array<
    Pick<DbActivity, 'started_at' | 'expedition_id' | 'is_independent'>
  >,
  days = 182,
  now: Date = new Date(),
): ActivityCalendar {
  const span = Math.max(1, days);
  const buckets = new Map<string, { minga: number; independent: number }>();

  for (const a of activities) {
    if (!a.started_at) continue;
    const started = new Date(a.started_at);
    if (Number.isNaN(started.getTime())) continue;
    const key = toDateKey(started);
    const bucket = buckets.get(key) ?? { minga: 0, independent: 0 };
    if (isMingaActivity(a)) bucket.minga += 1;
    else bucket.independent += 1;
    buckets.set(key, bucket);
  }

  const out: CalendarDay[] = [];
  let activeDays = 0;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (span - 1));

  for (let i = 0; i < span; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toDateKey(d);
    const bucket = buckets.get(key);
    const mingaCount = bucket?.minga ?? 0;
    const independentCount = bucket?.independent ?? 0;
    const count = mingaCount + independentCount;
    if (count > 0) activeDays += 1;
    let dominant: ActivityClass | null = null;
    if (count > 0) dominant = mingaCount >= independentCount ? 'minga' : 'independent';
    out.push({ date: key, count, mingaCount, independentCount, dominant });
  }

  return { days: out, activeDays, totalDays: span };
}
