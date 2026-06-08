import { Reveal } from "./Reveal.jsx";

// Shared hero header for interior marketing pages.
export function PageHeader({ kicker, title, lead, children }) {
  return (
    <header className="page-header">
      <div className="page-header-inner">
        <Reveal as="span" className="page-kicker">
          {kicker}
        </Reveal>
        <Reveal as="h1" className="page-title" delay={60}>
          {title}
        </Reveal>
        {lead && (
          <Reveal as="p" className="page-lead" delay={120}>
            {lead}
          </Reveal>
        )}
        {children && (
          <Reveal as="div" className="page-header-cta" delay={180}>
            {children}
          </Reveal>
        )}
      </div>
    </header>
  );
}
