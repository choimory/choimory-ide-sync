import type { PluginTheme, PluginWorkspaceSnapshot } from "@getpaseo/plugin";
import {
  type PluginScreenProps,
  type WorkspaceRef,
  useAgents,
  useTranslation,
  useWorkspace,
  useWorkspaces,
} from "@getpaseo/plugin/client";
import { Icon, ScrollView } from "@getpaseo/plugin/client/ui";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ArchiveButton } from "./archive-button";
import { WorkspaceMenuButton } from "./workspace-menu";
import { COLUMNS, type KanbanColumn } from "./columns";
import { formatElapsed, useNow } from "./format";
import { messages } from "./messages";

type Navigation = PluginScreenProps["navigation"];
interface MenuHost {
  screenHostId: string;
  canOpenFolder: boolean;
}

const ALL_PROJECTS = "__all__";

function isVisible(workspace: PluginWorkspaceSnapshot): boolean {
  return !workspace.background && workspace.archivingAt === null;
}

/** Most recent status change first. */
function byStatusEnteredDesc(a: PluginWorkspaceSnapshot, b: PluginWorkspaceSnapshot): number {
  const left = a.statusEnteredAt ?? a.lastPromptAt ?? a.createdAt ?? "";
  const right = b.statusEnteredAt ?? b.lastPromptAt ?? b.createdAt ?? "";
  return right.localeCompare(left);
}

function makeStyles(theme: PluginTheme, compact: boolean) {
  const c = theme.colors;
  return {
    screen: { flex: 1, backgroundColor: c.surface0 },
    header: {
      paddingHorizontal: compact ? 16 : 24,
      paddingTop: compact ? 12 : 20,
      paddingBottom: 8,
      gap: 10,
    },
    summary: { color: c.foregroundMuted, fontSize: 13 },
    chips: { gap: 6, paddingRight: 16 },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface1,
    },
    chipActive: { backgroundColor: c.accent, borderColor: c.accent },
    chipText: { color: c.foreground, fontSize: 12 },
    chipTextActive: { color: c.accentForeground, fontSize: 12 },
    board: {
      paddingHorizontal: compact ? 16 : 24,
      paddingBottom: 24,
      gap: compact ? 16 : 12,
    },
    column: {
      width: compact ? undefined : 280,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface1,
      overflow: "hidden" as const,
    },
    columnFill: { flex: 1 },
    columnHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    columnTitle: { color: c.foreground, fontSize: 14, fontWeight: "600" as const, flex: 1 },
    count: {
      color: c.foregroundMuted,
      fontSize: 12,
      minWidth: 22,
      textAlign: "center" as const,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 999,
      backgroundColor: c.surface2,
      overflow: "hidden" as const,
    },
    cards: { padding: 8, gap: 8 },
    empty: { color: c.foregroundMuted, fontSize: 12, padding: 12, textAlign: "center" as const },
    card: {
      padding: 10,
      gap: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface0,
    },
    cardPressed: { backgroundColor: c.surface2 },
    cardHeader: { flexDirection: "row" as const, alignItems: "flex-start" as const, gap: 6 },
    cardTitle: { color: c.foreground, fontSize: 13, fontWeight: "600" as const },
    cardProject: { color: c.foregroundMuted, fontSize: 12 },
    cardMeta: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      alignItems: "center" as const,
      gap: 8,
      marginTop: 2,
    },
    metaText: { color: c.foregroundMuted, fontSize: 11 },
    added: { color: c.statusSuccess, fontSize: 11 },
    removed: { color: c.statusDanger, fontSize: 11 },
  };
}

type Styles = ReturnType<typeof makeStyles>;

