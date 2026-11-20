import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { Tabs } from "../../components/Tabs";
import { api } from "../../lib/api";
import type { HistoryDay, Settings } from "../../lib/types";
import { computeStats, currentStreak, monthStart, yearStart } from "./heatmap";
import { MonthHeatmap } from "./MonthHeatmap";
import { HeatLegend, StatCards } from "./StatCards";
import { YearHeatmap } from "./YearHeatmap";

type Range = "month" | "year";

const RANGE_TABS = [
  { value: "month" as const, label: "Month" },
  { value: "year" as const, label: "Year" },
];

/** Enough days to cover the year view plus week alignment. */
const FETCH_DAYS = 400;

interface HistoryViewProps {
  settings: Settings;
  /** Changing this refetches history (e.g. after a todo is toggled). */
  refreshKey: unknown;
}

export function HistoryView({ settings, refreshKey }: HistoryViewProps) {
  const [range, setRange] = useState<Range>("month");
  const [history, setHistory] = useState<HistoryDay[]>([]);

  useEffect(() => {
    api.getHistory(FETCH_DAYS).then(setHistory, () => setHistory([]));
  }, [refreshKey]);

  const now = new Date();
  const from = range === "month" ? monthStart(now) : yearStart(now);
  const byDate = useMemo(() => new Map(history.map((h) => [h.date, h])), [history]);
  const stats = useMemo(() => computeStats(history.filter((h) => h.date >= from)), [history, from]);

  const subtitle =
    range === "month" ? now.toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "Last 12 months";

  return (
    <div className="page">
      <PageHeader title="History" subtitle={subtitle}>
        <Tabs items={RANGE_TABS} value={range} onChange={setRange} />
      </PageHeader>

      <StatCards
        stats={[
          { value: stats.completed, label: "completed" },
          { value: `${stats.rate}%`, label: "completion rate" },
          { value: stats.activeDays, label: "active days" },
          { value: stats.best, label: "best day" },
          { value: currentStreak(byDate, now), label: "day streak" },
        ]}
      />

      {range === "month" ? (
        <MonthHeatmap byDate={byDate} weekStart={settings.weekStart} now={now} />
      ) : (
        <YearHeatmap byDate={byDate} weekStart={settings.weekStart} now={now} />
      )}
      <HeatLegend />
    </div>
  );
}
