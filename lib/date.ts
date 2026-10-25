export const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export const pad = (n: number) => String(n).padStart(2, "0");

/** Local-time YYYY-MM-DD. */
export function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** month is YYYY-MM. */
export function daysInMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** 0 (Sunday) – 6 (Saturday) for a YYYY-MM-DD string. */
export function weekdayOf(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}
