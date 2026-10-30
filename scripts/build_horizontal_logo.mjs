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

const x6Rgb = fs.readFileSync('public/assets/images/_temp_x6_rgb.bin');
const x6Smask = fs.readFileSync('public/assets/images/_temp_x6_smask.bin');
const x10Smask = fs.readFileSync('public/assets/images/_temp_x10_smask.bin');

fs.unlinkSync('public/assets/images/_temp_x6_rgb.bin');
fs.unlinkSync('public/assets/images/_temp_x6_smask.bin');
fs.unlinkSync('public/assets/images/_temp_x10_smask.bin');

const w6 = 671, h6 = 799;
const w10 = 1590, h10 = 297;

let maxX10 = 0;
for (let i = 0; i < x10Smask.length; i++) {
  if (x10Smask[i] > maxX10) maxX10 = x10Smask[i];
}

// Create Horizontal Canvas
// Height: 240, Width: 880
// Emblem: Height = 220, Width = 220 * (w6/h6) = 185
// Offset emblem: x = 15, y = 10
// Wordmark: Height = 84, Width = 84 * (w10/h10) = 450
// Offset wordmark: x = 240, y = (240 - 84)/2 = 78
const W = 760;
const H = 220;

function createHorizontalLogo(isWhite) {
  const canvas = Buffer.alloc(W * H * 4);

  // Draw Emblem
  const embH = 190;
  const embW = Math.round(embH * (w6 / h6));
  const embX = 15;
  const embY = Math.round((H - embH) / 2);

  for (let dy = 0; dy < embH; dy++) {
    const sy = Math.floor(dy * h6 / embH);
    const ty = embY + dy;
    if (ty < 0 || ty >= H) continue;

    for (let dx = 0; dx < embW; dx++) {
      const sx = Math.floor(dx * w6 / embW);
      const tx = embX + dx;
      if (tx < 0 || tx >= W) continue;

      const a = x6Smask[sy * w6 + sx];
      if (a === 0) continue;

      const dest = (ty * W + tx) * 4;
      if (isWhite) {
        canvas[dest] = 255;
        canvas[dest + 1] = 255;
        canvas[dest + 2] = 255;
      } else {
        canvas[dest] = x6Rgb[(sy * w6 + sx) * 3];
        canvas[dest + 1] = x6Rgb[(sy * w6 + sx) * 3 + 1];
        canvas[dest + 2] = x6Rgb[(sy * w6 + sx) * 3 + 2];
      }
      canvas[dest + 3] = a;
    }
  }

  // Draw Wordmark
  const wmH = 72;
  const wmW = Math.round(wmH * (w10 / h10));
  const wmX = embX + embW + 32;
  const wmY = Math.round((H - wmH) / 2) + 6;

  for (let dy = 0; dy < wmH; dy++) {
    const sy = Math.floor(dy * h10 / wmH);
    const ty = wmY + dy;
    if (ty < 0 || ty >= H) continue;

    for (let dx = 0; dx < wmW; dx++) {
      const sx = Math.floor(dx * w10 / wmW);
      const tx = wmX + dx;
      if (tx < 0 || tx >= W) continue;

      const rawA = x10Smask[sy * w10 + sx];
      if (rawA === 0) continue;
      const a = Math.min(255, Math.round((rawA / maxX10) * 255));

      const dest = (ty * W + tx) * 4;
      if (isWhite) {
        canvas[dest] = 255;
        canvas[dest + 1] = 255;
        canvas[dest + 2] = 255;
      } else {
        canvas[dest] = 0;
        canvas[dest + 1] = 0;
        canvas[dest + 2] = 0;
      }
      canvas[dest + 3] = a;
    }
  }

  return createRgbaPng(W, H, canvas);
}

fs.writeFileSync('public/assets/images/freska_logo_horizontal_black.png', createHorizontalLogo(false));
fs.writeFileSync('public/assets/images/freska_logo_horizontal_white.png', createHorizontalLogo(true));
console.log('Saved freska_logo_horizontal_black.png and freska_logo_horizontal_white.png');
