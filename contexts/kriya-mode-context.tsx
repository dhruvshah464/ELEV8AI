"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type KriyaMode = "krishna" | "vishnu" | "shiva";

interface KriyaModeContextValue {
  mode: KriyaMode;
  setMode: (mode: KriyaMode) => void;
  /** Descriptive label for the current mode */
  modeLabel: string;
  /** Descriptive subtitle for the current mode */
  modeDescription: string;
}

const MODE_LABELS: Record<KriyaMode, string> = {
  krishna: "Guidance",
  vishnu: "Order",
  shiva: "Transformation",
};

const MODE_DESCRIPTIONS: Record<KriyaMode, string> = {
  krishna: "Warm guidance · Saffron gold · Gentle motion",
  vishnu: "Structured clarity · Sovereign blue · Precise rhythm",
  shiva: "Pure transformation · Cosmic violet · Explosive energy",
};

const LS_KEY = "kriya-mode";

const KriyaModeContext = createContext<KriyaModeContextValue | undefined>(
  undefined
);

function getStoredMode(): KriyaMode {
  if (typeof window === "undefined") return "vishnu";
  const stored = localStorage.getItem(LS_KEY);
  if (stored === "krishna" || stored === "vishnu" || stored === "shiva") {
    return stored;
  }
  return "vishnu";
}

function applyModeToDOM(mode: KriyaMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-kriya-mode", mode);
}

export function KriyaModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<KriyaMode>("vishnu");

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = getStoredMode();
    setModeState(stored);
    applyModeToDOM(stored);
  }, []);

  const setMode = useCallback((next: KriyaMode) => {
    setModeState(next);
    applyModeToDOM(next);
    localStorage.setItem(LS_KEY, next);
  }, []);

  return (
    <KriyaModeContext.Provider
      value={{
        mode,
        setMode,
        modeLabel: MODE_LABELS[mode],
        modeDescription: MODE_DESCRIPTIONS[mode],
      }}
    >
      {children}
    </KriyaModeContext.Provider>
  );
}

export function useKriyaMode() {
  const ctx = useContext(KriyaModeContext);
  if (!ctx) {
    throw new Error("useKriyaMode must be used inside <KriyaModeProvider>");
  }
  return ctx;
}
