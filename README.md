# freskaweb

> **Freska — The Living Rhythm of Last-Mile Delivery**  
> An immersive, editorial web experience engineered for last-mile logistics riders and merchant partners. Built with React 19, TypeScript, Three.js custom GLSL shaders, GSAP ScrollTrigger, and Lenis smooth scrolling.

---

## ✨ Features & Architecture

- **Custom GLSL Fluid Smoke Atmosphere**: Procedural curl noise, domain-warped FBM, and directional lighting simulating physical smoke disturbance and organic cursor wake tracking.
- **The Operational Sequence (Pinned Editorial Narrative)**: Coordinated 4-chapter narrative sequence locked to view with safe header clearance and seamless bi-directional scroll synchronization.
- **3D Environmental Models**: WebGL Three.js scene featuring floating meat, poultry, and seafood elements suspended in atmospheric mist.
- **Dynamic Water Reflection Shader**: Dark chiaroscuro water surface reflecting illuminated Roman numerals and brand backdrops.
- **Responsive Ergonomics**: Full desktop pinning with adaptive, unconstrained mobile touch layouts and high-contrast accessibility.
- **Official Brand System**: Pixel-accurate vectors, dark obsidian palette, brand emblems, and high-DPI favicons.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite](https://vitejs.dev/) with `vite-plugin-glsl` |
| **Graphics & Shaders** | [Three.js](https://threejs.org/) + Custom GLSL Vertex/Fragment Shaders |
| **Choreography & Motion** | [GSAP](https://gsap.com/) (ScrollTrigger) + [Lenis](https://lenis.darkroom.engineering/) |
| **Typography & Icons** | Cormorant Garamond, Plus Jakarta Sans, Lucide React |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher recommended)
- npm or yarn / pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/syedzeeeshan/freskaweb.git

# Enter project directory
cd freskaweb

# Install dependencies
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
```

Previews the production bundle locally:

```bash
npm run preview
```

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)
This repository includes a pre-configured [`vercel.json`](./vercel.json) for zero-config deployments:
1. Import repository on [Vercel](https://vercel.com).
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Deploy!

### Deploy to Netlify
1. Connect repository on [Netlify](https://netlify.com).
2. Set Build Command: `npm run build`.
3. Set Publish directory: `dist`.

---

## 📄 License

Proprietary © Freska Technologies. All rights reserved.
