import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { canUpdateTask, getWorkspaceWithRole } from "@/lib/workspaceAccess";
import { isValidObjectId } from "@/lib/validators";
import Task from "@/models/Task";

export async function PUT(request, { params }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
  }

  await connectToDatabase();
  const task = await Task.findById(id);
  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const { role } = await getWorkspaceWithRole(task.workspaceId, user.userId);
  if (!role) {
    return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
  }

  const isAssignee = task.assignedTo?.toString() === user.userId;
  if (!canUpdateTask(role, isAssignee)) {
    return NextResponse.json({ error: "Insufficient permissions to update task." }, { status: 403 });
  }

  const body = await request.json();
  const allowed = ["title", "description", "status", "assignedTo", "priority", "dueDate"];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      task[key] = body[key];
    }
  }

  if (body.comment) {
    task.comments.push({ userId: user.userId, text: body.comment });
  }

  await task.save();
  return NextResponse.json({ task });
}
