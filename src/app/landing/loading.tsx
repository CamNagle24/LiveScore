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

      {/* nav bar placeholder */}
      <div style={{ height: "64px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(3,0,20,0.9)" }} />

      {/* hero placeholder */}
      <div
        style={{
          background: "radial-gradient(ellipse at 50% 0%, #1a0030 0%, #030014 70%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "520px",
          padding: "60px 24px",
          gap: "20px",
        }}
      >
        <div className="skel" style={{ width: "min(500px, 55vw)", height: "clamp(54px, 9vw, 100px)", borderRadius: "12px" }} />
        <div className="skel" style={{ width: "min(360px, 40vw)", height: "clamp(36px, 6vw, 64px)", borderRadius: "12px" }} />
        <div className="skel" style={{ width: "min(260px, 28vw)", height: "clamp(36px, 6vw, 64px)", borderRadius: "12px" }} />
        <div style={{ display: "flex", gap: "14px", marginTop: "8px" }}>
          <div className="skel" style={{ width: "160px", height: "52px", borderRadius: "12px" }} />
          <div className="skel" style={{ width: "140px", height: "52px", borderRadius: "12px" }} />
        </div>
      </div>

      {/* recent drops placeholder */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 24px" }}>
        <div className="skel" style={{ width: "200px", height: "36px", marginBottom: "40px", borderRadius: "8px" }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
            gap: "16px",
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skel" style={{ height: "300px", borderRadius: "16px" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
