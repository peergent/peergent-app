"use client";

export default function V17Atmosphere() {
  return (
    <>
      <div className="v17-mesh" aria-hidden>
        <div
          className="v17-orb"
          style={{
            width: 640,
            height: 640,
            top: -220,
            right: -140,
            background: "radial-gradient(circle, rgba(91,124,250,0.55), transparent 70%)",
          }}
        />
        <div
          className="v17-orb"
          style={{
            width: 540,
            height: 540,
            bottom: -200,
            left: -160,
            background: "radial-gradient(circle, rgba(76,140,245,0.5), transparent 70%)",
          }}
        />
      </div>
      <div className="v17-dot-grid" aria-hidden />
      <div className="v17-vignette" aria-hidden />
    </>
  );
}
