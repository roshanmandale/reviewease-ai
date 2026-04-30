// Generates icon-192.png and icon-512.png using pure Node.js
// No external dependencies required

import { createWriteStream } from 'fs';
import { deflateSync } from 'zlib';

function createPNG(size) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type);
    const crcBuf = Buffer.concat([typeB, data]);
    let crc = 0xffffffff;
    for (const b of crcBuf) {
      crc ^= b;
      for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    crc ^= 0xffffffff;
    const crcOut = Buffer.alloc(4);
    crcOut.writeUInt32BE(crc >>> 0);
    return Buffer.concat([len, typeB, data, crcOut]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Draw pixels — violet gradient background with white star
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = [0]; // filter byte
    for (let x = 0; x < size; x++) {
      // Gradient from violet to indigo
      const t = (x + y) / (size * 2);
      const r = Math.round(124 + (79 - 124) * t);
      const g = Math.round(58 + (70 - 58) * t);
      const b = Math.round(237 + (229 - 237) * t);

      // Rounded corners mask
      const cx = x - size / 2, cy = y - size / 2;
      const radius = size * 0.22;
      const cornerR = size * 0.22;
      const inCorner = (Math.abs(cx) > size / 2 - cornerR && Math.abs(cy) > size / 2 - cornerR);
      if (inCorner) {
        const dx = Math.abs(cx) - (size / 2 - cornerR);
        const dy = Math.abs(cy) - (size / 2 - cornerR);
        if (dx * dx + dy * dy > cornerR * cornerR) {
          row.push(255, 255, 255); // white (transparent bg)
          continue;
        }
      }

      // Star shape in center
      const nx = cx / (size * 0.28), ny = cy / (size * 0.28);
      const dist = Math.sqrt(nx * nx + ny * ny);
      const angle = Math.atan2(ny, nx);
      const starPoints = 5;
      const outerR = 1.0, innerR = 0.45;
      const sector = Math.floor((angle + Math.PI) / (2 * Math.PI / starPoints));
      const sectorAngle = sector * (2 * Math.PI / starPoints) - Math.PI;
      const nextAngle = sectorAngle + Math.PI / starPoints;
      const midAngle = sectorAngle + Math.PI / starPoints / 2;
      // Simple star check
      const starR = (angle % (2 * Math.PI / starPoints) < Math.PI / starPoints) ? outerR : innerR;
      const inStar = dist < starR * 0.7;

      if (inStar) {
        row.push(255, 255, 255); // white star
      } else {
        row.push(r, g, b);
      }
    }
    rows.push(Buffer.from(row));
  }

  const raw = Buffer.concat(rows);
  const compressed = deflateSync(raw, { level: 9 });
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, chunk('IHDR', ihdr), idat, iend]);
}

// Better approach: use a simple solid color PNG with text
function solidColorPNG(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let crc = 0xffffffff;
    for (const byte of buf) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type);
    const crcVal = crc32(Buffer.concat([typeB, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal);
    return Buffer.concat([len, typeB, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;

  // Build raw image data — violet background
  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(size * rowSize);
  for (let y = 0; y < size; y++) {
    const base = y * rowSize;
    raw[base] = 0; // filter none
    for (let x = 0; x < size; x++) {
      // Gradient
      const t = (x + y) / (size * 2);
      raw[base + 1 + x * 3] = Math.round(r + (79 - r) * t);
      raw[base + 1 + x * 3 + 1] = Math.round(g + (70 - g) * t);
      raw[base + 1 + x * 3 + 2] = Math.round(b + (229 - b) * t);
    }
  }

  const compressed = deflateSync(raw, { level: 6 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

const icon192 = solidColorPNG(192, 124, 58, 237);
const icon512 = solidColorPNG(512, 124, 58, 237);

import { writeFileSync } from 'fs';
writeFileSync('public/icons/icon-192.png', icon192);
writeFileSync('public/icons/icon-512.png', icon512);
console.log('Icons generated: icon-192.png and icon-512.png');
