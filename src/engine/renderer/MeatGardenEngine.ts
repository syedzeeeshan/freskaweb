import * as THREE from 'three';
import fogVert from '../shaders/meatFogReveal.vert';
import fogFrag from '../shaders/meatFogReveal.frag';
import { MeatGardenBuilder, FoodModelItem } from '../scenes/MeatGardenBuilder';

export type FoodCategory = 'all' | 'poultry' | 'meat' | 'seafood';

export class MeatGardenEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private fogQuad!: THREE.Mesh;
  private fogMaterial!: THREE.ShaderMaterial;
  private foodItems: FoodModelItem[] = [];

  // Interaction & Animation State
  private clock: THREE.Clock;
  private pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
  private revealIntensity = { current: 0.0, target: 0.0 };
  private categorySpot = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
  private categoryIntensity = { current: 0.0, target: 0.0 };
  private activeCategory: FoodCategory = 'all';

  private isHovered = false;
  private isDisposed = false;
  private rafId: number | null = null;
  private touchTimeout: NodeJS.Timeout | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // 1. Initialize WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    // 2. Initialize Camera & Scene
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 50);
    this.camera.position.set(0, 0, 6.2);

    this.scene = new THREE.Scene();

    this.setupLighting();
    this.populateGarden();
    this.setupFogRevealQuad();
    this.setupEventListeners();

    this.startRenderLoop();
  }

  private setupLighting() {
    // Soft Ambient Studio Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    // Warm Key Light (top-left studio light)
    const keyLight = new THREE.DirectionalLight(0xfff5eb, 1.4);
    keyLight.position.set(3.5, 4.0, 5.0);
    this.scene.add(keyLight);

    // Cool Rim Light (back-right edge lighting)
    const rimLight = new THREE.DirectionalLight(0xe0f2fe, 1.1);
    rimLight.position.set(-4.0, -2.5, -2.0);
    this.scene.add(rimLight);

    // Subtle Fill Light
    const fillLight = new THREE.PointLight(0xffe4d6, 0.8, 12);
    fillLight.position.set(0, -2.5, 3.0);
    this.scene.add(fillLight);
  }

  private populateGarden() {
    this.foodItems = MeatGardenBuilder.buildGardenCollection();
    this.foodItems.forEach((item) => {
      this.scene.add(item.group);
    });
  }

  private setupFogRevealQuad() {
    // Large quad placed in front of food items to act as the frosted translucent mist veil
    const geo = new THREE.PlaneGeometry(16, 12);
    this.fogMaterial = new THREE.ShaderMaterial({
      vertexShader: fogVert,
      fragmentShader: fogFrag,
      uniforms: {
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uPointerRadius: { value: 0.28 },
        uRevealIntensity: { value: 0.0 },
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(this.container.clientWidth, this.container.clientHeight) },
        uMistColor: { value: new THREE.Color('#F7F6F2') },
        uCategorySpot: { value: new THREE.Vector2(0.5, 0.5) },
        uCategoryIntensity: { value: 0.0 }
      },
      transparent: true,
      depthWrite: false
    });

    this.fogQuad = new THREE.Mesh(geo, this.fogMaterial);
    // Positioned right in front of the food cuts (cuts are around z = -0.5 to +0.5)
    this.fogQuad.position.set(0, 0, 1.3);
    this.scene.add(this.fogQuad);
  }

  private setupEventListeners() {
    window.addEventListener('resize', this.onResize);
    this.container.addEventListener('pointerenter', this.onPointerEnter);
    this.container.addEventListener('pointermove', this.onPointerMove);
    this.container.addEventListener('pointerleave', this.onPointerLeave);

    // Mobile touch handling
    this.container.addEventListener('touchstart', this.onTouchStart, { passive: true });
    this.container.addEventListener('touchmove', this.onTouchMove, { passive: true });
    this.container.addEventListener('touchend', this.onTouchEnd, { passive: true });
  }

  private onResize = () => {
    if (!this.container || this.isDisposed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(dpr);

    if (this.fogMaterial?.uniforms?.uResolution) {
      this.fogMaterial.uniforms.uResolution.value.set(width, height);
    }
  };

  private updatePointerCoords(clientX: number, clientY: number) {
    const rect = this.container.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, 1.0 - (clientY - rect.top) / rect.height));

    this.pointer.targetX = x;
    this.pointer.targetY = y;
  }

  private onPointerEnter = (e: PointerEvent) => {
    this.isHovered = true;
    this.revealIntensity.target = 1.0;
    this.updatePointerCoords(e.clientX, e.clientY);
  };

  private onPointerMove = (e: PointerEvent) => {
    this.isHovered = true;
    this.revealIntensity.target = 1.0;
    this.updatePointerCoords(e.clientX, e.clientY);
  };

  private onPointerLeave = () => {
    this.isHovered = false;
    // Naturally and gently restore the smoky veil
    this.revealIntensity.target = 0.0;
  };

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.isHovered = true;
      this.revealIntensity.target = 1.0;
      this.updatePointerCoords(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.isHovered = true;
      this.revealIntensity.target = 1.0;
      this.updatePointerCoords(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  private onTouchEnd = () => {
    // Keep revealed for 2 seconds on mobile tap/drag before gently fading
    if (this.touchTimeout) clearTimeout(this.touchTimeout);
    this.touchTimeout = setTimeout(() => {
      this.revealIntensity.target = 0.0;
    }, 2200);
  };

  public setCategory(category: FoodCategory) {
    this.activeCategory = category;

    if (category === 'all') {
      this.categoryIntensity.target = 0.0;
      // Reset all models scale and visibility
      this.foodItems.forEach((item) => {
        item.group.visible = true;
        item.group.scale.setScalar(0.65);
      });
    } else {
      this.categoryIntensity.target = 1.0;

      // Set category center coordinates for spotlight reveal
      if (category === 'poultry') {
        this.categorySpot.targetX = 0.28;
        this.categorySpot.targetY = 0.55;
      } else if (category === 'meat') {
        this.categorySpot.targetX = 0.52;
        this.categorySpot.targetY = 0.52;
      } else if (category === 'seafood') {
        this.categorySpot.targetX = 0.78;
        this.categorySpot.targetY = 0.48;
      }

      // Highlight matched models, gently soften others
      this.foodItems.forEach((item) => {
        const isMatch = item.category === category;
        const targetScale = isMatch ? 0.75 : 0.48;
        item.group.scale.setScalar(targetScale);
      });
    }
  }

  public getActiveCategory(): FoodCategory {
    return this.activeCategory;
  }

  public getIsHovered(): boolean {
    return this.isHovered;
  }

  private startRenderLoop = () => {
    const loop = () => {
      if (this.isDisposed) return;
      this.update();
      this.renderer.render(this.scene, this.camera);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  };

  private update() {
    const elapsed = this.clock.getElapsedTime();

    // Smooth pointer coordinate interpolation (lerp damping)
    this.pointer.x += (this.pointer.targetX - this.pointer.x) * 0.08;
    this.pointer.y += (this.pointer.targetY - this.pointer.y) * 0.08;

    // Smooth reveal intensity
    this.revealIntensity.current += (this.revealIntensity.target - this.revealIntensity.current) * 0.06;

    // Smooth category spotlight
    this.categorySpot.x += (this.categorySpot.targetX - this.categorySpot.x) * 0.08;
    this.categorySpot.y += (this.categorySpot.targetY - this.categorySpot.y) * 0.08;
    this.categoryIntensity.current += (this.categoryIntensity.target - this.categoryIntensity.current) * 0.06;

    // Camera gentle parallax response to cursor
    const targetCamX = (this.pointer.x - 0.5) * 0.8;
    const targetCamY = (this.pointer.y - 0.5) * 0.5;
    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.04;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.04;
    this.camera.lookAt(0, 0, 0);

    // Animate subtle floating and breathing for each food sculpture
    this.foodItems.forEach((item) => {
      const t = elapsed * item.floatSpeed;
      // Gentle vertical floating
      item.group.position.y = item.initialPos.y + Math.sin(t) * item.floatAmplitude;
      item.group.position.x = item.initialPos.x + Math.cos(t * 0.7) * (item.floatAmplitude * 0.5);

      // Subtle slow rotation
      item.group.rotation.x = item.initialRot.x + Math.sin(t * 0.5) * 0.08;
      item.group.rotation.y += item.rotSpeed.y;
      item.group.rotation.z = item.initialRot.z + Math.cos(t * 0.6) * 0.06;
    });

    // Update shader uniforms
    if (this.fogMaterial) {
      this.fogMaterial.uniforms.uPointer.value.set(this.pointer.x, this.pointer.y);
      this.fogMaterial.uniforms.uRevealIntensity.value = this.revealIntensity.current;
      this.fogMaterial.uniforms.uCategorySpot.value.set(this.categorySpot.x, this.categorySpot.y);
      this.fogMaterial.uniforms.uCategoryIntensity.value = this.categoryIntensity.current;
      this.fogMaterial.uniforms.uTime.value = elapsed;
    }
  }

  public dispose() {
    this.isDisposed = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.touchTimeout) clearTimeout(this.touchTimeout);

    window.removeEventListener('resize', this.onResize);
    this.container.removeEventListener('pointerenter', this.onPointerEnter);
    this.container.removeEventListener('pointermove', this.onPointerMove);
    this.container.removeEventListener('pointerleave', this.onPointerLeave);
    this.container.removeEventListener('touchstart', this.onTouchStart);
    this.container.removeEventListener('touchmove', this.onTouchMove);
    this.container.removeEventListener('touchend', this.onTouchEnd);

    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
