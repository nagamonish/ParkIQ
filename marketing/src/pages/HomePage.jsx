import { Hero } from "../components/Hero.jsx";
import { Stats } from "../components/Stats.jsx";
import { HowItWorks } from "../components/HowItWorks.jsx";
import { Features } from "../components/Features.jsx";
import { EarlyAccess } from "../components/EarlyAccess.jsx";
import { Reveal } from "../components/Reveal.jsx";
import { Icon } from "../components/Icon.jsx";
import { navigate } from "../router.js";

const PATHS = [
  {
    route: "drivers",
    icon: "car",
    title: "For drivers",
    body: "See which lots actually have space before you leave. Never circle the block again.",
    cta: "Find parking",
  },
  {
    route: "operators",
    icon: "building",
    title: "For operators & cities",
    body: "Turn the cameras you already have into a live, accurate map of every space you run.",
    cta: "Explore the platform",
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />

      <section className="section statement">
        <Reveal as="p" className="statement-text">
          The average driver spends <em>17 hours a year</em> hunting for parking. That's wasted
          time, wasted fuel, and traffic that didn't need to exist.
        </Reveal>
        <Reveal as="p" className="statement-sub" delay={120}>
          ParkIQ gives that time back.
        </Reveal>
      </section>

      <HowItWorks />

      <section className="section paths">
        <Reveal as="div" className="section-head">
          <span className="section-kicker">One platform, two sides</span>
          <h2 className="section-title">Whoever you are, parking just got easier.</h2>
        </Reveal>
        <div className="paths-grid">
          {PATHS.map((p, i) => (
            <Reveal as="button" className="path-card" key={p.route} delay={i * 90} >
              <span className="path-icon">
                <Icon name={p.icon} size={24} />
              </span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
              <span className="path-cta" onClick={() => navigate(p.route)}>
                {p.cta} <Icon name="arrow" size={16} />
              </span>
            </Reveal>
          ))}
        </div>
      </section>

      <Features />
      <EarlyAccess />
    </>
  );
}
