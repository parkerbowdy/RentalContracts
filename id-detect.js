const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function otsu(hist, total) {
 let sum = 0;
 for (let i = 0; i < 256; i++) sum += i * hist[i];
 let wB = 0, sB = 0, best = 0, threshold = 0;
 for (let i = 0; i < 256; i++) {
  wB += hist[i];
  if (!wB) continue;
  const wF = total - wB;
  if (!wF) break;
  sB += i * hist[i];
  const mB = sB / wB, mF = (sum - sB) / wF, variance = wB * wF * (mB - mF) * (mB - mF);
  if (variance > best) { best = variance; threshold = i; }
 }
 return threshold;
}
function morph(src, w, h, r, grow) {
 const tmp = new Uint8Array(w * h), out = new Uint8Array(w * h), outside = grow ? 0 : 1;
 const hit = (value, target) => grow ? value === 1 : value === 0;
 for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  let v = grow ? 0 : 1;
  for (let d = -r; d <= r; d++) { const xx = x + d, s = xx < 0 || xx >= w ? outside : src[y * w + xx]; if (hit(s)) { v = grow ? 1 : 0; break; } }
  tmp[y * w + x] = v;
 }
 for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  let v = grow ? 0 : 1;
  for (let d = -r; d <= r; d++) { const yy = y + d, s = yy < 0 || yy >= h ? outside : tmp[yy * w + x]; if (hit(s)) { v = grow ? 1 : 0; break; } }
  out[y * w + x] = v;
 }
 return out;
}
function fillHoles(mask, w, h) {
 const n = w * h, reach = new Uint8Array(n), queue = new Int32Array(n);
 let head = 0, tail = 0;
 const seed = i => { if (!mask[i] && !reach[i]) { reach[i] = 1; queue[tail++] = i; } };
 for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
 for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
 while (head < tail) {
  const i = queue[head++], x = i % w, y = (i - x) / w;
  if (x) seed(i - 1);
  if (x + 1 < w) seed(i + 1);
  if (y) seed(i - w);
  if (y + 1 < h) seed(i + w);
 }
 const out = new Uint8Array(n);
 for (let i = 0; i < n; i++) out[i] = mask[i] || !reach[i] ? 1 : 0;
 return out;
}
export function findIdBox(data, w, h) {
 const n = w * h;
 if (w < 40 || h < 40 || data.length < n * 4) return null;
 const ring = Math.max(2, Math.round(Math.min(w, h) * 0.015)), samples = [[], [], []];
 const inRing = (x, y) => x < ring || y < ring || x >= w - ring || y >= h - ring;
 for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inRing(x, y)) { const i = (y * w + x) * 4; for (let k = 0; k < 3; k++) samples[k].push(data[i + k]); }
 const bg = samples.map(a => { a.sort((p, q) => p - q); return a[a.length >> 1]; });
 const dist = new Uint8Array(n), hist = new Array(256).fill(0);
 for (let i = 0; i < n; i++) { const d = Math.max(Math.abs(data[i * 4] - bg[0]), Math.abs(data[i * 4 + 1] - bg[1]), Math.abs(data[i * 4 + 2] - bg[2])); dist[i] = d; hist[d]++; }
 const t = clamp(Math.round(otsu(hist, n) * 0.5), 14, 40);
 let calm = 0, ringTotal = 0;
 for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inRing(x, y)) { ringTotal++; if (dist[y * w + x] <= Math.max(t, 24)) calm++; }
 if (calm / ringTotal < 0.6) return null;
 let mask = new Uint8Array(n);
 for (let i = 0; i < n; i++) mask[i] = dist[i] > t ? 1 : 0;
 const r = Math.max(1, Math.round(Math.min(w, h) * 0.004));
 mask = morph(fillHoles(morph(mask, w, h, r, true), w, h), w, h, r, false);
 const seen = new Uint8Array(n), queue = new Int32Array(n), comps = [];
 for (let start = 0; start < n; start++) {
  if (!mask[start] || seen[start]) continue;
  let head = 0, tail = 1, minX = w, minY = h, maxX = 0, maxY = 0, count = 0;
  queue[0] = start; seen[start] = 1;
  while (head < tail) {
   const i = queue[head++], x = i % w, y = (i - x) / w;
   count++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
   for (const m of [x ? i - 1 : -1, x + 1 < w ? i + 1 : -1, y ? i - w : -1, y + 1 < h ? i + w : -1]) if (m >= 0 && mask[m] && !seen[m]) { seen[m] = 1; queue[tail++] = m; }
  }
  comps.push({minX, minY, maxX, maxY, count, bw: maxX - minX + 1, bh: maxY - minY + 1});
 }
 const box = (c, kind, multiple) => {
  const pad = Math.max(4, Math.ceil(Math.max(c.bw, c.bh) * 0.03));
  return {x: Math.max(0, c.minX - pad) / w, y: Math.max(0, c.minY - pad) / h, right: Math.min(w, c.maxX + pad + 1) / w, bottom: Math.min(h, c.maxY + pad + 1) / h, kind, multiple};
 };
 const cards = comps.filter(c => {
  const ratio = Math.max(c.bw / c.bh, c.bh / c.bw), area = c.bw * c.bh;
  return c.bw >= 30 && c.bh >= 30 && ratio >= 1.25 && ratio <= 2 && area >= n * 0.02 && area <= n * 0.97 && c.count >= area * 0.6;
 }).sort((a, b) => b.count - a.count);
 if (cards.length) return box(cards[0], 'card', cards.length > 1 && cards[1].count >= cards[0].count * 0.25);
 const content = comps.filter(c => c.count >= Math.max(30, n * 0.003));
 if (!content.length) return null;
 const all = {minX: Math.min(...content.map(c => c.minX)), minY: Math.min(...content.map(c => c.minY)), maxX: Math.max(...content.map(c => c.maxX)), maxY: Math.max(...content.map(c => c.maxY))};
 all.bw = all.maxX - all.minX + 1; all.bh = all.maxY - all.minY + 1;
 const area = all.bw * all.bh;
 if (all.bw < 30 || all.bh < 30 || area < n * 0.01 || area > n * 0.92) return null;
 return box(all, 'content', false);
}
