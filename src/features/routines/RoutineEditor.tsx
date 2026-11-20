import { useState } from "react";
import { PlusIcon } from "../../components/Icons";
import { PageHeader } from "../../components/PageHeader";
import { PALETTE } from "../../lib/constants";
import { localDateString, weekdayIndex } from "../../lib/time";
import type { Routine, RoutineItem, Settings } from "../../lib/types";
import { RoutineItemEditor } from "./RoutineItemEditor";
import { createItem, validateRoutine } from "./routineUtils";
import { ScheduleTabs } from "./ScheduleTabs";

const MAX_WEEKS = 12;

interface RoutineEditorProps {
  routine: Routine | null;
  settings: Settings;
  onSave: (routine: Routine) => void;
  onCancel: () => void;
}

export function RoutineEditor({ routine, settings, onSave, onCancel }: RoutineEditorProps) {
  // --- Draft state ---------------------------------------------------------
  const [name, setName] = useState(routine?.name ?? "");
  const [weeks, setWeeks] = useState(routine?.weeks ?? 1);
  const [startDate, setStartDate] = useState(routine?.startDate ?? localDateString());
  const [items, setItems] = useState<RoutineItem[]>(routine?.items ?? []);
  const [error, setError] = useState("");

  // --- Selected day --------------------------------------------------------
  const [week, setWeek] = useState(0);
  const [weekday, setWeekday] = useState(() => weekdayIndex(new Date()));
  const shownWeek = Math.min(week, weeks - 1);

  const visible = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.weekIndex === shownWeek && item.weekday === weekday);

  const countFor = (d: number) => items.filter((i) => i.weekIndex === shownWeek && i.weekday === d).length;

  // --- Item mutations ------------------------------------------------------
  const updateItem = (index: number, change: Partial<RoutineItem>) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...change } : it)));

  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const addItem = () => {
    const previous = visible[visible.length - 1]?.item;
    setItems((prev) => [...prev, createItem(shownWeek, weekday, previous, PALETTE[0])]);
  };

  // --- Save ----------------------------------------------------------------
  const save = () => {
    const kept = items.filter((i) => i.weekIndex < weeks);
    const problem = validateRoutine(name, kept);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    onSave({
      id: routine?.id,
      name: name.trim(),
      weeks,
      startDate,
      pinned: routine?.pinned ?? false,
      currentWeek: 0,
      items: kept,
    });
  };

  return (
    <div className="page">
      <PageHeader title={routine ? "Edit routine" : "New routine"}>
        <button className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn primary" onClick={save}>
          Save
        </button>
      </PageHeader>

      {error ? <p className="error">{error}</p> : null}

      <section className="row wrap">
        <label className="field grow">
          <span>Name</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Uni Week" />
        </label>
        <label className="field narrow">
          <span>Weeks in cycle</span>
          <input
            type="number"
            min={1}
            max={MAX_WEEKS}
            value={weeks}
            onChange={(e) => setWeeks(Math.min(MAX_WEEKS, Math.max(1, Number(e.target.value) || 1)))}
          />
        </label>
        {weeks > 1 ? (
          <label className="field">
            <span>Week 1 starts</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value || localDateString())} />
          </label>
        ) : null}
      </section>

      <ScheduleTabs
        weeks={weeks}
        week={shownWeek}
        onWeekChange={setWeek}
        weekday={weekday}
        onWeekdayChange={setWeekday}
        weekStart={settings.weekStart}
        countFor={countFor}
      />

      <div className="items-head">
        <button className="icon add" title="Add item" onClick={addItem}>
          <PlusIcon size={20} />
        </button>
      </div>

      {visible.length === 0 ? <p className="empty">Nothing scheduled. Add an item with +</p> : null}
      <ul className="editor-items">
        {visible.map(({ item, index }) => (
          <RoutineItemEditor
            key={index}
            item={item}
            onChange={(change) => updateItem(index, change)}
            onRemove={() => removeItem(index)}
          />
        ))}
      </ul>
    </div>
  );
}
