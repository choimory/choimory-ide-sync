import type { PluginClientContext, PluginSidebarItemProps } from "@getpaseo/plugin/client";
import { useWorkspaces } from "@getpaseo/plugin/client";
import { SidebarRow } from "@getpaseo/plugin/client/ui";
import { Text } from "react-native";
import { KanbanScreen } from "./client/board";
import { messages } from "./client/messages";

const SCREEN_ID = "board";

function KanbanSidebarItem({ currentScreen, openScreen, theme }: PluginSidebarItemProps) {
  const waiting = useWorkspaces({
    where: (w) =>
      !w.background &&
      w.archivingAt === null &&
      (w.indicator === "needs_input" || w.indicator === "failed"),
  });
  return (
    <SidebarRow
      icon="Kanban"
      active={currentScreen?.screenId === SCREEN_ID}
      onPress={() => openScreen({ screenId: SCREEN_ID })}
      trailing={
        waiting.length > 0 ? (
          <Text style={{ color: theme.colors.statusWarning, fontSize: 12, fontWeight: "600" }}>
            {waiting.length}
          </Text>
        ) : undefined
      }
    />
  );
}

export default function contribute(client: PluginClientContext) {
  client.addScreen({ id: SCREEN_ID, title: messages.message("title"), Component: KanbanScreen });
  client.addSidebarHeaderItem({
    id: SCREEN_ID,
    title: messages.message("title"),
    Component: KanbanSidebarItem,
  });
  client.addCommandCenterItem({
    id: "open-board",
    title: messages.message("open"),
    icon: "Kanban",
    keywords: ["kanban", "board", "status", "workspace", "칸반"],
    context: "global",
    onSelect({ openScreen }) {
      openScreen({ screenId: SCREEN_ID });
    },
  });
  return () => {};
}
