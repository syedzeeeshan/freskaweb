import React, { useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { freskaContent } from '../../content/freska.content';

export const ChaptersSection: React.FC = () => {
  const { chapters } = freskaContent;
  const [activeIdx, setActiveIdx] = useState(0);

  const handleTabClick = (idx: number) => {
    setActiveIdx(idx);
    const chapterCards = document.querySelectorAll<HTMLElement>('.chapter-card');
    chapterCards.forEach((card, i) => {
      if (i === idx) {
        card.classList.add('is-active');
      } else {
        card.classList.remove('is-active');
      }
    });
    const stepPills = document.querySelectorAll<HTMLElement>('.chapter-step-pill');
    stepPills.forEach((pill, i) => {
      if (i === idx) {
        pill.classList.add('is-active');
      } else {
        pill.classList.remove('is-active');
      }
    });
  };

  return (
    <section id="chapters" className="section-wrapper chapter-container">
      {/* Top Section Editorial Header */}
      <div className="chapter-header-box">
        <div className="chapter-eyebrow">
          <Sparkles size={16} className="text-[#00D084]" />
          <span>The Operational Sequence</span>
        </div>
        <h2 className="chapter-main-title">
          {chapters.headline}
        </h2>
        <p className="chapter-main-subhead">
          {chapters.subhead}
        </p>
      </div>

      {/* Center Stage: The Four Chapter Panels */}
      <div className="chapter-stage">
        {chapters.items.map((chap, idx) => (
          <div
            key={chap.id}
            className={`chapter-card chapter-panel ${
              idx === activeIdx ? 'is-active' : ''
            }`}
            data-chapter-index={idx}
          >
            <div className="chapter-editorial-card">
              {/* Left Column: Striking Luminous Roman Numeral & Identity */}
              <div className="chapter-numeral-col">
                <div className="numeral-grand-display">
                  {chap.numeral}
                </div>
                <div className="numeral-meta">
                  <span className="numeral-pill">
                    Chapter {chap.numeral}
                  </span>
                  <span className="numeral-subtitle">
                    {chap.subtitle}
                  </span>
                </div>
              </div>

              {/* Right Column: High-Contrast Heading & Verified Details */}
              <div className="chapter-content-col">
                <h3 className="chapter-panel-title">
                  {chap.title}
                </h3>
                
                <p className="chapter-panel-desc">
                  {chap.description}
                </p>

                <div className="chapter-details-grid">
                  {chap.verifiedDetails.map((detail, dIdx) => (
                    <div key={dIdx} className="chapter-detail-item">
                      <CheckCircle2 size={18} className="detail-check-icon" />
                      <span className="detail-text">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Chapter Step Progress & Interactive Switcher Bar */}
      <div className="chapter-footer-bar">
        <div className="chapter-step-pills">
          {chapters.items.map((chap, idx) => (
            <button
              key={chap.id}
              type="button"
              onClick={() => handleTabClick(idx)}
              className={`chapter-step-pill ${idx === activeIdx ? 'is-active' : ''}`}
            >
              <span className="pill-roman">{chap.numeral}</span>
              <span className="pill-label">{chap.subtitle}</span>
            </button>
          ))}
        </div>

        <div className="chapter-brand-status">
          <img
            src="/assets/images/freska_emblem_white.png"
            alt="Official Freska Brand Emblem"
            className="brand-status-emblem"
          />
          <div className="brand-status-meta">
            <span className="brand-status-meta-title">Freska Cold-Chain Protocol</span>
            <span className="brand-status-meta-sub">Verified Shift Workflow</span>
          </div>
        </div>
      </div>
    </section>
  );
};
