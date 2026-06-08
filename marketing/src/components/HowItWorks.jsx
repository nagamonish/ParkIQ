import { Icon } from "./Icon.jsx";
import { Reveal } from "./Reveal.jsx";

const STEPS = [
  {
    icon: "camera",
    step: "01",
    title: "See",
    body: "ParkIQ taps the overhead cameras a lot already has. No new hardware, no sensors in the ground.",
  },
  {
    icon: "scan",
    step: "02",
    title: "Detect",
    body: "Our vision models read every space many times a second, telling open from taken with oriented-box precision.",
  },
  {
    icon: "pin",
    step: "03",
    title: "Find",
    body: "Live availability flows to the Sightline app, so drivers know exactly where to go before they arrive.",
  },
];

export function HowItWorks() {
  return (
    <section className="section how" id="how">
      <Reveal as="div" className="section-head">
        <span className="section-kicker">How it works</span>
        <h2 className="section-title">Three steps. No new hardware.</h2>
        <p className="section-lead">
          ParkIQ turns existing cameras into a real-time map of open spaces — for an
          entire lot, garage, or street.
        </p>
      </Reveal>
      <div className="steps">
        {STEPS.map((s, i) => (
          <Reveal as="article" className="step-card" key={s.step} delay={i * 90}>
            <div className="step-icon">
              <Icon name={s.icon} size={26} />
            </div>
            <div className="step-num">{s.step}</div>
            <h3 className="step-title">{s.title}</h3>
            <p className="step-body">{s.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
