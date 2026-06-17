export default function VenuesLoading() {
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
        {/* search / filter bar */}
        <div className="skel" style={{ height: "40px", borderRadius: "10px", marginBottom: "32px" }} />

        {/* venue list */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skel" style={{ height: "72px", borderRadius: "12px", marginBottom: "12px" }} />
        ))}
      </div>
    </div>
  );
}
