import type { PluginTheme, PluginWorkspaceSnapshot, WorkspaceIndicator } from "@getpaseo/plugin";
import {
  type AgentRef,
  type PluginScreenProps,
  type WorkspaceRef,
  useAgent,
  useAgents,
  useSettings,
  useTranslation,
  useWorkspace,
  useWorkspaces,
} from "@getpaseo/plugin/client";
import { Icon, Modal, ScrollView, TextInput } from "@getpaseo/plugin/client/ui";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { type MapGroup, mapSettings } from "../shared/settings";
import { COLUMNS } from "./columns";
import { type Translate, formatElapsed, indicatorColor, useNow } from "./format";
import { type MapProject, type MapSection, assignProject, buildSections, customGroupOf, projectGroupKey } from "./grouping";
import { messages } from "./messages";

const ROOT = "__root__";

function makeStyles(theme: PluginTheme, compact: boolean) {
  const c = theme.colors;
  return {
    screen: { flex: 1, backgroundColor: c.surface0 },
    toolbar: {
      paddingHorizontal: compact ? 12 : 20,
      paddingTop: compact ? 10 : 16,
      paddingBottom: 10,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    toolbarRow: { flexDirection: "row" as const, flexWrap: "wrap" as const, alignItems: "center" as const, gap: 6 },
    search: {
      flexGrow: 1,
      flexBasis: compact ? ("100%" as const) : 280,
      minHeight: 34,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface1,
      color: c.foreground,
      fontSize: 13,
    },
    chip: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface1,
    },
    chipActive: { backgroundColor: c.surface2, borderColor: c.foregroundMuted },
    chipText: { color: c.foreground, fontSize: 12 },
    summary: { color: c.foregroundMuted, fontSize: 12, marginLeft: 4 },
    error: { color: c.statusDanger, fontSize: 12 },
    canvas: { padding: compact ? 12 : 20, gap: compact ? 20 : 28 },
    empty: { color: c.foregroundMuted, fontSize: 13, textAlign: "center" as const, padding: 32 },
    section: { gap: 10 },
    sectionHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8 },
    sectionTitle: { color: c.foreground, fontSize: 15, fontWeight: "700" as const },
    sectionPath: { color: c.foregroundMuted, fontSize: 11, flexShrink: 1 },
    sectionBody: { flexDirection: "row" as const, flexWrap: "wrap" as const, alignItems: "flex-start" as const, gap: 12 },
    project: {
      width: compact ? ("100%" as const) : undefined,
      maxWidth: "100%" as const,
      padding: 10,
      gap: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface1,
    },
    projectHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8 },
    tag: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 5,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: c.surface2,
    },
    tagText: { color: c.foreground, fontSize: 12, fontWeight: "600" as const },
    projectMeta: { color: c.foregroundMuted, fontSize: 11, flexShrink: 1 },
    spacer: { flex: 1 },
    moveButton: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: c.accent,
    },
    moveText: { color: c.accent, fontSize: 11 },
    workspaces: { flexDirection: compact ? ("column" as const) : ("row" as const), flexWrap: "wrap" as const, alignItems: "flex-start" as const, gap: 8 },
    workspace: {
      width: compact ? ("100%" as const) : 270,
      padding: 8,
      gap: 3,
      borderRadius: 8,
      borderWidth: 1,
      borderLeftWidth: 3,
      borderColor: c.border,
      backgroundColor: c.surface0,
    },
    pressed: { backgroundColor: c.surface2 },
    wsTitle: { color: c.foreground, fontSize: 13, fontWeight: "600" as const },
    wsLabel: { fontSize: 11 },
    meta: { flexDirection: "row" as const, flexWrap: "wrap" as const, alignItems: "center" as const, gap: 6 },
    metaText: { color: c.foregroundMuted, fontSize: 11 },
    added: { color: c.statusSuccess, fontSize: 11 },
    removed: { color: c.statusDanger, fontSize: 11 },
    agents: { marginTop: 4, gap: 4 },
    agent: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      gap: 6,
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderRadius: 6,
      backgroundColor: c.surface1,
    },
    dot: { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
    agentBody: { flex: 1, gap: 1 },
    agentTitle: { color: c.foreground, fontSize: 12 },
    children: { marginLeft: 10, paddingLeft: 6, borderLeftWidth: 1, borderLeftColor: c.border, gap: 4 },
    modalOption: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    modalOptionActive: { borderColor: c.accent, backgroundColor: c.surface2 },
    modalText: { color: c.foreground, fontSize: 14, flex: 1 },
    modalRow: { flexDirection: "row" as const, gap: 8, alignItems: "center" as const },
    addButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, backgroundColor: c.accent },
    addButtonDisabled: { opacity: 0.5 },
    addText: { color: c.accentForeground, fontSize: 13 },
  };
}

