/**
 * Đọc giá trị của cookie theo tên.
 * Dùng phía client (browser) để lấy auth_password khi gọi API.
 */
export function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Trả về giá trị auth_password từ cookie để dùng làm x-api-password header.
 */
export function getApiPassword() {
  return getCookie("auth_password") ?? "";
}

/**
 * fetch wrapper: nếu response bị redirect về login (307 hoặc HTML),
 * tự động redirect browser về /login.
 */
export async function fetchWithAuth(url, options = {}) {
  const password = getApiPassword();
  const res = await fetch(url, {
    ...options,
    redirect: "manual",
    headers: {
      ...options.headers,
      "x-api-password": password,
    },
  });

  // 307/308 redirect hoặc 401 → về login
  if (
    res.type === "opaqueredirect" ||
    res.status === 401 ||
    res.status === 307 ||
    res.status === 308
  ) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  return res;
}
