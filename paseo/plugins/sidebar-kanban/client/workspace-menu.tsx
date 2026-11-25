import type { PluginTheme } from "@getpaseo/plugin";
import {
  type WorkspaceRef,
  usePaseo,
  useRpc,
  useTranslation,
  useWorkspace,
  useWorkspaces,
} from "@getpaseo/plugin/client";
import { Icon, Modal, TextInput, copyText, useToast } from "@getpaseo/plugin/client/ui";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { openFolderRpc } from "../shared/open-folder";
import { messages } from "./messages";

type Page = "menu" | "rename" | "labels";

export interface WorkspaceMenuProps {
  workspaceRef: WorkspaceRef;
  theme: PluginTheme;
  /** Host this screen talks to; the folder can only be opened on that daemon. */
  screenHostId: string;
  /** False on iOS and Android, where opening a folder on the daemon makes no sense. */
  canOpenFolder: boolean;
}

/** The "⋮" button. Opens the same actions as the sidebar workspace menu. */
export function WorkspaceMenuButton(props: WorkspaceMenuProps) {
  const { t } = useTranslation(messages);
  const [open, setOpen] = useState(false);
  const c = props.theme.colors;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("menu.open")}
        hitSlop={6}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          paddingHorizontal: 2,
          paddingVertical: 2,
          borderRadius: 6,
          backgroundColor: pressed ? c.surface2 : "transparent",
        })}
      >
        <Icon name="EllipsisVertical" size={14} color={c.foregroundMuted} />
      </Pressable>
      {open ? <WorkspaceMenuModal {...props} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function WorkspaceMenuModal({
  workspaceRef,
  theme,
  screenHostId,
  canOpenFolder,
  onClose,
}: WorkspaceMenuProps & { onClose(): void }) {
  const { t } = useTranslation(messages);
  const paseo = usePaseo();
  const toast = useToast();
  const openFolder = useRpc(openFolderRpc);
  const ws = useWorkspace(workspaceRef, (w) => ({
    id: w.id,
    hostId: w.hostId,
    title: w.title ?? w.name,
    rawTitle: w.title,
    branch: w.branch,
    directory: w.directory,
    pinned: w.pinnedAt !== null,
    labels: w.labels,
  }));
  // Every label used on this host, for the label picker.
  const labelGroups = useWorkspaces({ hosts: [workspaceRef.hostId], groupBy: (w) => w.labels });
  const [page, setPage] = useState<Page>("menu");
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const c = theme.colors;
  const styles = useMemo(
    () => ({
      item: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
      },
      itemText: { color: c.foreground, fontSize: 14, flex: 1 },
      muted: { color: c.foregroundMuted, fontSize: 12 },
      danger: { color: c.statusDanger, fontSize: 14, flex: 1 },
      input: {
        minHeight: 38,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.surface1,
        color: c.foreground,
        fontSize: 14,
      },
      row: { flexDirection: "row" as const, gap: 8, alignItems: "center" as const },
      button: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, backgroundColor: c.accent },
      buttonText: { color: c.accentForeground, fontSize: 13 },
      ghost: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: c.border },
      ghostText: { color: c.foreground, fontSize: 13 },
      disabled: { opacity: 0.5 },
    }),
    [c],
  );

  if (!ws) return null;
  const handle = () => paseo.workspaces.ref(workspaceRef);

  const run = async (key: string, action: () => Promise<unknown>, done?: string, close = true) => {
    setBusy(key);
    try {
      await action();
      if (done) toast.show(done, { variant: "success" });
      if (close) onClose();
    } catch (error) {
      toast.error(t("menu.failed", { error: error instanceof Error ? error.message : String(error) }));
    } finally {
      setBusy(null);
    }
  };

  const item = (
    key: string,
    icon: string,
    label: string,
    onPress: () => void,
    opts: { trailing?: string; danger?: boolean } = {},
  ) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      disabled={busy !== null}
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && { backgroundColor: c.surface2 }, busy === key && styles.disabled]}
    >
      <Icon name={icon} size={16} color={opts.danger ? c.statusDanger : c.foregroundMuted} />
      <Text style={opts.danger ? styles.danger : styles.itemText}>{busy === key ? `${label}…` : label}</Text>
      {opts.trailing ? <Icon name={opts.trailing} size={16} color={c.foregroundMuted} /> : null}
    </Pressable>
  );

  const allLabels = [...new Set([...labelGroups.map((g) => g.key), ...ws.labels])].sort((a, b) => a.localeCompare(b));
  const trimmedTitle = draft.trim();
  const trimmedLabel = newLabel.trim();

  const submitRename = () =>
    run("rename", () => handle().setTitle(trimmedTitle === "" ? null : trimmedTitle));
  const toggleLabel = (name: string, assigned: boolean) =>
    run(`label:${name}`, () => handle().setLabel(name, { assigned }), undefined, false);
  const createLabel = () => {
    if (!trimmedLabel) return;
    setNewLabel("");
    void toggleLabel(trimmedLabel, true);
  };

  return (
    <Modal title={ws.title} open onOpenChange={(open) => !open && onClose()}>
      <Modal.Content contentContainerStyle={{ padding: 12, gap: 2 }}>
        {page === "menu" ? (
          <>
            {ws.directory
              ? item("copyPath", "Copy", t("menu.copyPath"), () =>
                  void run("copyPath", () => copyText(ws.directory), t("menu.copied")),
                )
              : null}
            {ws.branch
              ? item("copyBranch", "Copy", t("menu.copyBranch"), () =>
                  void run("copyBranch", () => copyText(ws.branch ?? ""), t("menu.copied")),
                )
              : null}
            {item("rename", "Pencil", t("menu.rename"), () => {
              setDraft(ws.rawTitle ?? ws.title);
              setPage("rename");
            })}
            {item(ws.pinned ? "unpin" : "pin", ws.pinned ? "PinOff" : "Pin", ws.pinned ? t("menu.unpin") : t("menu.pin"), () =>
              void run("pin", () => handle().setPinned(!ws.pinned)),
            )}
            {item("labels", "Tag", t("menu.labels"), () => setPage("labels"), { trailing: "ChevronRight" })}
            {canOpenFolder && ws.hostId === screenHostId
              ? item("openFolder", "FolderOpen", t("menu.openFolder"), () =>
                  void run("openFolder", () => openFolder({ workspaceId: ws.id })),
                )
              : null}
            {item("archive", "Archive", busy === "archive" ? t("menu.archiving") : t("menu.archive"), () =>
              void run("archive", async () => {
                const result = await handle().archive();
                if (result.error) throw new Error(result.error);
              }),
              { danger: true },
            )}
          </>
        ) : null}

        {page === "rename" ? (
          <View style={{ gap: 12 }}>
            <TextInput
              autoFocus
              value={draft}
              onChangeText={setDraft}
              placeholder={ws.title}
              placeholderTextColor={c.foregroundMuted}
              style={styles.input}
              onSubmitEditing={() => void submitRename()}
            />
            <Text style={styles.muted}>{t("menu.renameHint")}</Text>
            <View style={[styles.row, { justifyContent: "flex-end" }]}>
              <Pressable accessibilityRole="button" onPress={() => setPage("menu")} style={styles.ghost}>
                <Text style={styles.ghostText}>{t("menu.back")}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={busy !== null}
                onPress={() => void submitRename()}
                style={[styles.button, busy !== null && styles.disabled]}
              >
                <Text style={styles.buttonText}>{t("menu.renameSubmit")}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {page === "labels" ? (
          <View style={{ gap: 2 }}>
            {item("back", "ChevronLeft", t("menu.back"), () => setPage("menu"))}
            {allLabels.length === 0 ? <Text style={[styles.muted, { padding: 12 }]}>{t("menu.noLabels")}</Text> : null}
            {allLabels.map((name) => {
              const assigned = ws.labels.includes(name);
              return (
                <Pressable
                  key={name}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: assigned }}
                  disabled={busy !== null}
                  onPress={() => void toggleLabel(name, !assigned)}
                  style={({ pressed }) => [styles.item, pressed && { backgroundColor: c.surface2 }]}
                >
                  <Icon name={assigned ? "SquareCheck" : "Square"} size={16} color={assigned ? c.accent : c.foregroundMuted} />
                  <Text style={styles.itemText}>{name}</Text>
                </Pressable>
              );
            })}
            <View style={[styles.row, { marginTop: 8 }]}>
              <TextInput
                value={newLabel}
                onChangeText={setNewLabel}
                placeholder={t("menu.createLabel")}
                placeholderTextColor={c.foregroundMuted}
                style={[styles.input, { flex: 1 }]}
                onSubmitEditing={createLabel}
              />
              <Pressable
                accessibilityRole="button"
                disabled={!trimmedLabel || busy !== null}
                onPress={createLabel}
                style={[styles.button, (!trimmedLabel || busy !== null) && styles.disabled]}
              >
                <Text style={styles.buttonText}>{t("menu.add")}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Modal.Content>
    </Modal>
  );
}
