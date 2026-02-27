import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { canCreateTask, getWorkspaceWithRole } from "@/lib/workspaceAccess";
import { isValidObjectId, requireMinLength } from "@/lib/validators";
import Task from "@/models/Task";

export async function POST(request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await request.json();
  const { workspaceId, title, description = "", assignedTo, status = "To Do", priority = "Medium", dueDate } = body;

  if (!isValidObjectId(workspaceId) || !requireMinLength(title, 1)) {
    return NextResponse.json({ error: "Workspace and title are required." }, { status: 400 });
  }

  await connectToDatabase();
  const { workspace, role } = await getWorkspaceWithRole(workspaceId, user.userId);
  if (!workspace || !role) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  if (!canCreateTask(role)) {
    return NextResponse.json({ error: "Insufficient role to create task." }, { status: 403 });
  }

  if (assignedTo) {
    const isWorkspaceMember = workspace.members.some((member) => member.userId.toString() === assignedTo);
    if (!isWorkspaceMember) {
      return NextResponse.json({ error: "Assigned user must be a workspace member." }, { status: 400 });
    }
  }

  const task = await Task.create({
    workspaceId,
    title,
    description,
    assignedTo: isValidObjectId(assignedTo) ? assignedTo : undefined,
    createdBy: user.userId,
    status,
    priority,
    dueDate: dueDate ? new Date(dueDate) : undefined,
  });

  return NextResponse.json({ task }, { status: 201 });
}
