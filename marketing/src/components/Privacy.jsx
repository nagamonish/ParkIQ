import { Icon } from "./Icon.jsx";
import { Reveal } from "./Reveal.jsx";

export function Privacy() {
  return (
    <section className="section privacy" id="privacy">
      <Reveal as="div" className="privacy-inner">
        <div className="privacy-icon">
          <Icon name="eyeoff" size={30} />
        </div>
        <h2 className="section-title">We count cars, not people.</h2>
        <p className="section-lead privacy-lead">
          ParkIQ only ever measures how many spaces are open. No license plates,
          no faces, no tracking — and only aggregate counts ever leave a site.
          Privacy isn't a setting; it's the architecture.
        </p>
        <div className="privacy-tags">
          <span className="tag"><Icon name="shield" size={16} /> No plates or faces</span>
          <span className="tag"><Icon name="eyeoff" size={16} /> No personal data</span>
          <span className="tag"><Icon name="check" size={16} /> Counts only, on the edge</span>
        </div>
      </Reveal>
    </section>
  );
}
