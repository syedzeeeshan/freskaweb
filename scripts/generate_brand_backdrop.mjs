import fs from 'fs';
import zlib from 'zlib';

// Function to generate a dark atmospheric background texture with the official Freska emblem embossed
function createRgbaPng(width, height, rgbaBuffer) {
  const scanlineLen = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLen);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLen;
    rawData[rowOffset] = 0;
    rgbaBuffer.copy(rawData, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const deflated = zlib.deflateSync(rawData);

  function createChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcBuf = Buffer.alloc(4 + len);
    buf.copy(crcBuf, 0, 4, 8 + len);
    const crc = crc32(crcBuf);
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  return Buffer.concat([
    sig,
    createChunk('IHDR', ihdrData),
    createChunk('IDAT', deflated),
    createChunk('IEND', Buffer.alloc(0))
  ]);
}

// Load official emblem mask
const x6Smask = fs.readFileSync('public/assets/images/freska_emblem_white.png'); // PNG file
// Let's read the raw smask from memory or decode from our previous generation
const rawSmask = fs.existsSync('public/assets/images/freska_emblem_black.png');

// We have the emblem dimensions: w6 = 671, h6 = 799
// Let's create a 1024x1024 dark atmospheric background
const W = 1024, H = 1024;
const bgBuffer = Buffer.alloc(W * H * 4);

// Load the emblem alpha channel directly from the PNG IDAT
const smask = fs.readFileSync('public/assets/images/_temp_smask.bin');
fs.unlinkSync('public/assets/images/_temp_smask.bin');

const embW = 671, embH = 799;

// Calculate distance transform / bevel for embossed sculptural effect
// Target size: scale emblem to 600 width in 1024x1024, centered slightly to the right
const destW = 620;
const destH = Math.round(destW * (embH / embW));
const offsetX = Math.round(W * 0.45);
const offsetY = Math.round((H - destH) / 2);

// Create heightmap for the emblem
const heightMap = new Float32Array(W * H);

for (let y = 0; y < destH; y++) {
  const sy = Math.floor(y * embH / destH);
  const ty = offsetY + y;
  if (ty < 0 || ty >= H) continue;

  for (let x = 0; x < destW; x++) {
    const sx = Math.floor(x * embW / destW);
    const tx = offsetX + x;
    if (tx < 0 || tx >= W) continue;

    const alpha = smask[sy * embW + sx] / 255.0;
    heightMap[ty * W + tx] = alpha;
  }
}

// Render atmospheric dark environment with embossed logo:
// Base color: #050507 with subtle radial gradient from top-center
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const idx = y * W + x;
    const px = (x - W * 0.5) / W;
    const py = (y - H * 0.4) / H;
    const dist = Math.sqrt(px * px + py * py);

    // Deep obsidian vignette
    const ambient = Math.max(0.02, 0.08 * (1.0 - dist * 0.9));
    let r = ambient * 20.0;
    let g = ambient * 22.0;
    let b = ambient * 30.0;

    // Calculate normal / bevel of embossed logo
    const hCenter = heightMap[idx];
    const hRight = x < W - 1 ? heightMap[idx + 1] : hCenter;
    const hLeft = x > 0 ? heightMap[idx - 1] : hCenter;
    const hDown = y < H - 1 ? heightMap[idx + W] : hCenter;
    const hUp = y > 0 ? heightMap[idx - W] : hCenter;

    const dx = (hRight - hLeft) * 1.5;
    const dy = (hDown - hUp) * 1.5;

    // Directional light from top-left (raking studio light)
    const lightDirX = -0.6;
    const lightDirY = -0.7;
    const lightDirZ = 0.4;
    const len = Math.sqrt(lightDirX*lightDirX + lightDirY*lightDirY + lightDirZ*lightDirZ);
    const lx = lightDirX / len, ly = lightDirY / len, lz = lightDirZ / len;

    // Normal vector
    const nx = -dx;
    const ny = -dy;
    const nz = 0.5;
    const nlen = Math.sqrt(nx*nx + ny*ny + nz*nz);
    const nnx = nx / nlen, nny = ny / nlen, nnz = nz / nlen;

    // Diffuse & Specular lighting on embossed logo
    if (hCenter > 0.05 || Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
      const dot = Math.max(0, nnx * lx + nny * ly + nnz * lz);
      const spec = Math.pow(Math.max(0, nnx * lx + nny * ly + nnz * lz), 16.0);

      // Subtle sculptural dark grey slate logo with emerald rim light
      const logoTone = 0.04 + dot * 0.08 + spec * 0.12;
      r += logoTone * 140.0;
      g += logoTone * 155.0;
      b += logoTone * 170.0;

      // Soft brand emerald edge tint
      if (Math.abs(dx) > 0.02 || Math.abs(dy) > 0.02) {
        g += spec * 35.0;
      }
    }

    // Add subtle fine film grain
    const grain = (Math.random() - 0.5) * 3.0;
    r = Math.min(255, Math.max(0, Math.round(r + grain)));
    g = Math.min(255, Math.max(0, Math.round(g + grain)));
    b = Math.min(255, Math.max(0, Math.round(b + grain)));

    const pIdx = idx * 4;
    bgBuffer[pIdx] = r;
    bgBuffer[pIdx + 1] = g;
    bgBuffer[pIdx + 2] = b;
    bgBuffer[pIdx + 3] = 255;
  }
}

fs.writeFileSync('public/assets/textures/freska_dark_brand_backdrop.png', createRgbaPng(W, H, bgBuffer));
console.log('Generated public/assets/textures/freska_dark_brand_backdrop.png');
