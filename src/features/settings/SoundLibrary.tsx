import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { EditIcon, PlayIcon, PlusIcon, TrashIcon } from "../../components/Icons";
import { useConfirm } from "../../components/useConfirm";
import { BUILTIN_SOUNDS, playSound } from "../../lib/sound";
import type { Sound } from "../../lib/types";
import { SoundNameForm } from "./SoundNameForm";
import { useSounds } from "./useSounds";

const MAX_BYTES = 5 * 1024 * 1024;

interface SoundLibraryProps {
  selectedId: string;
  /** 0-100, used for previews. */
  volume: number;
  onSelect: (soundId: string) => void;
  /** Called after a sound is deleted, since that can reset the selected sound. */
  onSoundsChanged: () => void;
}

/** What the naming dialog is currently for. */
type NameDialog = { kind: "upload"; file: File } | { kind: "rename"; sound: Sound } | null;

export function SoundLibrary({ selectedId, volume, onSelect, onSoundsChanged }: SoundLibraryProps) {
  const { sounds, error, setError, add, rename, remove } = useSounds();
  const [dialog, setDialog] = useState<NameDialog>(null);
  const [askConfirm, confirmDialog] = useConfirm();
  const fileInput = useRef<HTMLInputElement>(null);

  const pickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/\.mp3$/i.test(file.name)) return setError("Only MP3 files are supported.");
    if (file.size > MAX_BYTES) return setError("Sounds can be at most 5 MB.");
    setError("");
    setDialog({ kind: "upload", file });
  };

  const saveName = async (name: string) => {
    if (dialog?.kind === "upload") {
      const created = await add(name, dialog.file);
      if (created) {
        const id = `custom:${created.id}`;
        onSelect(id);
        playSound(id, volume);
      }
    } else if (dialog?.kind === "rename") {
      await rename(dialog.sound.id, name);
    }
  };

  const confirmDelete = (sound: Sound) =>
    askConfirm(`Delete the sound "${sound.name}"?`, async () => {
      await remove(sound.id);
      onSoundsChanged();
    });

  const entries = [
    ...BUILTIN_SOUNDS.map((s) => ({ id: s.id, name: s.name, custom: null as Sound | null })),
    ...sounds.map((s) => ({ id: `custom:${s.id}`, name: s.name, custom: s })),
  ];

  return (
    <div className="sound-library">
      <div className="sound-head">
        <div>
          <strong>Alert sound</strong>
          <div className="muted small">Pick the sound that plays when a todo is due, or upload your own MP3 (up to 5 MB).</div>
        </div>
        <button className="temp-add" onClick={() => fileInput.current?.click()}>
          <PlusIcon size={18} /> Add sound
        </button>
        <input ref={fileInput} type="file" accept=".mp3,audio/mpeg" hidden onChange={pickFile} />
      </div>

      {error ? <p className="error">{error}</p> : null}

      <ul className="sound-list">
        {entries.map((entry) => (
          <li key={entry.id} className={`sound-item ${selectedId === entry.id ? "selected" : ""}`}>
            <label className="sound-pick">
              <input type="radio" name="alert-sound" checked={selectedId === entry.id} onChange={() => onSelect(entry.id)} />
              <span>{entry.name}</span>
              {entry.custom ? null : <span className="muted small">Built-in</span>}
            </label>
            <span className="actions">
              <button className="icon accent" title="Preview" onClick={() => playSound(entry.id, volume)}>
                <PlayIcon />
              </button>
              {entry.custom ? (
                <>
                  <button className="icon" title="Rename" onClick={() => setDialog({ kind: "rename", sound: entry.custom as Sound })}>
                    <EditIcon />
                  </button>
                  <button className="icon del" title="Delete" onClick={() => confirmDelete(entry.custom as Sound)}>
                    <TrashIcon />
                  </button>
                </>
              ) : null}
            </span>
          </li>
        ))}
      </ul>

      {dialog ? (
        <SoundNameForm
          title={dialog.kind === "upload" ? "Name your sound" : "Rename sound"}
          initialName={dialog.kind === "upload" ? dialog.file.name.replace(/\.mp3$/i, "") : dialog.sound.name}
          onSave={saveName}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {confirmDialog}
    </div>
  );
}
