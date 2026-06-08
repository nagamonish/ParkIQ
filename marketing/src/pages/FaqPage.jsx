import { PageHeader } from "../components/PageHeader.jsx";
import { Reveal } from "../components/Reveal.jsx";

const FAQS = [
  { q: "Do I need special cameras?", a: "No. ParkIQ works with the overhead RTSP cameras most lots already have. No ground sensors, no new hardware." },
  { q: "How accurate is the detection?", a: "Accuracy comes from tight space calibration plus oriented-bounding-box detection and temporal smoothing. In typical overhead views it's well above 95%." },
  { q: "Is any personal data collected?", a: "No. ParkIQ only measures how many spaces are open. No license plates, no faces, and only aggregate counts ever leave a site." },
  { q: "How fast does availability update?", a: "Within about a second of a car arriving or leaving, both in the operator console and the public finder." },
  { q: "Can drivers use it for free?", a: "Yes. The public Sightline finder is always free for drivers. Operators pay per camera." },
  { q: "Can I pipe the data into my own app?", a: "Yes — the Growth and Enterprise plans include an API so you can feed live availability into apps, signage, and maps." },
  { q: "What happens if a camera goes offline?", a: "The console flags it, keeps the last known state, and auto-reconnects with backoff. Spaces show as 'no live data' until it returns." },
];

export default function FaqPage() {
  return (
    <>
      <PageHeader kicker="FAQ" title="Questions, answered." lead="The things people ask us most. Still curious? Reach out anytime." />
      <section className="section faq-section">
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <Reveal as="details" className="faq-item" key={f.q} delay={(i % 4) * 50}>
              <summary className="faq-q">
                {f.q}
                <span className="faq-chevron" />
              </summary>
              <p className="faq-a">{f.a}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
