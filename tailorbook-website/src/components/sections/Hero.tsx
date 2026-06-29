import { Download, Users } from 'lucide-react';
import PhoneMockup from '../mockups/PhoneMockup';

const APK_URL      = import.meta.env.VITE_APK_DOWNLOAD_URL   || '#';
const FOUNDING_URL = import.meta.env.VITE_FOUNDING_MEMBER_URL || '#founding';

export default function Hero() {
  return (
    <section className="hero" aria-label="Hero">
      {/* Background */}
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__orb hero__orb--1" />
        <div className="hero__orb hero__orb--2" />
        <div className="hero__grid" />
      </div>

      {/* Main content */}
      <div className="container" style={{ width: '100%' }}>
        <div className="hero__inner">
          {/* Left — text */}
          <div className="hero__content">
            <div className="hero__badge">
              <span className="hero__badge-dot" aria-hidden="true" />
              Now available on Android · Free during Beta
            </div>

            <h1 className="hero__title">
              The{' '}
              <span className="hero__title-accent">Operating System</span>{' '}
              for Modern Tailoring Businesses
            </h1>

            <p className="hero__desc">
              TailorBook replaces scattered notebooks, WhatsApp chats, and mental notes
              with one calm, intelligent system. Built for tailors who take their craft —
              and their business — seriously.
            </p>

            <div className="hero__actions">
              <a href={APK_URL} className="btn btn--primary btn--lg" download>
                <Download size={18} aria-hidden="true" />
                Download APK
              </a>
              <a href={FOUNDING_URL} className="btn btn--secondary btn--lg">
                <Users size={18} aria-hidden="true" />
                Become a Founding Member
              </a>
            </div>

            <div className="hero__stats" aria-label="Product highlights">
              <div className="hero__stat">
                <div className="hero__stat-value">100%</div>
                <div className="hero__stat-label">Offline-first</div>
              </div>
              <div className="hero__stat">
                <div className="hero__stat-value">Free</div>
                <div className="hero__stat-label">During Beta</div>
              </div>
              <div className="hero__stat">
                <div className="hero__stat-value">0</div>
                <div className="hero__stat-label">Data sent to servers</div>
              </div>
            </div>
          </div>

          {/* Right — phone mockup */}
          <div className="hero__visual">
            <div className="hero__phone-wrap">
              <div className="hero__phone-glow" aria-hidden="true" />
              <PhoneMockup size="lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="hero__scroll-hint" aria-hidden="true">
        <span>Scroll to explore</span>
        <div className="hero__scroll-arrow" />
      </div>
    </section>
  );
}
