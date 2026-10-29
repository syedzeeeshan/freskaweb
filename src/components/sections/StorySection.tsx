import React from 'react';
import { freskaContent } from '../../content/freska.content';

export const StorySection: React.FC = () => {
  const { story } = freskaContent;

  return (
    <section id="story" className="section-wrapper">
      <div className="asym-grid">
        {/* Left Column: Asymmetrical Editorial Image */}
        <div className="media-frame" data-mask-reveal>
          <img
            src="/assets/images/rider_transit_editorial.jpg"
            alt="Professional Freska delivery partner riding an electric bicycle in early morning city light"
            loading="lazy"
          />
        </div>

        {/* Right Column: Narrative Storytelling */}
        <div>
          <h2 className="h2" style={{ marginBottom: '2rem' }} data-reveal>
            {story.headline}
          </h2>
          
          <p className="body-text" style={{ fontSize: '1.25rem', color: 'var(--editorial-charcoal)', fontWeight: 500, marginBottom: '1.75rem' }} data-reveal>
            {story.lead}
          </p>

          <div style={{ marginBottom: '2.5rem' }} data-reveal>
            {story.narrative.map((para, i) => (
              <p key={i} className="body-text" style={{ marginBottom: '1rem' }}>
                {para}
              </p>
            ))}
          </div>

          {/* Core Principles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem', paddingTop: '2.5rem' }} data-reveal>
            {story.principles.map((pr, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--editorial-charcoal)', fontFamily: 'var(--font-sans)' }}>
                  Principle {idx + 1}
                </span>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--editorial-charcoal)' }}>
                  {pr.title}
                </h3>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--editorial-muted)' }}>
                  {pr.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
