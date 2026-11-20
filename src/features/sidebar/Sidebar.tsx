import { HistoryIcon, PlusIcon, SettingsIcon, SidebarIcon, TodayIcon } from "../../components/Icons";
import { useConfirm } from "../../components/useConfirm";
import type { RoutineActions } from "../../hooks/useAppData";
import { useStoredState } from "../../hooks/useStoredState";
import { orderedWeekdays } from "../../lib/constants";
import type { Routine, Settings, TodayData, View } from "../../lib/types";
import { NavButton } from "./NavButton";
import { RoutineGroup } from "./RoutineGroup";

interface SidebarProps {
  routines: Routine[];
  today: TodayData | null;
  settings: Settings;
  view: View;
  setView: (view: View) => void;
  routineActions: RoutineActions;
}

export function Sidebar({ routines, today, settings, view, setView, routineActions }: SidebarProps) {
  const [collapsed, setCollapsed] = useStoredState("sidebarCollapsed", false);
  const [openIds, setOpenIds] = useStoredState<number[]>("openRoutines", []);
  const [askConfirm, confirmDialog] = useConfirm();

  const days = orderedWeekdays(settings.weekStart);
  const toggleLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";

  const toggleOpen = (id: number) =>
    setOpenIds(openIds.includes(id) ? openIds.filter((x) => x !== id) : [...openIds, id]);

  const confirmDelete = (routine: Routine) =>
    askConfirm(`Delete "${routine.name}" and all of its scheduled items? This cannot be undone.`, async () => {
      await routineActions.remove(routine.id as number);
      if (view.kind === "preview" || view.kind === "edit") setView({ kind: "today" });
    });

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* --- Collapse toggle ---------------------------------------------- */}
      <button className="collapse-toggle" title={toggleLabel} aria-label={toggleLabel} onClick={() => setCollapsed(!collapsed)}>
        <SidebarIcon collapsed={collapsed} />
      </button>

      <NavButton
        icon={<TodayIcon />}
        label="Today"
        collapsed={collapsed}
        selected={view.kind === "today"}
        onClick={() => setView({ kind: "today" })}
      />

      {/* --- Routines ----------------------------------------------------- */}
      {collapsed ? null : (
        <>
          <div className="section-head">
            <span>Routines</span>
            <button className="icon add" title="New routine" onClick={() => setView({ kind: "edit", routineId: null })}>
              <PlusIcon />
            </button>
          </div>

          <div className="routine-list">
            {routines.length === 0 ? <p className="muted small pad">No routines yet.</p> : null}
            {routines.map((routine) => {
              const id = routine.id as number;
              const active = today?.activeRoutineId === id;
              return (
                <RoutineGroup
                  key={id}
                  routine={routine}
                  days={days}
                  open={openIds.includes(id)}
                  active={active}
                  todayWeekday={today?.weekday ?? null}
                  selectedWeekday={view.kind === "preview" && view.routineId === id ? view.weekday : null}
                  onToggleOpen={() => toggleOpen(id)}
                  onToggleActive={() => routineActions.setActive(active ? null : id)}
                  onTogglePin={() => routineActions.togglePin(routine)}
                  onSelectDay={(weekday) => setView({ kind: "preview", routineId: id, weekday })}
                  onEdit={() => setView({ kind: "edit", routineId: id })}
                  onDelete={() => confirmDelete(routine)}
                />
              );
            })}
          </div>
        </>
      )}

      {/* --- Footer navigation -------------------------------------------- */}
      <div className="spacer" />
      <NavButton
        icon={<HistoryIcon />}
        label="History"
        collapsed={collapsed}
        selected={view.kind === "history"}
        onClick={() => setView({ kind: "history" })}
      />
      <NavButton
        icon={<SettingsIcon />}
        label="Settings"
        collapsed={collapsed}
        selected={view.kind === "settings"}
        onClick={() => setView({ kind: "settings" })}
      />

      {confirmDialog}
    </aside>
  );
}
