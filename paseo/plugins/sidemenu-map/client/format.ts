import type { PluginTheme, WorkspaceIndicator } from "@getpaseo/plugin";
import type { useTranslation } from "@getpaseo/plugin/client";
import { useEffect, useState } from "react";
import { COLUMNS, elapsedSince } from "./columns";
import type { messages } from "./messages";

export type Translate = ReturnType<typeof useTranslation<(typeof messages)["resources"]["en"]>>["t"];

export function formatElapsed(t: Translate, iso: string | null, now: number): string | null {
  const elapsed = elapsedSince(iso, now);
  if (!elapsed) return null;
  if (elapsed.unit === "justNow") return t("elapsed.justNow");
  return t(`elapsed.${elapsed.unit}`, { n: elapsed.n });
}

export function indicatorColor(theme: PluginTheme, indicator: WorkspaceIndicator): string {
  return COLUMNS.find((c) => c.key === indicator)?.color(theme) ?? theme.colors.foregroundMuted;
}

/** Re-render periodically so relative times stay current. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
