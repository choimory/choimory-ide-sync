import type { PluginServerContext } from "@getpaseo/plugin/server";
import { openFolder } from "./server/open-folder";
import { openFolderRpc } from "./shared/open-folder";

export default function contribute(server: PluginServerContext) {
  server.handle(openFolderRpc, openFolder);
  return () => {};
}
