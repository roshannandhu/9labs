import { ImageResponse } from "next/og";
import { NINE_PATH } from "@/components/hero/nine-path";

export const dynamic = "force-static";
export const alt = "Nine Labs Solutions — Marketing, events and technology, built to deliver results.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const grid =
    "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "#050507",
          backgroundImage: grid,
          backgroundSize: "60px 60px",
          padding: "0 80px",
          gap: 60,
        }}
      >
        <svg width="300" height="450" viewBox="0 0 400 600">
          <path d={NINE_PATH} fill="#0b1130" stroke="#b98cff" strokeOpacity="0.4" strokeWidth="30" strokeLinejoin="round" />
          <path d={NINE_PATH} fill="#0b1130" stroke="#3b82ff" strokeWidth="9" strokeLinejoin="round" />
          <path d={NINE_PATH} fill="none" stroke="#e8f0ff" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", color: "white", maxWidth: 680 }}>
          <div style={{ fontSize: 22, letterSpacing: 6, color: "#b98cff", textTransform: "uppercase" }}>Nine Labs Solutions · Dubai South</div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, marginTop: 20 }}>Marketing, events and technology, built to deliver results.</div>
          <div style={{ fontSize: 26, color: "#b8bcc8", marginTop: 24 }}>The bridge between your business and your results.</div>
        </div>
      </div>
    ),
    size,
  );
}
