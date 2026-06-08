import { PageHeader } from "../components/PageHeader.jsx";
import { Reveal } from "../components/Reveal.jsx";

const POSTS = [
  { tag: "Product", title: "Calibration that anyone can do in 5 minutes", date: "Jun 2, 2026", read: "4 min", hue: "#7c3aed" },
  { tag: "Engineering", title: "Why oriented bounding boxes beat rectangles for parking", date: "May 21, 2026", read: "7 min", hue: "#a855f7" },
  { tag: "Cities", title: "How live availability cuts cruising traffic by 30%", date: "May 9, 2026", read: "5 min", hue: "#6d28d9" },
  { tag: "Privacy", title: "Counting cars without watching people", date: "Apr 28, 2026", read: "3 min", hue: "#9333ea" },
  { tag: "Product", title: "Bringing the public finder to three new cities", date: "Apr 14, 2026", read: "2 min", hue: "#7c3aed" },
  { tag: "Engineering", title: "Keeping occupancy steady with temporal smoothing", date: "Apr 1, 2026", read: "6 min", hue: "#a855f7" },
];

export default function BlogPage() {
  return (
    <>
      <PageHeader kicker="Blog" title="Notes from the curb." lead="Product updates, engineering deep-dives, and what we're learning about parking." />
      <section className="section">
        <div className="blog-grid">
          {POSTS.map((p, i) => (
            <Reveal as="article" className="blog-card" key={p.title} delay={(i % 3) * 80}>
              <span className="blog-cover" style={{ background: `linear-gradient(135deg, ${p.hue}, #c084fc)` }}>
                {p.tag}
              </span>
              <div className="blog-body">
                <h3 className="blog-title">{p.title}</h3>
                <div className="blog-meta">
                  <span>{p.date}</span>
                  <span>· {p.read} read</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
