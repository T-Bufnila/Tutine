import { useState } from "react";
import { Modal, ModalActions } from "../../components/Modal";
import { useHintedLabel, useShortcut } from "../../hooks/useShortcuts";

export const MAX_NOTE_CHARS = 200;

interface NoteFormProps {
  title: string;
  initial: string;
  onSave: (note: string) => void;
  onClose: () => void;
}

export function NoteForm({ title, initial, onSave, onClose }: NoteFormProps) {
  const [note, setNote] = useState(initial);

  const submit = () => {
    onSave(note.trim());
    onClose();
  };

  const saveTitle = useHintedLabel("Save", "save");
  useShortcut("save", submit, { inDialog: true });

  return (
    <Modal title={`Note for "${title}"`} onClose={onClose}>
      <label className="field">
        <span>Note</span>
        <input
          autoFocus
          value={note}
          maxLength={MAX_NOTE_CHARS}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Shown on this todo that day"
        />
      </label>
      <ModalActions>
        {initial ? (
          <button
            className="btn danger"
            onClick={() => {
              onSave("");
              onClose();
            }}
          >
            Remove
          </button>
        ) : null}
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn primary" title={saveTitle} disabled={note.trim() === ""} onClick={submit}>
          Save
        </button>
      </ModalActions>
    </Modal>
  );
}
