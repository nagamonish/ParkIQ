import { useState } from "react";

import { Icon } from "../components/Icon.jsx";
import { signIn } from "../auth.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setError(null);
  };

  const submit = (e) => {
    e.preventDefault();
    if (mode === "signup" && !form.name.trim()) return setError("What should we call you?");
    if (!EMAIL_RE.test(form.email.trim())) return setError("Enter a valid email address.");
    if (form.password.length < 4) return setError("Password must be at least 4 characters.");
    setBusy(true);
    // Demo: accept any credentials and start a local session.
    setTimeout(() => {
      signIn(form.email.trim(), form.name.trim());
      onAuth();
    }, 450);
  };

  return (
    <div className="auth">
      <aside className="auth-brand">
        <div className="auth-brand-inner">
          <span className="auth-logo">
            <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="9" fill="#fff" />
              <circle cx="16" cy="16" r="7" fill="none" stroke="#7c3aed" strokeWidth="2.6" />
              <circle cx="16" cy="16" r="2.6" fill="#7c3aed" />
            </svg>
            Park<span>IQ</span>
          </span>
          <h1>The operator console for AI parking.</h1>
          <p>Connect cameras, calibrate spaces, and watch occupancy update live — all in one place.</p>
          <ul className="auth-points">
            <li><Icon name="camera" size={18} /> Connect any RTSP camera in seconds</li>
            <li><Icon name="spaces" size={18} /> Pixel-accurate space calibration</li>
            <li><Icon name="analytics" size={18} /> Live occupancy + trends</li>
          </ul>
        </div>
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </aside>

      <main className="auth-panel">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-tabs">
            <button type="button" className={mode === "login" ? "is-on" : ""} onClick={() => setMode("login")}>
              Log in
            </button>
            <button type="button" className={mode === "signup" ? "is-on" : ""} onClick={() => setMode("signup")}>
              Sign up
            </button>
          </div>

          <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="auth-sub">
            {mode === "login" ? "Log in to manage your lots." : "Start monitoring your parking in minutes."}
          </p>

          {mode === "signup" && (
            <label className="auth-field">
              Name
              <input value={form.name} onChange={set("name")} placeholder="Sarah Connor" autoComplete="name" />
            </label>
          )}
          <label className="auth-field">
            Email
            <input value={form.email} onChange={set("email")} placeholder="you@company.com" autoComplete="email" />
          </label>
          <label className="auth-field">
            Password
            <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={busy}>
            {busy ? "One moment…" : mode === "login" ? "Log in" : "Create account"}
            {!busy && <Icon name="chevronRight" size={17} />}
          </button>

          <p className="auth-demo">Demo build — any email + password gets you in.</p>
          <a className="auth-back" href="http://localhost:5175">← Back to parkiq.io</a>
        </form>
      </main>
    </div>
  );
}
