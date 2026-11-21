import { BreakHeader } from "../../components/BreakHeader";
import { TagLabel } from "../../components/TagLabel";
import { addMinutes, fmtRange } from "../../lib/time";
import type { RoutineItem, Tag } from "../../lib/types";

/** Read-only routine item, followed by its indented break when it has one. */
export function PreviewItem({ item, tag, use24h }: { item: RoutineItem; tag: Tag | undefined; use24h: boolean }) {
  return (
    <>
      <li className="todo">
        <div className="todo-main">
          <span className="todo-title">{item.title}</span>
        </div>
        <TagLabel tag={tag} />
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
