import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { siteConfig } from '../../config/site.config';

interface FullscreenMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
}

export const FullscreenMenu: React.FC<FullscreenMenuProps> = ({ isOpen, onClose, onNavigate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#050507]/95 backdrop-blur-2xl flex flex-col justify-between p-8 md:p-16 text-[#F5F4F0] animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between w-full">
        <span className="font-serif text-2xl tracking-widest uppercase opacity-60">
          Navigation
        </span>
        <button
          onClick={onClose}
          aria-label="Close Menu"
          className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Chapter Links */}
      <nav className="my-auto">
        <ul className="flex flex-col gap-4 md:gap-8">
          {siteConfig.navItems.map((item) => (
            <li key={item.number} className="overflow-hidden">
              <a
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.href);
                  onClose();
                }}
                className="group flex items-baseline gap-4 md:gap-8 text-3xl sm:text-5xl md:text-7xl font-serif font-light tracking-tight hover:italic transition-all duration-300"
              >
                <span className="text-sm md:text-lg font-sans font-medium text-white/40 tracking-widest">
                  {item.number}
                </span>
                <span className="group-hover:translate-x-3 transition-transform duration-300">
                  {item.label}
                </span>
                <ArrowRight size={28} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-4 transition-all duration-300 text-[#00D084]" />
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-8 border-t border-white/10 text-xs text-white/50 font-sans">
        <div>
          <span>Partner Operations: </span>
          <a href={`mailto:${siteConfig.partnerEmail}`} className="text-[#00D084] hover:underline">
            {siteConfig.partnerEmail}
          </a>
        </div>
        <div className="mt-2 sm:mt-0">
          <span>{siteConfig.name} Technologies © 2026</span>
        </div>
      </div>
    </div>
  );
};
