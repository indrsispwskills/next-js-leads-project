import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import Invitation from "@/models/Invitation";
import Workspace from "@/models/Workspace";

export async function POST(request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { invitationId } = await request.json();
  await connectToDatabase();

  const invitation = await Invitation.findById(invitationId);
  if (!invitation || invitation.status !== "Pending") {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  if (invitation.email !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "Invitation email does not match your account." }, { status: 403 });
  }

  const workspace = await Workspace.findById(invitation.workspaceId);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const alreadyMember = workspace.members.some((entry) => entry.userId.toString() === user.userId);
  if (!alreadyMember) {
    workspace.members.push({ userId: user.userId, role: invitation.role });
    await workspace.save();
  }

  invitation.status = "Accepted";
  await invitation.save();

  return NextResponse.json({ message: "Invitation accepted.", workspaceId: workspace._id });
}
