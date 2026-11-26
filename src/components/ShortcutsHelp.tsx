import { Modal } from "./Modal";
import { formatShortcut, SHORTCUTS } from "../lib/shortcuts";
import type { ShortcutId } from "../lib/shortcuts";

export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Keyboard shortcuts" onClose={onClose}>
      <ul className="shortcut-list">
        {(Object.keys(SHORTCUTS) as ShortcutId[]).map((id) => (
          <li key={id}>
            <span>{SHORTCUTS[id].label}</span>
            <kbd className="kbd">{formatShortcut(id)}</kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
