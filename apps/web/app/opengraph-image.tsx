import { ImageResponse } from "next/og";

export const alt = "ShobShop — Everyday favourites";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff7ed",
        color: "#1c1917",
        padding: "72px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "42px",
          width: "100%",
          padding: "64px",
          border: "4px solid #fed7aa",
          borderRadius: "48px",
          background: "white",
        }}
      >
        <div
          style={{
            width: "184px",
            height: "184px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "48px",
            background: "#ea580c",
          }}
        >
          <svg width="116" height="116" viewBox="0 0 64 64">
            <path d="M18 25h28l-2.2 25H20.2L18 25Z" fill="#fff7ed" />
            <path
              d="M25 27v-4a7 7 0 0 1 14 0v4"
              fill="none"
              stroke="#fff7ed"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M26 36c1.8 2.5 3.8 3.7 6 3.7s4.2-1.2 6-3.7"
              fill="none"
              stroke="#ea580c"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: "76px",
              fontWeight: 800,
              letterSpacing: "-3px",
            }}
          >
            Shob<span style={{ color: "#ea580c" }}>Shop</span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "12px",
              fontSize: "34px",
              color: "#57534e",
            }}
          >
            Everyday favourites, delivered across Bangladesh.
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
