import React from 'react';
import { Download, ArrowUpRight, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import { freskaContent } from '../../content/freska.content';
import { siteConfig } from '../../config/site.config';

export const DownloadSection: React.FC = () => {
  const { download } = freskaContent;

  return (
    <section id="download" className="section-wrapper" style={{ color: '#F5F4F0' }}>
      {/* Top Conversion Stage */}
      <div className="download-grid">
        {/* Left Columns: Action Typography & Download Triggers */}
        <div>
          <h2 className="h2" style={{ color: '#FFFFFF', marginBottom: '1.5rem' }} data-reveal>
            {download.headline}
          </h2>
          <p className="body-text" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.125rem', marginBottom: '2.5rem' }} data-reveal>
            {download.subhead}
          </p>

          {/* Download Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }} data-reveal>
            <a
              href={siteConfig.downloads.androidDirectApk}
              download
              className="btn-primary"
              style={{ background: '#FFFFFF', color: '#050507' }}
            >
              <Download size={18} />
              <span>{download.androidButton}</span>
            </a>

            <a
              href={siteConfig.downloads.googlePlayStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#FFFFFF' }}
            >
              <span>{download.playStoreButton}</span>
              <ArrowUpRight size={16} />
            </a>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }} data-reveal>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} color="#00D084" />
              Direct APK v1.0 Release
            </span>
            <span>Android 12+</span>
            <span>Flutter Engine 3.47.5</span>
          </div>
        </div>

        {/* Right Columns: Mobile Device Mockup */}
        <div className="download-mockup-wrapper" data-reveal>
          <div className="phone-device-mockup">
            {/* Phone Top Notch */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)' }}>
              <span>09:41</span>
              <div style={{ width: '72px', height: '16px', background: '#000000', borderRadius: '9999px' }} />
              <span>5G 100%</span>
            </div>

            {/* In-App Mobile Interface Screen Mockup */}
            <div style={{ padding: '1.5rem', borderRadius: '1.25rem', background: '#0D1424', color: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#00D084', fontWeight: 600 }}>
                  ● Rider Online
                </span>
                <span style={{ fontSize: '0.8125rem', opacity: 0.7 }}>Shift ID #849</span>
              </div>

              <div>
                <span style={{ fontSize: '0.8125rem', opacity: 0.6, display: 'block', marginBottom: '0.25rem' }}>Next Delivery Target</span>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 300, margin: '0.25rem 0' }}>Artisan Baker Collective</p>
                <p style={{ fontSize: '0.875rem', opacity: 0.75 }}>1.8 km · Estimated 12 mins</p>
              </div>

              {/* Thumb Zone Ergonomic Slider Mockup */}
              <div style={{ width: '100%', padding: '0.875rem 1.25rem', borderRadius: '9999px', background: '#0284C7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', fontWeight: 600, boxSizing: 'border-box' }}>
                <span>Swipe to Accept</span>
                <ArrowRight size={18} />
              </div>
            </div>

            {/* Bottom Home Indicator */}
            <div style={{ width: '120px', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '9999px', margin: '0 auto 0.25rem auto' }} />
          </div>
        </div>
      </div>

      {/* Partner Operations Card */}
      <div className="partner-box" data-reveal>
        <div style={{ maxWidth: '580px' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300, color: '#FFFFFF', marginBottom: '0.75rem' }}>
            {download.partnerTitle}
          </h3>
          <p className="body-text" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem' }}>
            {download.partnerDesc}
          </p>
        </div>

        <a
          href={`mailto:${download.partnerEmail}`}
          className="btn-primary"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <Mail size={16} />
          <span>Contact Operations</span>
        </a>
      </div>

      {/* Footer & Legal Information */}
      <footer className="site-footer">
        <div>
          <span>{download.footerCopyright}</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
          {download.footerLinks.map((link, i) => (
            <a key={i} href={link.href} style={{ color: 'inherit', textDecoration: 'none' }}>
              {link.label}
            </a>
          ))}
        </div>
      </footer>
    </section>
  );
};
