import { CONTACT_EMAIL } from "../config.js";
import { Icon } from "./Icon.jsx";
import { DashboardMock } from "./Mocks.jsx";
import { Reveal } from "./Reveal.jsx";

const BENEFITS = [
  "Real-time occupancy across every space you run",
  "Trends and peak-hour analytics that drive pricing",
  "Higher turnover and revenue from the spaces you already own",
  "Works with your existing camera infrastructure",
];

export function ForOperators() {
  return (
    <section className="section split split-reverse" id="operators">
      <Reveal as="div" className="split-visual" delay={120}>
        <DashboardMock />
      </Reveal>
      <Reveal as="div" className="split-text">
        <span className="section-kicker">For operators &amp; cities</span>
        <h2 className="section-title">Every space, accounted for.</h2>
        <p className="section-lead">
          Garages, lots, campuses, and curbs get a live operations view and the
          analytics to price and manage capacity intelligently.
        </p>
        <ul className="check-list">
          {BENEFITS.map((b) => (
            <li key={b}>
              <Icon name="check" size={18} /> {b}
            </li>
          ))}
        </ul>
        <a className="btn btn-dark btn-lg" href={`mailto:${CONTACT_EMAIL}?subject=ParkIQ%20demo`}>
          Book a demo <Icon name="arrow" size={17} />
        </a>
      </Reveal>
    </section>
  );
}
