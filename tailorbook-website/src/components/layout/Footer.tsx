import { Twitter, Instagram, Linkedin, Mail, MessageCircle } from 'lucide-react';

const CONTACT = import.meta.env.VITE_CONTACT_EMAIL || 'hello@tailorbook.app';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer__top">
          {/* Brand column */}
          <div className="footer__brand">
            <div className="footer__logo">
              <div className="footer__logo-icon" aria-hidden="true">T</div>
              TailorBook
            </div>
            <p className="footer__tagline">
              The operating system for modern tailoring businesses — calm, intelligent, and continuously evolving.
            </p>
            <div className="footer__socials" aria-label="Social media links">
              <a href="#" className="footer__social" aria-label="Twitter / X">
                <Twitter size={15} />
              </a>
              <a href="#" className="footer__social" aria-label="Instagram">
                <Instagram size={15} />
              </a>
              <a href="#" className="footer__social" aria-label="LinkedIn">
                <Linkedin size={15} />
              </a>
              <a href={`mailto:${CONTACT}`} className="footer__social" aria-label="Email us">
                <Mail size={15} />
              </a>
              <a href="#" className="footer__social" aria-label="WhatsApp">
                <MessageCircle size={15} />
              </a>
            </div>
          </div>

          {/* Product column */}
          <div className="footer__col">
            <div className="footer__col-title">Product</div>
            <ul className="footer__links">
              <li><a href="#features"  className="footer__link">Features</a></li>
              <li><a href="#workflow"  className="footer__link">How It Works</a></li>
              <li><a href="#ai"        className="footer__link">AI Studio</a></li>
              <li><a href="#roadmap"   className="footer__link">Roadmap</a></li>
              <li><a href="#founding"  className="footer__link">Founding Members</a></li>
            </ul>
          </div>

          {/* Resources column */}
          <div className="footer__col">
            <div className="footer__col-title">Resources</div>
            <ul className="footer__links">
              <li><a href="#faq"       className="footer__link">FAQ</a></li>
              <li><a href="#"          className="footer__link">Documentation</a></li>
              <li><a href="#"          className="footer__link">Release Notes</a></li>
              <li><a href="#"          className="footer__link">Help Center</a></li>
              <li><a href="#"          className="footer__link">Community</a></li>
            </ul>
          </div>

          {/* Company column */}
          <div className="footer__col">
            <div className="footer__col-title">Company</div>
            <ul className="footer__links">
              <li><a href="#"                      className="footer__link">About</a></li>
              <li><a href={`mailto:${CONTACT}`}    className="footer__link">Contact</a></li>
              <li><a href="#"                      className="footer__link">Partner Program</a></li>
              <li><a href="#"                      className="footer__link">Privacy Policy</a></li>
              <li><a href="#"                      className="footer__link">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">
            © {year} TailorBook. All rights reserved. Built with love for tailors everywhere.
          </p>
          <div className="footer__legal">
            <a href="#" className="footer__legal-link">Privacy</a>
            <a href="#" className="footer__legal-link">Terms</a>
            <a href="#" className="footer__legal-link">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
