import { ImageResponse } from "next/og";

export const alt = "Project RESET, inspired by Third Degree Burnout — How do you reset?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        color: "#ffffff",
        background: "#52292b",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ width: 30, height: "100%", display: "flex", background: "#458284" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "64px 72px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 5 }}>PROJECT</span>
            <div style={{ display: "flex", alignItems: "baseline", fontSize: 82, fontWeight: 700, letterSpacing: -6 }}>
              <span style={{ color: "#ef805b" }}>re</span>
              <span>set</span>
              <span style={{ color: "#ef805b" }}>.</span>
            </div>
            <span style={{ color: "#f1bca6", fontSize: 22 }}>Choose Better. Together.</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", paddingLeft: 34, borderLeft: "2px solid #f8dfd0" }}>
            <span style={{ fontSize: 27, fontWeight: 700, letterSpacing: 2 }}>THIRD DEGREE</span>
            <span style={{ fontSize: 27, fontWeight: 700, letterSpacing: 2 }}>BURNOUT</span>
            <span style={{ marginTop: 9, color: "#f1bca6", fontSize: 21 }}>A Survivor’s Guide</span>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ maxWidth: 790, fontSize: 72, fontWeight: 700, lineHeight: 1, letterSpacing: -4 }}>How do you reset?</span>
            <span style={{ marginTop: 18, color: "#f8dfd0", fontSize: 25 }}>Add your voice to the community picture.</span>
          </div>
          <div style={{ width: 110, height: 110, display: "flex", borderRadius: 999, background: "#ef805b" }} />
        </div>
      </div>
    </div>,
    size,
  );
}
