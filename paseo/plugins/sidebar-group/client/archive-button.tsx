import type { PluginTheme } from "@getpaseo/plugin";
import { type WorkspaceRef, usePaseo, useTranslation } from "@getpaseo/plugin/client";
import { Icon, useToast } from "@getpaseo/plugin/client/ui";
import { useState } from "react";
import { Pressable } from "react-native";
import { messages } from "./messages";

/** Archives a workspace on its own host with a single press. */
export function ArchiveButton({
  workspaceRef,
  title,
  theme,
}: {
  workspaceRef: WorkspaceRef;
  title: string;
  theme: PluginTheme;
}) {
  const paseo = usePaseo();
  const toast = useToast();
  const { t } = useTranslation(messages);
  const [busy, setBusy] = useState(false);

  const fail = (error: string) => {
    toast.error(t("archive.failed", { title, error }));
    setBusy(false);
  };

  const onPress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await paseo.workspaces.ref(workspaceRef).archive();
      // On success the card disappears because the workspace leaves the list.
      if (result.error) fail(result.error);
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error));
    }
  };

  const c = theme.colors;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t("archive.label")}: ${title}`}
      accessibilityState={{ busy }}
      disabled={busy}
      hitSlop={6}
      onPress={() => void onPress()}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 3,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: pressed ? c.surface2 : "transparent",
        opacity: busy ? 0.5 : 1,
      })}
    >
      <Icon name="Archive" size={13} color={c.foregroundMuted} />
    </Pressable>
  );
}
