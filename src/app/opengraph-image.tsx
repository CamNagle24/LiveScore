import { ImageResponse } from "next/og";

export const alt = "LiveScore — Every Live Performance, All in One Place";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background: "radial-gradient(ellipse at 30% 0%, #1a0030 0%, #030014 70%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "40px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "16px",
              background: "linear-gradient(135deg,#FF006E,#FF7A00)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px",
            }}
          >
            ▶
          </div>
          <div style={{ fontSize: "52px", letterSpacing: "0.12em", fontWeight: 800 }}>LIVESCORE</div>
        </div>
        <div style={{ fontSize: "76px", fontWeight: 800, lineHeight: 1.05, maxWidth: "900px" }}>
          Every live performance,
        </div>
        <div
          style={{
            fontSize: "76px",
            fontWeight: 800,
            lineHeight: 1.05,
            background: "linear-gradient(90deg,#FF006E,#FF7A00,#BCFF00)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          all in one place.
        </div>
        <div style={{ fontSize: "30px", color: "rgba(255,255,255,0.6)", marginTop: "32px" }}>
          Discover, track & save — and find where to watch.
        </div>
      </div>
    ),
    { ...size }
  );
}
