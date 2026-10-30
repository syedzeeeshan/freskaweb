import * as THREE from 'three';
import stoneVert from '../shaders/stoneRelief.vert';
import stoneFrag from '../shaders/stoneRelief.frag';
import botanicalVert from '../shaders/botanicalComposite.vert';
import freskaBrandFrag from '../shaders/freskaBrandComposite.frag';
import waterVert from '../shaders/waterReflection.vert';
import waterFrag from '../shaders/waterReflection.frag';
import fogVert from '../shaders/meatFogReveal.vert';
import fogFrag from '../shaders/meatFogReveal.frag';
import { MeatGardenBuilder, FoodModelItem } from '../scenes/MeatGardenBuilder';

export class ThreeEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private mainScene: THREE.Scene;
  private upperScene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private upperCamera: THREE.PerspectiveCamera;
  private renderTarget: THREE.WebGLRenderTarget;

  // Materials & Shaders
  private stoneBackdropMat!: THREE.ShaderMaterial;
  private brandCompositeMat!: THREE.ShaderMaterial;
  private waterMat!: THREE.ShaderMaterial;
  private fogMaterial!: THREE.ShaderMaterial;

  // Meshes
  private stoneBackdropMesh!: THREE.Mesh;
  private brandUpperMesh!: THREE.Mesh;
  private waterMesh!: THREE.Mesh;
  private fogQuad!: THREE.Mesh;

  // 3D Environmental Food Collection (Living Background Environment)
  private foodItems: FoodModelItem[] = [];

  // Textures
  private stoneNormalTexture!: THREE.Texture;
  private brandBackdropTexture!: THREE.Texture;
  private waterNormalTexture!: THREE.Texture;

  // Animation & Interaction State
  private clock: THREE.Clock;
  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private scroll = { progress: 0, velocity: 0, targetVelocity: 0 };
  private darkProgress = 0;
  private currentChapter = 0;
  private isDisposed = false;

  // GhostCursor Tuned Parameters for Editorial Atmospheric Reveal
  private revealConfig = {
    desktop: {
      radius: 105,         // 105px radius = 210px diameter (Target: 180-240px)
      boundaryWidth: 36,   // 36px soft boundary (Target: 30-45px)
      trailFactor: 1.4,    // 1.4x radius = 147px max trail length (Target: 1.2-1.6x)
      inertia: 0.52,
      fadeDelay: 850,
      fadeDuration: 1250,
    },
    mobile: {
      radius: 75,          // 75px radius = 150px diameter (Target: 130-180px)
      boundaryWidth: 26,   // 26px soft boundary (Target: 20-35px)
      trailFactor: 1.2,    // 1.2x radius = 90px max trail length (Target: 1.0-1.4x)
      inertia: 0.45,
      fadeDelay: 600,
      fadeDuration: 1000,
    }
  };
  private currentRadius = 105;
  private currentBoundaryWidth = 36;
  private currentTrailMax = 147;

  // React Bits GhostCursor Fluid Dynamics State
  private ghost = {
    x: 0.5,
    y: 0.5,
    vx: 0,
    vy: 0,
    px: 0.5,
    py: 0.5,
    ready: false
  };
  private pointer = {
    x: 0.5,
    y: 0.5,
    inside: false,
    moved: -1e9
  };
  private presence = 0;
  private waterOpacity = 0;

  // Trailing nodes for subtle smoke wake (React Bits GhostCursor reference)
  private trailNodes = Array.from({ length: 8 }, () => ({
    x: 0.5,
    y: 0.5,
    weight: 0
  }));
  private trailPositionsArray: THREE.Vector2[] = Array.from(
    { length: 8 },
    () => new THREE.Vector2(0.5, 0.5)
  );
  private trailWeightsArray: number[] = new Array(8).fill(0);
  private wakeStrength = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // 1. Initialize WebGL Renderer with high performance and color calibration
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    // 2. Initialize Cameras & Scenes
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 5.0);

    this.upperCamera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
    this.upperCamera.position.set(0, 0, 5.0);

    this.mainScene = new THREE.Scene();
    this.upperScene = new THREE.Scene();

    // 3. Offscreen Render Target for Water Reflection
    const rtWidth = Math.floor(window.innerWidth * dpr * 0.75);
    const rtHeight = Math.floor((window.innerHeight * 0.55) * dpr * 0.75);
    this.renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });

    this.loadTextures();
    this.initBackgroundEnvironment();
    this.initDarkRomanEnvironment();
    this.setupListeners();
  }

  private loadTextures() {
    const loader = new THREE.TextureLoader();
    
    // Normal map for plaster relief
    this.stoneNormalTexture = loader.load('/assets/textures/stone_plaster_normal.png');
    this.stoneNormalTexture.wrapS = THREE.RepeatWrapping;
    this.stoneNormalTexture.wrapT = THREE.RepeatWrapping;

    // Normal map for water ripples
    this.waterNormalTexture = loader.load('/assets/textures/water_normal_loop.png');
    this.waterNormalTexture.wrapS = THREE.RepeatWrapping;
    this.waterNormalTexture.wrapT = THREE.RepeatWrapping;

    // Official Freska Embossed Brand Backdrop Texture
    this.brandBackdropTexture = loader.load('/assets/textures/freska_dark_brand_backdrop.png');
    this.brandBackdropTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.brandBackdropTexture.wrapT = THREE.ClampToEdgeWrapping;
  }

  private initBackgroundEnvironment() {
    // 1. Studio Lighting for 3D Environmental Food Objects
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    this.mainScene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5eb, 1.45);
    keyLight.position.set(3.5, 4.0, 5.0);
    this.mainScene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xe0f2fe, 1.15);
    rimLight.position.set(-4.0, -2.5, -2.0);
    this.mainScene.add(rimLight);

    const fillLight = new THREE.PointLight(0xffe4d6, 0.85, 12);
    fillLight.position.set(0, -2.5, 3.0);
    this.mainScene.add(fillLight);

    // 2. Full-Bleed Continuous Background Quad (transitions seamlessly to dark brand backdrop)
    const planeGeo = new THREE.PlaneGeometry(24, 18);
    this.stoneBackdropMat = new THREE.ShaderMaterial({
      vertexShader: stoneVert,
      fragmentShader: stoneFrag,
      uniforms: {
        uNormalMap: { value: this.stoneNormalTexture },
        uDarkBrandBackdrop: { value: this.brandBackdropTexture },
        uStoneColor: { value: new THREE.Color('#F5F4F0') },
        uLightPosition: { value: new THREE.Vector3(2.0, 3.5, 4.0) },
        uNormalScale: { value: 0.15 },
        uAmbientIntensity: { value: 0.88 },
        uDarkProgress: { value: 0.0 }
      },
      depthWrite: false
    });
    this.stoneBackdropMesh = new THREE.Mesh(planeGeo, this.stoneBackdropMat);
    this.stoneBackdropMesh.position.z = -2.5;
    this.mainScene.add(this.stoneBackdropMesh);

    // 3. 3D Meat & Seafood Environmental Objects (Integrated into Background Scene)
    this.foodItems = MeatGardenBuilder.buildGardenCollection();
    this.foodItems.forEach((item) => {
      this.mainScene.add(item.group);
    });

    // 4. Dense Smoky White Atmosphere Veil Quad with React Bits GhostCursor Shader
    const fogGeo = new THREE.PlaneGeometry(24, 18);
    const dpr = this.renderer.getPixelRatio();
    this.fogMaterial = new THREE.ShaderMaterial({
      vertexShader: fogVert,
      fragmentShader: fogFrag,
      uniforms: {
        uFrom: { value: new THREE.Vector2(window.innerWidth * 0.5, window.innerHeight * 0.5) },
        uTo: { value: new THREE.Vector2(window.innerWidth * 0.5, window.innerHeight * 0.5) },
        uVelocity: { value: new THREE.Vector2(0.0, 0.0) },
        uRadius: { value: this.currentRadius },
        uBoundaryWidth: { value: this.currentBoundaryWidth },
        uTrailMax: { value: this.currentTrailMax },
        uPresence: { value: 0.0 }, // 0.0 = 100% opaque concealment initially!
        uTurbulence: { value: 0.5 },
        uSwirl: { value: 1.2 },
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uDpr: { value: dpr },
        uMistColor: { value: new THREE.Color('#F5F4F0') },
        uDarkProgress: { value: 0.0 },
        uTrailNodes: { value: this.trailPositionsArray },
        uTrailWeights: { value: this.trailWeightsArray },
        uWakeStrength: { value: 0.0 }
      },
      transparent: true,
      depthWrite: false
    });

    this.fogQuad = new THREE.Mesh(fogGeo, this.fogMaterial);
    this.fogQuad.position.set(0, 0, 1.2);
    this.mainScene.add(this.fogQuad);
  }

  private initDarkRomanEnvironment() {
    // Upper Scene: Used strictly for offscreen water reflection buffer
    const upperGeo = new THREE.PlaneGeometry(8.0, 5.0);

    this.brandCompositeMat = new THREE.ShaderMaterial({
      vertexShader: botanicalVert,
      fragmentShader: freskaBrandFrag,
      uniforms: {
        uBrandBackdrop: { value: this.brandBackdropTexture },
        uSurfaceNormal: { value: this.stoneNormalTexture },
        uBackgroundColor: { value: new THREE.Color('#050507') },
        uDarkProgress: { value: 0.0 },
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      },
      transparent: true
    });

    this.brandUpperMesh = new THREE.Mesh(upperGeo, this.brandCompositeMat);
    this.brandUpperMesh.position.set(0, 0.4, 0);
    this.upperScene.add(this.brandUpperMesh);

    // Lower Scene: Animated Continuous Water Reflection Plane (spanning full width)
    const waterGeo = new THREE.PlaneGeometry(28.0, 8.0, 64, 32);
    this.waterMat = new THREE.ShaderMaterial({
      vertexShader: waterVert,
      fragmentShader: waterFrag,
      uniforms: {
        uSceneTexture: { value: this.renderTarget.texture },
        uWaterNormalMap: { value: this.waterNormalTexture },
        uTime: { value: 0.0 },
        uWaveHeight: { value: 0.035 },
        uWaterAbyssColor: { value: new THREE.Color('#050507') },
        uSpecularColor: { value: new THREE.Vector4(0.86, 0.94, 1.0, 0.65) },
        uWaterOpacity: { value: 0.0 },
        uHorizonY: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      },
      transparent: true,
      depthWrite: false
    });

    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMat);
    this.waterMesh.position.set(0, -1.8, 0.3);
    this.waterMesh.rotation.x = -Math.PI * 0.12;
    this.waterMesh.visible = false;
    this.mainScene.add(this.waterMesh);
  }

  private setupListeners() {
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerleave', this.onPointerLeave);

    // Mobile touch handling
    window.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: true });
    window.addEventListener('touchend', this.onTouchEnd, { passive: true });
  }

  private onMouseMove = (e: MouseEvent) => {
    this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  };

  private onPointerMove = (e: PointerEvent) => {
    const x = e.clientX / window.innerWidth;
    const y = 1.0 - (e.clientY / window.innerHeight);

    if (!this.pointer.inside && !this.ghost.ready) {
      this.ghost.x = this.ghost.px = x;
      this.ghost.y = this.ghost.py = y;
      this.ghost.vx = this.ghost.vy = 0;
      this.ghost.ready = true;
    } else if (!this.pointer.inside && this.presence < 0.05) {
      this.ghost.x = this.ghost.px = x;
      this.ghost.y = this.ghost.py = y;
      this.ghost.vx = this.ghost.vy = 0;
    }

    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.inside = true;
    this.pointer.moved = performance.now();
  };

  private onPointerLeave = () => {
    this.pointer.inside = false;
  };

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const x = touch.clientX / window.innerWidth;
      const y = 1.0 - (touch.clientY / window.innerHeight);

      this.ghost.x = this.ghost.px = x;
      this.ghost.y = this.ghost.py = y;
      this.ghost.vx = this.ghost.vy = 0;
      this.ghost.ready = true;

      this.pointer.x = x;
      this.pointer.y = y;
      this.pointer.inside = true;
      this.pointer.moved = performance.now();
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.pointer.x = touch.clientX / window.innerWidth;
      this.pointer.y = 1.0 - (touch.clientY / window.innerHeight);
      this.pointer.inside = true;
      this.pointer.moved = performance.now();
    }
  };

  private onTouchEnd = () => {
    this.pointer.inside = false;
  };

  private onWindowResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    this.upperCamera.aspect = aspect;
    this.upperCamera.updateProjectionMatrix();

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(dpr);

    const rtWidth = Math.floor(width * dpr * 0.75);
    const rtHeight = Math.floor((height * 0.55) * dpr * 0.75);
    this.renderTarget.setSize(rtWidth, rtHeight);

    if (this.waterMat?.uniforms?.uResolution) {
      this.waterMat.uniforms.uResolution.value.set(width, height);
    }

    // Adaptive radius, boundary, and trail limits
    const isMobile = width < 768;
    const cfg = isMobile ? this.revealConfig.mobile : this.revealConfig.desktop;
    this.currentRadius = cfg.radius;
    this.currentBoundaryWidth = cfg.boundaryWidth;
    this.currentTrailMax = cfg.radius * cfg.trailFactor;

    if (this.fogMaterial?.uniforms) {
      this.fogMaterial.uniforms.uResolution.value.set(width, height);
      this.fogMaterial.uniforms.uDpr.value = dpr;
      this.fogMaterial.uniforms.uRadius.value = this.currentRadius;
      this.fogMaterial.uniforms.uBoundaryWidth.value = this.currentBoundaryWidth;
      this.fogMaterial.uniforms.uTrailMax.value = this.currentTrailMax;
    }
  };

  // Public controls driven by ScrollTrigger / Lenis
  public setScrollProgress(progress: number, velocity: number) {
    this.scroll.progress = progress;
    this.scroll.targetVelocity = velocity;

    // Fade out water pool as user approaches download section to ensure continuous obsidian backdrop
    if (this.waterMat && this.waterMesh) {
      if (progress > 0.75) {
        const fadeOut = Math.max(0.0, 1.0 - (progress - 0.75) / 0.15);
        const effectiveOpacity = this.waterOpacity * fadeOut;
        this.waterMat.uniforms.uWaterOpacity.value = effectiveOpacity;
        this.waterMesh.visible = effectiveOpacity > 0.005;
      }
    }
  }

  public setThemeTransition(progress: number) {
    // 0.0 = Light plaster stone, 1.0 = Obsidian black
    this.darkProgress = progress;

    if (this.stoneBackdropMat) {
      this.stoneBackdropMat.uniforms.uDarkProgress.value = progress;
      const stoneCol = new THREE.Color('#F5F4F0').lerp(new THREE.Color('#050507'), progress);
      this.stoneBackdropMat.uniforms.uStoneColor.value = stoneCol;
      this.stoneBackdropMat.uniforms.uAmbientIntensity.value = THREE.MathUtils.lerp(0.55, 0.05, progress);
    }

    if (this.fogMaterial) {
      this.fogMaterial.uniforms.uDarkProgress.value = progress;
    }

    // Water Surface: visible only when dark chapters begin with smooth opacity blend
    if (this.waterMesh && this.waterMat) {
      this.waterOpacity = Math.min(1.0, Math.max(0.0, (progress - 0.15) / 0.25));
      if (this.scroll.progress > 0.75) {
        const fadeOut = Math.max(0.0, 1.0 - (this.scroll.progress - 0.75) / 0.15);
        this.waterOpacity *= fadeOut;
      }
      this.waterMat.uniforms.uWaterOpacity.value = this.waterOpacity;
      this.waterMesh.visible = this.waterOpacity > 0.005;
      this.waterMesh.position.y = THREE.MathUtils.lerp(-3.2, -1.8, progress);
    }

    if (this.brandCompositeMat) {
      this.brandCompositeMat.uniforms.uDarkProgress.value = progress;
    }
  }

  public getDarkProgress(): number {
    return this.darkProgress;
  }

  public setChapter(index: number) {
    this.currentChapter = Math.max(0, Math.min(3, index));
  }

  public getCurrentChapter(): number {
    return this.currentChapter;
  }

  public update(time: number) {
    if (this.isDisposed) return;
    const dt = Math.min(0.05, this.clock.getDelta());

    // Smooth cursor interpolation for parallax
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // React Bits GhostCursor Spring-Damper Simulation & Inertia
    const isMobile = window.innerWidth < 768;
    const cfg = isMobile ? this.revealConfig.mobile : this.revealConfig.desktop;

    const now = performance.now();
    const idle = now - this.pointer.moved;
    const fadeDelay = cfg.fadeDelay;
    const fadeDuration = cfg.fadeDuration;
    const target = !this.ghost.ready ? 0 : idle < fadeDelay ? 1 : Math.max(0, 1 - (idle - fadeDelay) / fadeDuration);
    this.presence += (target - this.presence) * (1 - Math.exp(-dt / (target > this.presence ? 0.12 : 0.08)));
    if (Math.abs(target - this.presence) < 0.001) this.presence = target;

    this.ghost.px = this.ghost.x;
    this.ghost.py = this.ghost.y;
    if (this.ghost.ready) {
      if (this.pointer.inside) {
        const inertia = cfg.inertia;
        const stiffness = 520 * Math.pow(1 - inertia, 2) + 26;
        const damping = 2 * Math.sqrt(stiffness) * 0.92;
        const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
        const h = dt / steps;
        for (let i = 0; i < steps; i++) {
          this.ghost.vx += (stiffness * (this.pointer.x - this.ghost.x) - damping * this.ghost.vx) * h;
          this.ghost.vy += (stiffness * (this.pointer.y - this.ghost.y) - damping * this.ghost.vy) * h;
          this.ghost.x += this.ghost.vx * h;
          this.ghost.y += this.ghost.vy * h;
        }
      } else {
        const glide = Math.pow(0.52, dt * 60);
        this.ghost.vx *= glide;
        this.ghost.vy *= glide;
        this.ghost.x += this.ghost.vx * dt;
        this.ghost.y += this.ghost.vy * dt;
      }
    }

    // Smooth scroll velocity damping
    this.scroll.velocity += (this.scroll.targetVelocity - this.scroll.velocity) * 0.1;

    // Update 3D Food Models (Environmental Objects in Background)
    const scrollParallax = this.scroll.progress * 2.2;
    this.foodItems.forEach((item) => {
      const t = time * item.floatSpeed;
      item.group.position.y = item.initialPos.y + Math.sin(t) * item.floatAmplitude + this.mouse.y * 0.12 - scrollParallax * 0.35;
      item.group.position.x = item.initialPos.x + Math.cos(t * 0.7) * (item.floatAmplitude * 0.5) + this.mouse.x * 0.12;
      
      // Sink deeper and dissolve during dark theme transition
      item.group.position.z = item.initialPos.z - this.darkProgress * 3.5;
      item.group.visible = this.darkProgress < 0.95;

      item.group.rotation.x = item.initialRot.x + Math.sin(t * 0.5) * 0.06 + this.scroll.velocity * 0.001;
      item.group.rotation.y = item.initialRot.y + t * item.rotSpeed.y;
      item.group.rotation.z = item.initialRot.z + Math.cos(t * 0.4) * 0.04;
    });

    // Update subtle smoke trailing wake along cursor path (React Bits GhostCursor reference)
    if (this.ghost.ready && this.pointer.inside) {
      this.trailNodes[0].x = this.ghost.x;
      this.trailNodes[0].y = this.ghost.y;
      this.trailNodes[0].weight = this.presence > 0.05 ? 1.0 : 0.0;

      const cursorSpeed = Math.hypot(this.ghost.vx, this.ghost.vy);
      // Wake strength scales smoothly with velocity (0 when resting, gentle wake when moving)
      const targetWake = Math.min(1.0, cursorSpeed * 1.6) * this.presence;
      this.wakeStrength += (targetWake - this.wakeStrength) * (1 - Math.exp(-dt * 10.0));

      for (let i = 1; i < 8; i++) {
        const prev = this.trailNodes[i - 1];
        const curr = this.trailNodes[i];
        
        // Progressive natural delay: each subsequent node lags slightly behind
        const followSpeed = Math.max(9.0, 28.0 - i * 2.4);
        const k = 1.0 - Math.exp(-dt * followSpeed);
        curr.x += (prev.x - curr.x) * k;
        curr.y += (prev.y - curr.y) * k;
        
        // Node activity based on displacement
        const d = Math.hypot(curr.x - prev.x, curr.y - prev.y);
        const targetW = Math.min(1.0, d * 35.0) * this.presence;
        curr.weight += (targetW - curr.weight) * (1 - Math.exp(-dt * 12.0));
      }
    } else {
      this.wakeStrength *= Math.max(0.0, 1.0 - dt * 8.0);
      for (let i = 0; i < 8; i++) {
        this.trailNodes[i].weight *= Math.max(0.0, 1.0 - dt * 10.0);
        if (this.ghost.ready) {
          this.trailNodes[i].x += (this.ghost.x - this.trailNodes[i].x) * (1 - Math.exp(-dt * 12.0));
          this.trailNodes[i].y += (this.ghost.y - this.trailNodes[i].y) * (1 - Math.exp(-dt * 12.0));
        }
      }
    }

    // Update GhostCursor Fluid Reveal Shader Uniforms in Pixel Space
    if (this.fogMaterial) {
      const W = window.innerWidth;
      const H = window.innerHeight;
      this.fogMaterial.uniforms.uFrom.value.set(this.ghost.px * W, this.ghost.py * H);
      this.fogMaterial.uniforms.uTo.value.set(this.ghost.x * W, this.ghost.y * H);
      this.fogMaterial.uniforms.uVelocity.value.set(this.ghost.vx * W, this.ghost.vy * H);
      this.fogMaterial.uniforms.uPresence.value = this.presence;
      this.fogMaterial.uniforms.uRadius.value = this.currentRadius;
      this.fogMaterial.uniforms.uBoundaryWidth.value = this.currentBoundaryWidth;
      this.fogMaterial.uniforms.uTrailMax.value = this.currentTrailMax;
      this.fogMaterial.uniforms.uTime.value = time;
      this.fogMaterial.uniforms.uDarkProgress.value = this.darkProgress;
      this.fogMaterial.uniforms.uWakeStrength.value = this.wakeStrength;

      for (let i = 0; i < 8; i++) {
        this.trailPositionsArray[i].set(this.trailNodes[i].x * W, this.trailNodes[i].y * H);
        this.trailWeightsArray[i] = this.trailNodes[i].weight;
      }
      this.fogMaterial.uniforms.uTrailNodes.value = this.trailPositionsArray;
      this.fogMaterial.uniforms.uTrailWeights.value = this.trailWeightsArray;
    }

    // Update Water shader uniforms
    if (this.waterMat) {
      this.waterMat.uniforms.uTime.value = time;
    }

    // Update Brand Composite shader uniforms
    if (this.brandCompositeMat) {
      this.brandCompositeMat.uniforms.uTime.value = time;
    }

    // Update Brand Composite shader uniforms
    if (this.brandCompositeMat) {
      this.brandCompositeMat.uniforms.uTime.value = time;
    }

    // Pass 1: Render Upper Scene (Botanical + Numeral) to Offscreen RenderTarget (reflection only)
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.clear();
    this.renderer.render(this.upperScene, this.upperCamera);

    // Pass 2: Render Main Scene (Seamless Continuous Backdrop, 3D Food Objects, Fog Veil, Water Reflection)
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.mainScene, this.camera);
  }

  public dispose() {
    this.isDisposed = true;
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerleave', this.onPointerLeave);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);

    this.renderTarget.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
