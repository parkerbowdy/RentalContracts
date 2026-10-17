const $ = id => document.getElementById(id);
function install() {
 const form = $('rentalForm'), confirm = $('previewButton'), canvas = $('signature');
 if (!form || !confirm || !canvas || form.dataset.signatureFlow || typeof confirm.onclick !== 'function') return;
 form.dataset.signatureFlow = '1';
 const runPreview = confirm.onclick;
 const calculate = document.createElement('button');
 calculate.type = 'button';
 calculate.id = 'calculateTimesButton';
 calculate.textContent = 'Calculate rental times';
 confirm.before(calculate);
 const heading = canvas.previousElementSibling;
 form.insertBefore(confirm, heading && heading.tagName === 'H3' ? heading : canvas);
 confirm.textContent = 'Confirm information — enable signing';
 const note = document.createElement('p');
 note.id = 'confirmationNote';
 note.setAttribute('role', 'status');
 note.textContent = 'Finish customer details, attach the ID and accept the terms. Then confirm here before signing.';
 confirm.after(note);
 const reset = () => $('name').dispatchEvent(new Event('input', {bubbles:true}));
 const successful = () => $('previewSummary')?.textContent.startsWith('Confirmed:');
 const showStatus = (text, bad = false) => { const s = $('status'); if (s) { s.textContent = text; s.className = bad ? 'error' : 'ok'; } };
 calculate.onclick = async () => {
  if (calculate.disabled || confirm.disabled) return;
  calculate.disabled = true;
  try {
   await runPreview.call(confirm);
   if (!form.isConnected) return;
   const ok = successful();
   const summary = $('previewSummary').textContent;
   reset();
   if (ok) {
    $('previewSummary').textContent = summary.replace(/^Confirmed:/, 'Calculated:') + ' Finish the form, then confirm information above the signature.';
    showStatus('Rental times calculated. Finish the form, then confirm information above the signature.');
   }
  } finally { calculate.disabled = false; }
 };
 confirm.onclick = async () => {
  if (confirm.disabled || calculate.disabled) return;
  if (!form.reportValidity()) { note.textContent = 'Complete the required fields and accept the terms before confirming.'; return; }
  const image = $('idPreview');
  if (!image || image.classList.contains('hidden') || !image.getAttribute('src')) {
   note.textContent = 'Attach the customer ID image before confirming.';
   showStatus(note.textContent, true);
   return;
  }
  calculate.disabled = true;
  try {
   await runPreview.call(confirm);
   if (!form.isConnected) return;
   if (successful()) {
    note.textContent = 'Information confirmed. Review the confirmed times above, then sign below. Any edits require confirmation again.';
    $('sigNote').textContent = 'Information confirmed. Sign here.';
    showStatus('Information confirmed. The customer can now sign.');
   } else { note.textContent = $('status')?.textContent || 'Confirmation failed. Review the form.'; }
  } finally { calculate.disabled = false; }
 };
 form.addEventListener('input', event => {
  if (event.target.id === 'barcode' || event.target.id === 'findCustomer') return;
  note.textContent = 'Information changed. Confirm here again before signing.';
 });
 $('sigNote').textContent = 'Click Confirm information above before signing.';
}
const app = $('app');
if (app) { new MutationObserver(install).observe(app, {childList:true, subtree:true}); install(); }
