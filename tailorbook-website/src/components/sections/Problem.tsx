import { useEffect, useRef } from 'react';
import {
  AlertTriangle, Search, Clock, MessageSquare, CreditCard, Zap
} from 'lucide-react';

const PROBLEMS = [
  {
    icon: AlertTriangle,
    title: 'Jobs slipping through the cracks',
    desc: "You're managing 30 garments simultaneously. Three are due today — but which three? The mental load alone is exhausting.",
  },
  {
    icon: Search,
    title: 'Lost measurements',
    desc: "Is this measurement from two years ago or last month? Wrong measurements mean remakes — and that destroys your margins.",
  },
  {
    icon: Clock,
    title: 'Missed delivery dates',
    desc: "A customer is calling. You can't find their order. You promise to call back. That moment quietly costs you a referral.",
  },
  {
    icon: MessageSquare,
    title: 'Scattered conversations',
    desc: 'Critical details buried in WhatsApp chats from six months ago. Style references, style choices, price agreements — all lost.',
  },
  {
    icon: CreditCard,
    title: 'Unpaid balances forgotten',
    desc: "You delivered a beautiful outfit. Three months later you realize you never collected the balance. It happens more than you think.",
  },
  {
    icon: Zap,
    title: 'Chaos instead of craft',
    desc: "You became a tailor because you love the craft. But managing the business is drowning out the work that brings you joy.",
  },
];

export default function Problem() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('is-visible'); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="problem" className="section section--white">
      <div className="container">
        <div className="section-header">
          <div className="section-label">The Challenge</div>
          <h2 className="section-title">Sound familiar?</h2>
          <p className="section-desc">
            Every skilled tailor knows these frustrations. They're not a sign of failure —
            they're a sign that your business has outgrown paper and memory.
          </p>
        </div>

        <div className="problem__grid animate-stagger" ref={gridRef}>
          {PROBLEMS.map(({ icon: Icon, title, desc }) => (
            <article key={title} className="card problem__card">
              <div className="problem__card-icon" aria-hidden="true">
                <Icon size={22} />
              </div>
              <h3 className="problem__card-title">{title}</h3>
              <p className="problem__card-desc">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
