import { useEffect, useRef } from 'react';
import { Sparkles, Palette, Image, MessageCircle, Zap, ShieldCheck } from 'lucide-react';

const AI_FEATURES = [
  {
    icon: Palette,
    title: 'Generate Outfit Ideas',
    text: 'Describe a style direction and TailorBook generates variations tailored to your specialty — Senator, Agbada, suits, and more.',
  },
  {
    icon: Image,
    title: 'Design Variations',
    text: 'Take an existing design and explore alternative cuts, collar styles, sleeve options, or embroidery patterns instantly.',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Script Suggestions',
    text: 'AI helps draft professional WhatsApp messages — delivery updates, payment reminders, and follow-up messages.',
  },
  {
    icon: Zap,
    title: 'Measurement Suggestions',
    text: 'Based on previous jobs, AI can suggest starting measurements for returning customers and flag unusual measurements.',
  },
];

const AI_RESULTS = [
  { color: 'linear-gradient(135deg,#4B3FA0,#7C6FD4)', name: 'Classic Senator', sub: 'Clean lines · Navy & Gold' },
  { color: 'linear-gradient(135deg,#1E3A5F,#2D6A4F)', name: 'Modern Agbada', sub: 'Wide sleeves · Forest Green' },
  { color: 'linear-gradient(135deg,#7B3F00,#C46200)', name: 'Royal Kaftan', sub: 'Embroidered · Burnt Orange' },
];

export default function AISection() {
  const ref   = useRef<HTMLDivElement>(null);
  const fRef  = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const els = [ref.current, fRef.current];
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); } },
      { threshold: 0.1 }
    );
    els.forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section id="ai" className="section section--purple-soft">
      <div className="container">
        <div className="ai__inner">
          {/* Text side */}
          <div className="animate-fade-up" ref={ref}>
            <div className="section-label">AI Studio</div>
            <h2 className="section-title">AI That Assists.<br />Never Overwhelms.</h2>
            <p className="section-desc">
              TailorBook's AI is not a chatbot. It is a quiet creative partner that helps
              only when you ask — and stays out of the way when you don't.
            </p>

            <ul className="ai__features animate-stagger" ref={fRef}>
              {AI_FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="ai__feature">
                  <div className="ai__feature-icon" aria-hidden="true">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="ai__feature-title">{title}</div>
                    <div className="ai__feature-text">{text}</div>
                  </div>
                </li>
              ))}
            </ul>

            <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--gray-500)', lineHeight: 1.65 }}>
              <strong>Coming next:</strong> Fabric visualization, body-adapted silhouettes,
              colour palette suggestions, and AI-powered design library curation.
            </p>
          </div>

          {/* Visual side — AI card mockup */}
          <div className="ai__visual">
            <div className="ai__card">
              <div className="ai__card-label">AI Design Studio</div>

              <div className="ai__prompt">
                <Sparkles size={14} color="rgba(167,139,250,0.7)" style={{ display: 'inline', marginRight: '0.4rem' }} />
                "Create 3 modern senator suit variations for a formal government event — classic but with a contemporary feel."
              </div>

              <div className="ai__results" role="list" aria-label="AI generated designs">
                {AI_RESULTS.map(({ color, name, sub }) => (
                  <div key={name} className="ai__result-item" role="listitem">
                    <div
                      className="ai__result-thumb"
                      style={{ background: color }}
                      aria-hidden="true"
                    />
                    <div>
                      <div className="ai__result-name">{name}</div>
                      <div className="ai__result-sub">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ai__disclaimer">
                <ShieldCheck size={16} color="rgba(52,211,153,0.8)" style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>
                  AI assists <strong>only when you request it</strong>. No automatic analysis,
                  no data collection — your business stays yours.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
