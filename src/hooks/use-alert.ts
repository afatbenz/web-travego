import * as React from 'react';

export type AlertType = 'success' | 'error' | 'warning';

export type AlertOptions = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  confirmText?: string;
  type?: AlertType;
  onConfirm?: () => void;
};

type State = AlertOptions & { open: boolean };

let memoryState: State = { open: false };
const listeners: Array<(s: State) => void> = [];

function notify() {
  listeners.forEach((l) => l(memoryState));
}

export function showAlert(options: AlertOptions) {
  memoryState = { open: true, ...options };
  notify();
}

export function hideAlert() {
  const cb = memoryState.onConfirm;
  memoryState = { ...memoryState, open: false };
  notify();
  if (cb) cb();
}

export function useAlert() {
  const [state, setState] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);
  return { ...state, showAlert, hideAlert };
}
