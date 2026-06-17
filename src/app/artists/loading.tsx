export default function ArtistsLoading() {
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

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
        {/* filter / sort bar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
          <div className="skel" style={{ height: "40px", flex: 1, borderRadius: "10px" }} />
          <div className="skel" style={{ height: "40px", width: "120px", borderRadius: "10px" }} />
        </div>

        {/* artist card grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "20px" }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ borderRadius: "16px", overflow: "hidden", background: "rgba(255,255,255,0.04)" }}>
              <div className="skel" style={{ paddingTop: "75%", borderRadius: 0 }} />
              <div style={{ padding: "14px" }}>
                <div className="skel" style={{ height: "15px", marginBottom: "6px", width: "65%" }} />
                <div className="skel" style={{ height: "11px", width: "40%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
