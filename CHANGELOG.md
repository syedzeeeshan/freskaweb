# Changelog

All notable changes to the Freska Official Immersive Website project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), adhering to REA Release Guidelines.

## [1.0.0] - 2026-10-29

### Highlights
- Built the persistent Three.js WebGL rendering environment with raking directional light, procedural seamless normal mapping, and organic 3D sculptural torus knot relief.
- Implemented coordinated single-ticker animation engine connecting Lenis smooth scrolling, GSAP ScrollTrigger, and WebGL rendering passes.
- Engineered signature dark Roman Numeral sequence (Chapters I, II, III, IV) featuring multi-layered GLSL depth compositing (Background -> Botanical background -> Numeral -> Foreground petals -> Rim lighting/shadows).
- Implemented real-time dynamic Gerstner wave water reflection shader sampling an off-screen WebGLRenderTarget with chromatic dispersion, horizon attenuation, and Fresnel abyss falloff.
- Integrated 100% verified Freska delivery platform capabilities (OTP/KYC verification, availability toggle, dispatch logic, route navigation, COD reconciliation, earnings breakdown) with zero fabricated claims or statistics.
- Audited using CDP browser automation (`design-taste-frontend`), achieving zero console errors and strict anti-slop typography/surface compliance.

### Changes
- Implemented `ThreeEngine` managing dual-scene off-screen render target compositing, viewport resizing, device pixel ratio adaptation, and WebGL context restoration.
- Added procedural 512x512 tangent-space stone plaster and liquid water normal map generation utility (`scripts/generate_textures.mjs`).
- Created dynamic 2D canvas texture generator for Roman numerals (I, II, III, IV) set in Cormorant Garamond (`NumeralGenerator.ts`).
- Authored custom GLSL vertex and fragment shaders:
  - `stoneRelief.vert` / `stoneRelief.frag`: Normal mapping, directional raking light, ambient occlusion.
  - `botanicalComposite.vert` / `botanicalComposite.frag`: Multi-stage depth composite with simulated contact shadow and soft light wrap.
  - `waterReflection.vert` / `waterReflection.frag`: Sum of Gerstner waves, inverted UV sampling, horizon attenuation, and specular highlights.
- Implemented modular component architecture across 5 master sections:
  - `HeroSection`: Sculptural stone environment, editorial typography, dynamic scroll indicator.
  - `StorySection`: Editorial narrative, electric rider documentary portrait, verified core principles.
  - `PlatformSection`: Spatial vendor-to-courier documentary plate, operational feature cards.
  - `ChaptersSection`: Pinned Roman numeral sequence, botanical and water reflection backdrop, verified shift workflows.
  - `DownloadSection`: Ergonomic courier device mockup, direct Android APK link, operations inquiry CTA, legal navigation.
- Configured production SEO architecture: semantic heading hierarchy, Schema.org `MobileApplication` JSON-LD structured data, Open Graph / Twitter cards, `robots.txt`, and `sitemap.xml`.

### Fixes
- Removed PowerShell script execution policy blockers by standardizing all npm invocations through `cmd /c`.
- Resolved buffer range error on 32-bit CRC chunk calculations in procedural texture generator by switching to `writeUInt32BE`.
- Fixed Three.js mesh collision on initial hero viewport by isolating dark botanical and water layers to Section 4 activation.
- Enforced strict anti-slop design system: eliminated 1px hairlines in favor of tone-step surfaces, removed resting box-shadows, eliminated uppercase tracked eyebrows, and stabilized typography to disciplined scale.
- Resolved chapter panel stacking collision by implementing explicit `visibility: hidden` and pointer-event toggles across inactive pinned chapters.
