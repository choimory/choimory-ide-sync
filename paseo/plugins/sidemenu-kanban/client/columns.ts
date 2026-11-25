import type { PluginTheme, WorkspaceIndicator } from "@getpaseo/plugin";

export interface KanbanColumn {
  readonly key: WorkspaceIndicator;
  readonly icon: string;
  color(theme: PluginTheme): string;
}

/** Board order: things that need you first, finished work last. Titles live in messages.ts. */
export const COLUMNS: readonly KanbanColumn[] = [
  { key: "needs_input", icon: "MessageCircleQuestion", color: (t) => t.colors.statusWarning },
  { key: "attention", icon: "Bell", color: (t) => t.colors.accent },
  { key: "running", icon: "LoaderCircle", color: (t) => t.colors.statusSuccess },
  { key: "failed", icon: "CircleX", color: (t) => t.colors.statusDanger },
  { key: "done", icon: "CircleCheck", color: (t) => t.colors.foregroundMuted },
];

export type Elapsed =
  | { readonly unit: "justNow" }
  | { readonly unit: "minutes" | "hours" | "days"; readonly n: number };

export function elapsedSince(iso: string | null, now: number): Elapsed | null {
  if (!iso) return null;
  const started = Date.parse(iso);
  if (Number.isNaN(started)) return null;
  const seconds = Math.max(0, Math.floor((now - started) / 1000));
  if (seconds < 60) return { unit: "justNow" };
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return { unit: "minutes", n: minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { unit: "hours", n: hours };
  return { unit: "days", n: Math.floor(hours / 24) };
}
