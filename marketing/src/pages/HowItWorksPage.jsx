import { PageHeader } from "../components/PageHeader.jsx";
import { HowItWorks } from "../components/HowItWorks.jsx";
import { EarlyAccess } from "../components/EarlyAccess.jsx";
import { Reveal } from "../components/Reveal.jsx";
import { Icon } from "../components/Icon.jsx";

const SEES = [
  { icon: "camera", title: "It starts with a frame", body: "Every overhead camera streams to ParkIQ over standard RTSP — no extra hardware, no sensors in the asphalt." },
  { icon: "scan", title: "The model reads the scene", body: "Oriented-bounding-box detection finds each vehicle many times a second, even in angled or tightly-packed stalls." },
  { icon: "spaces", title: "Spaces get matched", body: "Each detection is compared against your calibrated stalls by overlap, so a space is only 'taken' when a car truly fills it." },
  { icon: "bolt", title: "Temporal smoothing", body: "A short voting window prevents flicker from people walking by or momentary occlusions, so the count stays rock-steady." },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        kicker="How it works"
        title="From camera to open spot, in milliseconds."
        lead="ParkIQ turns ordinary overhead cameras into a real-time map of open spaces. Here's the whole pipeline."
      />
      <HowItWorks />
      <section className="section sees">
        <Reveal as="div" className="section-head">
          <span className="section-kicker">Under the hood</span>
          <h2 className="section-title">What happens to every frame</h2>
        </Reveal>
        <div className="sees-grid">
          {SEES.map((s, i) => (
            <Reveal as="article" className="sees-card" key={s.title} delay={(i % 2) * 80}>
              <span className="sees-icon"><Icon name={s.icon} size={22} /></span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <EarlyAccess />
    </>
  );
}
