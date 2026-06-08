import { PageHeader } from "../components/PageHeader.jsx";
import { ForOperators } from "../components/ForOperators.jsx";
import { EarlyAccess } from "../components/EarlyAccess.jsx";
import { Reveal } from "../components/Reveal.jsx";
import { Icon } from "../components/Icon.jsx";
import { OPERATOR_URL } from "../config.js";

const STEPS = [
  { icon: "camera", title: "Connect a camera", body: "Paste an RTSP URL. ParkIQ starts reading the feed immediately." },
  { icon: "spaces", title: "Calibrate spaces", body: "Auto-detect stalls or draw them, then drag the corners to fit. Accuracy is in your hands." },
  { icon: "analytics", title: "Go live", body: "Watch occupancy update in real time and publish availability to the public finder." },
];

export default function OperatorsPage() {
  return (
    <>
      <PageHeader
        kicker="For operators & cities"
        title="Every space, accounted for."
        lead="Garages, surface lots, campuses, and curbs get a live operations view and the analytics to price and manage capacity intelligently."
      >
        <a className="btn btn-primary btn-lg" href={OPERATOR_URL} target="_blank" rel="noreferrer">
          Open the operator console
        </a>
      </PageHeader>

      <ForOperators />

      <section className="section">
        <Reveal as="div" className="section-head">
          <span className="section-kicker">Onboarding</span>
          <h2 className="section-title">Live in three steps</h2>
        </Reveal>
        <div className="opsteps">
          {STEPS.map((s, i) => (
            <Reveal as="div" className="opstep" key={s.title} delay={i * 90}>
              <span className="opstep-num">{i + 1}</span>
              <span className="opstep-icon"><Icon name={s.icon} size={20} /></span>
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
