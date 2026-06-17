export default function ProfileLoading() {
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

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 24px" }}>
        {/* avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "40px" }}>
          <div className="skel" style={{ width: "72px", height: "72px", borderRadius: "50%", flexShrink: 0 }} />
          <div>
            <div className="skel" style={{ height: "20px", width: "180px", marginBottom: "8px" }} />
            <div className="skel" style={{ height: "14px", width: "120px" }} />
          </div>
        </div>

        {/* saved performances heading */}
        <div className="skel" style={{ height: "22px", width: "200px", marginBottom: "24px" }} />

        {/* saved performance cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "20px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ borderRadius: "16px", overflow: "hidden", background: "rgba(255,255,255,0.04)" }}>
              <div className="skel" style={{ paddingTop: "56%", borderRadius: 0 }} />
              <div style={{ padding: "12px" }}>
                <div className="skel" style={{ height: "15px", marginBottom: "8px", width: "70%" }} />
                <div className="skel" style={{ height: "12px", width: "45%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
