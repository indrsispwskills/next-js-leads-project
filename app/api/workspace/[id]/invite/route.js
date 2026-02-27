import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { canManageWorkspace, getWorkspaceWithRole } from "@/lib/workspaceAccess";
import { isEmail } from "@/lib/validators";
import Invitation from "@/models/Invitation";

export async function POST(request, { params }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const { email, role = "Member" } = await request.json();

  if (!isEmail(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  await connectToDatabase();
  const { workspace, role: actingRole } = await getWorkspaceWithRole(id, user.userId);
  if (!workspace || !actingRole) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  if (!canManageWorkspace(actingRole)) {
    return NextResponse.json({ error: "Only admin can invite users." }, { status: 403 });
  }

  const existing = await Invitation.findOne({ workspaceId: id, email: email.toLowerCase(), status: "Pending" });
  if (existing) {
    return NextResponse.json({ error: "Pending invitation already exists." }, { status: 409 });
  }

  const invitation = await Invitation.create({ workspaceId: id, email: email.toLowerCase(), role, invitedBy: user.userId });
  return NextResponse.json({ invitation }, { status: 201 });
}
