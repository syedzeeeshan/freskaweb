import React from 'react';
import { Menu, ArrowUpRight } from 'lucide-react';

interface HeaderProps {
  onOpenMenu: () => void;
  onScrollTo: (target: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMenu, onScrollTo }) => {
  return (
    <header className="site-header">
      {/* Brand Wordmark */}
      <div className="header-brand" onClick={() => onScrollTo('#hero')}>
        <span>Freska</span>
      </div>

      {/* Center Platform Status */}
      <div className="header-status-pill">
        <span className="status-dot" />
        <span>Last-Mile Platform</span>
      </div>

      {/* Navigation Actions */}
      <div className="header-actions">
        <button
          onClick={() => onScrollTo('#download')}
          className="btn-primary"
          style={{ height: '44px', padding: '0 1.5rem', fontSize: '0.8125rem' }}
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
