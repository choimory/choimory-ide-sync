import type { PluginClientContext, PluginSidebarItemProps } from "@getpaseo/plugin/client";
import { SidebarRow } from "@getpaseo/plugin/client/ui";
import { MapScreen } from "./client/map";
import { messages } from "./client/messages";

const SCREEN_ID = "map";

function MapSidebarItem({ currentScreen, openScreen }: PluginSidebarItemProps) {
  return (
    <SidebarRow
      icon="Map"
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
    Component: MapSidebarItem,
  });
  client.addCommandCenterItem({
    id: "open-map",
    title: messages.message("open"),
    icon: "Map",
    keywords: ["map", "project", "group", "workspace", "맵", "프로젝트"],
    context: "global",
    onSelect({ openScreen }) {
      openScreen({ screenId: SCREEN_ID });
    },
  });
  return () => {};
}
