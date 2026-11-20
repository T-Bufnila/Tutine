import { useState } from "react";
import { Modal, ModalActions } from "../../components/Modal";

const MAX_NAME_CHARS = 60;

interface SoundNameFormProps {
  title: string;
  initialName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

export function SoundNameForm({ title, initialName, onSave, onClose }: SoundNameFormProps) {
  const [name, setName] = useState(initialName);
  const canSave = name.trim() !== "";

  const submit = () => {
    if (!canSave) return;
    onSave(name.trim());
    onClose();
  };

  return (
    <Modal title={title} onClose={onClose}>
      <label className="field">
        <span>Name</span>
        <input
          autoFocus
          maxLength={MAX_NAME_CHARS}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          onFocus={(e) => e.currentTarget.select()}
        />
      </label>
      <ModalActions>
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn primary" disabled={!canSave} onClick={submit}>
          Save
        </button>
      </ModalActions>
    </Modal>
  );
}
