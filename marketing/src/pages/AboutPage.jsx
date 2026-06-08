import { PageHeader } from "../components/PageHeader.jsx";
import { Stats } from "../components/Stats.jsx";
import { Reveal } from "../components/Reveal.jsx";
import { Icon } from "../components/Icon.jsx";

const VALUES = [
  { icon: "bolt", title: "Useful over flashy", body: "We obsess over whether a driver actually finds a spot faster. Everything else is secondary." },
  { icon: "shield", title: "Privacy by default", body: "We count cars, not people. No plates, no faces — it's the architecture, not a setting." },
  { icon: "globe", title: "Built for the real world", body: "Rain, glare, odd angles, packed lots. If it doesn't work on a real curb, it doesn't ship." },
];

const TEAM = [
  { name: "Sarah Connor", role: "CEO & Co-founder", hue: "#7c3aed" },
  { name: "Marcus Lee", role: "CTO & Co-founder", hue: "#a855f7" },
  { name: "Priya Nair", role: "Head of Vision", hue: "#6d28d9" },
  { name: "Diego Alvarez", role: "Head of Product", hue: "#9333ea" },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        kicker="About"
        title="We're giving cities their time back."
        lead="ParkIQ started with a simple frustration: circling the block. We're a small team of computer-vision and cities nerds building the layer that makes parking legible."
      />
      <Stats />
      <section className="section">
        <Reveal as="div" className="section-head">
          <span className="section-kicker">What we believe</span>
          <h2 className="section-title">Our values</h2>
        </Reveal>
        <div className="values-grid">
          {VALUES.map((v, i) => (
            <Reveal as="article" className="value-card" key={v.title} delay={(i % 3) * 80}>
              <span className="value-icon"><Icon name={v.icon} size={22} /></span>
              <h3>{v.title}</h3>
              <p>{v.body}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="section about-team">
        <Reveal as="div" className="section-head">
          <span className="section-kicker">Team</span>
          <h2 className="section-title">The people behind ParkIQ</h2>
        </Reveal>
        <div className="team-grid">
          {TEAM.map((m, i) => (
            <Reveal as="div" className="team-card" key={m.name} delay={(i % 4) * 70}>
              <span className="team-avatar" style={{ background: m.hue }}>
                {m.name.split(" ").map((n) => n[0]).join("")}
              </span>
              <h4>{m.name}</h4>
              <span className="team-role">{m.role}</span>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
