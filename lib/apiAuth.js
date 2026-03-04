import { NextResponse } from "next/server";

/**
 * Kiểm tra header x-api-password.
 * Trả về null nếu hợp lệ, hoặc NextResponse 401 nếu sai.
 */
export function checkApiPassword(request) {
  const provided = request.headers.get("x-api-password");
  const expected = process.env.NEXT_PUBLIC_PASSWORD;

  if (!provided || provided !== expected) {
    return NextResponse.json(
      { error: "Unauthorized: invalid or missing password" },
      { status: 401 },
    );
  }

  return null; // OK
}
