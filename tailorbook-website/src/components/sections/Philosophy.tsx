import { useEffect, useRef } from 'react';

const PRINCIPLES = [
  {
    num: '01',
    title: 'Touch over typing',
    text: "Every action should require the fewest taps possible. We design for hands that are busy with fabric, not with typing.",
  },
  {
    num: '02',
    title: 'Guided workflows',
    text: "TailorBook shows you the next logical step. You don't need to remember what to do — the system guides you forward.",
  },
  {
    num: '03',
    title: 'Context before action',
    text: "Before asking you to do anything, TailorBook shows you everything you need to know. No guessing. No searching.",
  },
  {
    num: '04',
    title: 'Reduce thinking',
    text: "Every calculation, every reminder, every notification is automatic. Your mental energy belongs on your craft.",
  },
  {
    num: '05',
    title: 'WhatsApp-first communication',
    text: "Customers don't need to download anything. Your existing WhatsApp becomes a professional communication channel.",
  },
  {
    num: '06',
    title: 'Calm by design',
    text: "A chaotic interface creates a chaotic mind. TailorBook is deliberately quiet, minimal, and easy to trust.",
  },
];

export default function Philosophy() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('is-visible'); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="philosophy" className="section section--dark">
      <div className="container">
        <div className="section-header">
          <div className="section-label section-label--dark">Our Philosophy</div>
          <h2 className="section-title section-title--light">
            Built on principles,<br />not features.
          </h2>
          <p className="section-desc section-desc--light">
            Every decision in TailorBook traces back to a core belief about how great
            tools should behave. These aren't guidelines — they are non-negotiable.
          </p>
        </div>

        <div className="philosophy__grid animate-stagger" ref={gridRef}>
          {PRINCIPLES.map(({ num, title, text }) => (
            <article key={num} className="card card--dark philosophy__card">
              <div className="philosophy__num" aria-hidden="true">{num}</div>
              <h3 className="philosophy__title">{title}</h3>
              <p className="philosophy__text">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
