import { defineSettings } from "@getpaseo/plugin";
import { z } from "zod";

/** Custom Map groups. A project belongs to a group by its root path; the rest group by parent folder. */
export const mapSettingsSchema = z
  .object({
    groups: z
      .array(z.object({ name: z.string().min(1), projects: z.array(z.string()) }))
      .default([]),
  })
  .default({ groups: [] });

export type MapSettings = z.output<typeof mapSettingsSchema>;
export type MapGroup = MapSettings["groups"][number];

export const mapSettings = defineSettings({
  id: "map",
  scope: "host",
  version: 1,
  schema: mapSettingsSchema,
});
