import { useEffect, useRef } from 'react';
import { Download, Users, Star, MessageCircle, Zap } from 'lucide-react';

const PERKS = [
  { icon: Star,          text: 'Free access during Beta'          },
  { icon: Zap,           text: 'Direct influence on features'     },
  { icon: MessageCircle, text: 'Priority WhatsApp support'        },
  { icon: Users,         text: 'Founding Member recognition'      },
  { icon: Star,          text: 'Special pricing when Premium launches' },
];

const APK_URL      = import.meta.env.VITE_APK_DOWNLOAD_URL    || '#';
const FOUNDING_URL = import.meta.env.VITE_FOUNDING_MEMBER_URL || '#';

export default function FoundingMember() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('is-visible'); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="founding" className="founding" aria-labelledby="founding-title">
      <div className="founding__orb founding__orb--1" aria-hidden="true" />
      <div className="founding__orb founding__orb--2" aria-hidden="true" />

      <div className="container">
        <div className="founding__inner animate-fade-up" ref={ref}>
          <div className="section-label section-label--dark" style={{ margin: '0 auto 1.5rem' }}>
            Limited Spots Available
          </div>

          <h2 className="founding__title" id="founding-title">
            Shape the Future<br />of TailorBook.
          </h2>

          <p className="founding__desc">
            You're not a tester. You're a <strong>Founding Member</strong> — a tailor or
            fashion professional who helps define what TailorBook becomes. Your feedback,
            your workflow, and your challenges directly influence every feature we build next.
          </p>

          <ul className="founding__perks" aria-label="Founding member benefits">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="founding__perk">
                <Icon size={15} aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>

          <div className="founding__actions">
            <a href={FOUNDING_URL} className="btn btn--ghost btn--lg" target="_blank" rel="noopener noreferrer">
              <Users size={18} aria-hidden="true" />
              Apply to Join
            </a>
            <a href={APK_URL} className="btn btn--primary btn--lg" download>
              <Download size={18} aria-hidden="true" />
              Download APK Now
            </a>
          </div>

          <p className="founding__note">
            Free during Beta. No credit card required. Android only for now — iOS coming soon.
          </p>
        </div>
      </div>
    </section>
  );
}
