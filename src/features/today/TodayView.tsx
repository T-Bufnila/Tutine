import { useMemo, useState } from "react";
import { EditIcon, PlusIcon, TrashIcon } from "../../components/Icons";
import { PageHeader } from "../../components/PageHeader";
import { useConfirm } from "../../components/useConfirm";
import { fmtLongDate, isWithin } from "../../lib/time";
import type { Settings, TodayData, Todo } from "../../lib/types";
import { BreakTodo } from "./BreakTodo";
import { TodoForm } from "./TodoForm";
import { TodoItem } from "./TodoItem";
import { summarize, unlockedBreakIds } from "./todoUtils";
import type { TodayActions } from "./useTodayActions";

interface TodayViewProps {
  today: TodayData;
  settings: Settings;
  now: Date;
  actions: TodayActions;
}

/** `null` = closed, `{}` = new temp todo, `{ todo }` = editing that todo. */
type FormState = { todo?: Todo } | null;

export function TodayView({ today, settings, now, actions }: TodayViewProps) {
  const [form, setForm] = useState<FormState>(null);
  const [askConfirm, confirmDialog] = useConfirm();

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
        <button className="temp-add" onClick={() => setForm({})}>
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
