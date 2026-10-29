import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Helper to write valid PNG with raw pixels using Node built-in zlib
function createPng(width, height, getPixelRGBA) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixelRGBA(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: 0
  ihdr[11] = 0; // Filter: 0
  ihdr[12] = 0; // Interlace: 0

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(12 + length);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// Standard CRC32
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const table = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  table[i] = c;
}

// 1. Generate Stone Plaster Normal Map (512x512 seamless)
console.log('Generating stone plaster normal map...');
const stoneNormal = createPng(512, 512, (x, y, w, h) => {
  const u = (x / w) * Math.PI * 4;
  const v = (y / h) * Math.PI * 4;
  
  // Multi-octave pseudo-noise height derivative
  const h1 = Math.sin(u * 2 + Math.cos(v * 3)) * 0.4;
  const h2 = Math.cos(v * 4 + Math.sin(u * 5)) * 0.25;
  const h3 = Math.sin(u * 12 + v * 10) * 0.12;
  const h4 = Math.sin(u * 28 - v * 22) * 0.06;
  const total = h1 + h2 + h3 + h4;

  const dx = (Math.sin((u + 0.05) * 2 + Math.cos(v * 3)) * 0.4 +
              Math.sin((u + 0.05) * 12 + v * 10) * 0.12) - total;
  const dy = (Math.cos((v + 0.05) * 4 + Math.sin(u * 5)) * 0.25 +
              Math.sin(u * 12 + (v + 0.05) * 10) * 0.12) - total;

  let nx = -dx * 8.0;
  let ny = -dy * 8.0;
  let nz = 1.0;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  nx /= len; ny /= len; nz /= len;

  return [
    Math.floor((nx * 0.5 + 0.5) * 255),
    Math.floor((ny * 0.5 + 0.5) * 255),
    Math.floor((nz * 0.5 + 0.5) * 255),
    255
  ];
});

fs.writeFileSync('public/assets/textures/stone_plaster_normal.png', stoneNormal);
console.log('Saved stone_plaster_normal.png');

// 2. Generate Water Ripple Flow Normal Map (512x512 seamless)
console.log('Generating water normal map...');
const waterNormal = createPng(512, 512, (x, y, w, h) => {
  const u = (x / w) * Math.PI * 6;
  const v = (y / h) * Math.PI * 6;

  const w1 = Math.sin(u * 2.0 + v * 1.5) * 0.5;
  const w2 = Math.sin(u * 3.5 - v * 2.8) * 0.35;
  const w3 = Math.cos(u * 5.0 + v * 4.2) * 0.2;
  const total = w1 + w2 + w3;

  const dx = (Math.sin((u + 0.05) * 2.0 + v * 1.5) * 0.5 + Math.sin((u + 0.05) * 3.5 - v * 2.8) * 0.35) - total;
  const dy = (Math.sin(u * 2.0 + (v + 0.05) * 1.5) * 0.5 - Math.sin(u * 3.5 - (v + 0.05) * 2.8) * 0.35) - total;

  let nx = -dx * 12.0;
  let ny = -dy * 12.0;
  let nz = 1.0;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  nx /= len; ny /= len; nz /= len;

  return [
    Math.floor((nx * 0.5 + 0.5) * 255),
    Math.floor((ny * 0.5 + 0.5) * 255),
    Math.floor((nz * 0.5 + 0.5) * 255),
    255
  ];
});

fs.writeFileSync('public/assets/textures/water_normal_loop.png', waterNormal);
console.log('Saved water_normal_loop.png');
