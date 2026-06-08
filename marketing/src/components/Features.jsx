import { Icon } from "./Icon.jsx";
import { Reveal } from "./Reveal.jsx";

const FEATURES = [
  { icon: "bolt", title: "Real-time", body: "Availability updates within seconds of a car arriving or leaving." },
  { icon: "camera", title: "Uses existing cameras", body: "No sensors, no trenching, no per-space hardware to maintain." },
  { icon: "scan", title: "Vision-grade accuracy", body: "Oriented-box detection handles angled spaces and tight lots." },
  { icon: "globe", title: "City-scale", body: "One platform spans garages, surface lots, campuses, and curbs." },
  { icon: "code", title: "Open API", body: "Pipe live availability into your own apps, signage, and maps." },
  { icon: "shield", title: "Privacy-first", body: "Aggregate counts only — nothing personal ever leaves a site." },
];

export function Features() {
  return (
    <section className="section features">
      <Reveal as="div" className="section-head">
        <span className="section-kicker">The platform</span>
        <h2 className="section-title">Built for the real world.</h2>
      </Reveal>
      <div className="feature-grid">
        {FEATURES.map((f, i) => (
          <Reveal as="article" className="feature-card" key={f.title} delay={(i % 3) * 80}>
            <div className="feature-icon">
              <Icon name={f.icon} size={22} />
            </div>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-body">{f.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
