import { useAudioReady } from "../../hooks/useAudioReady";
import { useNotificationPermission } from "../../hooks/useNotificationPermission";
import { playSound } from "../../lib/sound";
import type { SettingKey, Settings } from "../../lib/types";
import { PermissionStatus, SettingRow } from "./SettingRow";
import { VolumeSlider } from "./VolumeSlider";

interface AlertSettingsProps {
  settings: Settings;
  onChange: (key: SettingKey, value: string) => void;
  onTestAlert: () => void;
}

export function AlertSettings({ settings, onChange, onTestAlert }: AlertSettingsProps) {
  const notificationPermission = useNotificationPermission();
  const audio = useAudioReady();

  const toggleNotifications = (enabled: boolean) => {
    onChange("notifications", enabled ? "1" : "0");
    if (enabled) notificationPermission.request();
  };

  // Turning sound on is a user gesture, so it also grants the WebView audio access.
  const toggleSound = async (enabled: boolean) => {
    onChange("sound_enabled", enabled ? "1" : "0");
    if (!enabled) return;
    await audio.allow();
    playSound(settings.soundId, settings.soundVolume);
  };

  const allowSound = async () => {
    await audio.allow();
    playSound(settings.soundId, settings.soundVolume);
  };

  const commitVolume = async (volume: number) => {
    onChange("sound_volume", String(volume));
    await audio.allow();
    playSound(settings.soundId, volume);
  };

  return (
    <>
      <SettingRow
        title="System notifications"
        description={
          <>
            Show a notification when a todo is due to start and when a break ends.{" "}
            <PermissionStatus
              allowed={notificationPermission.granted}
              allowedText="Permission granted."
              blockedText="Permission needed."
              actionLabel="Allow notifications"
              onAction={notificationPermission.request}
            />
          </>
        }
      >
        <input
          type="checkbox"
          className="switch"
          aria-label="System notifications"
          checked={settings.notifications}
          onChange={(e) => toggleNotifications(e.target.checked)}
        />
      </SettingRow>

      <SettingRow
        title="Play a sound"
        description={
          <>
            Play the selected sound for each alert.{" "}
            <PermissionStatus
              allowed={audio.ready}
              allowedText="Audio allowed."
              blockedText="Audio is blocked until you allow it."
              actionLabel="Allow sound"
              onAction={allowSound}
            />
          </>
        }
      >
        <input
          type="checkbox"
          className="switch"
          aria-label="Play a sound"
          checked={settings.soundEnabled}
          onChange={(e) => toggleSound(e.target.checked)}
        />
      </SettingRow>

      <SettingRow title="Volume" description="How loud alerts play. Release the slider to hear a preview.">
        <VolumeSlider value={settings.soundVolume} disabled={!settings.soundEnabled} onCommit={commitVolume} />
      </SettingRow>

      <SettingRow title="Test alert" description="Sends a notification and plays the sound using your current settings.">
        <button className="btn ghost" onClick={onTestAlert}>
          Send test
        </button>
      </SettingRow>
    </>
  );
}
