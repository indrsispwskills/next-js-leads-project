import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { isValidObjectId, requireMinLength } from "@/lib/validators";
import { canManageWorkspace, getWorkspaceWithRole } from "@/lib/workspaceAccess";
import Workspace from "@/models/Workspace";
import Task from "@/models/Task";

export async function PATCH(request, { params }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid workspace id." }, { status: 400 });
  }

  const { name } = await request.json();
  if (!requireMinLength(name, 2)) {
    return NextResponse.json({ error: "Workspace name must be at least 2 characters." }, { status: 400 });
  }

  await connectToDatabase();
  const { workspace, role } = await getWorkspaceWithRole(id, user.userId);

  if (!workspace || !role) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  if (!canManageWorkspace(role)) {
    return NextResponse.json({ error: "Only admin can edit workspace." }, { status: 403 });
  }

  workspace.name = name.trim();
  await workspace.save();

  return NextResponse.json({ workspace });
}

export async function DELETE(_request, { params }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid workspace id." }, { status: 400 });
  }

  await connectToDatabase();

  const { workspace, role } = await getWorkspaceWithRole(id, user.userId);
  if (!workspace || !role) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  if (!canManageWorkspace(role)) {
    return NextResponse.json({ error: "Only admin can delete workspace." }, { status: 403 });
  }

  await Task.deleteMany({ workspaceId: id });
  await Workspace.findByIdAndDelete(id);
  return NextResponse.json({ message: "Workspace deleted." });
}
