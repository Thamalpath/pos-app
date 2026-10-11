import { create } from 'zustand';

/**
 * Named keys the dock can emit. Kept as a closed union so a sink has to
 * handle them explicitly rather than silently ignore a typo'd string.
 */
export type DockAction =
  | 'backspace'
  | 'clear'
  | 'enter'
  | 'escape'
  | 'tab'
  | 'negate'
  | 'percent'
  | 'focus-search'
  | 'open-held';

export type DockKey = { kind: 'char'; value: string } | { kind: 'action'; action: DockAction };

export const charKey = (value: string): DockKey => ({ kind: 'char', value });
export const actionKey = (action: DockAction): DockKey => ({ kind: 'action', action });

export type DockSink = (key: DockKey) => void;

interface KeyboardDockState {
  isOpen: boolean;
  /** Shown on the dock so the cashier knows where digits are landing. */
  label: string;
  onKey: DockSink | null;

  /** Measured dock height, so the shell can reserve exactly that much. */
  height: number;

  defaultLabel: string;
  defaultSink: DockSink | null;

  /**
   * Optional filter so the board can grey out keys the active sink would
   * ignore. The board is a single keypad, so a cash-amount sink has to mute
   * the letters itself -- otherwise every letter press looks broken.
   */
  accepts: ((key: DockKey) => boolean) | null;

  setHeight: (height: number) => void;
  /** The target the collapsed handle opens. Set by the search field. */
  registerDefault: (
    label: string,
    sink: DockSink,
    accepts?: (key: DockKey) => boolean,
  ) => void;
  /** Takes over temporarily, e.g. while the cash-tender field is in play. */
  open: (
    label: string,
    sink: DockSink,
    accepts?: (key: DockKey) => boolean,
  ) => void;
  close: () => void;
  toggle: () => void;
  press: (key: DockKey) => void;
}

/**
 * Bottom keyboard dock.
 *
 * The dock owns no value of its own. Whoever is receiving keys hands over a
 * sink and interprets them, which keeps "type a barcode" and "type an amount
 * tendered" as two separate, already-correct flows instead of one shared
 * buffer that has to be re-synced when the target changes.
 */
export const useKeyboardDock = create<KeyboardDockState>((set, get) => ({
  isOpen: false,
  label: 'Keyboard',
  onKey: null,
  height: 0,

  defaultLabel: 'Keyboard',
  defaultSink: null,
  accepts: null,

  setHeight: height => {
    // Guard against needless re-renders; ResizeObserver fires often.
    if (Math.abs(get().height - height) < 1) return;
    set({ height });
  },

  registerDefault: (label, sink, accepts) =>
    set({ defaultLabel: label, defaultSink: sink, accepts: accepts ?? null }),

  open: (label, sink, accepts) =>
    set({ isOpen: true, label, onKey: sink, accepts: accepts ?? null }),

  close: () => set({ isOpen: false, onKey: null }),

  toggle: () => {
    const state = get();
    if (state.isOpen) {
      set({ isOpen: false, onKey: null });
      return;
    }
    // Fall back to the last sink pressed if the default has not registered.
    if (state.defaultSink) {
      set({ isOpen: true, label: state.defaultLabel, onKey: state.defaultSink });
    }
  },

  press: key => {
    const state = get();
    const sink = state.onKey ?? state.defaultSink;
    if (!sink) return;

    // Escape both dismisses the dock and reaches the sink, so the focused
    // field can decide whether Esc means "clear" or "leave".
    if (key.kind === 'action' && key.action === 'escape') {
      set({ isOpen: false, onKey: null });
    }

    sink(key);
  }
}));