type Styles = ReturnType<typeof makeStyles>;

interface MapContext {
  readonly theme: PluginTheme;
  readonly styles: Styles;
  readonly t: Translate;
  readonly now: number;
  readonly navigation: PluginScreenProps["navigation"];
  readonly showBackground: boolean;
  readonly editing: boolean;
  onMove(project: MapProject): void;
}

function byRecent(a: PluginWorkspaceSnapshot, b: PluginWorkspaceSnapshot): number {
  const left = a.statusEnteredAt ?? a.lastPromptAt ?? a.createdAt ?? "";
  const right = b.statusEnteredAt ?? b.lastPromptAt ?? b.createdAt ?? "";
  return right.localeCompare(left);
}

function agentPresentation(
  theme: PluginTheme,
  agent: { status: string; requiresAttention: boolean; attentionReason: string | null },
): { key: "running" | "idle" | "error" | "initializing" | "permission" | "finished"; color: string } {
  const c = theme.colors;
  if (agent.status === "error" || agent.attentionReason === "error") return { key: "error", color: c.statusDanger };
  if (agent.requiresAttention && agent.attentionReason === "permission") return { key: "permission", color: c.statusWarning };
  if (agent.status === "running") return { key: "running", color: c.statusSuccess };
  if (agent.status === "initializing") return { key: "initializing", color: c.foregroundMuted };
  if (agent.requiresAttention && agent.attentionReason === "finished") return { key: "finished", color: c.accent };
  return { key: "idle", color: c.foregroundMuted };
}

