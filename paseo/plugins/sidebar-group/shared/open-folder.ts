import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";

/** Opens a workspace's folder in the daemon machine's file manager. */
export const openFolderRpc = defineRpc({
  name: "workspace.open-folder",
  input: z.object({ workspaceId: z.string().min(1) }),
  output: z.object({ path: z.string() }),
});
