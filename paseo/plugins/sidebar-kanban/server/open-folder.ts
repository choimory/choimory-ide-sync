/// <reference types="node" />
import type { RpcInput } from "@getpaseo/plugin";
import type { PluginHandlerContext } from "@getpaseo/plugin/server";
import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import type { openFolderRpc } from "../shared/open-folder";

function fileManagerCommand(path: string): [string, string[]] {
  if (process.platform === "win32") return ["explorer.exe", [path]];
  if (process.platform === "darwin") return ["open", [path]];
  return ["xdg-open", [path]];
}

/** Resolves the folder from the workspace ID so the client cannot open arbitrary paths. */
export async function openFolder(
  { workspaceId }: RpcInput<typeof openFolderRpc>,
  { paseo }: PluginHandlerContext,
): Promise<{ path: string }> {
  const workspace = await paseo.workspaces.ref(workspaceId).refresh();
  const path = workspace?.workspaceDirectory;
  if (!path) throw new Error("Workspace folder is unknown");
  const info = await stat(path).catch(() => null);
  if (!info?.isDirectory()) throw new Error(`Folder not found: ${path}`);
  const [command, args] = fileManagerCommand(path);
  // explorer.exe exits non-zero even on success, so only spawn failures count.
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { detached: true, stdio: "ignore", windowsHide: false });
    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  });
  return { path };
}
