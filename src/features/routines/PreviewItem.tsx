import { BreakHeader } from "../../components/BreakHeader";
import { TagLabel } from "../../components/TagLabel";
import { addMinutes, fmtRange } from "../../lib/time";
import type { RoutineItem } from "../../lib/types";

/** Read-only routine item, followed by its indented break when it has one. */
export function PreviewItem({ item, use24h }: { item: RoutineItem; use24h: boolean }) {
  return (
    <>
      <li className="todo">
        <div className="todo-main">
          <span className="todo-title">{item.title}</span>
        </div>
        <TagLabel tag={item.tag} color={item.color} />
        <span className="time">{fmtRange(item.startTime, item.endTime, use24h)}</span>
      </li>

      {item.breakMinutes > 0 ? (
        <li className="todo break locked">
          <BreakHeader
            minutes={item.breakMinutes}
            startTime={item.endTime}
            endTime={addMinutes(item.endTime, item.breakMinutes)}
            use24h={use24h}
          />
        </li>
      ) : null}
    </>
  );
}
