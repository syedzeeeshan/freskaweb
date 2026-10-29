import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ThreeEngine } from '../engine/renderer/ThreeEngine';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollController {
  lenis: Lenis | null;
  destroy: () => void;
  scrollTo: (target: string | HTMLElement) => void;
}

export function initScrollEngine(engine: ThreeEngine): ScrollController {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let lenis: Lenis | null = null;

  if (!prefersReducedMotion) {
    lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 0.9,
      smoothWheel: true,
      syncTouch: false
    });

    lenis.on('scroll', (e) => {
      ScrollTrigger.update();
      engine.setScrollProgress(e.progress, e.velocity);
    });

    // Single unified GSAP RAF loop
    const tickerUpdate = (time: number) => {
      lenis?.raf(time * 1000);
      engine.update(time);
    };

    gsap.ticker.add(tickerUpdate);
    // lagSmoothing evaluated: 500ms max lag, 33ms adjust to prevent frame explosion during tab suspension
    gsap.ticker.lagSmoothing(500, 33);
  } else {
    // Under reduced motion: pure standard scroll + independent render loop
    const tickerUpdate = (time: number) => {
      engine.update(time);
    };
    gsap.ticker.add(tickerUpdate);
  }

  // --- ScrollTrigger Choreography ---

  // 1. Environmental Shift Trigger (Light Stone to Deep Obsidian)
  ScrollTrigger.create({
    trigger: '#chapters',
    start: 'top 80%',
    end: 'top 20%',
    scrub: 1.0,
    onUpdate: (self) => {
      engine.setThemeTransition(self.progress);
      if (self.progress > 0.4) {
        document.body.classList.add('theme-dark');
      } else {
        document.body.classList.remove('theme-dark');
      }
    }
  });

  // 2. Pinned Roman Numeral Sequence (Chapters I, II, III, IV)
  const chaptersSection = document.getElementById('chapters');
  if (chaptersSection) {
    ScrollTrigger.create({
      trigger: '#chapters',
      start: 'top top',
      end: '+=150%',
      pin: true,
      scrub: 0.8,
      onUpdate: (self) => {
        // Divide progress into 4 chapters (0.0 - 0.25: I, 0.25 - 0.50: II, 0.50 - 0.75: III, 0.75 - 1.0: IV)
        const chapterIdx = Math.min(3, Math.floor(self.progress * 4));
        engine.setChapter(chapterIdx);

        // Update active chapter UI state with clean visibility toggle
        const chapterCards = document.querySelectorAll<HTMLElement>('.chapter-card');
        chapterCards.forEach((card, idx) => {
          if (idx === chapterIdx) {
            card.classList.add('is-active');
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
            card.style.pointerEvents = 'auto';
            card.style.visibility = 'visible';
          } else {
            card.classList.remove('is-active');
            card.style.opacity = '0';
            card.style.transform = 'translateY(16px)';
            card.style.pointerEvents = 'none';
            card.style.visibility = 'hidden';
          }
        });
      }
    });
  }

  // 3. Editorial Text & Mask Reveals
  const revealElements = document.querySelectorAll('[data-reveal]');
  revealElements.forEach((el) => {
    gsap.fromTo(
      el,
      { y: 24, autoAlpha: 0.15 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none'
        }
      }
    );
  });

  // 4. Polygon Image Mask Reveals
  const maskImages = document.querySelectorAll('[data-mask-reveal]');
  maskImages.forEach((img) => {
    gsap.fromTo(
      img,
      { clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)', scale: 1.15 },
      {
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        scale: 1.0,
        duration: 1.5,
        ease: 'power3.inOut',
        scrollTrigger: {
          trigger: img,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });

  return {
    lenis,
    scrollTo: (target: string | HTMLElement) => {
      if (lenis) {
        lenis.scrollTo(target, { duration: 1.6, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      } else {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    destroy: () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
      lenis?.destroy();
    }
  };
}
