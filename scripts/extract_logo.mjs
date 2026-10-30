import fs from 'fs';
import zlib from 'zlib';

const pdfPath = 'C:\\Users\\sazee\\.gemini\\antigravity-ide\\brain\\52f5a81e-5e56-49a4-9de1-8cc6b3e09259\\.user_uploaded\\media_1793280625194.pdf';
const buf = fs.readFileSync(pdfPath);

let offset = 0;
while (true) {
  const streamIdx = buf.indexOf('stream', offset);
  if (streamIdx === -1) break;
  
  // Find preceding dictionary
  const dictStart = buf.lastIndexOf('<<', streamIdx);
  const dict = buf.subarray(dictStart, streamIdx).toString('latin1');
  
  // Find start of stream data (after CRLF or LF)
  let dataStart = streamIdx + 6;
  if (buf[dataStart] === 0x0D && buf[dataStart + 1] === 0x0A) {
    dataStart += 2;
  } else if (buf[dataStart] === 0x0A || buf[dataStart] === 0x0D) {
    dataStart += 1;
  }
  
  const endStreamIdx = buf.indexOf('endstream', dataStart);
  if (endStreamIdx !== -1) {
    const rawData = buf.subarray(dataStart, endStreamIdx);
    console.log('Stream found! Dict:', dict.replace(/\s+/g, ' '));
    console.log('Raw stream length:', rawData.length);
    
    if (dict.includes('/FlateDecode')) {
      try {
        const decompressed = zlib.inflateSync(rawData);
        console.log('Decompressed length:', decompressed.length);
        
        // Check if decompressed has JPEG or PNG or raw image samples
        fs.writeFileSync('public/assets/images/extracted_stream.bin', decompressed);
      } catch (err) {
        console.log('Zlib inflate error:', err.message);
      }
    }
  }
  offset = streamIdx + 6;
}
