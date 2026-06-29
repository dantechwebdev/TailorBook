import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import PhoneMockup from '../mockups/PhoneMockup';

const ITEMS = [
  {
    title: 'Customer Management',
    text: 'Every customer has a complete profile — contact details, measurement history, job history, and WhatsApp link. One tap to reach anyone.',
  },
  {
    title: 'Measurement Library',
    text: 'Every measurement saved, dated, and linked to a specific garment type. No more confusion about which measurement is current.',
  },
  {
    title: 'Job Tracking Pipeline',
    text: 'Watch every job move from Pending → Cutting → Sewing → Finishing → Ready → Delivered. Nothing gets forgotten.',
  },
  {
    title: 'Schedule & Reminders',
    text: "Automatic notifications at 7 days, 3 days, 1 day, and on delivery day. Your phone reminds you — so your mind doesn't have to.",
  },
  {
    title: 'Financial Tracking',
    text: 'Price, deposit, and balance calculated automatically. Know exactly who owes you and how much at any moment.',
  },
  {
    title: 'WhatsApp Integration',
    text: 'Customers communicate naturally through WhatsApp. TailorBook organizes everything quietly behind the scenes.',
  },
];

export default function Solution() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('is-visible'); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="solution" className="section section--purple-soft">
      <div className="container">
        <div className="solution__inner">
          {/* Text side */}
          <div className="animate-fade-up" ref={ref}>
            <div className="section-label">The Answer</div>
            <h2 className="section-title">
              Everything your business needs.{' '}
              <br />In one calm place.
            </h2>
            <p className="section-desc">
              TailorBook brings together every part of your workflow into a single, offline-first
              system designed around how tailors actually think and work.
            </p>

            <ul className="solution__list" aria-label="TailorBook features overview">
              {ITEMS.map(({ title, text }) => (
                <li key={title} className="solution__item">
                  <div className="solution__item-icon" aria-hidden="true">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <div>
                    <div className="solution__item-title">{title}</div>
                    <div className="solution__item-text">{text}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual side */}
          <div className="solution__visual">
            <div className="float-anim">
              <PhoneMockup size="md" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
