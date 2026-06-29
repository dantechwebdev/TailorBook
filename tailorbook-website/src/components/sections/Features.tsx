import { useEffect, useRef } from 'react';
import {
  Users, Ruler, Briefcase, Bell, Calendar, Truck, Package,
  MessageCircle, Wifi, Cpu, BookImage, Brain, Cloud, Star, BarChart3
} from 'lucide-react';

interface Feature {
  icon: React.ElementType;
  name: string;
  desc: string;
  badge?: { label: string; variant: string };
}

const FEATURES: Feature[] = [
  {
    icon: Users,
    name: 'Customer Management',
    desc: 'Complete profiles with contact info, photo, job history, and measurement records. Every customer remembered perfectly.',
  },
  {
    icon: Ruler,
    name: 'Measurement Library',
    desc: 'Store, date, and retrieve measurements for every garment type. Senator, Agbada, Suits, Kaftan — all covered.',
  },
  {
    icon: Briefcase,
    name: 'Job Tracking',
    desc: 'Visual pipeline from intake to delivery. Track status, assign production stages, and never lose an order.',
  },
  {
    icon: Bell,
    name: 'Smart Notifications',
    desc: 'Automatic delivery reminders at 7, 3, 1 day and on the due date. Custom alerts for any milestone.',
  },
  {
    icon: Calendar,
    name: 'Schedule & Diary',
    desc: 'See every delivery grouped by date. Plan your week at a glance. Never be caught off-guard by a cluster of due dates.',
  },
  {
    icon: Truck,
    name: 'Delivery Management',
    desc: 'Track deliveries, record pickups, send WhatsApp updates, and confirm collection — all from one screen.',
  },
  {
    icon: Package,
    name: 'Waybill & Pickup',
    desc: 'Generate waybills for outgoing deliveries. Track pickup requests and completion status in real time.',
  },
  {
    icon: MessageCircle,
    name: 'WhatsApp Integration',
    desc: 'One tap to message any customer, share job updates, send payment reminders, or confirm delivery.',
    badge: { label: 'Built-in', variant: 'available' },
  },
  {
    icon: Wifi,
    name: 'Offline-First',
    desc: 'Your data lives on your device. Works perfectly without internet — no subscriptions, no server dependency.',
    badge: { label: 'Core', variant: 'available' },
  },
  {
    icon: Cpu,
    name: 'AI Design Studio',
    desc: 'Generate outfit ideas, create design variations, and explore styles on demand. AI assists only when you ask.',
    badge: { label: 'In Dev', variant: 'development' },
  },
  {
    icon: BookImage,
    name: 'Design Library',
    desc: 'Save approved designs, reference images, and fabric photos. A growing visual archive for your workshop.',
    badge: { label: 'In Dev', variant: 'development' },
  },
  {
    icon: Brain,
    name: 'Customer Memory',
    desc: "TailorBook remembers style preferences, fabric choices, and fitting notes for every customer automatically.",
    badge: { label: 'Coming Soon', variant: 'coming' },
  },
  {
    icon: Cloud,
    name: 'Cloud Backup',
    desc: 'Your data safely backed up and restorable across devices. Peace of mind if your phone is ever lost.',
    badge: { label: 'Coming Soon', variant: 'coming' },
  },
  {
    icon: Star,
    name: 'Premium Features',
    desc: 'Advanced analytics, priority support, multi-device sync, and exclusive AI capabilities for power users.',
    badge: { label: 'Coming Soon', variant: 'coming' },
  },
  {
    icon: BarChart3,
    name: 'Business Analytics',
    desc: 'Revenue tracking, delivery performance, top customers, and busiest periods — real data for smarter decisions.',
    badge: { label: 'Future', variant: 'future' },
  },
];

export default function Features() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('is-visible'); obs.disconnect(); } },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="features" className="section section--gray">
      <div className="container">
        <div className="section-header section-header--center">
          <div className="section-label">Features</div>
          <h2 className="section-title">Built for Every Part of Your Workflow</h2>
          <p className="section-desc">
            From the moment a customer walks in to the day they collect their garment —
            and every step in between.
          </p>
        </div>

        <div className="features__grid animate-stagger" ref={gridRef}>
          {FEATURES.map(({ icon: Icon, name, desc, badge }) => (
            <article key={name} className="card features__card">
              <div className="features__card-icon" aria-hidden="true">
                <Icon size={24} />
              </div>
              <h3 className="features__card-name">{name}</h3>
              <p className="features__card-desc">{desc}</p>
              {badge && (
                <div className="features__card-badge">
                  <span className={`badge badge--${badge.variant}`}>{badge.label}</span>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
