import React, { useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { siteConfig } from '../../config/site.config';

interface FullscreenMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
}

export const FullscreenMenu: React.FC<FullscreenMenuProps> = ({ isOpen, onClose, onNavigate }) => {
  useEffect(() => {
    if (!isOpen) return;

    // Lock body scrolling when fullscreen menu is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Keyboard ESC key handler to close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fullscreen-menu-overlay" role="dialog" aria-modal="true" aria-label="Navigation Menu">
      {/* Top Header Bar inside Menu */}
      <div className="menu-top-bar">
        <img
          src="/assets/images/freska_logo_horizontal_white.png"
          alt="Freska Official Logo"
          className="menu-brand-logo"
        />

        <button
          onClick={onClose}
          aria-label="Close Navigation Menu"
          className="btn-menu-close"
        >
          <X size={22} />
        </button>
      </div>

      {/* Main Chapter Navigation Links */}
      <nav className="menu-nav-stage">
        <ul className="menu-nav-list">
          {siteConfig.navItems.map((item) => (
            <li key={item.number} className="menu-nav-item">
              <a
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.href);
                  onClose();
                }}
                className="menu-nav-link"
              >
                <span className="menu-nav-num">{item.number}</span>
                <span className="menu-nav-label">{item.label}</span>
                <ArrowRight size={28} className="menu-nav-arrow" />
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer Info inside Menu */}
      <div className="menu-footer-bar">
        <div>
          <span>Partner & Fleet Operations: </span>
          <a href={`mailto:${siteConfig.partnerEmail}`} className="menu-email-link">
            {siteConfig.partnerEmail}
          </a>
        </div>
        <div>
          <span>{siteConfig.name} Technologies © 2026 · Fresh Delivery Network</span>
        </div>
      </div>
    </div>
  );
};
