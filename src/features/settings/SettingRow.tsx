import type { ReactNode } from "react";

interface SettingRowProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
}

export function SettingRow({ title, description, children }: SettingRowProps) {
  return (
    <div className="setting">
      <div>
        <strong>{title}</strong>
        <div className="muted small">{description}</div>
      </div>
      {children}
    </div>
  );
}

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="settings-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

/** Small status line with an optional action, e.g. "Allowed" or "Blocked · Allow". */
export function PermissionStatus({
  allowed,
  allowedText,
  blockedText,
  actionLabel,
  onAction,
}: {
  allowed: boolean | null;
  allowedText: string;
  blockedText: string;
  actionLabel: string;
  onAction: () => void;
}) {
  if (allowed === null) return null;
  return (
    <span className={`permission ${allowed ? "ok" : "blocked"}`}>
      {allowed ? allowedText : blockedText}
      {allowed ? null : (
        <button className="link" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </span>
  );
}
