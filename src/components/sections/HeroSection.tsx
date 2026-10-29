import React from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { freskaContent } from '../../content/freska.content';

interface HeroSectionProps {
  onScrollTo: (target: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onScrollTo }) => {
  const { hero } = freskaContent;

  return (
    <section id="hero" className="section-wrapper hero-container">
      {/* Central Editorial Content */}
      <div className="hero-content">
        <h1 className="hero-title" data-reveal>
          {hero.headline}
        </h1>
        <p className="hero-lead" data-reveal>
          {hero.subhead}
        </p>

        {/* Action Controls */}
        <div className="hero-cta-group" data-reveal>
          <button
            onClick={() => onScrollTo('#download')}
            className="btn-primary"
          >
            <span>{hero.primaryCta}</span>
            <ArrowUpRight size={18} />
          </button>

          <button
            onClick={() => onScrollTo('#story')}
            className="btn-secondary"
          >
            <span>{hero.secondaryCta}</span>
          </button>
        </div>
      </div>

      {/* Bottom Scroll Cue */}
      <div className="hero-footer-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img
            src="/assets/textures/botanical_sunlit_diffuse.jpg"
            alt="Sculptural botanical relief study in raking sunlight"
            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '10px' }}
          />
          <span>{hero.statusBadge}</span>
        </div>
        <button
          onClick={() => onScrollTo('#story')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem', font: 'inherit' }}
        >
          <span>Scroll to Explore</span>
          <ArrowDown size={14} />
        </button>
      </div>
    </section>
  );
};
