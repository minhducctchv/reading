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
