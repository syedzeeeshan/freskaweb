import * as THREE from 'three';
import stoneVert from '../shaders/stoneRelief.vert';
import stoneFrag from '../shaders/stoneRelief.frag';
import botanicalVert from '../shaders/botanicalComposite.vert';
import botanicalFrag from '../shaders/botanicalComposite.frag';
import waterVert from '../shaders/waterReflection.vert';
import waterFrag from '../shaders/waterReflection.frag';
import { NumeralGenerator } from '../textures/NumeralGenerator';

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
  private sculpturalMat!: THREE.ShaderMaterial;
  private botanicalCompositeMat!: THREE.ShaderMaterial;
  private waterMat!: THREE.ShaderMaterial;

  // Meshes
  private stoneBackdropMesh!: THREE.Mesh;
  private sculpturalMesh!: THREE.Mesh;
  private botanicalUpperMesh!: THREE.Mesh;
  private waterMesh!: THREE.Mesh;

  // Textures
  private stoneNormalTexture!: THREE.Texture;
  private botanicalSunlitTexture!: THREE.Texture;
  private botanicalDarkTexture!: THREE.Texture;
  private waterNormalTexture!: THREE.Texture;

  // Animation state
  private clock: THREE.Clock;
  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private scroll = { progress: 0, velocity: 0, targetVelocity: 0 };
  private darkProgress = 0;
  private currentChapter = 0;
  private numerals = ['I', 'II', 'III', 'IV'];
  private isDisposed = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // 1. Initialize WebGL Renderer with performance parameters
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
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);

    // 2. Initialize Camera & Scenes
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 5);

    this.upperCamera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.upperCamera.position.set(0, 0, 5);

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
    this.initLightEnvironment();
    this.initDarkRomanEnvironment();
    this.setupListeners();
  }

  private loadTextures() {
    const loader = new THREE.TextureLoader();
    
    // Normal map for plaster
    this.stoneNormalTexture = loader.load('/assets/textures/stone_plaster_normal.png');
    this.stoneNormalTexture.wrapS = THREE.RepeatWrapping;
    this.stoneNormalTexture.wrapT = THREE.RepeatWrapping;

    // Normal map for water ripples
    this.waterNormalTexture = loader.load('/assets/textures/water_normal_loop.png');
    this.waterNormalTexture.wrapS = THREE.RepeatWrapping;
    this.waterNormalTexture.wrapT = THREE.RepeatWrapping;

    // Botanical Diffuse Textures
    this.botanicalSunlitTexture = loader.load('/assets/textures/botanical_sunlit_diffuse.jpg');
    this.botanicalDarkTexture = loader.load('/assets/textures/botanical_dark_diffuse.jpg');
  }

  private initLightEnvironment() {
    // 1. Plaster Stone Background Quad
    const planeGeo = new THREE.PlaneGeometry(16, 12);
    this.stoneBackdropMat = new THREE.ShaderMaterial({
      vertexShader: stoneVert,
      fragmentShader: stoneFrag,
      uniforms: {
        uNormalMap: { value: this.stoneNormalTexture },
        uStoneColor: { value: new THREE.Color('#F5F4F0') },
        uLightPosition: { value: new THREE.Vector3(2.0, 3.5, 4.0) },
        uNormalScale: { value: 0.15 },
        uAmbientIntensity: { value: 0.88 }
      },
      depthWrite: false
    });
    this.stoneBackdropMesh = new THREE.Mesh(planeGeo, this.stoneBackdropMat);
    this.stoneBackdropMesh.position.z = -2;
    this.mainScene.add(this.stoneBackdropMesh);

    // 2. 3D Floating Sculptural Relief Object (Neoclassical organic petals/folds)
    // Parametric Torus Knot geometry evoking sculpted botanical stone folds
    const sculpturalGeo = new THREE.TorusKnotGeometry(0.85, 0.28, 128, 32, 2, 3);
    this.sculpturalMat = new THREE.ShaderMaterial({
      vertexShader: stoneVert,
      fragmentShader: stoneFrag,
      uniforms: {
        uNormalMap: { value: this.stoneNormalTexture },
        uStoneColor: { value: new THREE.Color('#EDECE7') },
        uLightPosition: { value: new THREE.Vector3(2.5, 4.0, 4.5) },
        uNormalScale: { value: 0.25 },
        uAmbientIntensity: { value: 0.78 }
      }
    });
    this.sculpturalMesh = new THREE.Mesh(sculpturalGeo, this.sculpturalMat);
    this.sculpturalMesh.position.set(1.4, 0.2, 0);
    this.sculpturalMesh.scale.set(0.9, 0.9, 0.9);
    this.mainScene.add(this.sculpturalMesh);
  }

  private initDarkRomanEnvironment() {
    // 1. Upper Scene: Botanical & Roman Numeral Depth Composite Quad
    const upperGeo = new THREE.PlaneGeometry(4.2, 3.2);
    const initialNumeralTexture = NumeralGenerator.getNumeralTexture('I');

    this.botanicalCompositeMat = new THREE.ShaderMaterial({
      vertexShader: botanicalVert,
      fragmentShader: botanicalFrag,
      uniforms: {
        uBotanicalBg: { value: this.botanicalDarkTexture },
        uBotanicalFg: { value: this.botanicalSunlitTexture },
        uNumeralMask: { value: initialNumeralTexture },
        uSurfaceNormal: { value: this.stoneNormalTexture },
        uBackgroundColor: { value: new THREE.Color('#050507') },
        uNumeralColor: { value: new THREE.Color('#FFFFFF') },
        uDarkProgress: { value: 0.0 },
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      },
      transparent: true
    });

    this.botanicalUpperMesh = new THREE.Mesh(upperGeo, this.botanicalCompositeMat);
    this.botanicalUpperMesh.position.set(0, 0.4, 0);
    this.upperScene.add(this.botanicalUpperMesh);

    // Also add to mainScene so it can be seen directly when in dark mode
    const upperMainMesh = this.botanicalUpperMesh.clone();
    upperMainMesh.name = 'botanicalUpperMain';
    upperMainMesh.visible = false;
    this.mainScene.add(upperMainMesh);

    // 2. Lower Scene: Animated Water Reflection Plane
    const waterGeo = new THREE.PlaneGeometry(6.5, 3.5, 64, 32);
    this.waterMat = new THREE.ShaderMaterial({
      vertexShader: waterVert,
      fragmentShader: waterFrag,
      uniforms: {
        uSceneTexture: { value: this.renderTarget.texture },
        uWaterNormalMap: { value: this.waterNormalTexture },
        uTime: { value: 0.0 },
        uWaveHeight: { value: 0.04 },
        uWaterAbyssColor: { value: new THREE.Color('#050507') },
        uSpecularColor: { value: new THREE.Vector4(0.86, 0.94, 1.0, 0.65) },
        uHorizonY: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      },
      transparent: true
    });

    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMat);
    // Positioned below the horizon line with slight horizontal tilt
    this.waterMesh.position.set(0, -1.5, 0.3);
    this.waterMesh.rotation.x = -Math.PI * 0.12;
    this.waterMesh.visible = false;
    this.mainScene.add(this.waterMesh);
  }

  private setupListeners() {
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('mousemove', this.onMouseMove);
  }

  private onMouseMove = (e: MouseEvent) => {
    // Normalized device coordinates (-1 to 1)
    this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
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

    if (this.waterMat.uniforms.uResolution) {
      this.waterMat.uniforms.uResolution.value.set(width, height);
    }
  };

  // Public controls driven by ScrollTrigger / Lenis
  public setScrollProgress(progress: number, velocity: number) {
    this.scroll.progress = progress;
    this.scroll.targetVelocity = velocity;
  }

  public setThemeTransition(progress: number) {
    // 0.0 = Light plaster stone, 1.0 = Obsidian black
    this.darkProgress = progress;

    if (this.stoneBackdropMat) {
      const stoneCol = new THREE.Color('#F5F4F0').lerp(new THREE.Color('#050507'), progress);
      this.stoneBackdropMat.uniforms.uStoneColor.value = stoneCol;
      this.stoneBackdropMat.uniforms.uAmbientIntensity.value = THREE.MathUtils.lerp(0.55, 0.05, progress);
    }

    if (this.sculpturalMesh) {
      // Float sculptural relief away as dark roman chapters enter
      this.sculpturalMesh.position.x = THREE.MathUtils.lerp(1.8, 4.5, progress);
      this.sculpturalMesh.visible = progress < 0.95;
    }

    // Botanical Numeral Quad: visible only when dark chapters begin
    const upperMainMesh = this.mainScene.getObjectByName('botanicalUpperMain');
    if (upperMainMesh) {
      upperMainMesh.visible = progress > 0.15;
      (upperMainMesh as THREE.Mesh).position.y = THREE.MathUtils.lerp(2.5, 0.5, progress);
    }

    // Water Surface: visible only when dark chapters begin
    if (this.waterMesh) {
      this.waterMesh.visible = progress > 0.15;
      this.waterMesh.position.y = THREE.MathUtils.lerp(-3.5, -1.5, progress);
    }

    if (this.botanicalCompositeMat) {
      this.botanicalCompositeMat.uniforms.uDarkProgress.value = progress;
    }
  }

  public getDarkProgress(): number {
    return this.darkProgress;
  }

  public setChapter(index: number) {
    if (index === this.currentChapter) return;
    this.currentChapter = Math.max(0, Math.min(3, index));
    const numeralStr = this.numerals[this.currentChapter];
    const newTex = NumeralGenerator.getNumeralTexture(numeralStr);
    
    if (this.botanicalCompositeMat) {
      this.botanicalCompositeMat.uniforms.uNumeralMask.value = newTex;
    }
  }

  public update(time: number) {
    if (this.isDisposed) return;
    this.clock.getDelta();

    // Smooth cursor interpolation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Smooth scroll velocity damping
    this.scroll.velocity += (this.scroll.targetVelocity - this.scroll.velocity) * 0.1;

    // Procedural Perlin-like low frequency drift for sculptural relief
    if (this.sculpturalMesh) {
      const t = time * 0.4;
      this.sculpturalMesh.rotation.x = Math.sin(t * 0.7) * 0.15 + this.mouse.y * 0.2 + this.scroll.velocity * 0.002;
      this.sculpturalMesh.rotation.y = Math.cos(t * 0.5) * 0.2 + this.mouse.x * 0.25;
      this.sculpturalMesh.rotation.z = Math.sin(t * 0.3) * 0.1;
      this.sculpturalMesh.position.y = 0.2 + Math.sin(t * 0.8) * 0.08;
    }

    // Update Water shader uniforms
    if (this.waterMat) {
      this.waterMat.uniforms.uTime.value = time;
    }

    // Update Botanical Composite shader uniforms
    if (this.botanicalCompositeMat) {
      this.botanicalCompositeMat.uniforms.uTime.value = time;
    }

    // Pass 1: Render Upper Scene (Botanical + Numeral) to Offscreen RenderTarget
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.clear();
    this.renderer.render(this.upperScene, this.upperCamera);

    // Pass 2: Render Main Scene (Backdrop, Water Reflection, 3D Sculptures) to Screen
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.mainScene, this.camera);
  }

  public dispose() {
    this.isDisposed = true;
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('mousemove', this.onMouseMove);

    NumeralGenerator.dispose();
    this.renderTarget.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
