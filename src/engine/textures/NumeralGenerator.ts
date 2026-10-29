import * as THREE from 'three';

export class NumeralGenerator {
  private static canvasCache: Map<string, THREE.CanvasTexture> = new Map();

  public static getNumeralTexture(numeral: string, size = 1024): THREE.CanvasTexture {
    if (this.canvasCache.has(numeral)) {
      return this.canvasCache.get(numeral)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Clear transparent
      ctx.clearRect(0, 0, size, size);

      // Render high-contrast oversized Roman numeral with elegant serif brackets
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Cormorant Garamond / serif styling
      const fontSize = size * 0.65;
      ctx.font = `300 ${fontSize}px "Cormorant Garamond", "Times New Roman", Georgia, serif`;
      
      // Draw centered
      ctx.fillText(numeral, size / 2, size / 2 + size * 0.02);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    this.canvasCache.set(numeral, texture);
    return texture;
  }

  public static dispose() {
    this.canvasCache.forEach(tex => tex.dispose());
    this.canvasCache.clear();
  }
}
