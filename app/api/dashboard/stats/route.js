import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import Workspace from "@/models/Workspace";
import Task from "@/models/Task";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  await connectToDatabase();

  const workspaces = await Workspace.find({ "members.userId": user.userId }, { _id: 1 });
  const workspaceIds = workspaces.map((w) => w._id);

  const tasks = await Task.find({ workspaceId: { $in: workspaceIds } }, { status: 1, dueDate: 1, assignedTo: 1 });

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "Done").length;
  const pending = tasks.filter((t) => t.status !== "Done").length;
  const overdue = tasks.filter((t) => t.status !== "Done" && t.dueDate && new Date(t.dueDate) < new Date()).length;

  const perUserMap = {};
  for (const task of tasks) {
    const key = task.assignedTo?.toString() || "Unassigned";
    perUserMap[key] = (perUserMap[key] || 0) + 1;
  }

  return NextResponse.json({
    totalTasks: total,
    completedTasks: completed,
    pendingTasks: pending,
    overdueTasks: overdue,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    tasksPerUser: perUserMap,
  });
}
