import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { requireMinLength } from "@/lib/validators";
import Workspace from "@/models/Workspace";

export async function POST(request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { name } = await request.json();
    if (!requireMinLength(name, 2)) {
      return NextResponse.json({ error: "Workspace name must be at least 2 characters." }, { status: 400 });
    }

    await connectToDatabase();
    const workspace = await Workspace.create({
      name: name.trim(),
      owner: user.userId,
      members: [{ userId: user.userId, role: "Admin" }],
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create workspace." }, { status: 500 });
  }
}
