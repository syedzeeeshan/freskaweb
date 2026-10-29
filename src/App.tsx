import React, { useEffect, useRef, useState } from 'react';
import { ThreeEngine } from './engine/renderer/ThreeEngine';
import { initScrollEngine, ScrollController } from './animation/ScrollEngine';
import { Header } from './components/navigation/Header';
import { FullscreenMenu } from './components/navigation/FullscreenMenu';
import { HeroSection } from './components/sections/HeroSection';
import { StorySection } from './components/sections/StorySection';
import { PlatformSection } from './components/sections/PlatformSection';
import { ChaptersSection } from './components/sections/ChaptersSection';
import { DownloadSection } from './components/sections/DownloadSection';

export const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const engineRef = useRef<ThreeEngine | null>(null);
  const scrollControllerRef = useRef<ScrollController | null>(null);

  useEffect(() => {
    const canvasContainer = document.getElementById('webgl-canvas-container');
    if (!canvasContainer) return;

    // Initialize Three.js Engine
    const engine = new ThreeEngine(canvasContainer);
    engineRef.current = engine;

    // Initialize Scroll and Animation Engine (Lenis + GSAP)
    const scrollController = initScrollEngine(engine);
    scrollControllerRef.current = scrollController;

    return () => {
      scrollController.destroy();
      engine.dispose();
    };
  }, []);

  const handleScrollTo = (target: string) => {
    scrollControllerRef.current?.scrollTo(target);
  };

  return (
    <div className="relative w-full min-h-screen">
      {/* Editorial Header */}
      <Header
        onOpenMenu={() => setIsMenuOpen(true)}
        onScrollTo={handleScrollTo}
      />

      {/* Fullscreen Navigation Modal */}
      <FullscreenMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={handleScrollTo}
      />

      {/* Main Editorial Storyline Flow */}
      <main className="relative z-10">
        <HeroSection onScrollTo={handleScrollTo} />
        <StorySection />
        <PlatformSection />
        <ChaptersSection />
        <DownloadSection />
      </main>
    </div>
  );
};

export default App;
