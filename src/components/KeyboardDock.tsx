import React, { useEffect, useRef, useState } from "react";
import { cn } from "@pos/ui";
import { Delete } from "lucide-react";
import {
  actionKey,
  charKey,
  useKeyboardDock,
} from "../stores/keyboardDockStore";
import { DOCK_RIGHT_CLASS } from "../lib/layout";

interface KeyDef {
  label: string;
  icon?: React.ReactNode;
  key?: ReturnType<typeof charKey> | ReturnType<typeof actionKey>;
  variant?: "char" | "fn" | "num" | "action" | "edit" | "accent";
  span?: 2 | 3 | 4 | 5 | 6;
  rowSpan?: 2;
  title?: string;
  placeholder?: boolean;
}

const ALPHA = (s: string): KeyDef[] =>
  s.split("").map((label) => ({ label, key: charKey(label) }));
const SYMBOLS = (s: string): KeyDef[] =>
  s.split("").map((label) => ({ label, key: charKey(label) }));
const NUM = (s: string): KeyDef[] =>
  s.split("").map((label) => ({
    label,
    key: charKey(label),
    variant: "num" as const,
  }));

const FN_BOARD: KeyDef[] = [
  {
    label: "⇧",
    variant: "fn",
    title: "Shift — tap to toggle capitals",
  },

  {
    label: "Held",
    key: actionKey("open-held"),
    variant: "fn",
    title: "Held tickets",
  },
  {
    label: "Scan",
    key: actionKey("focus-search"),
    variant: "fn",
    title: "Focus search / barcode",
  },
  { label: "%", key: actionKey("percent"), variant: "fn", title: "Percent" },

  { label: "Disc", placeholder: true, title: "Discount — not wired up yet" },
  { label: "Cust", placeholder: true, title: "Customer — not wired up yet" },
  { label: "Park", placeholder: true, title: "Park ticket — not wired up yet" },
  { label: "Print", placeholder: true, title: "Reprint — not wired up yet" },

  { label: "Qty", placeholder: true, title: "Quantity — not wired up yet" },
  { label: "Void", placeholder: true, title: "Void line — not wired up yet" },
  {
    label: "Drawer",
    placeholder: true,
    title: "Open cash drawer — not wired up yet",
  },
  { label: "Refund", placeholder: true, title: "Refund — not wired up yet" },

  {
    label: "More",
    placeholder: true,
    span: 4,
    title: "More actions — not wired up yet",
  },
];

const ALPHA_BOARD: KeyDef[] = [
  ...ALPHA("qwertyuiop"),
  ...ALPHA("asdfghjkl"),
  { label: ";", key: charKey(";") },
  ...ALPHA("zxcvbnm"),
  ...SYMBOLS(",./"),

  {
    label: "Space",
    key: charKey(" "),
    variant: "edit",
    span: 4,
    title: "Space",
  },
  ...SYMBOLS("-+*=#?"),
];

const NUM_BOARD: KeyDef[] = [
  ...NUM("789"),
  {
    label: "Backspace",
    icon: <Delete className="w-4.5 h-4.5" aria-hidden="true" />,
    key: actionKey("backspace"),
    variant: "edit",
    title: "Backspace",
  },

  ...NUM("456"),
  { label: "C", key: actionKey("clear"), variant: "edit", title: "Clear" },

  ...NUM("123"),
  {
    label: "Enter",
    key: actionKey("enter"),
    variant: "accent",
    rowSpan: 2,
    title: "Confirm",
  },

  { label: "0", key: charKey("0"), variant: "num" },
  { label: "00", key: charKey("00"), variant: "num", title: "Double zero" },
  { label: ".", key: charKey("."), variant: "num" },
];

const SPAN_CLASS: Record<NonNullable<KeyDef["span"]>, string> = {
  2: "kbd-span-2",
  3: "kbd-span-3",
  4: "kbd-span-4",
  5: "kbd-span-5",
  6: "kbd-span-6",
};

const VARIANT_CLASS: Record<NonNullable<KeyDef["variant"]>, string> = {
  char: "",
  fn: "kbd-key--fn",
  num: "kbd-key--num",
  action: "kbd-key--action",
  edit: "kbd-key--edit",
  accent: "kbd-key--accent",
};

