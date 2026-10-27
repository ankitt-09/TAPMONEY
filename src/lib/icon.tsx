import { ImageResponse } from "next/og";

/** App icon: a "tap ripple" — green dot with two rings on near-black. Full-bleed so it works as maskable. */
export function renderIcon(size: number) {
  const dot = size * 0.22;
  const ring1 = size * 0.46;
  const ring2 = size * 0.7;
  const circle = (d: number, style: React.CSSProperties) => (
    <div
      style={{
        position: "absolute",
        width: d,
        height: d,
        borderRadius: "50%",
        left: (size - d) / 2,
        top: (size - d) / 2,
        ...style,
      }}
    />
  );

  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: "flex", position: "relative", background: "#0b0d0c" }}>
        {circle(ring2, { border: `${size * 0.025}px solid rgba(61,220,151,0.3)` })}
        {circle(ring1, { border: `${size * 0.035}px solid rgba(61,220,151,0.6)` })}
        {circle(dot, { background: "#3ddc97" })}
      </div>
    ),
    { width: size, height: size },
  );
}
