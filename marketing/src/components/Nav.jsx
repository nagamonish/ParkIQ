import { useEffect, useState } from "react";

import { OPERATOR_URL, SIGHTLINE_URL } from "../config.js";
import { Icon } from "./Icon.jsx";
import { Logo } from "./Logo.jsx";

const LINKS = [
  { route: "how-it-works", label: "How it works" },
  { route: "technology", label: "Technology" },
  { route: "operators", label: "For operators" },
  { route: "pricing", label: "Pricing" },
  { route: "about", label: "About" },
];

export function Nav({ route }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [route]);

  return (
    <header className={`nav ${scrolled ? "is-scrolled" : ""}`}>
      <div className="nav-inner">
        <a className="nav-brand" href="#/">
          <Logo />
        </a>

        <nav className="nav-links" aria-label="Primary">
          {LINKS.map((link) => (
            <a key={link.route} href={`#/${link.route}`} className={route === link.route ? "is-active" : ""}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <a className="nav-login" href={OPERATOR_URL} target="_blank" rel="noreferrer">
            Log in
          </a>
          <a className="btn btn-primary btn-sm" href={SIGHTLINE_URL} target="_blank" rel="noreferrer">
            Find parking
          </a>
          <button className="nav-toggle" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            <Icon name={open ? "x" : "menu"} size={22} />
          </button>
        </div>
      </div>

      <div className={`nav-mobile ${open ? "is-open" : ""}`}>
        {LINKS.map((link) => (
          <a key={link.route} href={`#/${link.route}`}>
            {link.label}
          </a>
        ))}
        <a href="#/drivers">For drivers</a>
        <a href="#/contact">Contact</a>
        <a className="btn btn-primary" href={SIGHTLINE_URL} target="_blank" rel="noreferrer">
          Find parking near you
        </a>
        <a className="btn" href={OPERATOR_URL} target="_blank" rel="noreferrer">
          Operator log in
        </a>
      </div>
    </header>
  );
}
