export default function ArtistLoading() {
  return (
    <div style={{ background: "#030014", minHeight: "100vh", color: "#fff", fontFamily: "var(--font-dm-sans, system-ui)" }}>
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

      {/* hero section placeholder */}
      <div style={{ position: "relative", minHeight: "320px", background: "radial-gradient(ellipse at 50% 0%,#1a0030 0%,#030014 70%)", display: "flex", alignItems: "flex-end" }}>
        <div style={{ position: "relative", zIndex: 2, padding: "48px 24px 40px", maxWidth: "1200px", width: "100%", margin: "0 auto", display: "flex", alignItems: "flex-end", gap: "28px" }}>
          {/* artist avatar skeleton */}
          <div className="skel" style={{ width: "110px", height: "110px", borderRadius: "50%", flexShrink: 0 }} />

          <div style={{ flex: 1 }}>
            {/* artist name skeleton */}
            <div className="skel" style={{ height: "52px", width: "280px", borderRadius: "10px", marginBottom: "16px" }} />
            {/* genre / country tags skeleton */}
            <div style={{ display: "flex", gap: "10px" }}>
              <div className="skel" style={{ height: "26px", width: "80px", borderRadius: "20px" }} />
              <div className="skel" style={{ height: "26px", width: "60px", borderRadius: "20px" }} />
            </div>
          </div>
        </div>
      </div>

      {/* performances section */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
        {/* section heading skeleton */}
        <div className="skel" style={{ height: "28px", width: "200px", marginBottom: "28px" }} />

        {/* performance card grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "20px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ borderRadius: "14px", overflow: "hidden", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {/* thumbnail */}
              <div className="skel" style={{ paddingTop: "56.25%", borderRadius: 0 }} />
              <div style={{ padding: "14px" }}>
                <div className="skel" style={{ height: "15px", marginBottom: "8px", width: "75%" }} />
                <div className="skel" style={{ height: "12px", marginBottom: "6px", width: "50%" }} />
                <div className="skel" style={{ height: "12px", width: "35%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
