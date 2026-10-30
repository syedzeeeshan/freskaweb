import React, { useEffect, useRef, useState } from 'react';
import { MeatGardenEngine, FoodCategory } from '../../engine/renderer/MeatGardenEngine';
import { Sparkles, Compass, ShieldCheck } from 'lucide-react';

export const MeatGardenSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<MeatGardenEngine | null>(null);
  const [activeCategory, setActiveCategory] = useState<FoodCategory>('all');
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new MeatGardenEngine(containerRef.current);
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleSelectCategory = (cat: FoodCategory) => {
    setActiveCategory(cat);
    setHasInteracted(true);
    engineRef.current?.setCategory(cat);
  };

  const handlePointerOver = () => {
    if (!hasInteracted) setHasInteracted(true);
  };

  return (
    <section id="meat-garden" className="section-wrapper meat-garden-container">
      {/* Editorial Header */}
      <div className="meat-garden-header" data-reveal>
        <div className="meat-garden-eyebrow">
          <Sparkles size={16} className="text-[#00D084]" />
          <span>Interactive 3D Garden · Farm-to-Door Offerings</span>
        </div>
        <h2 className="h2 meat-garden-title">
          The Freska Meat & Seafood Garden.
        </h2>
        <p className="body-text meat-garden-lead">
          An immersive study of uncompromised freshness. Explore our prime poultry, tender pasture-raised red meats, and coastal seafood—protected in cold-chain transit and carved fresh for daily delivery.
        </p>

        {/* Category Discovery Controls */}
        <div className="meat-category-bar">
          <button
            type="button"
            className={`meat-cat-btn ${activeCategory === 'all' ? 'is-active' : ''}`}
            onClick={() => handleSelectCategory('all')}
          >
            <span>All Offerings</span>
            <span className="cat-count">6</span>
          </button>
          <button
            type="button"
            className={`meat-cat-btn ${activeCategory === 'poultry' ? 'is-active' : ''}`}
            onClick={() => handleSelectCategory('poultry')}
          >
            <span>Poultry Cuts</span>
            <span className="cat-count">2</span>
          </button>
          <button
            type="button"
            className={`meat-cat-btn ${activeCategory === 'meat' ? 'is-active' : ''}`}
            onClick={() => handleSelectCategory('meat')}
          >
            <span>Lamb & Red Meat</span>
            <span className="cat-count">2</span>
          </button>
          <button
            type="button"
            className={`meat-cat-btn ${activeCategory === 'seafood' ? 'is-active' : ''}`}
            onClick={() => handleSelectCategory('seafood')}
          >
            <span>Coastal Seafood</span>
            <span className="cat-count">2</span>
          </button>
        </div>
      </div>

      {/* 3D Meat Garden Interactive Spatial Canvas */}
      <div 
        className="meat-canvas-wrapper" 
        data-reveal
        onPointerEnter={handlePointerOver}
      >
        {/* WebGL Canvas Mounting Host */}
        <div
          ref={containerRef}
          className="meat-canvas-host"
          aria-label="3D Meat and Seafood interactive garden viewer"
        />

        {/* Ambient Interaction Cue Overlay */}
        <div className={`interaction-cue ${hasInteracted ? 'is-faded' : ''}`}>
          <Compass size={18} className="animate-spin-slow" />
          <span>Hover pointer or touch and drag across the mist to reveal 3D cuts</span>
        </div>

        {/* Ambient Bottom Garden Metadata Bar */}
        <div className="meat-canvas-footer">
          <div className="flex items-center gap-2">
            <span className="live-dot" />
            <span className="font-mono text-xs tracking-wider uppercase text-neutral-600">
              {activeCategory === 'all' ? 'All Cuts Suspended in Mist' : `Focusing: ${activeCategory}`}
            </span>
          </div>

          <div className="garden-specs">
            <span className="spec-item">
              <ShieldCheck size={14} className="text-[#00D084]" />
              0°C – 4°C Constant Chilled Transit
            </span>
            <span className="spec-item">Antibiotic-Free Certified</span>
            <span className="spec-item">Daily Hand-Cut Carving</span>
          </div>
        </div>
      </div>

      {/* Architectural Pillars Summary */}
      <div className="meat-pillars-grid" data-reveal>
        <div className="meat-pillar-card">
          <span className="pillar-num">01</span>
          <h3 className="pillar-title">Prime Poultry Selection</h3>
          <p className="pillar-desc">
            Farm-raised chicken drumsticks, boneless fillets, and cuts inspected for firm muscle tone, natural color, and tender texture.
          </p>
        </div>

        <div className="meat-pillar-card">
          <span className="pillar-num">02</span>
          <h3 className="pillar-title">Artisanal Lamb & Steak</h3>
          <p className="pillar-desc">
            Pasture-fed lamb chops with marbled fat caps and thick tenderloin cuts, aged under precision humidity and carved to culinary standards.
          </p>
        </div>

        <div className="meat-pillar-card">
          <span className="pillar-num">03</span>
          <h3 className="pillar-title">Fresh Catch Seafood</h3>
          <p className="pillar-desc">
            Whole clean fish, succulent salmon fillets, and jumbo tiger prawns sourced directly from licensed coastal fisheries every dawn.
          </p>
        </div>
      </div>
    </section>
  );
};
