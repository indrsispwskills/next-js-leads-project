import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { canManageWorkspace, getWorkspaceWithRole } from "@/lib/workspaceAccess";
import { isValidObjectId } from "@/lib/validators";
import Task from "@/models/Task";

export async function DELETE(_request, { params }) {
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
  if (!canManageWorkspace(role)) {
    return NextResponse.json({ error: "Only admin can delete tasks." }, { status: 403 });
  }

  await Task.findByIdAndDelete(id);
  return NextResponse.json({ message: "Task deleted." });
}
