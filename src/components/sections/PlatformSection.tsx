import React from 'react';
import { freskaContent } from '../../content/freska.content';

export const PlatformSection: React.FC = () => {
  const { platform } = freskaContent;

  return (
    <section id="platform" className="section-wrapper">
      {/* Header Statement */}
      <div style={{ maxWidth: '840px', marginBottom: '4rem' }}>
        <h2 className="h2" style={{ marginBottom: '1.5rem' }} data-reveal>
          {platform.headline}
        </h2>
        <p className="body-text" style={{ fontSize: '1.2rem' }} data-reveal>
          {platform.subhead}
        </p>
      </div>

      {/* Spatial Platform Architecture */}
      <div className="platform-layout">
        {/* Left: Merchant & Transit Documentary Focus */}
        <div style={{ position: 'sticky', top: '7rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="media-frame" style={{ aspectRatio: '4/3' }} data-mask-reveal>
            <img
              src="/assets/images/merchant_pickup_editorial.jpg"
              alt="Boutique local merchant handing an artisanal packaged delivery to courier"
              loading="lazy"
            />
          </div>
          <div style={{ padding: '2.5rem', borderRadius: '1.25rem', background: 'var(--stone-surface)' }} data-reveal>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 300, marginBottom: '0.75rem' }}>
              Direct Vendor-to-Courier Protocol
            </h3>
            <p className="body-text" style={{ fontSize: '1rem', lineHeight: 1.6 }}>
              Every dispatched package includes structured pickup notes, merchant door guidelines, and verified handover timestamps.
            </p>
          </div>
        </div>

        {/* Right: Clean Editorial Feature Rows */}
        <div>
          {platform.features.map((feat) => (
            <div key={feat.id} className="platform-row" data-reveal>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.35rem', fontWeight: 600 }}>
                  {feat.title}
                </h3>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0A7347' }}>
                  {feat.metricDetail}
                </span>
              </div>

              <p className="body-text" style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                {feat.description}
              </p>

              <p style={{ fontSize: '0.9375rem', fontStyle: 'italic', fontFamily: 'var(--font-serif)', color: 'var(--editorial-muted)' }}>
                {feat.tagline}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
