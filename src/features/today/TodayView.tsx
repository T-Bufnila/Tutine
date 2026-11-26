import { useMemo, useState } from "react";
import { CalendarIcon, EditIcon, PlusIcon, TrashIcon } from "../../components/Icons";
import { PageHeader } from "../../components/PageHeader";
import { useConfirm } from "../../components/useConfirm";
import { useHintedLabel, useShortcut } from "../../hooks/useShortcuts";
import { fmtLongDate, isWithin } from "../../lib/time";
import type { Settings, Tag, TodayData, Todo } from "../../lib/types";
import { BreakTodo } from "./BreakTodo";
import { TodoForm } from "./TodoForm";
import { TodoItem } from "./TodoItem";
import { summarize, unlockedBreakIds } from "./todoUtils";
import type { TodayActions } from "./useTodayActions";

interface TodayViewProps {
  today: TodayData;
  tags: Tag[];
  settings: Settings;
  now: Date;
  actions: TodayActions;
  onOpenFutureRef: () => void;
}

/** `null` = closed, `{}` = new temp todo, `{ todo }` = editing that todo. */
type FormState = { todo?: Todo } | null;

export function TodayView({ today, tags, settings, now, actions, onOpenFutureRef }: TodayViewProps) {
  const [form, setForm] = useState<FormState>(null);
  const [askConfirm, confirmDialog] = useConfirm();
  const futureRefTitle = useHintedLabel("Open Future Ref", "futureRef");
  const newTempTitle = useHintedLabel("New temp todo", "newTemp");

  useShortcut("newTemp", () => setForm({}));

  const { total, done, hasSchedule } = summarize(today.todos);
  const unlocked = useMemo(() => unlockedBreakIds(today.todos), [today.todos]);

  const subtitle = [today.activeRoutineName ?? "No active routine", total > 0 ? `${done} of ${total} done` : null]
    .filter(Boolean)
    .join(" · ");

  const saveForm = (title: string, start: string, end: string) => {
    if (form?.todo) actions.editTemp(form.todo.id, title, start, end);
    else actions.addTemp(title, start, end);
  };

  return (
    <div className="page">
      <PageHeader title={fmtLongDate(now)} subtitle={subtitle}>
        <button className="temp-add future-ref-btn" title={futureRefTitle} onClick={onOpenFutureRef}>
          <CalendarIcon /> Future Ref
        </button>
        <button className="temp-add" title={newTempTitle} onClick={() => setForm({})}>
          <PlusIcon size={18} /> Temp todo
        </button>
      </PageHeader>

      {hasSchedule ? null : <p className="empty">No routine for today</p>}

      <ul className="todo-list">
        {today.todos.map((todo) =>
          todo.kind === "break" ? (
            <BreakTodo
              key={todo.id}
              todo={todo}
              timer={actions.timers[todo.id]}
              use24h={settings.use24h}
              locked={!todo.done && !unlocked.has(todo.id)}
              onToggle={() => actions.toggle(todo)}
              onStart={() => actions.startBreak(todo)}
              onPause={() => actions.pauseBreak(todo)}
              onSkip={() => actions.skipBreak(todo)}
            />
          ) : (
            <TodoItem
              key={todo.id}
              todo={todo}
              tag={tags.find((t) => t.id === todo.tagId)}
              use24h={settings.use24h}
              current={isWithin(now, todo.startTime, todo.endTime)}
              onToggle={() => actions.toggle(todo)}
              actions={
                todo.kind === "custom" ? (
                  <>
                    <button className="icon" title="Edit" onClick={() => setForm({ todo })}>
                      <EditIcon />
                    </button>
                    <button
                      className="icon del"
                      title="Delete"
                      onClick={() => askConfirm(`Delete "${todo.title}"?`, () => actions.deleteTemp(todo.id))}
                    >
                      <TrashIcon />
                    </button>
                  </>
                ) : undefined
              }
            />
          ),
        )}
      </ul>

      {form ? (
        <TodoForm
          title={form.todo ? "Edit temp todo" : "New temp todo"}
          initial={form.todo}
          onSave={({ title, startTime, endTime }) => saveForm(title, startTime, endTime)}
          onClose={() => setForm(null)}
        />
      ) : null}
      {confirmDialog}
    </div>
  );
}
