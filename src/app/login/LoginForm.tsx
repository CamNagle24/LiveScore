"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { safeNext } from "@/lib/safeNext";

const STYLES = `
  body { background: #030014; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .login-input::placeholder { color: rgba(255,255,255,0.3); }
`;

type Mode = "signin" | "signup";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const initialError = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError ? "Sign-in failed. Please try again." : null
  );
  const [notice, setNotice] = useState<string | null>(null);

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push(next);
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      // If email confirmation is required there is no active session yet.
      if (data.session) {
        router.push(next);
        router.refresh();
      } else {
        setNotice("Check your email to confirm your account, then sign in.");
        setMode("signin");
      }
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setBusy(false);
      setError(error.message);
    }
    // On success the browser is redirected to Google.
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div
        style={{
          background: "radial-gradient(ellipse at 50% 0%,#1a0030 0%,#030014 70%)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "var(--font-dm-sans, system-ui)",
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          {/* Logo */}
          <div
            onClick={() => router.push("/landing")}
            style={{
              fontFamily: "var(--font-bebas, sans-serif)",
              fontSize: "32px",
              letterSpacing: "0.12em",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              cursor: "pointer",
              marginBottom: "28px",
            }}
          >
            <span
              style={{
                width: "32px",
                height: "32px",
                background: "linear-gradient(135deg,#FF006E,#FF7A00)",
                borderRadius: "7px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
              }}
            >
              ▶
            </span>
            LIVESCORE
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "32px 28px",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-bebas, sans-serif)",
                fontSize: "30px",
                letterSpacing: "0.04em",
                color: "#fff",
                margin: "0 0 6px",
              }}
            >
              {mode === "signin" ? "WELCOME BACK" : "CREATE YOUR ACCOUNT"}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: "0 0 24px" }}>
              {mode === "signin"
                ? "Sign in to track and save live performances."
                : "Join free to build your front-row collection."}
            </p>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              style={{
                width: "100%",
                background: "#fff",
                color: "#1a1a1a",
                border: "none",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: busy ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                fontFamily: "var(--font-dm-sans, system-ui)",
                opacity: busy ? 0.6 : 1,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
                <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>or</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
            </div>

            <form onSubmit={handleSubmit}>
              <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "6px" }}>
                Email
              </label>
              <input
                className="login-input"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />

              <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: "16px 0 6px" }}>
                Password
              </label>
              <input
                className="login-input"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
              />

              {error && (
                <p style={{ color: "#FF4D6D", fontSize: "13px", margin: "14px 0 0" }}>{error}</p>
              )}
              {notice && (
                <p style={{ color: "#BCFF00", fontSize: "13px", margin: "14px 0 0" }}>{notice}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                style={{
                  width: "100%",
                  marginTop: "20px",
                  background: "linear-gradient(135deg,#FF006E,#FF3366)",
                  border: "none",
                  borderRadius: "10px",
                  padding: "13px",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: busy ? "default" : "pointer",
                  fontFamily: "var(--font-dm-sans, system-ui)",
                  boxShadow: "0 0 20px rgba(255,0,110,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy && (
                  <span
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid rgba(255,255,255,0.4)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                )}
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "13px", marginTop: "20px" }}>
              {mode === "signin" ? "New to LiveScore? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                  setNotice(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#FF006E",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "13px",
                  fontFamily: "var(--font-dm-sans, system-ui)",
                }}
              >
                {mode === "signin" ? "Sign up free" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "10px",
  padding: "12px 14px",
  color: "#fff",
  fontSize: "14px",
  fontFamily: "var(--font-dm-sans, system-ui)",
  outline: "none",
  boxSizing: "border-box",
};
