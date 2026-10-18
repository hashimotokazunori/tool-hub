export type WageInput = { hoursPerDay: number; daysPerMonth: number; bonusMonths: number };

/** 時給 → 日給・月給・年収（賞与を月給の何か月分か加える） */
export function fromHourly(hourly: number, w: WageInput) {
  const monthlyHours = w.hoursPerDay * w.daysPerMonth;
  const monthly = hourly * monthlyHours;
  return { daily: hourly * w.hoursPerDay, monthly, yearly: monthly * (12 + (w.bonusMonths || 0)), monthlyHours };
}

/** 月給 → 時給・日給・年収 */
export function fromMonthly(monthly: number, w: WageInput) {
  const monthlyHours = w.hoursPerDay * w.daysPerMonth;
  return { hourly: monthlyHours ? monthly / monthlyHours : Number.NaN, daily: w.daysPerMonth ? monthly / w.daysPerMonth : Number.NaN, yearly: monthly * (12 + (w.bonusMonths || 0)), monthlyHours };
}
