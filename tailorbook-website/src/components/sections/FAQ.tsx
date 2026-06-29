import { useState } from 'react';
import { Plus } from 'lucide-react';

const FAQS = [
  {
    q: 'Is TailorBook free?',
    a: "Yes — TailorBook is completely free during the Beta period. Founding Members get extended free access as a thank-you for helping shape the product. When Premium features launch, there will be an optional paid tier, but the core app will always have a free plan.",
  },
  {
    q: 'Does it work without internet?',
    a: "Absolutely. TailorBook is built offline-first from the ground up. Your data lives on your device and the app works perfectly whether you have Wi-Fi, mobile data, or no connection at all. Cloud backup (coming soon) will be optional — not required.",
  },
  {
    q: 'Do my customers need to download TailorBook?',
    a: "No. Your customers interact with you through WhatsApp, exactly as they do now. TailorBook stays entirely on your side. Customers never need to create an account, download anything, or change how they communicate with you.",
  },
  {
    q: 'Is AI required to use TailorBook?',
    a: "Not at all. AI is an optional creative tool that assists only when you request it. You can use TailorBook fully — customer management, measurements, jobs, notifications, financials — without ever touching the AI Studio.",
  },
  {
    q: 'Will cloud sync and backup come?',
    a: "Yes. Cloud backup and multi-device sync are on the roadmap and actively being developed. When they arrive, they will be seamless and optional. Your data will never be stored in the cloud without your explicit permission.",
  },
  {
    q: 'Is iPhone (iOS) support planned?',
    a: "Yes — iOS is planned. Android came first because it's the most widely used platform among our target users. An iPhone version is on the roadmap and Founding Members will get early access when it arrives.",
  },
  {
    q: 'How is my data protected?',
    a: "Your data stays on your device. TailorBook does not send your customer data, measurements, or business information to any server. There is no cloud sync in the current version — everything is local and private.",
  },
  {
    q: 'Can I manage multiple tailors or staff?',
    a: "Single-tailor workshops are the primary focus right now. Multi-tailor workshop support — including staff assignment and production dashboards — is in active development and will be part of the Pro tier.",
  },
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="section section--white" aria-labelledby="faq-title">
      <div className="container">
        <div className="section-header section-header--center">
          <div className="section-label">FAQ</div>
          <h2 className="section-title" id="faq-title">Questions Answered</h2>
          <p className="section-desc">
            Everything you need to know before getting started.
          </p>
        </div>

        <dl className="faq__list">
          {FAQS.map(({ q, a }, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                className={`faq__item ${isOpen ? 'faq__item--open' : ''}`}
              >
                <dt>
                  <button
                    className="faq__question"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    id={`faq-question-${i}`}
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                  >
                    <span className="faq__question-text">{q}</span>
                    <div className="faq__icon" aria-hidden="true">
                      <Plus size={14} strokeWidth={2.5} />
                    </div>
                  </button>
                </dt>
                <dd
                  id={`faq-answer-${i}`}
                  role="region"
                  aria-labelledby={`faq-question-${i}`}
                  className={`faq__body ${isOpen ? 'faq__body--open' : ''}`}
                >
                  <div className="faq__answer">{a}</div>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
