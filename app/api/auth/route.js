import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request) {
  const { password } = await request.json();
  const correctPassword = process.env.NEXT_PUBLIC_PASSWORD;

  if (password === correctPassword) {
    const cookieStore = await cookies();
    cookieStore.set("auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { success: false, message: "Sai mật khẩu!" },
    { status: 401 },
  );
}
