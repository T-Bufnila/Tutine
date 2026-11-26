import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { TagLabel } from "../../components/TagLabel";
import { api } from "../../lib/api";
import { fmtLongDate, fmtRange } from "../../lib/time";
import type { FutureDay, FutureItem, Settings, Tag } from "../../lib/types";
import { parseDate } from "./calendar";
import { NoteForm } from "./NoteForm";

interface FutureDayViewProps {
  date: string;
  tags: Tag[];
  settings: Settings;
  onBack: () => void;
}

/** A future day's routine; pressing a todo lets you attach a note to it. */
export function FutureDayView({ date, tags, settings, onBack }: FutureDayViewProps) {
  const [day, setDay] = useState<FutureDay | null>(null);
  const [editing, setEditing] = useState<FutureItem | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setDay(await api.getFutureDay(date));
    } catch (e) {
      setError(String(e));
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const saveNote = async (item: FutureItem, note: string) => {
    try {
      setError("");
      await api.setFutureNote(date, item.title, item.startTime, note);
      await load();
    } catch (e) {
      setError(String(e));
    }
  };

  const subtitle = day ? (day.routineName ?? "No active routine") : "";

  return (
    <div className="page">
      <PageHeader title={fmtLongDate(parseDate(date))} subtitle={subtitle}>
        <button className="btn ghost" onClick={onBack}>
          ‹ Calendar
        </button>
      </PageHeader>

      {error ? <p className="error">{error}</p> : null}
      {day && day.items.length === 0 ? <p className="empty">Nothing scheduled</p> : null}

      <ul className="todo-list">
        {day?.items.map((item) => (
          <li
            key={`${item.startTime}-${item.title}`}
            className="todo clickable"
            role="button"
            tabIndex={0}
            title={item.note ? "Edit note" : "Add a note"}
            onClick={() => setEditing(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setEditing(item);
              }
            }}
          >
            <div className="todo-main">
              <div className="todo-text">
                <span className="todo-title">{item.title}</span>
                {item.note ? <span className="todo-note">{item.note}</span> : null}
              </div>
            </div>
            <TagLabel tag={tags.find((t) => t.id === item.tagId)} />
            <span className="time">{fmtRange(item.startTime, item.endTime, settings.use24h)}</span>
          </li>
        ))}
      </ul>

      {editing ? (
        <NoteForm
          title={editing.title}
          initial={editing.note ?? ""}
          onSave={(note) => saveNote(editing, note)}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}
