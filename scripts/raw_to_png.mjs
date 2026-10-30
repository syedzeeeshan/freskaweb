import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, rgbBuffer) {
  // Each scanline: 1 filter byte (0) + width * 3 bytes
  const scanlineLen = 1 + width * 3;
  const rawData = Buffer.alloc(height * scanlineLen);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLen;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    rgbBuffer.copy(rawData, rowOffset + 1, y * width * 3, (y + 1) * width * 3);
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

  // PNG Signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk: width (4), height (4), bit depth (1), color type 2 (RGB), compression (0), filter (0), interlace (0)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Extract /X4 from PDF
import PyPDF2 from 'child_process';
const pythonScript = `
import PyPDF2

pdf_path = r"C:\\Users\\sazee\\.gemini\\antigravity-ide\\brain\\52f5a81e-5e56-49a4-9de1-8cc6b3e09259\\.user_uploaded\\media_1793280625194.pdf"
reader = PyPDF2.PdfReader(pdf_path)
page = reader.pages[0]
xObject = page["/Resources"]["/XObject"].get_object()

with open("public/assets/images/logo_1024_raw.bin", "wb") as f:
    f.write(xObject["/X4"].get_data())

with open("public/assets/images/logo_cropped_raw.bin", "wb") as f:
    f.write(xObject["/X6"].get_data())
print("Python dumped both raw RGB images.")
`;

fs.writeFileSync('scripts/dump_images.py', pythonScript);
import { execSync } from 'child_process';
execSync('python scripts/dump_images.py', { stdio: 'inherit' });

const rgb1024 = fs.readFileSync('public/assets/images/logo_1024_raw.bin');
const png1024 = createPng(1024, 1024, rgb1024);
fs.writeFileSync('public/assets/images/freska_official_logo.png', png1024);
console.log('Saved 1024x1024 official logo to public/assets/images/freska_official_logo.png');

const rgbCropped = fs.readFileSync('public/assets/images/logo_cropped_raw.bin');
const pngCropped = createPng(671, 799, rgbCropped);
fs.writeFileSync('public/assets/images/freska_logo_emblem.png', pngCropped);
console.log('Saved 671x799 emblem logo to public/assets/images/freska_logo_emblem.png');

// Clean up raw bin files
fs.unlinkSync('public/assets/images/logo_1024_raw.bin');
fs.unlinkSync('public/assets/images/logo_cropped_raw.bin');
if (fs.existsSync('public/assets/images/raw_logo_data.bin')) {
  fs.unlinkSync('public/assets/images/raw_logo_data.bin');
}
