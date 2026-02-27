import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { isValidObjectId } from "@/lib/validators";
import { getWorkspaceWithRole } from "@/lib/workspaceAccess";
import Task from "@/models/Task";

export async function GET(request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const q = searchParams.get("q");

  if (!isValidObjectId(workspaceId)) {
    return NextResponse.json({ error: "Invalid workspace id." }, { status: 400 });
  }

  await connectToDatabase();
  const { role } = await getWorkspaceWithRole(workspaceId, user.userId);

  if (!role) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const query = { workspaceId };
  if (["To Do", "In Progress", "Done"].includes(status)) query.status = status;
  if (["Low", "Medium", "High"].includes(priority)) query.priority = priority;
  if (q) query.title = { $regex: q, $options: "i" };

  const tasks = await Task.find(query)
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  return NextResponse.json({ tasks });
}
