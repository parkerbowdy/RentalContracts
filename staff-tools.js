import {SUPABASE_URL,SUPABASE_KEY} from './config.js';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(path,method='GET',body){
 const session=JSON.parse(sessionStorage.getItem('jt_session')||'null');
 if(!session?.access_token)throw Error('Sign in before using this feature.');
 const r=await fetch(SUPABASE_URL+'/rest/v1/'+path,{method,headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+session.access_token,...(body?{'Content-Type':'application/json',Prefer:'return=minimal'}:{})},body:body?JSON.stringify(body):undefined});
 const text=await r.text();let data;try{data=text?JSON.parse(text):null}catch{throw Error('The rental server is unavailable. Try again later.');}
 if(!r.ok)throw Error(r.status===401?'Session expired. Sign in again.':data?.message||'Request failed.');return data;
}
const eastern=x=>x?new Date(x).toLocaleString('en-US',{timeZone:'America/New_York'}):'Not recorded';
function installOut(){
 if(!$('itemSearch')||$('staffOut'))return;
 const box=document.createElement('section');box.id='staffOut';box.className='no-print';
 box.innerHTML='<h2>Rentals currently out</h2><p>Due times are Eastern. Only signed-in staff can view these records.</p><div class="row"><button type="button" id="refreshOut">Refresh</button><a href="manager.html">Open rentals / returns</a></div><p id="outStatus" role="status"></p><div id="outRows"></div><button type="button" id="outPrevious" class="alt">Previous 50</button><button type="button" id="outNext" class="alt">Next 50</button>';
 $('app').append(box);let page=0;
 async function render(){
  const buttons=[...box.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);box.querySelector('#outStatus').textContent='Loading out rentals…';box.querySelector('#outRows').replaceChildren();let rows=[];
  try{rows=await api('jt_contracts?select=contract_number,customer_snapshot,item_snapshot,out_at,due_at&status=eq.out&order=due_at.asc,id.asc&limit=50&offset='+page*50);if(!box.isConnected)return;
   box.querySelector('#outRows').innerHTML=rows.map(r=>'<div class="card"><b>'+esc(r.customer_snapshot?.name)+' — '+esc(r.item_snapshot?.name)+'</b><p>Contract '+esc(r.contract_number)+' · Item #'+esc(r.item_snapshot?.item_number)+'<br>Out: '+esc(eastern(r.out_at))+'<br>Due: '+esc(eastern(r.due_at))+'</p>'+(new Date(r.due_at)<new Date()?'<p class="overdue">OVERDUE</p>':'')+'</div>').join('');
   box.querySelector('#outStatus').textContent=rows.length?'Showing out rentals '+(page*50+1)+'–'+(page*50+rows.length)+'. Refreshed '+new Date().toLocaleTimeString()+'.':'No out rentals on this page.';
  }catch(e){box.querySelector('#outStatus').textContent=e.message;}finally{buttons.forEach(b=>b.disabled=false);box.querySelector('#outPrevious').disabled=page===0;box.querySelector('#outNext').disabled=rows.length<50;}
 }
 box.querySelector('#refreshOut').onclick=render;box.querySelector('#outPrevious').onclick=()=>{page=Math.max(0,page-1);render()};box.querySelector('#outNext').onclick=()=>{page++;render()};render();
}
function csv(text){
 const rows=[];let row=[],field='',quoted=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(field);field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(v=>v.trim()))rows.push(row);row=[];field='';}else field+=c;}
 if(quoted)throw Error('Unclosed quoted field in CSV.');row.push(field);if(row.some(v=>v.trim()))rows.push(row);return rows;
}
function installImport(){
 if(!$('itemForm')||$('priceImport'))return;
 const box=document.createElement('section');box.id='priceImport';box.className='no-print';
 box.innerHTML='<h2>Import items and prices</h2><p>Manager only. Import a UTF-8 CSV spreadsheet. For Excel files, first use Save As → CSV UTF-8. Imports add new items only; existing item numbers are rejected, not overwritten.</p><p>Required columns: <code>name,item_number,price_4hr,price_24hr,price_5day,deposit</code>. Optional: <code>description,specifications</code>. All four prices must be nonnegative numbers. Keep item numbers as text to preserve leading zeros.</p><div class="row"><button type="button" id="itemTemplate" class="alt">Download CSV template</button><button type="button" id="manualItem" class="alt">Add item manually</button></div><label>Price spreadsheet (.csv)<input id="priceFile" type="file" accept=".csv,text/csv"></label><p id="importStatus" role="status" aria-live="polite">Choose a CSV to validate and preview before saving.</p><pre id="importPreview"></pre><button type="button" id="saveImport" disabled>Import new items</button>';
 $('itemForm').closest('section').before(box);
 box.querySelector('#manualItem').onclick=()=>{$('itemForm').scrollIntoView({behavior:'smooth'});$('itemName').focus({preventScroll:true});};
 box.querySelector('#itemTemplate').onclick=()=>{const url=URL.createObjectURL(new Blob(['name,item_number,price_4hr,price_24hr,price_5day,deposit,description,specifications\r\n'],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='rental-price-template.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 let pending=[],next=0;const file=box.querySelector('#priceFile'),save=box.querySelector('#saveImport'),message=box.querySelector('#importStatus');let selection=0;
 file.onchange=async()=>{const selected=++selection;pending=[];next=0;save.disabled=true;box.querySelector('#importPreview').textContent='';message.textContent='Validating…';
  try{const f=file.files[0];if(!f){message.textContent='Choose a CSV.';return;}if(!/\.csv$/i.test(f.name))throw Error('Choose a CSV file, not an Excel workbook.');if(f.size>2000000)throw Error('Use a CSV smaller than 2 MB.');const rows=csv(await f.text());if(selected!==selection)return;const headers=(rows.shift()||[]).map(v=>v.trim().toLowerCase());const required=['name','item_number','price_4hr','price_24hr','price_5day','deposit'];const allowed=[...required,'description','specifications'];if(headers.some((v,i)=>!allowed.includes(v)||headers.indexOf(v)!==i)||required.some(v=>!headers.includes(v)))throw Error('Use the template column names, each exactly once.');if(!rows.length||rows.length>1000)throw Error('Import between 1 and 1,000 items at a time.');const seen=new Set();
   pending=rows.map((values,index)=>{if(values.length!==headers.length)throw Error('Wrong column count on data row '+(index+1)+'.');const item=Object.fromEntries(headers.map((h,i)=>[h,values[i].trim()]));if(!item.name||!item.item_number)throw Error('Missing name or item number on data row '+(index+1)+'.');if(seen.has(item.item_number))throw Error('Duplicate item number in sheet: '+item.item_number);seen.add(item.item_number);for(const key of required.slice(2)){const v=item[key].replace(/^\$/,'').replace(/,/g,'');if(!/^\d+(\.\d{1,2})?$/.test(v)||!Number.isFinite(Number(v)))throw Error('Invalid '+key+' on data row '+(index+1)+'.');item[key]=Number(v);}return {...item,description:item.description||'',specifications:item.specifications||'',active:true};});
   const existing=new Set();for(let offset=0;;offset+=1000){const chunk=await api('jt_items?select=item_number&order=id.asc&limit=1000&offset='+offset);if(selected!==selection)return;chunk.forEach(x=>existing.add(x.item_number));if(chunk.length<1000)break;}
   const duplicates=pending.filter(x=>existing.has(x.item_number));if(duplicates.length)throw Error('Already-existing item numbers: '+duplicates.slice(0,10).map(x=>x.item_number).join(', ')+'. Remove these rows; edit existing prices in the manual item list.');
   box.querySelector('#importPreview').textContent=pending.slice(0,10).map(x=>x.item_number+' | '+x.name+' | 4 HR $'+x.price_4hr.toFixed(2)+' | 24 HR $'+x.price_24hr.toFixed(2)+' | 5 DAY $'+x.price_5day.toFixed(2)+' | Deposit $'+x.deposit.toFixed(2)).join('\n');message.textContent=pending.length+' new items validated. Preview shows up to 10 rows. Nothing has been saved.';save.disabled=false;
  }catch(e){if(selected===selection){pending=[];message.textContent=e.message;}}
 };
 save.onclick=async()=>{if(save.disabled||!pending.length)return;if(!window.confirm('Add '+(pending.length-next)+' new items to the live price list? Existing prices will not be changed.'))return;save.disabled=true;file.disabled=true;
  try{while(next<pending.length){message.textContent='Saving item '+(next+1)+' of '+pending.length+'…';await api('jt_items','POST',pending[next]);next++;}message.textContent='Imported '+next+' items. Reload the page to refresh the price list and manual item list.';pending=[];save.textContent='Import complete';const reload=document.createElement('button');reload.type='button';reload.textContent='Reload item list';reload.onclick=()=>location.reload();box.append(reload);
  }catch(e){message.textContent='Saved '+next+' of '+pending.length+' items. Stopped on '+pending[next].item_number+': '+e.message+' Already saved rows will not be repeated when retrying here.';save.disabled=false;save.textContent='Retry remaining items';}
  finally{file.disabled=false;}
 };
}
function install(){if(!location.pathname.endsWith('manager.html'))installOut();installImport();}
const app=$('app');if(app){new MutationObserver(install).observe(app,{childList:true,subtree:true});install();}
