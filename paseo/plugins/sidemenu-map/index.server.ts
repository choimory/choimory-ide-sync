import type { PluginServerContext } from "@getpaseo/plugin/server";
import { mapSettings } from "./shared/settings";

export default function contribute(server: PluginServerContext) {
  // Stores the Map's custom project groups on the daemon so every device sees them.
  server.registerSettings(mapSettings);
  return () => {};
}
