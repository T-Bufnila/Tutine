import { PageHeader } from "../../components/PageHeader";
import type { Settings, Tag } from "../../lib/types";
import { FutureCalendar } from "./FutureCalendar";
import { FutureDayView } from "./FutureDayView";

interface FutureRefViewProps {
  /** `null` shows the calendar; a date shows that day's routine. */
  date: string | null;
  tags: Tag[];
  settings: Settings;
  now: Date;
  onSelectDate: (date: string | null) => void;
}

export function FutureRefView({ date, tags, settings, now, onSelectDate }: FutureRefViewProps) {
  if (date) {
    return <FutureDayView key={date} date={date} tags={tags} settings={settings} onBack={() => onSelectDate(null)} />;
  }

  return (
    <div className="page">
      <PageHeader title="Future Ref" subtitle="Pick a day to leave notes on its routine" />
      <FutureCalendar weekStart={settings.weekStart} now={now} onSelectDate={onSelectDate} />
    </div>
  );
}
