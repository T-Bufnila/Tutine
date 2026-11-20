import type { WeekStart } from "../../lib/types";
import { buildYearGrid, describeCell, heatLevel } from "./heatmap";
import type { HistoryMap } from "./heatmap";

const CELL_PX = 13;

interface YearHeatmapProps {
  byDate: HistoryMap;
  weekStart: WeekStart;
  now: Date;
}

export function YearHeatmap({ byDate, weekStart, now }: YearHeatmapProps) {
  const { weeks, monthLabels } = buildYearGrid(byDate, weekStart, now);
  const columns = { gridTemplateColumns: `repeat(${weeks.length}, ${CELL_PX}px)` };

  return (
    <div className="year-heatmap">
      <div className="heat-months" style={columns}>
        {monthLabels.map((m) => (
          <span key={m.col} style={{ gridColumn: m.col + 1 }}>
            {m.label}
          </span>
        ))}
      </div>
      <div className="heat-grid" style={columns}>
        {weeks.flatMap((column, col) =>
          column.map((cell, row) =>
            cell ? (
              <div
                key={cell.date}
                className={`cell l${heatLevel(cell.day?.completed ?? 0)}`}
                style={{ gridColumn: col + 1, gridRow: row + 1 }}
                title={describeCell(cell)}
              />
            ) : null,
          ),
        )}
      </div>
    </div>
  );
}
