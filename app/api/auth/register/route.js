import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { isEmail, requireMinLength } from "@/lib/validators";
import User from "@/models/User";

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!requireMinLength(name, 2)) {
      return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
    }

    if (!isEmail(email)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }

    if (!requireMinLength(password, 6)) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await User.findOne({ email: email.toLowerCase() });

    if (existing) {
      return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email: email.toLowerCase(), password: hash });

    const token = signToken({ userId: user._id.toString(), email: user.email, name: user.name });
    const response = NextResponse.json({ message: "Registration successful." });
    response.cookies.set("token", token, { httpOnly: true, sameSite: "lax", path: "/" });
    return response;
  } catch {
    return NextResponse.json({ error: "Failed to register user." }, { status: 500 });
  }
}
