"use client";

const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

export function NoTranslation({ enPath }) {
  function handleClick(e) {
    e.preventDefault();
    // Set cookie NEXT_LOCALE=en giống LocaleSwitch, để middleware không redirect về vi nữa
    const expires = new Date(Date.now() + ONE_YEAR).toUTCString();
    document.cookie = `NEXT_LOCALE=en; expires=${expires}; path=/`;
    location.href = enPath;
  }

  return (
    <div
      style={{
        padding: "2rem",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        backgroundColor: "#fafafa",
        textAlign: "center",
        marginTop: "2rem",
      }}
    >
      <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🇻🇳</div>
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          marginBottom: "0.5rem",
          color: "#374151",
        }}
      >
        Chưa có bản dịch tiếng Việt
      </h2>
      <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
        Trang này chưa được dịch sang tiếng Việt. Vui lòng xem phiên bản tiếng
        Anh.
      </p>
      <a
        href={enPath}
        onClick={handleClick}
        style={{
          display: "inline-block",
          padding: "0.5rem 1rem",
          backgroundColor: "#3b82f6",
          color: "white",
          borderRadius: "6px",
          textDecoration: "none",
          fontSize: "0.875rem",
          cursor: "pointer",
        }}
      >
        Xem bản tiếng Anh →
      </a>
    </div>
  );
}
