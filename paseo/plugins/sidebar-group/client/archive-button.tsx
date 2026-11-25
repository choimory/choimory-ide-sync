import type { PluginTheme } from "@getpaseo/plugin";
import { type WorkspaceRef, usePaseo, useTranslation } from "@getpaseo/plugin/client";
import { Icon, useToast } from "@getpaseo/plugin/client/ui";
import { useEffect, useState } from "react";
import { Pressable, Text } from "react-native";
import { messages } from "./messages";

const CONFIRM_MS = 4000;

/** Archives a workspace on its own host. The first press arms it; a second press within 4s archives. */
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
  const [stage, setStage] = useState<"idle" | "confirm" | "busy">("idle");

  useEffect(() => {
    if (stage !== "confirm") return;
    const timer = setTimeout(() => setStage("idle"), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  const fail = (error: string) => {
    toast.error(t("archive.failed", { title, error }));
    setStage("idle");
  };

  const onPress = async () => {
    if (stage === "idle") {
      setStage("confirm");
      return;
    }
    if (stage !== "confirm") return;
    setStage("busy");
    try {
      const result = await paseo.workspaces.ref(workspaceRef).archive();
      // On success the card disappears because the workspace leaves the list.
      if (result.error) fail(result.error);
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error));
    }
  };

  const c = theme.colors;
  const armed = stage === "confirm";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={armed ? t("archive.confirm") : `${t("archive.label")}: ${title}`}
      accessibilityState={{ busy: stage === "busy" }}
      disabled={stage === "busy"}
      hitSlop={6}
      onPress={() => void onPress()}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: armed ? 6 : 3,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: armed ? c.statusDanger : pressed ? c.surface2 : "transparent",
        opacity: stage === "busy" ? 0.5 : 1,
      })}
    >
      <Icon name="Archive" size={13} color={armed ? c.surface0 : c.foregroundMuted} />
      {armed ? (
        <Text style={{ color: c.surface0, fontSize: 11, fontWeight: "600" }}>{t("archive.confirm")}</Text>
      ) : null}
    </Pressable>
  );
}
