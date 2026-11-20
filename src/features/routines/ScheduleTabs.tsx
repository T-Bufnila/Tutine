import { Tabs } from "../../components/Tabs";
import { orderedWeekdays, WEEKDAYS_SHORT } from "../../lib/constants";
import type { WeekStart } from "../../lib/types";

interface ScheduleTabsProps {
  weeks: number;
  week: number;
  onWeekChange: (week: number) => void;
  weekday: number;
  onWeekdayChange: (weekday: number) => void;
  weekStart: WeekStart;
  /** Optional item count shown as a badge on each weekday tab. */
  countFor?: (weekday: number) => number;
}

/** Week selector (only for multi-week cycles) followed by weekday tabs. */
export function ScheduleTabs({ weeks, week, onWeekChange, weekday, onWeekdayChange, weekStart, countFor }: ScheduleTabsProps) {
  const weekTabs = Array.from({ length: weeks }, (_, w) => ({ value: w, label: `Week ${w + 1}` }));
  const dayTabs = orderedWeekdays(weekStart).map((d) => ({
    value: d,
    label: WEEKDAYS_SHORT[d],
    badge: countFor?.(d),
  }));

  return (
    <>
      {weeks > 1 ? <Tabs items={weekTabs} value={week} onChange={onWeekChange} /> : null}
      <Tabs items={dayTabs} value={weekday} onChange={onWeekdayChange} />
    </>
  );
}
