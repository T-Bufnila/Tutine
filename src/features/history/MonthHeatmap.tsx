import { orderedWeekdays, WEEKDAYS_SHORT } from "../../lib/constants";
import type { WeekStart } from "../../lib/types";
import { buildMonthGrid, describeCell, heatLevel } from "./heatmap";
import type { HistoryMap } from "./heatmap";

interface MonthHeatmapProps {
  byDate: HistoryMap;
  weekStart: WeekStart;
  now: Date;
}

export function MonthHeatmap({ byDate, weekStart, now }: MonthHeatmapProps) {
  const cells = buildMonthGrid(byDate, weekStart, now);

  return (
    <div className="month-heatmap">
      {orderedWeekdays(weekStart).map((d) => (
        <span key={d} className="month-weekday">
          {WEEKDAYS_SHORT[d]}
        </span>
      ))}
      {cells.map((cell, i) =>
        cell ? (
          <div
            key={cell.date}
            className={`month-cell l${cell.future ? 0 : heatLevel(cell.day?.completed ?? 0)} ${cell.future ? "future" : ""}`}
            title={describeCell(cell)}
          >
            <span>{Number(cell.date.slice(8))}</span>
            {cell.day && cell.day.total > 0 ? (
              <small>
                {cell.day.completed}/{cell.day.total}
              </small>
            ) : null}
          </div>
        ) : (
          <div key={`pad-${i}`} />
        ),
      )}
    </div>
  );
}
