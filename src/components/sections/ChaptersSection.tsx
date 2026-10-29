import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { freskaContent } from '../../content/freska.content';

export const ChaptersSection: React.FC = () => {
  const { chapters } = freskaContent;

  return (
    <section id="chapters" className="section-wrapper chapter-container" style={{ color: '#F5F4F0' }}>
      {/* Top Section Header */}
      <div style={{ maxWidth: '800px', marginBottom: '3rem' }}>
        <h2 className="h2" style={{ color: '#FFFFFF', marginBottom: '1rem' }}>
          {chapters.headline}
        </h2>
        <p className="body-text" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.125rem' }}>
          {chapters.subhead}
        </p>
      </div>

      {/* Center Stage: The Four Chapter Panels (Overlaid onto Roman Numeral & Water Shader) */}
      <div className="chapter-stage">
        {chapters.items.map((chap, idx) => (
          <div
            key={chap.id}
            className={`chapter-card chapter-panel ${
              idx === 0 ? 'is-active' : ''
            }`}
            style={{
              opacity: idx === 0 ? 1 : 0,
              transform: idx === 0 ? 'translateY(0)' : 'translateY(20px)',
              pointerEvents: idx === 0 ? 'auto' : 'none',
              visibility: idx === 0 ? 'visible' : 'hidden'
            }}
            data-chapter-index={idx}
          >
            <div className="asym-grid chapter-panel-card" style={{ alignItems: 'center' }}>
              {/* Left Column: Chapter Numeral Identifier & Subtitle */}
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 3.8vw, 3.25rem)', fontWeight: 300, color: '#FFFFFF', lineHeight: 1.15, marginBottom: '0.75rem' }}>
                  {chap.title}
                </h3>
                <p style={{ fontSize: '1rem', color: '#00D084', fontWeight: 500, margin: 0 }}>
                  Chapter {chap.numeral} · {chap.subtitle}
                </p>
              </div>

              {/* Right Column: Verified Operational Details */}
              <div>
                <p className="body-text" style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1.0625rem', marginBottom: '1.5rem' }}>
                  {chap.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', paddingTop: '1.25rem' }}>
                  {chap.verifiedDetails.map((detail, dIdx) => (
                    <div key={dIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9375rem', color: 'rgba(255,255,255,0.8)' }}>
                      <CheckCircle2 size={16} color="#00D084" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Chapter Step Progress Indicator */}
      <div className="hero-footer-bar" style={{ borderTopColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {chapters.items.map((chap) => (
            <span key={chap.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{chap.numeral}</span>
              <span style={{ opacity: 0.5 }}>{chap.subtitle}</span>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src="/assets/textures/botanical_dark_diffuse.jpg"
            alt="Botanical flora under midnight chiaroscuro illumination"
            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }}
          />
          <span>Water Surface Dynamic Shader Active</span>
        </div>
      </div>
    </section>
  );
};
