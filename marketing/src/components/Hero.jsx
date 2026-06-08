import { LAUNCH_CITY, SIGHTLINE_URL } from "../config.js";
import { HeroVisual } from "./HeroVisual.jsx";
import { Icon } from "./Icon.jsx";

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-text reveal is-visible">
        <span className="eyebrow">
          <span className="eyebrow-dot" /> Now in soft launch · {LAUNCH_CITY}
        </span>
        <h1 className="hero-title">
          Parking,
          <br />
          finally solved.
        </h1>
        <p className="hero-sub">
          ParkIQ uses computer vision to see every open space in real time — so you
          find a spot before you arrive, and never circle the block again.
        </p>
        <div className="hero-cta">
          <a className="btn btn-primary btn-lg" href={SIGHTLINE_URL} target="_blank" rel="noreferrer">
            Find parking near you
          </a>
          <a className="btn btn-link btn-lg" href="#/how-it-works">
            See how it works <Icon name="chevron" size={17} />
          </a>
        </div>
      </div>
      <HeroVisual />
    </section>
  );
}
