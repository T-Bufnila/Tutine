import type { SettingKey, Settings } from "../../lib/types";
import { AlertSettings } from "./AlertSettings";
import { SettingRow, SettingsSection } from "./SettingRow";
import { SoundLibrary } from "./SoundLibrary";

interface SettingsViewProps {
  settings: Settings;
  onChange: (key: SettingKey, value: string) => void;
  onTestAlert: () => void;
  onSoundsChanged: () => void;
}

export function SettingsView({ settings, onChange, onTestAlert, onSoundsChanged }: SettingsViewProps) {
  return (
    <div className="page">
      <header className="page-head">
        <h1>Settings</h1>
      </header>

      <SettingsSection title="Alerts">
        <AlertSettings settings={settings} onChange={onChange} onTestAlert={onTestAlert} />
        <SoundLibrary
          selectedId={settings.soundId}
          onSelect={(id) => onChange("sound_id", id)}
          onSoundsChanged={onSoundsChanged}
        />
      </SettingsSection>

      <SettingsSection title="General">
        <SettingRow title="24-hour clock" description="Show times as 18:30 instead of 6:30 PM.">
          <input
            type="checkbox"
            className="switch"
            aria-label="24-hour clock"
            checked={settings.use24h}
            onChange={(e) => onChange("time_format", e.target.checked ? "24" : "12")}
          />
        </SettingRow>

        <SettingRow title="Week starts on" description="Affects weekday order, multi-week cycles and the heatmap.">
          <select
            aria-label="Week starts on"
            value={settings.weekStart}
            onChange={(e) => onChange("week_start", e.target.value)}
          >
            <option value="mon">Monday</option>
            <option value="sun">Sunday</option>
          </select>
        </SettingRow>
      </SettingsSection>
    </div>
  );
}
