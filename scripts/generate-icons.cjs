const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function createPNG(width, height, drawFn) {
  const bytesPerPixel = 4;
  const scanlineLength = width * bytesPerPixel + 1;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter none
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[i] = c;
  }

  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, combined, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflated),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// Draw function: Emerald background (#10b981 to #059669) with white shield / checkmark
function drawDaybookIcon(x, y, w, h, maskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background
  const cornerRadius = maskable ? 0 : w * 0.22;
  
  // Rounded rect distance
  let inBounds = false;
  if (maskable) {
    inBounds = true;
  } else {
    // Check rounded rect
    const qx = Math.abs(dx) - (w / 2 - cornerRadius);
    const qy = Math.abs(dy) - (h / 2 - cornerRadius);
    if (qx <= 0 || qy <= 0) {
      inBounds = (Math.abs(dx) <= w / 2 && Math.abs(dy) <= h / 2);
    } else {
      inBounds = (qx * qx + qy * qy <= cornerRadius * cornerRadius);
    }
  }

  if (!inBounds) {
    return [0, 0, 0, 0];
  }

  // Emerald gradient
  const grad = y / h;
  const bgR = Math.round(16 * (1 - grad) + 5 * grad);
  const bgG = Math.round(185 * (1 - grad) + 150 * grad);
  const bgB = Math.round(129 * (1 - grad) + 105 * grad);

  // Scaled coordinates for center emblem (-1 to 1)
  const scale = maskable ? 0.38 : 0.45;
  const nx = dx / (w * scale);
  const ny = dy / (h * scale);

  // Checkmark logic: point 1: (-0.5, 0.05), point 2: (-0.1, 0.45), point 3: (0.55, -0.45)
  // Check distance to checkmark line segments
  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  const d1 = distToSegment(nx, ny, -0.45, 0.05, -0.08, 0.45);
  const d2 = distToSegment(nx, ny, -0.08, 0.45, 0.52, -0.42);
  const checkDist = Math.min(d1, d2);

  const thickness = 0.16;
  if (checkDist <= thickness) {
    // White checkmark
    return [255, 255, 255, 255];
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve(__dirname, '../public');

console.log('Generating PWA icons in', publicDir);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createPNG(192, 192, (x, y, w, h) => drawDaybookIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createPNG(512, 512, (x, y, w, h) => drawDaybookIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.png'), createPNG(512, 512, (x, y, w, h) => drawDaybookIcon(x, y, w, h, true)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, (x, y, w, h) => drawDaybookIcon(x, y, w, h, false)));

// Also create vector icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#grad)" />
  <path d="M150 260 L235 345 L375 175" fill="none" stroke="#ffffff" stroke-width="56" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');

console.log('PWA icons successfully generated!');
