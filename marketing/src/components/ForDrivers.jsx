import { SIGHTLINE_URL } from "../config.js";
import { Icon } from "./Icon.jsx";
import { PhoneMock } from "./Mocks.jsx";
import { Reveal } from "./Reveal.jsx";

const BENEFITS = [
  "See open spaces near you, updated live",
  "Compare lots by price, distance, and how full they are",
  "Skip the circling — drive straight to a spot",
  "Less time idling means less fuel and fewer emissions",
];

export function ForDrivers() {
  return (
    <section className="section split" id="drivers">
      <Reveal as="div" className="split-text">
        <span className="section-kicker">For drivers</span>
        <h2 className="section-title">Know before you go.</h2>
        <p className="section-lead">
          Open the Sightline app and see which lots actually have space — right now.
          No guessing, no laps around the block.
        </p>
        <ul className="check-list">
          {BENEFITS.map((b) => (
            <li key={b}>
              <Icon name="check" size={18} /> {b}
            </li>
          ))}
        </ul>
        <a className="btn btn-primary btn-lg" href={SIGHTLINE_URL} target="_blank" rel="noreferrer">
          Find parking near you
        </a>
      </Reveal>
      <Reveal as="div" className="split-visual" delay={120}>
        <PhoneMock />
      </Reveal>
    </section>
  );
}
