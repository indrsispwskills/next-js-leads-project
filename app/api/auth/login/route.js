import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { isEmail, requireMinLength } from "@/lib/validators";
import User from "@/models/User";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!isEmail(email) || !requireMinLength(password, 6)) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = signToken({ userId: user._id.toString(), email: user.email, name: user.name });
    const response = NextResponse.json({ message: "Login successful." });
    response.cookies.set("token", token, { httpOnly: true, sameSite: "lax", path: "/" });
    return response;
  } catch {
    return NextResponse.json({ error: "Failed to login." }, { status: 500 });
  }
}
