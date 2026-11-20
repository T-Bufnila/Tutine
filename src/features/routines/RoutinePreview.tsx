import { useState } from "react";
import { EditIcon } from "../../components/Icons";
import { PageHeader } from "../../components/PageHeader";
import type { Routine, Settings } from "../../lib/types";
import { PreviewItem } from "./PreviewItem";
import { itemsForDay } from "./routineUtils";
import { ScheduleTabs } from "./ScheduleTabs";

interface RoutinePreviewProps {
  routine: Routine;
  weekday: number;
  settings: Settings;
  onSelectDay: (weekday: number) => void;
  onEdit: () => void;
}

export function RoutinePreview({ routine, weekday, settings, onSelectDay, onEdit }: RoutinePreviewProps) {
  const [week, setWeek] = useState(routine.currentWeek);
  const shownWeek = Math.min(week, routine.weeks - 1);
  const items = itemsForDay(routine.items, shownWeek, weekday);

  const subtitle =
    routine.weeks > 1 ? `${routine.weeks}-week cycle · currently week ${routine.currentWeek + 1}` : "Weekly routine";

  return (
    <div className="page">
      <PageHeader title={routine.name} subtitle={subtitle}>
        <button className="icon big" title="Edit routine" onClick={onEdit}>
          <EditIcon />
        </button>
      </PageHeader>

      <ScheduleTabs
        weeks={routine.weeks}
        week={shownWeek}
        onWeekChange={setWeek}
        weekday={weekday}
        onWeekdayChange={onSelectDay}
        weekStart={settings.weekStart}
      />

      {items.length === 0 ? <p className="empty">Nothing scheduled</p> : null}
      <ul className="todo-list">
        {items.map((item, i) => (
          <PreviewItem key={item.id ?? i} item={item} use24h={settings.use24h} />
        ))}
      </ul>
    </div>
  );
}
