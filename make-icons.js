const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---------- tiny PNG encoder (no deps) ----------

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// ---------- geometry: isometric LUT cube on a rounded dark chip ----------

function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = (yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const BG = hexToRgb('#141414');
const BORDER = hexToRgb('#2a2a2a');
const TOP = hexToRgb('#f7d9c6');
const LEFT = hexToRgb('#e8622c');
const RIGHT = hexToRgb('#a8451f');

// polygons in a 24x24 viewBox, matching the header logo mark
const topFace = [[12, 2.5], [20.5, 7.5], [12, 12.5], [3.5, 7.5]];
const leftFace = [[3.5, 7.5], [12, 12.5], [12, 21.5], [3.5, 16.5]];
const rightFace = [[20.5, 7.5], [12, 12.5], [12, 21.5], [20.5, 16.5]];

function roundedRectMask(x, y, w, h, r) {
  const cx = Math.min(Math.max(x, r), w - r);
  const cy = Math.min(Math.max(y, r), h - r);
  const dx = x - cx, dy = y - cy;
  if (x > r && x < w - r) return y >= 0 && y <= h;
  if (y > r && y < h - r) return x >= 0 && x <= w;
  return dx * dx + dy * dy <= r * r;
}

function renderIcon(size) {
  const SS = 4; // supersample factor for anti-aliasing
  const big = size * SS;
  const buf = Buffer.alloc(big * big * 4);

  const margin = big * 0.06;
  const r = big * 0.22;

  for (let y = 0; y < big; y++) {
    for (let x = 0; x < big; x++) {
      const i = (y * big + x) * 4;
      const inChip = roundedRectMask(x, y, big, big, r) &&
        x >= margin && x <= big - margin && y >= margin && y <= big - margin;

      if (!inChip) {
        buf[i] = 0; buf[i + 1] = 0; buf[i + 2] = 0; buf[i + 3] = 0;
        continue;
      }

      // map pixel to 24x24 viewBox with padding
      const pad = 3;
      const scale = (24 + pad * 2) / (big - margin * 2);
      const vx = (x - margin) * scale - pad;
      const vy = (y - margin) * scale - pad;

      let color = BG;
      if (pointInPoly(vx, vy, leftFace)) color = LEFT;
      else if (pointInPoly(vx, vy, rightFace)) color = RIGHT;
      else if (pointInPoly(vx, vy, topFace)) color = TOP;

      buf[i] = color[0]; buf[i + 1] = color[1]; buf[i + 2] = color[2]; buf[i + 3] = 255;
    }
  }

  // downsample (box filter) from big -> size
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const si = ((y * SS + sy) * big + (x * SS + sx)) * 4;
          r += buf[si]; g += buf[si + 1]; b += buf[si + 2]; a += buf[si + 3];
        }
      }
      const n = SS * SS;
      const oi = (y * size + x) * 4;
      out[oi] = Math.round(r / n);
      out[oi + 1] = Math.round(g / n);
      out[oi + 2] = Math.round(b / n);
      out[oi + 3] = Math.round(a / n);
    }
  }
  return out;
}

function writePng(size, filename) {
  const rgba = renderIcon(size);
  fs.writeFileSync(path.join(__dirname, filename), encodePNG(size, size, rgba));
  console.log(`wrote ${filename} (${size}x${size})`);
}

writePng(16, 'favicon-16.png');
writePng(32, 'favicon-32.png');
writePng(48, 'favicon-48.png');
writePng(180, 'apple-touch-icon.png');
writePng(512, 'icon-512.png');

// ---------- pack 16/32/48 PNGs into a single .ico ----------

function buildIco(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const dirEntries = [];
  const dataChunks = [];

  entries.forEach(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry[2] = 0;
    entry[3] = 0;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    dataChunks.push(data);
    offset += data.length;
  });

  return Buffer.concat([header, ...dirEntries, ...dataChunks]);
}

const icoEntries = [16, 32, 48].map((size) => ({
  size,
  data: encodePNG(size, size, renderIcon(size))
}));
fs.writeFileSync(path.join(__dirname, 'favicon.ico'), buildIco(icoEntries));
console.log('wrote favicon.ico (16/32/48 multi-size)');
