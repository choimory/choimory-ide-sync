import type { PluginWorkspaceSnapshot } from "@getpaseo/plugin";
import type { Group, WorkspaceRef } from "@getpaseo/plugin/client";
import type { MapGroup } from "../shared/settings";

export interface MapProject {
  readonly key: string;
  readonly hostId: string;
  readonly projectId: string;
  readonly rootPath: string;
  readonly title: string;
  readonly items: readonly WorkspaceRef[];
}

export interface MapSection {
  readonly key: string;
  readonly title: string;
  /** Full folder path for automatic sections; null for custom groups. */
  readonly path: string | null;
  readonly custom: boolean;
  readonly projects: readonly MapProject[];
}

/** One group key per project that carries what the Map needs to place it. */
export function projectGroupKey(w: PluginWorkspaceSnapshot): { key: string; title: string } {
  return { key: JSON.stringify([w.hostId, w.projectId, w.projectRootPath]), title: w.projectDisplayName };
}

export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
}

function trimTrailingSeparators(path: string): string {
  const trimmed = path.replace(/[\\/]+$/, "");
  return trimmed === "" ? path : trimmed;
}

export function parentDirectory(path: string): string {
  const trimmed = trimTrailingSeparators(path);
  const index = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  if (index <= 0) return trimmed;
  const parent = trimmed.slice(0, index);
  // Keep a drive root such as "C:" readable.
  return /^[A-Za-z]:$/.test(parent) ? `${parent}\\` : parent;
}

export function baseName(path: string): string {
  const trimmed = trimTrailingSeparators(path);
  const index = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  return index < 0 ? trimmed : trimmed.slice(index + 1) || trimmed;
}

export function customGroupOf(rootPath: string, groups: readonly MapGroup[]): string | null {
  const target = normalizePath(rootPath);
  for (const group of groups) {
    if (group.projects.some((p) => normalizePath(p) === target)) return group.name;
  }
  return null;
}

/** Custom groups first in their saved order, then parent folders alphabetically. */
export function buildSections(
  projectGroups: readonly Group<WorkspaceRef>[],
  customGroups: readonly MapGroup[],
): MapSection[] {
  const sections = new Map<string, { title: string; path: string | null; custom: boolean; projects: MapProject[] }>();
  for (const group of projectGroups) {
    const [hostId, projectId, rootPath] = JSON.parse(group.key) as [string, string, string];
    const project: MapProject = {
      key: group.key,
      hostId,
      projectId,
      rootPath,
      title: group.title ?? baseName(rootPath),
      items: group.items,
    };
    const custom = customGroupOf(rootPath, customGroups);
    const parent = parentDirectory(rootPath);
    const key = custom !== null ? `custom:${custom}` : `dir:${normalizePath(parent)}`;
    let section = sections.get(key);
    if (!section) {
      section =
        custom !== null
          ? { title: custom, path: null, custom: true, projects: [] }
          : { title: baseName(parent), path: parent, custom: false, projects: [] };
      sections.set(key, section);
    }
    section.projects.push(project);
  }
  const order = new Map(customGroups.map((g, i) => [`custom:${g.name}`, i]));
  return [...sections.entries()]
    .map(([key, s]) => ({
      key,
      ...s,
      projects: [...s.projects].sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => {
      if (a.custom !== b.custom) return a.custom ? -1 : 1;
      if (a.custom) return (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0);
      return a.title.localeCompare(b.title);
    });
}

/** Move a project to a custom group, or back to its parent folder when `groupName` is null. */
export function assignProject(
  groups: readonly MapGroup[],
  rootPath: string,
  groupName: string | null,
): MapGroup[] {
  const target = normalizePath(rootPath);
  const next = groups.map((g) => ({
    name: g.name,
    projects: g.projects.filter((p) => normalizePath(p) !== target),
  }));
  if (groupName !== null) {
    const existing = next.find((g) => g.name === groupName);
    if (existing) existing.projects.push(rootPath);
    else next.push({ name: groupName, projects: [rootPath] });
  }
  return next.filter((g) => g.projects.length > 0);
}
