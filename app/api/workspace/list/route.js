import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import Workspace from "@/models/Workspace";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  await connectToDatabase();

  const workspaces = await Workspace.find({ "members.userId": user.userId })
    .populate("members.userId", "name email")
    .sort({ createdAt: -1 });

  return NextResponse.json({ workspaces });
}
