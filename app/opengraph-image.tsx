import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Waffle n Crepe Dubai — golden grids, made to order";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Share card: the waffle grid inside a golden disc, brand fonts and colours, the hero line.
export default async function Image() {
  const dir = join(process.cwd(), "assets/fonts");
  const [display, displayRegular, serif] = await Promise.all([
    readFile(join(dir, "BricolageGrotesque-ExtraBold.ttf")),
    readFile(join(dir, "BricolageGrotesque-Regular.ttf")),
    readFile(join(dir, "InstrumentSerif-Italic.ttf")),
  ]);
  const cells = Array.from({ length: 7 * 7 });

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#FFF6E6", position: "relative", fontFamily: "Bricolage" }}>
        <div
          style={{
            position: "absolute", right: -70, top: 45, width: 560, height: 560, borderRadius: 9999, overflow: "hidden",
            background: "#E89A00", display: "flex", flexWrap: "wrap", alignContent: "center", justifyContent: "center",
            gap: 12, padding: 18, border: "14px solid #C98632",
          }}
        >
          {cells.map((_, i) => (
            <div key={i} style={{ width: 62, height: 62, borderRadius: 14, background: "#FFB81C", boxShadow: "inset 0 7px 12px rgba(42,22,11,.28)" }} />
          ))}
        </div>
        <div style={{ position: "absolute", right: 360, top: 70, width: 120, height: 120, borderRadius: 9999, background: "#D7263D", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: "rotate(-12deg)", fontSize: 22, lineHeight: 1.05, textAlign: "center" }}>
          <div style={{ display: "flex" }}>Buy 2,</div>
          <div style={{ display: "flex" }}>get 1 free</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px", width: 760 }}>
          <div style={{ fontFamily: "BricolageRegular", fontSize: 24, letterSpacing: 5, textTransform: "uppercase", color: "#6B4A33", marginBottom: 26 }}>Waffle n Crepe · Dubai</div>
          <div style={{ fontSize: 112, lineHeight: 0.9, letterSpacing: -5, color: "#2A160B" }}>Golden grids,</div>
          <div style={{ fontFamily: "Instrument", fontSize: 118, lineHeight: 1, letterSpacing: -2, color: "#C8691C" }}>made to order.</div>
          <div style={{ fontFamily: "BricolageRegular", fontSize: 30, color: "#6B4A33", marginTop: 34 }}>Silicon Oasis · The Sustainable City</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage", data: display, weight: 800, style: "normal" },
        { name: "BricolageRegular", data: displayRegular, weight: 400, style: "normal" },
        { name: "Instrument", data: serif, weight: 400, style: "italic" },
      ],
    }
  );
}