function AgentNode({
  agentRef,
  childMap,
  ctx,
}: {
  agentRef: AgentRef;
  childMap: ReadonlyMap<string, readonly AgentRef[]>;
  ctx: MapContext;
}) {
  const agent = useAgent(agentRef, (a) => ({
    id: a.id,
    hostId: a.hostId,
    title: a.title,
    provider: a.provider,
    model: a.model,
    status: a.status,
    requiresAttention: a.requiresAttention,
    attentionReason: a.attentionReason,
    lastActivityAt: a.lastActivityAt,
  }));
  if (!agent) return null;
  const { styles, t, navigation } = ctx;
  const look = agentPresentation(ctx.theme, agent);
  const elapsed = formatElapsed(t, agent.lastActivityAt, ctx.now);
  const children = childMap.get(agent.id) ?? [];
  const open = navigation
    ? () => navigation.openAgent({ agentId: agent.id, serverId: agent.hostId })
    : undefined;
  return (
    <View style={{ gap: 4 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${agent.title ?? agent.provider}, ${t(`agentStatus.${look.key}`)}`}
        disabled={!open}
        onPress={open}
        style={({ pressed }) => [styles.agent, pressed && styles.pressed]}
      >
        <View style={[styles.dot, { backgroundColor: look.color }]} />
        <View style={styles.agentBody}>
          <Text style={styles.agentTitle} numberOfLines={1}>
            {agent.title ?? agent.provider}
          </Text>
          <Text style={styles.metaText} numberOfLines={1}>
            <Text style={{ color: look.color }}>{t(`agentStatus.${look.key}`)}</Text>
            {` · ${agent.model ? `${agent.provider}/${agent.model}` : agent.provider}`}
            {elapsed ? ` · ${elapsed}` : ""}
          </Text>
        </View>
      </Pressable>
      {children.length > 0 ? (
        <View style={styles.children}>
          {children.map((child) => (
            <AgentNode key={child.key} agentRef={child} childMap={childMap} ctx={ctx} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function WorkspaceNode({ workspaceRef, ctx }: { workspaceRef: WorkspaceRef; ctx: MapContext }) {
  const ws = useWorkspace(workspaceRef, (w) => ({
    id: w.id,
    hostId: w.hostId,
    title: w.title ?? w.name,
    branch: w.branch,
    indicator: w.indicator,
    indicatorLabel: w.indicatorLabel,
    statusEnteredAt: w.statusEnteredAt,
    additions: w.diffStat?.additions ?? 0,
    deletions: w.diffStat?.deletions ?? 0,
  }));
  const showBackground = ctx.showBackground;
  const agentGroups = useAgents({
    hosts: [workspaceRef.hostId],
    where: (a) =>
      a.workspaceId === workspaceRef.id && a.status !== "closed" && (showBackground || !a.background),
    orderBy: ["createdAt", "asc"],
    groupBy: (a) => a.parentAgentId ?? ROOT,
  });
  const { roots, childMap } = useMemo(() => {
    const present = new Set<string>();
    for (const g of agentGroups) for (const ref of g.items) present.add(ref.id);
    const map = new Map<string, readonly AgentRef[]>();
    const rootRefs: AgentRef[] = [];
    for (const g of agentGroups) {
      // A child whose parent is hidden or closed is shown at the top level.
      if (g.key === ROOT || !present.has(g.key)) rootRefs.push(...g.items);
      else map.set(g.key, g.items);
    }
    return { roots: rootRefs, childMap: map };
  }, [agentGroups]);

  if (!ws) return null;
  const { styles, t, navigation, theme } = ctx;
  const color = indicatorColor(theme, ws.indicator);
  const elapsed = formatElapsed(t, ws.statusEnteredAt, ctx.now);
  const open = navigation
    ? () => navigation.openWorkspace({ workspaceId: ws.id, serverId: ws.hostId })
    : undefined;
  return (
    <View style={[styles.workspace, { borderLeftColor: color }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${ws.title}, ${t(`columns.${ws.indicator}`)}`}
        disabled={!open}
        onPress={open}
        style={({ pressed }) => [{ gap: 3, borderRadius: 6 }, pressed && styles.pressed]}
      >
        <Text style={styles.wsTitle} numberOfLines={2}>
          {ws.title}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.metaText, { color }]}>{t(`columns.${ws.indicator}`)}</Text>
          {ws.branch ? <Text style={styles.metaText}>⎇ {ws.branch}</Text> : null}
          {elapsed ? <Text style={styles.metaText}>{elapsed}</Text> : null}
          {ws.additions > 0 ? <Text style={styles.added}>+{ws.additions}</Text> : null}
          {ws.deletions > 0 ? <Text style={styles.removed}>−{ws.deletions}</Text> : null}
        </View>
        {ws.indicatorLabel ? (
          <Text style={[styles.wsLabel, { color }]} numberOfLines={2}>
            {ws.indicatorLabel}
          </Text>
        ) : null}
      </Pressable>
      {roots.length > 0 ? (
        <View style={styles.agents}>
          {roots.map((ref) => (
            <AgentNode key={ref.key} agentRef={ref} childMap={childMap} ctx={ctx} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ProjectBox({ project, ctx }: { project: MapProject; ctx: MapContext }) {
  const { styles, t } = ctx;
  return (
    <View style={styles.project}>
      <View style={styles.projectHeader}>
        <View style={styles.tag}>
          <Icon name="FolderGit2" size={12} color={ctx.theme.colors.foregroundMuted} />
          <Text style={styles.tagText} numberOfLines={1}>
            {project.title}
          </Text>
        </View>
        <Text style={styles.projectMeta}>{project.items.length}</Text>
        <View style={styles.spacer} />
        {ctx.editing ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t("move")}: ${project.title}`}
            onPress={() => ctx.onMove(project)}
            style={styles.moveButton}
          >
            <Text style={styles.moveText}>{t("move")}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.workspaces}>
        {project.items.map((ref) => (
          <WorkspaceNode key={ref.key} workspaceRef={ref} ctx={ctx} />
        ))}
      </View>
    </View>
  );
}

function SectionView({ section, ctx }: { section: MapSection; ctx: MapContext }) {
  const { styles, theme, t } = ctx;
  const workspaces = section.projects.reduce((sum, p) => sum + p.items.length, 0);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon
          name={section.custom ? "FolderHeart" : "Folder"}
          size={16}
          color={section.custom ? theme.colors.accent : theme.colors.foregroundMuted}
        />
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionPath} numberOfLines={1}>
          {section.path ?? t("customGroup")} · {section.projects.length} / {workspaces}
        </Text>
      </View>
      <View style={styles.sectionBody}>
        {section.projects.map((project) => (
          <ProjectBox key={project.key} project={project} ctx={ctx} />
        ))}
      </View>
    </View>
  );
}

function MoveModal({
  project,
  groups,
  onPick,
  onClose,
  styles,
  t,
  theme,
}: {
  project: MapProject | null;
  groups: readonly MapGroup[];
  onPick(groupName: string | null): void;
  onClose(): void;
  styles: Styles;
  t: Translate;
  theme: PluginTheme;
}) {
  const [name, setName] = useState("");
  const current = project ? customGroupOf(project.rootPath, groups) : null;
  const trimmed = name.trim();
  const options: { label: string; value: string | null; icon: string }[] = [
    { label: t("autoGroup"), value: null, icon: "Folder" },
    ...groups.map((g) => ({ label: g.name, value: g.name, icon: "FolderHeart" })),
  ];
  return (
    <Modal
      title={project ? t("moveTitle", { project: project.title }) : ""}
      open={project !== null}
      onOpenChange={(open) => {
        if (!open) {
          setName("");
          onClose();
        }
      }}
    >
      <Modal.Content>
        {options.map((option) => {
          const active = option.value === current;
          return (
            <Pressable
              key={option.value ?? "__auto__"}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onPick(option.value)}
              style={[styles.modalOption, active && styles.modalOptionActive]}
            >
              <Icon name={option.icon} size={16} color={theme.colors.foregroundMuted} />
              <Text style={styles.modalText}>{option.label}</Text>
              {active ? <Icon name="Check" size={16} color={theme.colors.accent} /> : null}
            </Pressable>
          );
        })}
        <View style={styles.modalRow}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t("newGroup")}
            placeholderTextColor={theme.colors.foregroundMuted}
            style={[styles.search, { flexBasis: 0 }]}
            onSubmitEditing={() => {
              if (trimmed) {
                setName("");
                onPick(trimmed);
              }
            }}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!trimmed}
            onPress={() => {
              setName("");
              onPick(trimmed);
            }}
            style={[styles.addButton, !trimmed && styles.addButtonDisabled]}
          >
            <Text style={styles.addText}>{t("add")}</Text>
          </Pressable>
        </View>
      </Modal.Content>
    </Modal>
  );
}

export function MapScreen({ theme, layout, navigation }: PluginScreenProps) {
  const compact = layout.compact;
  const styles = useMemo(() => makeStyles(theme, compact), [theme, compact]);
  const { t } = useTranslation(messages);
  const now = useNow(30_000);
  const settings = useSettings(mapSettings);
  const customGroups: readonly MapGroup[] = settings.status === "ready" ? settings.values.groups : [];

  const [query, setQuery] = useState("");
  const [showBackground, setShowBackground] = useState(false);
  const [statuses, setStatuses] = useState<ReadonlySet<WorkspaceIndicator>>(new Set());
  const [editing, setEditing] = useState(false);
  const [moving, setMoving] = useState<MapProject | null>(null);

  const q = query.trim().toLowerCase();
  const projectGroups = useWorkspaces({
    where: (w) =>
      w.archivingAt === null &&
      (showBackground || !w.background) &&
      (statuses.size === 0 || statuses.has(w.indicator)) &&
      (q === "" ||
        [w.title, w.name, w.projectDisplayName, w.branch].some((v) => v?.toLowerCase().includes(q))),
    orderBy: byRecent,
    groupBy: projectGroupKey,
  });
  const sections = useMemo(() => buildSections(projectGroups, customGroups), [projectGroups, customGroups]);
  const projectCount = sections.reduce((sum, s) => sum + s.projects.length, 0);
  const workspaceCount = projectGroups.reduce((sum, g) => sum + g.items.length, 0);

  const toggleStatus = (key: WorkspaceIndicator) =>
    setStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const pickGroup = (groupName: string | null) => {
    const project = moving;
    setMoving(null);
    if (!project || settings.status !== "ready") return;
    void settings.save({ groups: assignProject(customGroups, project.rootPath, groupName) }, settings.revision);
  };

  const ctx: MapContext = {
    theme,
    styles,
    t,
    now,
    navigation,
    showBackground,
    editing,
    onMove: setMoving,
  };

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <View style={styles.toolbarRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("search")}
            placeholderTextColor={theme.colors.foregroundMuted}
            style={styles.search}
          />
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: showBackground }}
            onPress={() => setShowBackground((v) => !v)}
            style={[styles.chip, showBackground && styles.chipActive]}
          >
            <Icon name={showBackground ? "Eye" : "EyeOff"} size={13} color={theme.colors.foregroundMuted} />
            <Text style={styles.chipText}>{t("background")}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: editing }}
            onPress={() => setEditing((v) => !v)}
            style={[styles.chip, editing && styles.chipActive]}
          >
            <Icon name={editing ? "Check" : "Pencil"} size={13} color={theme.colors.foregroundMuted} />
            <Text style={styles.chipText}>{editing ? t("editDone") : t("edit")}</Text>
          </Pressable>
        </View>
        <View style={styles.toolbarRow}>
          {COLUMNS.map((column) => {
            const active = statuses.has(column.key);
            return (
              <Pressable
                key={column.key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => toggleStatus(column.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <View style={[styles.dot, { marginTop: 0, backgroundColor: column.color(theme) }]} />
                <Text style={styles.chipText}>{t(`columns.${column.key}`)}</Text>
              </Pressable>
            );
          })}
          <Text style={styles.summary}>
            {t("summary", { groups: sections.length, projects: projectCount, workspaces: workspaceCount })}
          </Text>
        </View>
        {settings.status === "error" || settings.status === "invalid" ? (
          <Text style={styles.error}>{t("settingsError", { error: settings.error })}</Text>
        ) : null}
        {settings.saveError ? (
          <Text style={styles.error}>{t("saveFailed", { error: settings.saveError })}</Text>
        ) : null}
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.canvas}>
        {sections.length === 0 ? <Text style={styles.empty}>{t("empty")}</Text> : null}
        {sections.map((section) => (
          <SectionView key={section.key} section={section} ctx={ctx} />
        ))}
      </ScrollView>
      <MoveModal
        project={moving}
        groups={customGroups}
        onPick={pickGroup}
        onClose={() => setMoving(null)}
        styles={styles}
        t={t}
        theme={theme}
      />
    </View>
  );
}
