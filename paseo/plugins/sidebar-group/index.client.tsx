import type { PluginClientContext, PluginSidebarItemProps } from "@getpaseo/plugin/client";
import { SidebarRow } from "@getpaseo/plugin/client/ui";
import { MapScreen } from "./client/map";
import { messages } from "./client/messages";

const SCREEN_ID = "groups";

function GroupsSidebarItem({ currentScreen, openScreen }: PluginSidebarItemProps) {
  return (
    <SidebarRow
      icon="LayoutGrid"
      active={currentScreen?.screenId === SCREEN_ID}
      onPress={() => openScreen({ screenId: SCREEN_ID })}
    />
  );
}

export default function contribute(client: PluginClientContext) {
  client.addScreen({ id: SCREEN_ID, title: messages.message("title"), Component: MapScreen });
  client.addSidebarHeaderItem({
    id: SCREEN_ID,
    title: messages.message("title"),
    Component: GroupsSidebarItem,
  });
  client.addCommandCenterItem({
    id: "open-groups",
    title: messages.message("open"),
    icon: "LayoutGrid",
    keywords: ["groups", "group", "project", "workspace", "그룹", "프로젝트"],
    context: "global",
    onSelect({ openScreen }) {
      openScreen({ screenId: SCREEN_ID });
    },
  });
  return () => {};
}
