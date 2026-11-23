const $ = id => document.getElementById(id);
const issuerStates = Object.fromEntries('636000:VA 636001:NY 636002:MA 636003:MD 636004:NC 636005:SC 636006:CT 636007:LA 636008:MT 636009:NM 636010:FL 636011:DE 636014:CA 636015:TX 636018:IA 636019:GU 636021:AR 636022:KS 636023:OH 636024:VT 636025:PA 636026:AZ 636029:OR 636030:MO 636031:WI 636032:MI 636033:AL 636034:ND 636035:IL 636036:NJ 636037:IN 636038:MN 636039:NH 636040:UT 636041:ME 636042:SD 636043:DC 636045:WA 636046:KY 636047:HI 636049:NV 636050:ID 636051:MS 636052:RI 636053:TN 636054:NE 636055:GA 636058:OK 636059:AK 636060:WY 636061:WV 636062:VI 604427:AS 604430:MP 604431:PR'.split(' ').map(pair => pair.split(':')));
const codes = 'DAA DAB DAC DAD DAE DAF DAG DAH DAI DAJ DAK DAL DAM DAN DAO DAP DAQ DAR DAS DAT DAU DAV DAW DAX DAY DAZ DBA DBB DBC DBD DBE DBF DBG DBH DBI DBJ DBK DBL DBM DBN DBO DBP DBQ DBR DBS DCA DCB DCC DCD DCE DCF DCG DCH DCI DCJ DCK DCL DCM DCN DCO DCP DCQ DCR DCS DCT DCU DDA DDB DDC DDD DDE DDF DDG DDH DDI DDJ DDK DDL'.split(' ');
const known = new Set(codes);
function report(text, bad = false) { const s = $('status'); if (s) { s.textContent = text; s.className = bad ? 'error' : 'ok'; s.scrollIntoView({block:'nearest'}); } }
function protectKentuckyNames(body, matches, issuer) {
 if (issuer !== 'KY') return matches;
 const pattern = /DCS([A-Z][A-Z ,.'-]{0,79})DDE([NTU])DAC([A-Z][A-Z ,.'-]{0,79})DDF([NTU])DAD([A-Z ,.'-]{0,80})DDG([NTU])(?=DCA)/g;
 const blocks = Array.from(body.matchAll(pattern));
 if (blocks.length !== 1) return matches;
 const block = blocks[0], spans = [];
 let cursor = block.index;
 for (const [label, value] of [['DCS',block[1]],['DDE',block[2]],['DAC',block[3]],['DDF',block[4]],['DAD',block[5]],['DDG',block[6]]]) {
  if (['DCS','DAC','DAD'].includes(label)) spans.push([cursor + 3, cursor + 3 + value.length]);
  cursor += 3 + value.length;
 }
 return matches.filter(match => !spans.some(([start,end]) => match.index >= start && match.index < end));
}
function decode(raw) {
 const header = raw.match(/ANSI\s*(\d{6})/);
 const issuer = header ? issuerStates[header[1]] || '' : '';
 const text = raw.replace(/\r\n?/g, '\n').replace(/[\x1c-\x1f\t]/g, '\n');
 const lines = text.split('\n').map(x => x.trim()).filter(x => known.has(x.slice(0,3)));
 const fields = Object.create(null);
 const separated = lines.some(x => x.startsWith('DAQ')) && lines.some(x => x.startsWith('DCS'));
 let tailExcluded = false;
 const put = (k,v) => { if (k in fields) throw Error('Barcode diagnostic B3: repeated field ' + k + '; mode=' + (separated ? 'line-separated' : 'joined-field recovery') + '; separators=' + (/[\r\n\x1c-\x1f\t]/.test(raw) ? 'present' : 'absent') + '; ANSI headers=' + Math.min((raw.match(/ANSI\s*\d{6}/g) || []).length, 9) + '; tail excluded=' + (tailExcluded ? 'yes' : 'no') + '. No fields filled. Report this message only, not the barcode text.'); fields[k] = v.trim(); };
 if (separated) { for (const line of lines) put(line.slice(0,3), line.slice(3)); }
 else {
  const start = text.indexOf('DAQ');
  if (start < 0) throw Error('License number field not found. Scan an AAMVA ID or enter details manually.');
  let body = text.slice(start).split(/\n\s*Z[A-Z]/)[0];
  let matches = protectKentuckyNames(body, Array.from(body.matchAll(new RegExp(codes.join('|'), 'g'))), issuer);
  const dda = matches.filter(m => m[0] === 'DDA');
  if (dda.length > 1) {
   const cut = dda[0].index, before = matches.filter(m => m.index < cut), after = matches.filter(m => m.index >= cut);
   const count = k => before.filter(m => m[0] === k).length;
   const used = new Set(['DAQ','DAC','DCT','DCS','DAB','DAD','DCU','DAG','DAH','DAI','DAJ','DAK','DBA','DCG']);
   const complete = ['DAQ','DBA','DAG','DAI','DAJ','DAK'].every(k => count(k) === 1) && count('DAC') + count('DCT') === 1 && count('DCS') + count('DAB') === 1;
   if (complete && !after.some(m => used.has(m[0]))) { body = body.slice(0,cut); matches = before; tailExcluded = true; }
  }
  matches.forEach((m,i) => put(m[0], body.slice(m.index + 3, i+1 < matches.length ? matches[i+1].index : body.length)));
 }
 const get = k => fields[k] || '';
 const first = get('DAC') || get('DCT'), last = get('DCS') || get('DAB');
 if (!first || !last || !get('DAQ')) throw Error('Could not read the name and license number reliably. Enter details manually.');
 const d = get('DBA');
 if (!/^\d{8}$/.test(d)) throw Error('Could not read the expiration date. Enter details manually.');
 const canada = get('DCG') === 'CAN';
 const y = Number(canada ? d.slice(0,4) : d.slice(4,8));
 const m = Number(canada ? d.slice(4,6) : d.slice(0,2));
 const day = Number(canada ? d.slice(6,8) : d.slice(2,4));
 const date = new Date(Date.UTC(y,m-1,day));
 if (y < 1900 || y > 2200 || date.getUTCFullYear() !== y || date.getUTCMonth() !== m-1 || date.getUTCDate() !== day) throw Error('Invalid expiration date. Enter details manually.');
 if (!/^[A-Z]{2}$/.test(get('DAJ'))) throw Error('Could not read the address state/province reliably. Enter details manually.');
 const expiration = [y,String(m).padStart(2,'0'),String(day).padStart(2,'0')].join('-');
 return {recovered:!separated,tailExcluded, values:{name:[first,get('DAD'),last,get('DCU')].filter(Boolean).join(' '),street:[get('DAG'),get('DAH')].filter(Boolean).join(', '),city:get('DAI'),state:get('DAJ'),zip:get('DAK'),license:get('DAQ'),expiration,issuer}};
}
document.addEventListener('click', event => {
 const button = event.target instanceof Element ? event.target.closest('#parse') : null;
 if (!button || !$('barcode') || !$('rentalForm')) return;
 event.preventDefault();
 event.stopImmediatePropagation();
 try {
  const raw = $('barcode').value.trim();
  if (!raw) throw Error('Scan an ID into the barcode box first.');
  const result = decode(raw);
  for (const id of Object.keys(result.values)) if (!$(id)) throw Error('Rental form is missing a required field. Refresh and try again.');
  if (!$('removePhoto')) throw Error('ID reset control is missing. Refresh and try again.');
  $('removePhoto').click();
  for (const [id,value] of Object.entries(result.values)) $(id).value = value;
  $('name').dispatchEvent(new Event('input',{bubbles:true}));
  for (const id of ['idFile','idCamera']) if ($(id)) $(id).value = '';
  if ($('idPreview')) $('idPreview').removeAttribute('src');
  $('barcode').value = '';
  if ($('idNote')) $('idNote').textContent = 'Attach the image of the ID just scanned.';
  const issuerNote = result.values.issuer ? 'Issuing state detected: ' + result.values.issuer + '. Verify it against the ID. ' : 'Issuing authority not recognized; enter license issuing state manually. ';
  report((result.recovered ? 'Joined-field scan recovered: verify every field against the ID. ' : 'Barcode filled: verify every field against the ID. ') + (result.tailExcluded ? 'Trailing metadata excluded. ' : '') + issuerNote + 'Enter phone, attach the ID image, finish edits and consent, then confirm information and sign.');
 } catch (error) { report(error.message, true); }
}, true);
