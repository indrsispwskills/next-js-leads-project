import Workspace from "@/models/Workspace";

export const WORKSPACE_ROLES = ["Admin", "Member", "Viewer"];

export async function getWorkspaceWithRole(workspaceId, userId) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return { workspace: null, role: null };

  const member = workspace.members.find((entry) => entry.userId.toString() === userId);
  return { workspace, role: member?.role || null };
}

export function canManageWorkspace(role) {
  return role === "Admin";
}

export function canCreateTask(role) {
  return role === "Admin" || role === "Member";
}

export function canUpdateTask(role, isAssignee) {
  if (role === "Admin") return true;
  if (role === "Member") return isAssignee;
  return false;
}

export function ensureAtLeastOneAdmin(members) {
  return members.some((member) => member.role === "Admin");
}
