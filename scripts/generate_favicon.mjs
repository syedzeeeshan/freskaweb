import fs from 'fs';
import zlib from 'zlib';

// Function to create uncompressed/deflated RGBA PNG
function createRgbaPng(width, height, rgbaBuffer) {
  const scanlineLen = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLen);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLen;
    rawData[rowOffset] = 0;
    rgbaBuffer.copy(rawData, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const deflated = zlib.deflateSync(rawData);

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

// Function to decode an uncompressed/deflated PNG's IDAT chunks
function decodePngRgba(pngBuffer) {
  let pos = 8;
  let width = 0, height = 0;
  const idatChunks = [];

  while (pos < pngBuffer.length) {
    const length = pngBuffer.readUInt32BE(pos);
    const type = pngBuffer.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      width = pngBuffer.readUInt32BE(pos + 8);
      height = pngBuffer.readUInt32BE(pos + 12);
    } else if (type === 'IDAT') {
      idatChunks.push(pngBuffer.subarray(pos + 8, pos + 8 + length));
    }
    pos += 12 + length;
  }

  const allIdat = Buffer.concat(idatChunks);
  const inflated = zlib.inflateSync(allIdat);
  const scanlineLen = 1 + width * 4;
  const rgba = Buffer.alloc(width * height * 4);

  // Simplified scanline defilter (handles filter 0 = None and common filters)
  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLen;
    const filter = inflated[rowOffset];
    const prevRowOffset = y > 0 ? (y - 1) * width * 4 : -1;
    for (let x = 0; x < width * 4; x++) {
      const byteVal = inflated[rowOffset + 1 + x];
      let finalVal = byteVal;
      if (filter === 1) { // Sub
        const left = x >= 4 ? rgba[y * width * 4 + x - 4] : 0;
        finalVal = (byteVal + left) & 0xff;
      } else if (filter === 2) { // Up
        const up = prevRowOffset >= 0 ? rgba[prevRowOffset + x] : 0;
        finalVal = (byteVal + up) & 0xff;
      } else if (filter === 3) { // Average
        const left = x >= 4 ? rgba[y * width * 4 + x - 4] : 0;
        const up = prevRowOffset >= 0 ? rgba[prevRowOffset + x] : 0;
        finalVal = (byteVal + Math.floor((left + up) / 2)) & 0xff;
      } else if (filter === 4) { // Paeth
        const left = x >= 4 ? rgba[y * width * 4 + x - 4] : 0;
        const up = prevRowOffset >= 0 ? rgba[prevRowOffset + x] : 0;
        const upLeft = (prevRowOffset >= 0 && x >= 4) ? rgba[prevRowOffset + x - 4] : 0;
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        let pr;
        if (pa <= pb && pa <= pc) pr = left;
        else if (pb <= pc) pr = up;
        else pr = upLeft;
        finalVal = (byteVal + pr) & 0xff;
      }
      rgba[y * width * 4 + x] = finalVal;
    }
  }

  return { width, height, rgba };
}

// Bilinear resample to target width/height with padding to square
function resampleToSquare(srcRgba, srcW, srcH, size) {
  const dst = Buffer.alloc(size * size * 4, 0); // Transparent black

  const pad = 2; // subtle padding around emblem
  const usableSize = size - pad * 2;
  const scale = Math.min(usableSize / srcW, usableSize / srcH);
  const targetW = Math.round(srcW * scale);
  const targetH = Math.round(srcH * scale);
  const offsetX = Math.floor((size - targetW) / 2);
  const offsetY = Math.floor((size - targetH) / 2);

  for (let dy = 0; dy < targetH; dy++) {
    const sy = (dy / targetH) * (srcH - 1);
    const y0 = Math.floor(sy);
    const y1 = Math.min(y0 + 1, srcH - 1);
    const fy = sy - y0;

    for (let dx = 0; dx < targetW; dx++) {
      const sx = (dx / targetW) * (srcW - 1);
      const x0 = Math.floor(sx);
      const x1 = Math.min(x0 + 1, srcW - 1);
      const fx = sx - x0;

      const dstIdx = ((offsetY + dy) * size + (offsetX + dx)) * 4;

      for (let c = 0; c < 4; c++) {
        const v00 = srcRgba[(y0 * srcW + x0) * 4 + c];
        const v10 = srcRgba[(y0 * srcW + x1) * 4 + c];
        const v01 = srcRgba[(y1 * srcW + x0) * 4 + c];
        const v11 = srcRgba[(y1 * srcW + x1) * 4 + c];

        const top = v00 * (1 - fx) + v10 * fx;
        const bot = v01 * (1 - fx) + v11 * fx;
        dst[dstIdx + c] = Math.round(top * (1 - fy) + bot * fy);
      }
    }
  }

  return dst;
}

// Create an ICO containing a PNG
function createIcoFromPng(pngBuf, width, height) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(1, 4); // 1 image

  const dir = Buffer.alloc(16);
  dir.writeUInt8(width >= 256 ? 0 : width, 0);
  dir.writeUInt8(height >= 256 ? 0 : height, 1);
  dir.writeUInt8(0, 2); // Colors
  dir.writeUInt8(0, 3); // Reserved
  dir.writeUInt16LE(1, 4); // Planes
  dir.writeUInt16LE(32, 6); // BPP
  dir.writeUInt32LE(pngBuf.length, 8); // Size in bytes
  dir.writeUInt32LE(22, 12); // Offset (6 + 16 = 22)

  return Buffer.concat([header, dir, pngBuf]);
}

const emblemPngBuf = fs.readFileSync('public/assets/images/freska_emblem_black.png');
const { width, height, rgba } = decodePngRgba(emblemPngBuf);

const size64 = 64;
const rgba64 = resampleToSquare(rgba, width, height, size64);
const png64 = createRgbaPng(size64, size64, rgba64);

const size32 = 32;
const rgba32 = resampleToSquare(rgba, width, height, size32);
const png32 = createRgbaPng(size32, size32, rgba32);

const icoBuf = createIcoFromPng(png32, size32, size32);
fs.writeFileSync('public/favicon.ico', icoBuf);
fs.writeFileSync('public/favicon.png', png64);
fs.writeFileSync('public/favicon-32x32.png', png32);
console.log('✓ Successfully created public/favicon.ico, public/favicon.png (64x64) and public/favicon-32x32.png');
