import { useCallback, useState } from 'react';
import { ConfirmDialog } from '../components/layout/ConfirmDialog';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

/**
 * Promise-based stand-in for window.confirm(), rendered with the app's own retro
 * styling. Usage: `const ok = await confirm({ message: '...' }); if (ok) { ... }`,
 * and render `{dialog}` once somewhere in the component's JSX tree.
 */
export function useConfirmDialog() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  function handleConfirm() {
    pending?.resolve(true);
    setPending(null);
  }

  function handleCancel() {
    pending?.resolve(false);
    setPending(null);
  }

  const dialog = (
    <ConfirmDialog
      open={pending !== null}
      title={pending?.title}
      message={pending?.message ?? ''}
      confirmLabel={pending?.confirmLabel}
      cancelLabel={pending?.cancelLabel}
      danger={pending?.danger}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, dialog };
}
