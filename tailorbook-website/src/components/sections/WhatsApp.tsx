import { useEffect, useRef } from 'react';
import { MessageCircle, Bell, Link2, Users } from 'lucide-react';

const POINTS = [
  {
    icon: Users,
    title: 'Customers need nothing new',
    text: "Your customers already use WhatsApp every day. They don't need to download an app, create an account, or learn anything new.",
  },
  {
    icon: Link2,
    title: 'One tap to any customer',
    text: 'From any customer profile, one tap opens WhatsApp pre-loaded with their name. Communication is always one step away.',
  },
  {
    icon: Bell,
    title: 'Delivery notifications via WhatsApp',
    text: "When a job is ready, send a professional WhatsApp message directly from TailorBook. No copy-pasting, no errors.",
  },
  {
    icon: MessageCircle,
    title: 'TailorBook organises. WhatsApp communicates.',
    text: "Your records live in TailorBook. Your conversations live in WhatsApp. Both work perfectly — and both stay separate.",
  },
];

const MESSAGES = [
  { type: 'in',  text: "Hello! When will my Agbada be ready?", time: '10:32 AM' },
  { type: 'out', text: "Good morning! Your Agbada set is ready for collection today. 🎉", time: '10:45 AM' },
  { type: 'in',  text: "Wonderful! I'll come by this afternoon. How much is the balance?", time: '10:47 AM' },
  { type: 'out', text: "Balance is ₦20,000. We accept cash or transfer. See you soon! 🙏", time: '10:48 AM' },
  { type: 'in',  text: "Perfect. Thank you! You do amazing work.", time: '10:50 AM' },
];

export default function WhatsApp() {
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
    <section id="whatsapp" className="section section--white">
      <div className="container">
        <div className="wa__inner">
          {/* Text side */}
          <div className="animate-fade-up" ref={ref}>
            <div className="section-label">WhatsApp Integration</div>
            <h2 className="section-title">Your Customers Never Need to Download Anything.</h2>
            <p className="section-desc">
              Communication with your customers stays exactly where it already is —
              WhatsApp. TailorBook simply makes every conversation effortless.
            </p>

            <ul className="wa__points">
              {POINTS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="wa__point">
                  <div className="wa__point-icon" aria-hidden="true">
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="wa__point-title">{title}</div>
                    <div className="wa__point-text">{text}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* WhatsApp chat mockup */}
          <div className="wa__visual">
            <div className="wa__chat" role="img" aria-label="WhatsApp conversation example">
              <div className="wa__chat-header">
                <div className="wa__chat-avatar" aria-hidden="true">AO</div>
                <div>
                  <div className="wa__chat-name">Aisha Okonkwo</div>
                  <div className="wa__chat-status">online</div>
                </div>
              </div>
              <div className="wa__chat-body">
                {MESSAGES.map((m, i) => (
                  <div key={i} className={`wa__msg wa__msg--${m.type === 'in' ? 'in' : 'out'}`}>
                    {m.text}
                    <div className="wa__msg-time">{m.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
