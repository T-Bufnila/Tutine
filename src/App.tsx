import { useEffect, useState } from "react";
import { HistoryView } from "./features/history/HistoryView";
import { RoutineEditor } from "./features/routines/RoutineEditor";
import { RoutinePreview } from "./features/routines/RoutinePreview";
import { SettingsView } from "./features/settings/SettingsView";
import { Sidebar } from "./features/sidebar/Sidebar";
import { TodayView } from "./features/today/TodayView";
import { useTodayActions } from "./features/today/useTodayActions";
import { useAppData } from "./hooks/useAppData";
import { useAlert, useDueAlerts } from "./hooks/useAlerts";
import { useClock } from "./hooks/useClock";
import { useTheme } from "./hooks/useTheme";
import { useTypography } from "./hooks/useTypography";
import type { Routine, View } from "./lib/types";
import { installAudioUnlock } from "./lib/sound";

export default function App() {
  const data = useAppData();
  const { routines, today, settings, error, routineActions } = data;

  const [view, setView] = useState<View>({ kind: "today" });
  const now = useClock(data.reloadToday);
  useTheme(settings.theme);
  useTypography(settings.fontFamily, settings.fontSize);
  const raiseAlert = useAlert(settings);
  const todayActions = useTodayActions({ ...data, alert: raiseAlert });
  useDueAlerts(today, settings, raiseAlert);

  // WebViews block audio until the first user gesture.
  useEffect(() => installAudioUnlock(), []);

  const findRoutine = (id: number | null) => routines.find((r) => r.id === id) ?? null;

  const saveRoutine = async (routine: Routine) => {
    const id = await routineActions.save(routine);
    if (id !== undefined) setView({ kind: "preview", routineId: id, weekday: today?.weekday ?? 0 });
  };

  // --- Main content for the current view -------------------------------------
  const renderView = () => {
    if (!today) return null;

    switch (view.kind) {
      case "today":
        return <TodayView today={today} settings={settings} now={now} actions={todayActions} />;

      case "preview": {
        const routine = findRoutine(view.routineId);
        if (!routine) return null;
        return (
          <RoutinePreview
            key={routine.id}
            routine={routine}
            weekday={view.weekday}
            settings={settings}
            onSelectDay={(weekday) => setView({ ...view, weekday })}
            onEdit={() => setView({ kind: "edit", routineId: view.routineId })}
          />
        );
      }

      case "edit":
        return (
          <RoutineEditor
            key={view.routineId ?? "new"}
            routine={findRoutine(view.routineId)}
            settings={settings}
            onSave={saveRoutine}
            onCancel={() =>
              setView(
                view.routineId === null
                  ? { kind: "today" }
                  : { kind: "preview", routineId: view.routineId, weekday: today.weekday },
              )
            }
          />
        );

      case "history":
        return <HistoryView settings={settings} refreshKey={today} />;

      case "settings":
        return (
          <SettingsView
            settings={settings}
            onChange={data.updateSetting}
            onTestAlert={() => raiseAlert("Tutine", "This is how a due todo will alert you.")}
            onSoundsChanged={data.reloadAll}
          />
        );
    }
  };

  return (
    <div className="app">
      <Sidebar
        routines={routines}
        today={today}
        settings={settings}
        view={view}
        setView={setView}
        routineActions={routineActions}
      />
      <main className="content">
        {error ? <p className="error banner">{error}</p> : null}
        {renderView()}
      </main>
    </div>
  );
}
