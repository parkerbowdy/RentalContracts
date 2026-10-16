const $ = id => document.getElementById(id);
const codes = 'DAA DAB DAC DAD DAE DAF DAG DAH DAI DAJ DAK DAL DAM DAN DAO DAP DAQ DAR DAS DAT DAU DAV DAW DAX DAY DAZ DBA DBB DBC DBD DBE DBF DBG DBH DBI DBJ DBK DBL DBM DBN DBO DBP DBQ DBR DBS DCA DCB DCC DCD DCE DCF DCG DCH DCI DCJ DCK DCL DCM DCN DCO DCP DCQ DCR DCS DCT DCU DDA DDB DDC DDD DDE DDF DDG DDH DDI DDJ DDK DDL'.split(' ');
const known = new Set(codes);
function report(text, bad = false) { const s = $('status'); if (s) { s.textContent = text; s.className = bad ? 'error' : 'ok'; s.scrollIntoView({block:'nearest'}); } }
function decode(raw) {
 const text = raw.replace(/\r\n?/g, '\n').replace(/[\x1c-\x1f\t]/g, '\n');
 const lines = text.split('\n').map(x => x.trim()).filter(x => known.has(x.slice(0,3)));
 const fields = Object.create(null);
 const separated = lines.some(x => x.startsWith('DAQ')) && lines.some(x => x.startsWith('DCS'));
 const put = (k,v) => { if (k in fields) throw Error('Ambiguous barcode fields. Preserve scanner line breaks or enter details manually.'); fields[k] = v.trim(); };
 if (separated) { for (const line of lines) put(line.slice(0,3), line.slice(3)); }
 else {
  const start = text.indexOf('DAQ');
  if (start < 0) throw Error('License number field not found. Scan an AAMVA ID or enter details manually.');
  const body = text.slice(start).split(/\n\s*Z[A-Z]/)[0];
  const matches = Array.from(body.matchAll(new RegExp(codes.join('|'), 'g')));
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
 return {recovered:!separated, values:{name:[first,get('DAD'),last,get('DCU')].filter(Boolean).join(' '),street:[get('DAG'),get('DAH')].filter(Boolean).join(', '),city:get('DAI'),state:get('DAJ'),zip:get('DAK'),license:get('DAQ'),expiration,issuer:''}};
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
  report((result.recovered ? 'Joined-field scan recovered: verify every field against the ID. ' : 'Barcode filled: verify every field against the ID. ') + 'Enter phone and license issuing state manually, attach the ID image, finish edits and consent, then confirm times and sign.');
 } catch (error) { report(error.message, true); }
}, true);
