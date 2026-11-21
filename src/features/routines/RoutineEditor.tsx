import { useRef, useState } from "react";
import { PlusIcon } from "../../components/Icons";
import { PageHeader } from "../../components/PageHeader";
import { localDateString, weekdayIndex } from "../../lib/time";
import type { Routine, RoutineItem, Settings, Tag } from "../../lib/types";
import { RoutineItemEditor } from "./RoutineItemEditor";
import { createItem, findOverlaps, sortItems, validateRoutine } from "./routineUtils";
import { ScheduleTabs } from "./ScheduleTabs";

const MAX_WEEKS = 12;

/** An item being edited; `key` keeps rows stable while they re-sort. */
type DraftItem = RoutineItem & { key: number };

interface RoutineEditorProps {
  routine: Routine | null;
  tags: Tag[];
  settings: Settings;
  onSave: (routine: Routine) => void;
  onCancel: () => void;
}

export function RoutineEditor({ routine, tags, settings, onSave, onCancel }: RoutineEditorProps) {
  // --- Draft state ---------------------------------------------------------
  const nextKey = useRef(0);
  const [name, setName] = useState(routine?.name ?? "");
  const [weeks, setWeeks] = useState(routine?.weeks ?? 1);
  const [startDate, setStartDate] = useState(routine?.startDate ?? localDateString());
  const [items, setItems] = useState<DraftItem[]>(() =>
    (routine?.items ?? []).map((item) => ({ ...item, key: nextKey.current++ })),
  );
  const [error, setError] = useState("");

  // --- Selected day --------------------------------------------------------
  const [week, setWeek] = useState(0);
  const [weekday, setWeekday] = useState(() => weekdayIndex(new Date()));
  const shownWeek = Math.min(week, weeks - 1);

  const visible = items.filter((item) => item.weekIndex === shownWeek && item.weekday === weekday);
  const overlapping = new Set(findOverlaps(items).flatMap(([a, b]) => [items[a].key, items[b].key]));

  const countFor = (d: number) => items.filter((i) => i.weekIndex === shownWeek && i.weekday === d).length;

  // --- Item mutations ------------------------------------------------------
  const updateItem = (key: number, change: Partial<RoutineItem>) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...change } : it)));

  const removeItem = (key: number) => setItems((prev) => prev.filter((it) => it.key !== key));

  /** Re-sorts once the start time is committed, so rows don't jump while typing. */
  const reorder = () => setItems((prev) => sortItems(prev));

  const addItem = () => {
    const latest = visible.reduce<DraftItem | undefined>((a, b) => (a && a.startTime > b.startTime ? a : b), undefined);
    setItems((prev) => sortItems([...prev, { ...createItem(shownWeek, weekday, latest), key: nextKey.current++ }]));
  };

  // --- Save ----------------------------------------------------------------
  const save = () => {
    const kept = sortItems(items.filter((i) => i.weekIndex < weeks)).map(({ key: _key, ...item }) => item);
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
      {visible.some((i) => overlapping.has(i.key)) ? (
        <p className="error">Highlighted items overlap. An item and its break must finish before the next one starts.</p>
      ) : null}
      <ul className="editor-items">
        {visible.map((item) => (
          <RoutineItemEditor
            key={item.key}
            item={item}
            tags={tags}
            conflict={overlapping.has(item.key)}
            onChange={(change) => updateItem(item.key, change)}
            onStartCommitted={reorder}
            onRemove={() => removeItem(item.key)}
          />
        ))}
      </ul>
    </div>
  );
}
