import { PageHeader } from "../components/PageHeader.jsx";
import { Reveal } from "../components/Reveal.jsx";
import { Icon } from "../components/Icon.jsx";
import { CONTACT_EMAIL } from "../config.js";

const PERKS = [
  { icon: "globe", title: "Remote-first", body: "Work from anywhere. We sync a few hours a day and trust you with the rest." },
  { icon: "bolt", title: "Real impact", body: "Small team, big surface area. What you ship is live in cities within weeks." },
  { icon: "leaf", title: "Mission that matters", body: "Less circling means less traffic and lower emissions. The math is good." },
];

const ROLES = [
  { title: "Senior Computer Vision Engineer", team: "Vision", loc: "Remote (US)" },
  { title: "Full-Stack Engineer", team: "Product", loc: "Remote (US/EU)" },
  { title: "Cities Partnerships Lead", team: "Go-to-market", loc: "San Francisco" },
  { title: "Product Designer", team: "Design", loc: "Remote" },
];

export default function CareersPage() {
  return (
    <>
      <PageHeader kicker="Careers" title="Help us make parking disappear." lead="We're a small, senior team shipping computer vision that touches real streets. Come build with us." />
      <section className="section">
        <div className="perks-grid">
          {PERKS.map((p, i) => (
            <Reveal as="article" className="value-card" key={p.title} delay={(i % 3) * 80}>
              <span className="value-icon"><Icon name={p.icon} size={22} /></span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="section">
        <Reveal as="div" className="section-head">
          <span className="section-kicker">Open roles</span>
          <h2 className="section-title">Where you fit in</h2>
        </Reveal>
        <div className="roles-list">
          {ROLES.map((r, i) => (
            <Reveal as="a" className="role-row" key={r.title} delay={i * 60} href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(r.title)}`}>
              <div>
                <h3>{r.title}</h3>
                <span className="role-meta">{r.team} · {r.loc}</span>
              </div>
              <span className="role-apply">Apply <Icon name="arrow" size={16} /></span>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
