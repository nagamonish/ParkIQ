import { PageHeader } from "../components/PageHeader.jsx";
import { Features } from "../components/Features.jsx";
import { Privacy } from "../components/Privacy.jsx";
import { Reveal } from "../components/Reveal.jsx";
import { Icon } from "../components/Icon.jsx";

const SPECS = [
  { k: "Detection", v: "YOLO oriented bounding boxes", d: "Handles rotated stalls and dense lots that axis-aligned boxes miss." },
  { k: "Latency", v: "Sub-second", d: "Availability updates within a second of a car arriving or leaving." },
  { k: "Hardware", v: "Your existing cameras", d: "Any RTSP feed works. No ground sensors, gateways, or trenching." },
  { k: "Edge-friendly", v: "Counts, not clips", d: "Only aggregate numbers leave a site — bandwidth and privacy stay low." },
];

export default function TechnologyPage() {
  return (
    <>
      <PageHeader
        kicker="Technology"
        title="Computer vision, tuned for the curb."
        lead="ParkIQ is built around an oriented-bounding-box detector and a temporal occupancy model that stay accurate in the messy real world."
      />
      <section className="section">
        <div className="spec-grid">
          {SPECS.map((s, i) => (
            <Reveal as="div" className="spec-card" key={s.k} delay={(i % 2) * 80}>
              <span className="spec-k">{s.k}</span>
              <span className="spec-v">{s.v}</span>
              <p>{s.d}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <Features />
      <Privacy />
    </>
  );
}
