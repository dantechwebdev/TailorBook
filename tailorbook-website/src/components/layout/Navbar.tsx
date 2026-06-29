import { useEffect, useState } from 'react';
import { Download, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '#features',  label: 'Features'   },
  { href: '#workflow',  label: 'How It Works'},
  { href: '#ai',        label: 'AI Studio'   },
  { href: '#roadmap',   label: 'Roadmap'     },
  { href: '#faq',       label: 'FAQ'         },
];

const APK_URL = import.meta.env.VITE_APK_DOWNLOAD_URL || '#';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => setOpen(false);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} role="navigation" aria-label="Main navigation">
      <div className="container">
        <div className="navbar__inner">
          {/* Logo */}
          <a href="#" className="navbar__logo" aria-label="TailorBook home" onClick={close}>
            <div className="navbar__logo-icon" aria-hidden="true">T</div>
            TailorBook
          </a>

          {/* Desktop nav */}
          <div className="navbar__nav" role="menubar">
            {NAV_LINKS.map(({ href, label }) => (
              <a key={href} href={href} className="navbar__link" role="menuitem">
                {label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="navbar__cta">
            <a href="#founding" className="btn btn--ghost btn--sm">
              Join Founding Members
            </a>
            <a href={APK_URL} className="btn btn--primary btn--sm" download>
              <Download size={15} aria-hidden="true" />
              Download APK
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`navbar__burger ${open ? 'open' : ''}`}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(p => !p)}
          >
            {open ? <X size={22} color="white" /> : (
              <>
                <span /><span /><span />
              </>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="navbar__mobile" role="menu">
            {NAV_LINKS.map(({ href, label }) => (
              <a key={href} href={href} className="navbar__link" role="menuitem" onClick={close}>
                {label}
              </a>
            ))}
            <div className="navbar__mobile-cta">
              <a href="#founding" className="btn btn--ghost btn--sm" style={{ marginBottom: '0.5rem', width: '100%' }} onClick={close}>
                Join Founding Members
              </a>
              <a href={APK_URL} className="btn btn--primary btn--sm" style={{ width: '100%', justifyContent: 'center' }} download onClick={close}>
                <Download size={15} />
                Download APK
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