function WorkspaceCard({
  workspaceRef,
  column,
  styles,
  theme,
  now,
  navigation,
  menuHost,
}: {
  workspaceRef: WorkspaceRef;
  column: KanbanColumn;
  styles: Styles;
  theme: PluginTheme;
  now: number;
  navigation: Navigation;
  menuHost: MenuHost;
}) {
  const card = useWorkspace(workspaceRef, (w) => ({
    id: w.id,
    hostId: w.hostId,
    title: w.title ?? w.name,
    project: w.projectDisplayName,
    branch: w.branch,
    statusEnteredAt: w.statusEnteredAt,
    additions: w.diffStat?.additions ?? 0,
    deletions: w.diffStat?.deletions ?? 0,
  }));
  const agents = useAgents({
    hosts: [workspaceRef.hostId],
    where: (a) =>
      a.workspaceId === workspaceRef.id && !a.background && a.status !== "closed",
  });
  const { t } = useTranslation(messages);
  if (!card) return null;

  const elapsed = formatElapsed(t, card.statusEnteredAt, now);
  const columnTitle = t(`columns.${column.key}`);
  const open = navigation
    ? () => navigation.openWorkspace({ workspaceId: card.id, serverId: card.hostId })
    : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${card.title}, ${card.project}, ${columnTitle}`}
      disabled={!open}
      onPress={open}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={2}>
          {card.title}
        </Text>
        <ArchiveButton workspaceRef={workspaceRef} title={card.title} theme={theme} />
        <WorkspaceMenuButton workspaceRef={workspaceRef} theme={theme} {...menuHost} />
      </View>
      <Text style={styles.cardProject} numberOfLines={1}>
        {card.project}
        {card.branch ? ` · ${card.branch}` : ""}
      </Text>
      <View style={styles.cardMeta}>
        {elapsed ? <Text style={styles.metaText}>{elapsed}</Text> : null}
        {agents.length > 0 ? (
          <Text style={styles.metaText}>{t("agents", { count: agents.length })}</Text>
        ) : null}
        {card.additions > 0 ? <Text style={styles.added}>+{card.additions}</Text> : null}
        {card.deletions > 0 ? <Text style={styles.removed}>−{card.deletions}</Text> : null}
      </View>
    </Pressable>
  );
}

function Column({
  column,
  items,
  styles,
  theme,
  now,
  navigation,
  compact,
  menuHost,
}: {
  column: KanbanColumn;
  items: readonly WorkspaceRef[];
  styles: Styles;
  theme: PluginTheme;
  now: number;
  navigation: Navigation;
  compact: boolean;
  menuHost: MenuHost;
}) {
  const color = column.color(theme);
  const { t } = useTranslation(messages);
  const cards = (
    <View style={styles.cards}>
      {items.length === 0 ? (
        <Text style={styles.empty}>{t("empty")}</Text>
      ) : (
        items.map((ref) => (
          <WorkspaceCard
            key={ref.key}
            workspaceRef={ref}
            column={column}
            styles={styles}
            theme={theme}
            now={now}
            navigation={navigation}
            menuHost={menuHost}
          />
        ))
      )}
    </View>
  );
  return (
    <View style={styles.column}>
      <View style={[styles.columnHeader, { borderTopWidth: 3, borderTopColor: color }]}>
        <Icon name={column.icon} size={16} color={color} />
        <Text style={styles.columnTitle}>{t(`columns.${column.key}`)}</Text>
        <Text style={styles.count}>{items.length}</Text>
      </View>
      {compact ? cards : <ScrollView style={styles.columnFill}>{cards}</ScrollView>}
    </View>
  );
}

export function KanbanScreen({ theme, layout, navigation, host }: PluginScreenProps) {
  const menuHost = useMemo(
    () => ({ screenHostId: host.id, canOpenFolder: layout.platform === "web" }),
    [host.id, layout.platform],
  );
  const compact = layout.compact;
  const styles = useMemo(() => makeStyles(theme, compact), [theme, compact]);
  const now = useNow(30_000);
  const [project, setProject] = useState(ALL_PROJECTS);
  const { t } = useTranslation(messages);

  const projects = useWorkspaces({
    where: isVisible,
    groupBy: (w) => ({ key: w.projectId, title: w.projectDisplayName }),
  });
  const activeProject = projects.some((g) => g.key === project) ? project : ALL_PROJECTS;

  const groups = useWorkspaces({
    where: (w) => isVisible(w) && (activeProject === ALL_PROJECTS || w.projectId === activeProject),
    orderBy: byStatusEnteredDesc,
    groupBy: (w) => w.indicator,
  });
  const itemsByStatus = useMemo(() => {
    const map = new Map<string, readonly WorkspaceRef[]>();
    for (const group of groups) map.set(group.key, group.items);
    return map;
  }, [groups]);

  const total = groups.reduce((sum, g) => sum + g.items.length, 0);
  const waiting =
    (itemsByStatus.get("needs_input")?.length ?? 0) + (itemsByStatus.get("attention")?.length ?? 0);

  const columns = COLUMNS.map((column) => (
    <Column
      key={column.key}
      column={column}
      items={itemsByStatus.get(column.key) ?? []}
      styles={styles}
      theme={theme}
      now={now}
      navigation={navigation}
      compact={compact}
      menuHost={menuHost}
    />
  ));

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.summary}>
          {t("summary", { total, waiting })}
        </Text>
        {projects.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {[{ key: ALL_PROJECTS, title: t("allProjects") }, ...projects].map((g) => {
              const active = g.key === activeProject;
              return (
                <Pressable
                  key={g.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setProject(g.key)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={active ? styles.chipTextActive : styles.chipText}>
                    {g.title ?? g.key}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}
      </View>
      {compact ? (
        <ScrollView contentContainerStyle={styles.board}>{columns}</ScrollView>
      ) : (
        <ScrollView
          horizontal
          style={styles.columnFill}
          contentContainerStyle={[styles.board, { flexDirection: "row", alignItems: "stretch" }]}
        >
          {columns}
        </ScrollView>
      )}
    </View>
  );
}
