import { RetroButton, type RetroButtonVariant } from './RetroButton';
import { RetroPanel } from './RetroPanel';

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A retro-styled stand-in for window.confirm(), which can't be restyled. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Bekreft',
  cancelLabel = 'Avbryt',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmVariant: RetroButtonVariant = danger ? 'danger' : 'primary';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onClick={onCancel}
      role="presentation"
    >
      <RetroPanel className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        {title && <p className="mb-2 text-lg font-bold text-ink">{title}</p>}
        <p className="text-sm text-ink/80">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <RetroButton type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </RetroButton>
          <RetroButton type="button" variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </RetroButton>
        </div>
      </RetroPanel>
    </div>
  );
}