export const KeyboardDock: React.FC = () => {
  const isOpen = useKeyboardDock((s) => s.isOpen);
  const label = useKeyboardDock((s) => s.label);
  const press = useKeyboardDock((s) => s.press);
  const toggle = useKeyboardDock((s) => s.toggle);
  const close = useKeyboardDock((s) => s.close);

  const hasTarget = useKeyboardDock(
    (s) => s.defaultSink !== null || s.onKey !== null,
  );
  const setHeight = useKeyboardDock((s) => s.setHeight);
  const accepts = useKeyboardDock((s) => s.accepts);

  const [isShiftArmed, setIsShiftArmed] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = dockRef.current;
    if (!node) return;

    setHeight(node.offsetHeight);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setHeight(entry.contentRect.height);
    });
    observer.observe(node);

    return () => {
      observer.disconnect();
      setHeight(0);
    };
  }, [setHeight]);

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const startY = dragStartY.current;
    dragStartY.current = null;
    if (startY === null) return;

    const deltaY = event.clientY - startY;
    const SWIPE_THRESHOLD = 40;
    const TAP_SLOP = 8;

    if (Math.abs(deltaY) > TAP_SLOP) {
      if (deltaY < -SWIPE_THRESHOLD && !isOpen) {
        suppressClick.current = true;
        toggle();
      } else if (deltaY > SWIPE_THRESHOLD && isOpen) {
        suppressClick.current = true;
        close();
      }
      return;
    }
  };

  const handleClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    toggle();
  };

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (/^[0-9.]$/.test(event.key)) {
        press(charKey(event.key));
        event.preventDefault();
      } else if (/^[a-zA-Z]$/.test(event.key)) {
        press(charKey(event.key));
        event.preventDefault();
      } else if (event.key === "Backspace") {
        press(actionKey("backspace"));
        event.preventDefault();
      } else if (event.key === "Enter") {
        press(actionKey("enter"));
        event.preventDefault();
      } else if (event.key === "Escape") {
        press(actionKey("escape"));
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, press]);

  const renderKey = (def: KeyDef) => {
    const isLetter = /^[a-z]$/i.test(def.label);
    const isShiftKey = def.label === "⇧";
    const isUpper = isLetter && isShiftArmed;
    const isMuted = Boolean(def.key && accepts && !accepts(def.key));
    const isDisabled = isMuted || Boolean(def.placeholder);

    return (
      <button
        key={`${def.variant ?? "char"}-${def.label}`}
        type="button"
        title={
          isMuted ? `${def.title ?? def.label} — not used here` : def.title
        }
        aria-label={def.title ?? def.label}
        aria-pressed={isShiftKey ? isShiftArmed : undefined}
        disabled={isDisabled}
        onClick={() => {
          if (isShiftKey) {
            setIsShiftArmed((prev) => !prev);
            return;
          }
          if (isLetter) {
            press(
              charKey(
                isUpper ? def.label.toUpperCase() : def.label.toLowerCase(),
              ),
            );
            if (isShiftArmed) setIsShiftArmed(false);
            return;
          }
          if (def.key) press(def.key);
        }}
        className={cn(
          "kbd-key",
          VARIANT_CLASS[def.variant ?? "char"],
          def.span && SPAN_CLASS[def.span],
          def.rowSpan === 2 && "kbd-row-2",
          isShiftKey && isShiftArmed && "kbd-key--latched",
          isMuted && "kbd-key--muted",
          def.placeholder && "kbd-key--placeholder",
        )}
      >
        {def.icon ?? (isUpper ? def.label.toUpperCase() : def.label)}
      </button>
    );
  };

  return (
    <div
      ref={dockRef}
      className={cn(
        "fixed bottom-0 left-0 z-[70] border-t border-line bg-surface pb-safe-b shadow-dock",
        "flex flex-col max-h-[70vh]",
        DOCK_RIGHT_CLASS,
      )}
    >
      {isOpen && (
        <div className="px-3 sm:px-4 py-3 overflow-y-auto overscroll-contain">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle truncate">
              Keyboard &mdash; {label}
            </div>
            <button
              type="button"
              onClick={close}
              className="text-xs text-fg-muted hover:text-fg px-2 py-1 rounded shrink-0"
            >
              Hide
            </button>
          </div>

          <div className="kbd-scroll pb-1">
            <div className="kbd-board">
              <div className="kbd-fn">{FN_BOARD.map(renderKey)}</div>
              <div className="kbd-alpha">{ALPHA_BOARD.map(renderKey)}</div>
              <div className="kbd-numpad">{NUM_BOARD.map(renderKey)}</div>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onPointerDown={(event) => {
          dragStartY.current = event.clientY;
        }}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragStartY.current = null;
        }}
        onClick={handleClick}
        disabled={!hasTarget}
        aria-expanded={isOpen}
        aria-label={
          isOpen ? "Swipe down to hide keyboard" : "Swipe up to open keyboard"
        }
        style={{ touchAction: "none" }}
        className={cn(
          "w-full flex items-center justify-center gap-2 select-none shrink-0",
          "min-h-[44px] py-2 border-t border-line/60",
          "text-xs text-fg-muted hover:text-fg transition",
          isOpen ? "bg-surface-2" : "bg-surface",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-180",
            !isOpen && "animate-dock-hint",
          )}
          aria-hidden="true"
        >
          <path d="M12 19V5" />
          <path d="m5 12 7-7 7 7" />
        </svg>
        <span>{isOpen ? "Swipe down to hide" : "Swipe up for keyboard"}</span>
      </button>
    </div>
  );
};
