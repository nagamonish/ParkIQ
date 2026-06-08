import { PageHeader } from "../components/PageHeader.jsx";
import { Reveal } from "../components/Reveal.jsx";
import { Icon } from "../components/Icon.jsx";
import { CONTACT_EMAIL, OPERATOR_URL } from "../config.js";

const TIERS = [
  {
    name: "Starter",
    price: "$0",
    period: "/ camera · forever",
    blurb: "For a single lot trying ParkIQ.",
    featured: false,
    cta: "Start free",
    href: OPERATOR_URL,
    features: ["1 camera", "Up to 50 spaces", "Live dashboard", "7-day history", "Community support"],
  },
  {
    name: "Growth",
    price: "$49",
    period: "/ camera · month",
    blurb: "For operators running multiple lots.",
    featured: true,
    cta: "Start free trial",
    href: OPERATOR_URL,
    features: ["Unlimited spaces", "Full analytics + peak hours", "Publish to the public finder", "Open API access", "Email support"],
  },
  {
    name: "Enterprise",
    price: "Let's talk",
    period: "· cities & large fleets",
    blurb: "For city-scale deployments.",
    featured: false,
    cta: "Contact sales",
    href: `mailto:${CONTACT_EMAIL}?subject=ParkIQ%20Enterprise`,
    features: ["Volume pricing", "SSO + roles", "SLA & dedicated support", "On-prem / private cloud", "Custom integrations"],
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHeader
        kicker="Pricing"
        title="Pay for cameras, not surprises."
        lead="Simple per-camera pricing. Start free, scale when you're ready. The public finder is always free for drivers."
      />
      <section className="section">
        <div className="pricing-grid">
          {TIERS.map((t, i) => (
            <Reveal as="article" className={`price-card ${t.featured ? "is-featured" : ""}`} key={t.name} delay={i * 90}>
              {t.featured && <span className="price-badge">Most popular</span>}
              <h3 className="price-name">{t.name}</h3>
              <p className="price-blurb">{t.blurb}</p>
              <div className="price-amount">
                {t.price} <span className="price-period">{t.period}</span>
              </div>
              <a className={`btn ${t.featured ? "btn-primary" : ""} price-cta`} href={t.href} target="_blank" rel="noreferrer">
                {t.cta}
              </a>
              <ul className="price-features">
                {t.features.map((f) => (
                  <li key={f}>
                    <Icon name="check" size={16} /> {f}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
