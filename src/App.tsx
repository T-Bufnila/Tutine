import { useEffect, useState } from "react";
import { FutureRefView } from "./features/future/FutureRefView";
import { HistoryView } from "./features/history/HistoryView";
import { RoutineEditor } from "./features/routines/RoutineEditor";
import { RoutinePreview } from "./features/routines/RoutinePreview";
import { SettingsView } from "./features/settings/SettingsView";
import { MiniPlayer } from "./features/music/MiniPlayer";
import { SpotifyModal } from "./features/music/SpotifyModal";
import { useMusic } from "./features/music/useMusic";
import { Sidebar } from "./features/sidebar/Sidebar";
import { TagConfigView } from "./features/tags/TagConfigView";
import { TodayView } from "./features/today/TodayView";
import { useTodayActions } from "./features/today/useTodayActions";
import { ShortcutsHelp } from "./components/ShortcutsHelp";
import { useAppData } from "./hooks/useAppData";
import { useAlert, useDueAlerts } from "./hooks/useAlerts";
import { ShortcutHintsProvider, useShortcut } from "./hooks/useShortcuts";
import { useClock } from "./hooks/useClock";
import { useTheme } from "./hooks/useTheme";
import { useUpdateCheck } from "./hooks/useUpdateCheck";
import { useTypography } from "./hooks/useTypography";
import type { Routine, View } from "./lib/types";
import { installAudioUnlock } from "./lib/sound";

export default function App() {
  const data = useAppData();
  const { routines, tags, today, settings, error, routineActions } = data;

  const [view, setView] = useState<View>({ kind: "today" });
  const [helpOpen, setHelpOpen] = useState(false);
  const music = useMusic();
  const { version, update } = useUpdateCheck();
  const now = useClock(data.reloadToday);
  useTheme(settings.theme);
  useTypography(settings.fontFamily, settings.fontSize);
  const raiseAlert = useAlert(settings);
  const todayActions = useTodayActions({ ...data, alert: raiseAlert });
  useDueAlerts(today, settings, raiseAlert);

  useShortcut("history", () => setView({ kind: "history" }));
  useShortcut("tags", () => setView({ kind: "tags" }));
  useShortcut("settings", () => setView({ kind: "settings" }));
  useShortcut("futureRef", () => setView({ kind: "future", date: null }));
  useShortcut("help", () => setHelpOpen(true));

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
        return (
          <TodayView
            today={today}
            tags={tags}
            settings={settings}
            now={now}
            actions={todayActions}
            onOpenFutureRef={() => setView({ kind: "future", date: null })}
          />
        );

      case "preview": {
        const routine = findRoutine(view.routineId);
        if (!routine) return null;
        return (
          <RoutinePreview
            key={routine.id}
            routine={routine}
            tags={tags}
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
            tags={tags}
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

      case "future":
        return (
          <FutureRefView
            date={view.date}
            tags={tags}
            settings={settings}
            now={now}
            onSelectDate={(date) => setView({ kind: "future", date })}
          />
        );

      case "history":
        return <HistoryView settings={settings} refreshKey={today} />;

      case "tags":
        return <TagConfigView tags={tags} actions={data.tagActions} />;

      case "settings":
        return (
          <SettingsView
            settings={settings}
            version={version}
            update={update}
            onChange={data.updateSetting}
            onTestAlert={() => raiseAlert("Tutine", "This is how a due todo will alert you.")}
            onSoundsChanged={data.reloadAll}
          />
        );
    }
  };

  return (
    <ShortcutHintsProvider value={settings.showShortcuts}>
      <div className="app">
        <Sidebar
          routines={routines}
          today={today}
          settings={settings}
          view={view}
          setView={setView}
          routineActions={routineActions}
          music={music}
          updateAvailable={update !== null}
        />
        <main className="content">
          {error ? <p className="error banner">{error}</p> : null}
          {renderView()}
        </main>
        {music.spotifyOpen ? <SpotifyModal onClose={music.closeSpotify} onStarted={music.spotifyStarted} /> : null}
        <MiniPlayer music={music} />
        <div className="music-host" ref={music.hostRef} aria-hidden="true" />
        {helpOpen ? <ShortcutsHelp onClose={() => setHelpOpen(false)} /> : null}
      </div>
    </ShortcutHintsProvider>
  );
}
