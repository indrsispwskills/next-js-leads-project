import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { canManageWorkspace, ensureAtLeastOneAdmin, getWorkspaceWithRole, WORKSPACE_ROLES } from "@/lib/workspaceAccess";
import { isEmail, isValidObjectId } from "@/lib/validators";
import User from "@/models/User";

export async function POST(request, { params }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = params;
  const { email, role = "Member" } = await request.json();

  if (!isEmail(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  if (!WORKSPACE_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  await connectToDatabase();
  const { workspace, role: actingRole } = await getWorkspaceWithRole(id, user.userId);

  if (!workspace || !actingRole) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  if (!canManageWorkspace(actingRole)) {
    return NextResponse.json({ error: "Only admin can add members." }, { status: 403 });
  }

  const memberUser = await User.findOne({ email: email.toLowerCase() });
  if (!memberUser) {
    return NextResponse.json({ error: "User with this email does not exist." }, { status: 404 });
  }

  const alreadyMember = workspace.members.some((entry) => entry.userId.toString() === memberUser._id.toString());
  if (alreadyMember) {
    return NextResponse.json({ error: "User already exists in workspace." }, { status: 409 });
  }

  workspace.members.push({ userId: memberUser._id, role });
  await workspace.save();
  await workspace.populate("members.userId", "name email");

  return NextResponse.json({ message: "Member added successfully.", workspace });
}

export async function PATCH(request, { params }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = params;
  const { userId, role } = await request.json();

  if (!isValidObjectId(userId) || !WORKSPACE_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid userId or role." }, { status: 400 });
  }

  await connectToDatabase();
  const { workspace, role: actingRole } = await getWorkspaceWithRole(id, user.userId);
  if (!workspace || !actingRole) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  if (!canManageWorkspace(actingRole)) {
    return NextResponse.json({ error: "Only admin can change member roles." }, { status: 403 });
  }

  const member = workspace.members.find((entry) => entry.userId.toString() === userId);
  if (!member) {
    return NextResponse.json({ error: "Member not found in this workspace." }, { status: 404 });
  }

  member.role = role;

  if (!ensureAtLeastOneAdmin(workspace.members)) {
    return NextResponse.json({ error: "Workspace must have at least one Admin." }, { status: 400 });
  }

  await workspace.save();
  await workspace.populate("members.userId", "name email");

  return NextResponse.json({ message: "Member role updated.", workspace });
}

export async function DELETE(request, { params }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = params;
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("userId");

  if (!isValidObjectId(memberId)) {
    return NextResponse.json({ error: "Invalid member id." }, { status: 400 });
  }

  await connectToDatabase();
  const { workspace, role: actingRole } = await getWorkspaceWithRole(id, user.userId);
  if (!workspace || !actingRole) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  if (!canManageWorkspace(actingRole)) {
    return NextResponse.json({ error: "Only admin can remove members." }, { status: 403 });
  }

  workspace.members = workspace.members.filter((entry) => entry.userId.toString() !== memberId);

  if (!ensureAtLeastOneAdmin(workspace.members)) {
    return NextResponse.json({ error: "Workspace must have at least one Admin." }, { status: 400 });
  }

  await workspace.save();
  await workspace.populate("members.userId", "name email");

  return NextResponse.json({ message: "Member removed.", workspace });
}
