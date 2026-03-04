import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request) {
  const { password } = await request.json();
  const correctPassword = process.env.AUTH_PASSWORD;

  if (password === correctPassword) {
    const cookieStore = await cookies();
    const baseOptions = {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    };
    // Cookie session – httpOnly để bảo vệ khỏi XSS
    cookieStore.set("auth", "true", { ...baseOptions, httpOnly: true });
    // Cookie password – không httpOnly để client JS đọc được khi gọi API
    cookieStore.set("auth_password", password, {
      ...baseOptions,
      httpOnly: false,
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { success: false, message: "Sai mật khẩu!" },
    { status: 401 },
  );
}
