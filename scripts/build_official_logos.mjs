import fs from 'fs';
import zlib from 'zlib';

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

// 1. Process X6 (Emblem: 671 x 799)
const x6Rgb = fs.readFileSync('public/assets/images/x6_rgb.bin');
const x6Smask = fs.readFileSync('public/assets/images/x6_smask.bin');
const w6 = 671, h6 = 799;

const x6RgbaBlack = Buffer.alloc(w6 * h6 * 4);
const x6RgbaWhite = Buffer.alloc(w6 * h6 * 4);

for (let i = 0; i < w6 * h6; i++) {
  const r = x6Rgb[i * 3];
  const g = x6Rgb[i * 3 + 1];
  const b = x6Rgb[i * 3 + 2];
  const a = x6Smask[i];

  x6RgbaBlack[i * 4] = r;
  x6RgbaBlack[i * 4 + 1] = g;
  x6RgbaBlack[i * 4 + 2] = b;
  x6RgbaBlack[i * 4 + 3] = a;

  x6RgbaWhite[i * 4] = 255;
  x6RgbaWhite[i * 4 + 1] = 255;
  x6RgbaWhite[i * 4 + 2] = 255;
  x6RgbaWhite[i * 4 + 3] = a;
}

fs.writeFileSync('public/assets/images/freska_emblem_black.png', createRgbaPng(w6, h6, x6RgbaBlack));
fs.writeFileSync('public/assets/images/freska_emblem_white.png', createRgbaPng(w6, h6, x6RgbaWhite));

// 2. Process X10 (Wordmark: 1590 x 297)
const x10Rgb = fs.readFileSync('public/assets/images/x10_rgb.bin');
const x10Smask = fs.readFileSync('public/assets/images/x10_smask.bin');
const w10 = 1590, h10 = 297;

// Find max value in x10Smask for normalization
let maxSmask = 0;
for (let i = 0; i < x10Smask.length; i++) {
  if (x10Smask[i] > maxSmask) maxSmask = x10Smask[i];
}
console.log('Max smask in x10:', maxSmask);

const x10RgbaBlack = Buffer.alloc(w10 * h10 * 4);
const x10RgbaWhite = Buffer.alloc(w10 * h10 * 4);

for (let i = 0; i < w10 * h10; i++) {
  const normAlpha = maxSmask > 0 ? Math.min(255, Math.round((x10Smask[i] / maxSmask) * 255)) : 0;

  x10RgbaBlack[i * 4] = 0;
  x10RgbaBlack[i * 4 + 1] = 0;
  x10RgbaBlack[i * 4 + 2] = 0;
  x10RgbaBlack[i * 4 + 3] = normAlpha;

  x10RgbaWhite[i * 4] = 255;
  x10RgbaWhite[i * 4 + 1] = 255;
  x10RgbaWhite[i * 4 + 2] = 255;
  x10RgbaWhite[i * 4 + 3] = normAlpha;
}

fs.writeFileSync('public/assets/images/freska_wordmark_black.png', createRgbaPng(w10, h10, x10RgbaBlack));
fs.writeFileSync('public/assets/images/freska_wordmark_white.png', createRgbaPng(w10, h10, x10RgbaWhite));

// 3. Composite full logo (emblem + wordmark) on 1024x1024 canvas
function compositeFullLogo(isWhite) {
  const W = 1024, H = 1024;
  const canvas = Buffer.alloc(W * H * 4);

  // PDF coordinate layout:
  // PDF size: 3200 x 3200
  // Emblem: x=731.3, y=397.6, w=1737.5, h=2068.75
  // Wordmark: x=872, y=2437, w=1590, h=297
  const embX = Math.round(731.3 * W / 3200);
  const embY = Math.round(397.6 * H / 3200);
  const embW = Math.round(1737.5 * W / 3200);
  const embH = Math.round(2068.75 * H / 3200);

  for (let dy = 0; dy < embH; dy++) {
    const sy = Math.floor(dy * h6 / embH);
    const targetY = embY + dy;
    if (targetY < 0 || targetY >= H) continue;

    for (let dx = 0; dx < embW; dx++) {
      const sx = Math.floor(dx * w6 / embW);
      const targetX = embX + dx;
      if (targetX < 0 || targetX >= W) continue;

      const srcIdx = (sy * w6 + sx);
      const a = x6Smask[srcIdx];
      if (a === 0) continue;

      const destIdx = (targetY * W + targetX) * 4;
      if (isWhite) {
        canvas[destIdx] = 255;
        canvas[destIdx + 1] = 255;
        canvas[destIdx + 2] = 255;
      } else {
        canvas[destIdx] = x6Rgb[srcIdx * 3];
        canvas[destIdx + 1] = x6Rgb[srcIdx * 3 + 1];
        canvas[destIdx + 2] = x6Rgb[srcIdx * 3 + 2];
      }
      canvas[destIdx + 3] = a;
    }
  }

  const wmX = Math.round(872 * W / 3200);
  const wmY = Math.round(2437 * H / 3200);
  const wmW = Math.round(1590 * W / 3200);
  const wmH = Math.round(297 * H / 3200);

  for (let dy = 0; dy < wmH; dy++) {
    const sy = Math.floor(dy * h10 / wmH);
    const targetY = wmY + dy;
    if (targetY < 0 || targetY >= H) continue;

    for (let dx = 0; dx < wmW; dx++) {
      const sx = Math.floor(dx * w10 / wmW);
      const targetX = wmX + dx;
      if (targetX < 0 || targetX >= W) continue;

      const srcIdx = (sy * w10 + sx);
      const rawAlpha = x10Smask[srcIdx];
      if (rawAlpha === 0) continue;
      const a = Math.min(255, Math.round((rawAlpha / maxSmask) * 255));

      const destIdx = (targetY * W + targetX) * 4;
      if (isWhite) {
        canvas[destIdx] = 255;
        canvas[destIdx + 1] = 255;
        canvas[destIdx + 2] = 255;
      } else {
        canvas[destIdx] = 0;
        canvas[destIdx + 1] = 0;
        canvas[destIdx + 2] = 0;
      }
      canvas[destIdx + 3] = a;
    }
  }

  return createRgbaPng(W, H, canvas);
}

fs.writeFileSync('public/assets/images/freska_official_logo_black.png', compositeFullLogo(false));
fs.writeFileSync('public/assets/images/freska_official_logo_white.png', compositeFullLogo(true));
console.log('Successfully generated sharp official black & white logo PNGs!');
