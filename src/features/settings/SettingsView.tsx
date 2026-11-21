import type { SettingKey, Settings } from "../../lib/types";
import { FONT_SIZE_OPTIONS } from "../../lib/typography";
import { Tabs } from "../../components/Tabs";
import { AlertSettings } from "./AlertSettings";
import { FontPicker } from "./FontPicker";
import { SettingRow, SettingsSection } from "./SettingRow";
import { SoundLibrary } from "./SoundLibrary";
import { ThemePicker } from "./ThemePicker";

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

      <SettingsSection title="Appearance">
        <div className="setting-block">
          <strong>Colour theme</strong>
          <div className="muted small">"System" switches between Light and Dark with your operating system.</div>
          <ThemePicker value={settings.theme} onChange={(theme) => onChange("theme", theme)} />
        </div>
      </SettingsSection>

      <SettingsSection title="Accessibility">
        <SettingRow title="Text size" description="Scales all text in the app.">
          <Tabs items={FONT_SIZE_OPTIONS} value={settings.fontSize} onChange={(size) => onChange("font_size", size)} />
        </SettingRow>
        <div className="setting-block">
          <strong>Font</strong>
          <div className="muted small">Pick the typeface that is easiest for you to read.</div>
          <FontPicker value={settings.fontFamily} onChange={(font) => onChange("font_family", font)} />
        </div>
      </SettingsSection>

      <SettingsSection title="Alerts">
        <AlertSettings settings={settings} onChange={onChange} onTestAlert={onTestAlert} />
        <SoundLibrary
          selectedId={settings.soundId}
          volume={settings.soundVolume}
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
