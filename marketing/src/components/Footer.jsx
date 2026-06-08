import { CONTACT_EMAIL, OPERATOR_URL, SIGHTLINE_URL } from "../config.js";
import { Logo } from "./Logo.jsx";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#/how-it-works" },
      { label: "Technology", href: "#/technology" },
      { label: "Pricing", href: "#/pricing" },
      { label: "For drivers", href: "#/drivers" },
      { label: "For operators", href: "#/operators" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#/about" },
      { label: "Blog", href: "#/blog" },
      { label: "Careers", href: "#/careers" },
      { label: "Contact", href: "#/contact" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Find parking", href: SIGHTLINE_URL, external: true },
      { label: "Operator login", href: OPERATOR_URL, external: true },
      { label: "FAQ", href: "#/faq" },
      { label: "Privacy", href: "#/privacy" },
      { label: "Book a demo", href: `mailto:${CONTACT_EMAIL}?subject=ParkIQ%20demo` },
    ],
  },
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Logo size={24} />
          <p className="footer-tagline">AI that sees every open space — so you never circle the block again.</p>
        </div>
        <div className="footer-cols">
          {COLUMNS.map((col) => (
            <div className="footer-col" key={col.title}>
              <h4>{col.title}</h4>
              {col.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noreferrer" : undefined}
                >
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} ParkIQ. All rights reserved.</span>
        <span className="footer-soft">Soft launch · {`${"San Francisco"}`} · more cities soon</span>
      </div>
    </footer>
  );
}
