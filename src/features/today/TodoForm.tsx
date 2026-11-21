import { useState } from "react";
import { Modal, ModalActions } from "../../components/Modal";

interface TodoFormValues {
  title: string;
  startTime: string;
  endTime: string;
}

interface TodoFormProps {
  title: string;
  initial?: TodoFormValues;
  onSave: (values: TodoFormValues) => void;
  onClose: () => void;
}

export function TodoForm({ title, initial, onSave, onClose }: TodoFormProps) {
  const [name, setName] = useState(initial?.title ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");

  const endBeforeStart = startTime !== "" && endTime !== "" && endTime <= startTime;
  const endWithoutStart = endTime !== "" && startTime === "";
  const canSave = name.trim() !== "" && !endBeforeStart && !endWithoutStart;

  const submit = () => {
    if (!canSave) return;
    onSave({ title: name.trim(), startTime, endTime });
    onClose();
  };

  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted small form-note">Temp todos only exist for today and are removed at midnight.</p>
      <label className="field">
        <span>Title</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="What needs doing today?"
        />
      </label>
      <div className="row">
        <label className="field">
          <span>Start (optional)</span>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </label>
        <label className="field">
          <span>End (optional)</span>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </label>
      </div>
      {endBeforeStart ? <p className="error">End must be after start.</p> : null}
      {endWithoutStart ? <p className="error">Add a start time too.</p> : null}
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
