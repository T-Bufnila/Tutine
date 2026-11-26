import { useEffect, useMemo, useState } from "react";
import { useHintedLabel, useShortcut } from "../../hooks/useShortcuts";
import { orderedWeekdays, WEEKDAYS_SHORT } from "../../lib/constants";
import { api } from "../../lib/api";
import { localDateString, weekdayIndex } from "../../lib/time";
import type { WeekStart } from "../../lib/types";
import { buildMonth } from "./calendar";

interface FutureCalendarProps {
  weekStart: WeekStart;
  now: Date;
  onSelectDate: (date: string) => void;
}

export function FutureCalendar({ weekStart, now, onSelectDate }: FutureCalendarProps) {
  const today = localDateString(now);
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [highlighted, setHighlighted] = useState<number | null>(weekdayIndex(now));
  const [noteDates, setNoteDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.getFutureNoteDates().then(
      (dates) => setNoteDates(new Set(dates)),
      () => {},
    );
  }, []);

  const cells = useMemo(() => buildMonth(cursor.year, cursor.month, weekStart), [cursor, weekStart]);
  const isCurrentMonth = cursor.year === now.getFullYear() && cursor.month === now.getMonth();
  const title = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const shiftMonth = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const prevTitle = useHintedLabel("Previous month", "prevMonth");
  const nextTitle = useHintedLabel("Next month", "nextMonth");
  useShortcut("prevMonth", () => shiftMonth(-1), { enabled: !isCurrentMonth });
  useShortcut("nextMonth", () => shiftMonth(1));

  return (
    <div className="future-calendar">
      <div className="future-nav">
        <button
          className="icon"
          title={prevTitle}
          aria-label="Previous month"
          disabled={isCurrentMonth}
          onClick={() => shiftMonth(-1)}
        >
          ‹
        </button>
        <strong>{title}</strong>
        <button className="icon" title={nextTitle} aria-label="Next month" onClick={() => shiftMonth(1)}>
          ›
        </button>
      </div>

      <div className="future-grid">
        {orderedWeekdays(weekStart).map((d) => (
          <button
            key={d}
            className={`future-weekday ${highlighted === d ? "on" : ""}`}
            aria-pressed={highlighted === d}
            title={highlighted === d ? "Stop highlighting" : `Highlight future ${WEEKDAYS_SHORT[d]}s`}
            onClick={() => setHighlighted(highlighted === d ? null : d)}
          >
            {WEEKDAYS_SHORT[d]}
          </button>
        ))}

        {cells.map((cell, i) => {
          if (!cell) return <div key={`pad-${i}`} />;
          const past = cell.date < today;
          const isToday = cell.date === today;
          const classes = [
            "future-day",
            past ? "past" : "",
            isToday ? "today" : "",
            !past && !isToday && cell.weekday === highlighted ? "match" : "",
          ].join(" ");
          return (
            <button
              key={cell.date}
              className={classes}
              disabled={past || isToday}
              onClick={() => onSelectDate(cell.date)}
            >
              <span>{cell.day}</span>
              {noteDates.has(cell.date) ? <i className="future-dot" title="Has notes" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
