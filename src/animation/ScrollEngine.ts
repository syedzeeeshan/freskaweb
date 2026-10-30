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
    // Disable GSAP lag smoothing to ensure frame-accurate sync between Lenis and ScrollTrigger
    gsap.ticker.lagSmoothing(0);
  } else {
    // Under reduced motion: pure standard scroll + independent render loop
    const tickerUpdate = (time: number) => {
      engine.update(time);
    };
    gsap.ticker.add(tickerUpdate);
  }

  // --- ScrollTrigger Choreography ---

  // Helper to sync chapter cards and step pills
  const syncChapterUI = (chapterIdx: number) => {
    engine.setChapter(chapterIdx);

    const chapterCards = document.querySelectorAll<HTMLElement>('.chapter-card');
    chapterCards.forEach((card, idx) => {
      if (idx === chapterIdx) {
        card.classList.add('is-active');
      } else {
        card.classList.remove('is-active');
      }
    });

    const stepPills = document.querySelectorAll<HTMLElement>('.chapter-step-pill');
    stepPills.forEach((pill, idx) => {
      if (idx === chapterIdx) {
        pill.classList.add('is-active');
      } else {
        pill.classList.remove('is-active');
      }
    });
  };

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

  // 2. Coordinated Operational Sequence Choreography
  ScrollTrigger.matchMedia({
    // Desktop (>= 901px wide and >= 680px high): Coordinated Pinned Stage
    "(min-width: 901px) and (min-height: 680px)": function() {
      const pinTrigger = ScrollTrigger.create({
        trigger: '#chapters',
        start: 'top top',
        end: '+=200%',
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: 0.5,
        onUpdate: (self) => {
          // Evenly partition progress across all 4 chapters with clean transitions
          const chapterIdx = Math.min(3, Math.floor(self.progress * 3.999));
          syncChapterUI(chapterIdx);
        }
      });
      return () => pinTrigger.kill();
    },

    // Mobile / Tablet / Compact screens: Controlled responsive scroll without forced pinning
    "(max-width: 900px), (max-height: 679px)": function() {
      // Retain active chapter state; user can navigate with interactive pills
      syncChapterUI(0);
    }
  });

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
