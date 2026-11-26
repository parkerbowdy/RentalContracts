const pad = n => String(n).padStart(2, '0');
const isoDay = date => date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
export function extractBirthDate(raw, now = new Date()) {
 const text = String(raw || '');
 const hits = Array.from(text.matchAll(/DBB(\d{8})(?!\d)/g));
 if (hits.length !== 1) return '';
 const value = hits[0][1], canada = /DCG\s*CAN/.test(text);
 const y = Number(canada ? value.slice(0,4) : value.slice(4,8));
 const m = Number(canada ? value.slice(4,6) : value.slice(0,2));
 const d = Number(canada ? value.slice(6,8) : value.slice(2,4));
 const date = new Date(Date.UTC(y, m - 1, d));
 if (y < 1900 || date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return '';
 const iso = y + '-' + pad(m) + '-' + pad(d);
 return iso > isoDay(now) ? '' : iso;
}
export function ageText(iso, now = new Date()) {
 const match = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || '');
 if (!match) return '';
 const [, y, m, d] = match.map(Number);
 let age = now.getFullYear() - y;
 if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
 return age >= 0 && age <= 120 ? 'Age ' + age : '';
}
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
 const $ = id => document.getElementById(id);
 const install = () => {
  const expiration = $('expiration');
  if (!$('rentalForm') || !expiration || $('dob')) return;
  const anchor = expiration.closest('label');
  if (!anchor) return;
  const label = document.createElement('label'), input = document.createElement('input'), age = document.createElement('small');
  label.append('Date of birth');
  input.id = 'dob'; input.name = 'dob'; input.type = 'date'; input.autocomplete = 'off'; input.max = isoDay(new Date());
  age.id = 'dobAge'; age.className = 'muted';
  input.addEventListener('input', () => { age.textContent = ageText(input.value); });
  label.append(input, age);
  anchor.after(label);
 };
 window.addEventListener('click', event => {
  const button = event.target instanceof Element ? event.target.closest('#parse') : null;
  if (!button || !$('barcode') || !$('rentalForm')) return;
  const raw = $('barcode').value;
  if (!raw.trim()) return;
  const dob = extractBirthDate(raw);
  setTimeout(() => {
   if ($('barcode').value !== '') return;
   const input = $('dob'), status = $('status');
   if (input) { input.value = dob; input.dispatchEvent(new Event('input', {bubbles:true})); }
   if (status && status.className === 'ok') status.textContent += dob ? ' Date of birth filled; verify it against the ID.' : ' Date of birth was not read; enter it manually.';
  }, 0);
 }, true);
 const app = $('app');
 if (app) { new MutationObserver(install).observe(app, {childList:true, subtree:true}); install(); }
}
