import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { canManageWorkspace, getWorkspaceWithRole } from "@/lib/workspaceAccess";
import { isEmail } from "@/lib/validators";
import User from "@/models/User";

export async function POST(request, { params }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const { email, role = "Member" } = await request.json();

  if (!isEmail(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  if (!["Admin", "Member", "Viewer"].includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  await connectToDatabase();
  const { workspace, role: actingRole } = await getWorkspaceWithRole(id, user.userId);

  if (!workspace || !actingRole) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  if (!canManageWorkspace(actingRole)) {
    return NextResponse.json({ error: "Only admin can invite members." }, { status: 403 });
  }

  const invitee = await User.findOne({ email: email.toLowerCase() });
  if (!invitee) {
    return NextResponse.json({ error: "User with this email does not exist." }, { status: 404 });
  }

  const alreadyMember = workspace.members.some((entry) => entry.userId.toString() === invitee._id.toString());
  if (alreadyMember) {
    return NextResponse.json({ error: "User already exists in workspace." }, { status: 409 });
  }

  workspace.members.push({ userId: invitee._id, role });
  await workspace.save();

  return NextResponse.json({ message: "Member invited successfully.", workspace });
}
