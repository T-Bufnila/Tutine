import { ChevronIcon, EditIcon, PinIcon, TrashIcon } from "../../components/Icons";
import { WEEKDAYS_SHORT } from "../../lib/constants";
import type { Routine } from "../../lib/types";

interface RoutineGroupProps {
  routine: Routine;
  days: number[];
  open: boolean;
  active: boolean;
  /** Today's weekday, highlighted when this routine is active. */
  todayWeekday: number | null;
  selectedWeekday: number | null;
  onToggleOpen: () => void;
  onToggleActive: () => void;
  onTogglePin: () => void;
  onSelectDay: (weekday: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function RoutineGroup(p: RoutineGroupProps) {
  const { routine, open, active } = p;

  return (
    <div className="routine">
      <div className="routine-head">
        <button className="icon" onClick={p.onToggleOpen} title={open ? "Collapse" : "Expand"}>
          <ChevronIcon open={open} />
        </button>
        <button
          className={`dot ${active ? "on" : ""}`}
          title={active ? "Active routine (click to deactivate)" : "Set as active routine"}
          aria-pressed={active}
          onClick={p.onToggleActive}
        />
        <button className="routine-name" onClick={p.onToggleOpen}>
          {routine.name}
        </button>
        <button
          className={`icon ${routine.pinned ? "accent" : ""}`}
          title={routine.pinned ? "Unpin" : "Pin"}
          aria-pressed={routine.pinned}
          onClick={p.onTogglePin}
        >
          <PinIcon filled={routine.pinned} />
        </button>
      </div>

      {open ? (
        <div className="routine-body">
          {p.days.map((d) => {
            const classes = [
              "day",
              p.selectedWeekday === d ? "selected" : "",
              active && p.todayWeekday === d ? "today" : "",
            ];
            return (
              <button key={d} className={classes.join(" ")} onClick={() => p.onSelectDay(d)}>
                {WEEKDAYS_SHORT[d]}
              </button>
            );
          })}
          <div className="routine-actions">
            <button className="icon" title="Edit routine" onClick={p.onEdit}>
              <EditIcon />
            </button>
            <button className="icon del" title="Delete routine" onClick={p.onDelete}>
              <TrashIcon />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
