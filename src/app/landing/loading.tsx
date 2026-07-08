export default function LandingLoading() {
  return (
    <div style={{ background: "#030014", minHeight: "100vh", color: "#fff" }}>
      <style>{`
        @keyframes shimmer {
          0%   { opacity: 0.4 }
          50%  { opacity: 0.7 }
          100% { opacity: 0.4 }
        }
        .skel { animation: shimmer 1.4s ease-in-out infinite; background: rgba(255,255,255,0.07); border-radius: 8px; }
      `}</style>

      {/* Ticker bar placeholder */}
      <div style={{ height: "36px", background: "rgba(255,0,110,0.3)" }} />

      {/* Nav bar placeholder */}
      <div style={{ height: "64px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(3,0,20,0.9)" }} />

      {/* Hero section placeholder */}
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", padding: "0 24px", background: "radial-gradient(ellipse at 50% 0%,#1a0030 0%,#030014 70%)" }}>
        <div className="skel" style={{ height: "80px", width: "min(600px, 80vw)", borderRadius: "12px" }} />
        <div className="skel" style={{ height: "24px", width: "min(400px, 60vw)", borderRadius: "8px" }} />
        <div style={{ display: "flex", gap: "14px" }}>
          <div className="skel" style={{ height: "52px", width: "160px", borderRadius: "12px" }} />
          <div className="skel" style={{ height: "52px", width: "160px", borderRadius: "12px" }} />
        </div>
      </div>

      {/* Recent Drops section placeholder */}
      <div style={{ background: "#030014", padding: "80px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="skel" style={{ height: "40px", width: "220px", marginBottom: "40px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "16px" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skel" style={{ height: "300px", borderRadius: "16px" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
