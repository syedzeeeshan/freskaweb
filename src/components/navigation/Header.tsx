import React, { useEffect, useState } from 'react';
import { Menu, ArrowUpRight } from 'lucide-react';

interface HeaderProps {
  onOpenMenu: () => void;
  onScrollTo: (target: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMenu, onScrollTo }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    // Observe body class changes to detect theme-dark
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.body.classList.contains('theme-dark'));
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    setIsDarkTheme(document.body.classList.contains('theme-dark'));

    return () => observer.disconnect();
  }, []);

  return (
    <header className="site-header" role="banner">
      {/* Official Freska Brand Identity */}
      <div 
        className="header-brand-wrap" 
        onClick={() => onScrollTo('#hero')}
        role="button"
        tabIndex={0}
        aria-label="Freska Home"
      >
        <img
          src={isDarkTheme ? '/assets/images/freska_logo_horizontal_white.png' : '/assets/images/freska_logo_horizontal_black.png'}
          alt="Freska — Fresh Meat & Seafood Delivery"
          className="header-official-logo"
        />
      </div>

      {/* Center Platform Status Pill */}
      <div className="header-status-pill">
        <span className="status-dot" />
        <span>Cold-Chain Transit Active</span>
      </div>

      {/* Navigation Actions */}
      <div className="header-actions">
        {/* Desktop Quick Jump Links */}
        <nav className="header-nav-links" aria-label="Quick Navigation">
          <button type="button" onClick={() => onScrollTo('#story')} className="header-quick-link">
            Story
          </button>
          <button type="button" onClick={() => onScrollTo('#platform')} className="header-quick-link">
            Platform
          </button>
          <button type="button" onClick={() => onScrollTo('#chapters')} className="header-quick-link">
            Chapters
          </button>
        </nav>

        <button
          onClick={() => onScrollTo('#download')}
          className="btn-primary header-cta-btn"
          aria-label="Download Partner App"
        >
          <span>Partner App</span>
          <ArrowUpRight size={14} />
        </button>

        <button
          onClick={onOpenMenu}
          aria-label="Toggle Fullscreen Menu"
          className="btn-menu"
        >
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
};
