import { useState } from "react";

import { Reveal } from "./Reveal.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EarlyAccess() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("driver");
  const [state, setState] = useState("idle"); // idle | error | done

  // Front-end only for the soft launch — swaps to a real endpoint later.
  const submit = (event) => {
    event.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setState("error");
      return;
    }
    setState("done");
  };

  return (
    <section className="section early" id="early-access">
      <Reveal as="div" className="early-card">
        <span className="section-kicker on-dark">Soft launch</span>
        <h2 className="early-title">Be first in your city.</h2>
        <p className="early-lead">
          We're rolling out city by city. Join the early-access list and we'll let
          you know the moment ParkIQ goes live near you.
        </p>

        {state === "done" ? (
          <div className="early-done" role="status">
            <span className="early-check">✓</span>
            You're on the list. We'll be in touch soon.
          </div>
        ) : (
          <form className="early-form" onSubmit={submit} noValidate>
            <div className="early-roles">
              {[
                ["driver", "I'm a driver"],
                ["operator", "I run parking"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={`role-chip ${role === value ? "is-active" : ""}`}
                  onClick={() => setRole(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="early-row">
              <input
                type="email"
                className={`early-input ${state === "error" ? "is-error" : ""}`}
                placeholder="you@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state === "error") setState("idle");
                }}
                aria-label="Email address"
              />
              <button type="submit" className="btn btn-light btn-lg">
                Get early access
              </button>
            </div>
            {state === "error" && <p className="early-error">Please enter a valid email address.</p>}
          </form>
        )}
      </Reveal>
    </section>
  );
}
