import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (!file.type?.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    const uploadDirectory = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDirectory, { recursive: true });
    await fs.writeFile(path.join(uploadDirectory, fileName), buffer);

    return NextResponse.json({
      image: {
        url: `/uploads/${fileName}`,
        name: file.name,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
