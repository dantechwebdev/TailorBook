import { useEffect, useRef } from 'react';
import {
  UserPlus, Ruler, Scissors, Layers, CheckCircle, Truck, Heart
} from 'lucide-react';

const STEPS = [
  {
    num: '1',
    icon: UserPlus,
    title: 'New Customer Arrives',
    text: 'Create a customer profile in seconds. Name, phone, WhatsApp, and optional photo. TailorBook links to their WhatsApp instantly.',
    tags: ['Customer Profile', 'WhatsApp Link', 'Contact Save'],
  },
  {
    num: '2',
    icon: Ruler,
    title: 'Record Measurements',
    text: 'Select the garment type and fill in measurements using a guided template. Every measurement is saved with the date and garment type.',
    tags: ['Guided Templates', 'Garment Types', 'Measurement History'],
  },
  {
    num: '3',
    icon: Scissors,
    title: 'Create the Job',
    text: 'Log outfit type, fabric description, price, deposit received, and delivery date. Attach photos if needed. The job is now tracked.',
    tags: ['Job Creation', 'Photo Capture', 'Price & Deposit'],
  },
  {
    num: '4',
    icon: Layers,
    title: 'Production Begins',
    text: 'Move the job through stages: Pending → Cutting → Sewing → Finishing. Your team always knows what stage each garment is at.',
    tags: ['Stage Tracking', 'Team Visibility', 'Progress Updates'],
  },
  {
    num: '5',
    icon: CheckCircle,
    title: 'Ready for Delivery',
    text: 'Mark the job Ready. TailorBook automatically sends a notification and shows it prominently on the delivery schedule.',
    tags: ['Auto Notification', 'Delivery Schedule', 'Customer Alert'],
  },
  {
    num: '6',
    icon: Truck,
    title: 'Delivery & Collection',
    text: 'Record pickup or delivery. Log balance payment. Send a WhatsApp confirmation. Mark the job Delivered with one tap.',
    tags: ['Payment Record', 'WhatsApp Confirm', 'Job Closure'],
  },
  {
    num: '7',
    icon: Heart,
    title: 'Happy Customer. Next Order.',
    text: "The customer's complete history — measurements, jobs, preferences — is saved forever. Every return visit starts from a place of trust.",
    tags: ['Repeat Business', 'Customer History', 'Long-term Relationship'],
  },
];

export default function Workflow() {
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stepsRef.current;
    if (!el) return;
    const steps = el.querySelectorAll<HTMLElement>('.workflow__step');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = '1';
            (entry.target as HTMLElement).style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.15 }
    );
    steps.forEach((s, i) => {
      s.style.opacity = '0';
      s.style.transform = 'translateY(24px)';
      s.style.transition = `opacity 0.5s ease ${i * 80}ms, transform 0.5s ease ${i * 80}ms`;
      obs.observe(s);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <section id="workflow" className="section section--white">
      <div className="container">
        <div className="section-header section-header--center">
          <div className="section-label">How It Works</div>
          <h2 className="section-title">From customer to delivery.<br />Every step tracked.</h2>
          <p className="section-desc">
            TailorBook follows the natural rhythm of your workshop. No learning curve —
            just a system that mirrors how you already think.
          </p>
        </div>

        <div className="workflow__steps" ref={stepsRef} role="list" aria-label="Workflow steps">
          {STEPS.map(({ num, icon: Icon, title, text, tags }) => (
            <div key={num} className="workflow__step" role="listitem">
              <div className="workflow__step-left" aria-hidden="true">
                <div className="workflow__step-dot">
                  <Icon size={20} />
                </div>
                <div className="workflow__step-line" />
              </div>
              <div className="workflow__step-content">
                <h3 className="workflow__step-title">{title}</h3>
                <p className="workflow__step-text">{text}</p>
                <div className="workflow__step-tags" aria-label="Related features">
                  {tags.map(tag => (
                    <span key={tag} className="workflow__tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
