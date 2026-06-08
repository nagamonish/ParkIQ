import { PageHeader } from "../components/PageHeader.jsx";
import { Privacy } from "../components/Privacy.jsx";
import { Reveal } from "../components/Reveal.jsx";

const POINTS = [
  { h: "What we measure", b: "Only the number of occupied and open spaces per location, plus the polygon you draw for each stall. That's it." },
  { h: "What we never collect", b: "No license plates, no faces, no identities, no movement tracking of individuals. The model is tuned to count vehicles, not recognize anyone." },
  { h: "What leaves a site", b: "Only aggregate counts (e.g. '142 of 985 free'). Raw video stays within the operator's own network and is never sent to the cloud." },
  { h: "Who can see what", b: "Operators see their own lots. The public finder shows only the aggregate availability operators choose to publish." },
  { h: "Data retention", b: "Occupancy events are kept to power trends and peak-hours analytics, and can be purged on request. There's nothing personal in them to begin with." },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        kicker="Privacy"
        title="Privacy isn't a setting. It's the architecture."
        lead="ParkIQ was designed so that protecting people isn't something we add on — it's the only way the system can work."
      />
      <Privacy />
      <section className="section">
        <div className="policy-list">
          {POINTS.map((p, i) => (
            <Reveal as="div" className="policy-item" key={p.h} delay={(i % 2) * 70}>
              <h3>{p.h}</h3>
              <p>{p.b}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
