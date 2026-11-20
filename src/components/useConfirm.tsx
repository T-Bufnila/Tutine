import { useCallback, useState } from "react";
import { Modal, ModalActions } from "./Modal";

interface ConfirmRequest {
  message: string;
  onConfirm: () => void;
}

/**
 * Returns an `ask(message, onConfirm)` function and the dialog element to render.
 * Lets any component own its own delete confirmation.
 */
export function useConfirm() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const close = useCallback(() => setRequest(null), []);

  const ask = useCallback((message: string, onConfirm: () => void) => {
    setRequest({ message, onConfirm });
  }, []);

  const dialog = request ? (
    <Modal title="Are you sure?" onClose={close}>
      <p className="muted">{request.message}</p>
      <ModalActions>
        <button className="btn ghost" onClick={close}>
          Cancel
        </button>
        <button
          className="btn danger"
          onClick={() => {
            request.onConfirm();
            close();
          }}
        >
          Delete
        </button>
      </ModalActions>
    </Modal>
  ) : null;

  return [ask, dialog] as const;
}
