import { Reveal } from "./Reveal.jsx";

const STATS = [
  { value: "52,000+", label: "Spaces monitored" },
  { value: "6", label: "Cities live or piloting" },
  { value: "30%", label: "Less time spent searching" },
  { value: "0", label: "New cameras required" },
];

export function Stats() {
  return (
    <section className="stats">
      <div className="stats-grid">
        {STATS.map((stat, i) => (
          <Reveal as="div" className="stat" key={stat.label} delay={i * 70}>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
