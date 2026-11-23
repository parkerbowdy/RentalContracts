const codes='DAA DAB DAC DAD DAE DAF DAG DAH DAI DAJ DAK DAL DAM DAN DAO DAP DAQ DAR DAS DAT DAU DAV DAW DAX DAY DAZ DBA DBB DBC DBD DBE DBF DBG DBH DBI DBJ DBK DBL DBM DBN DBO DBP DBQ DBR DBS DCA DCB DCC DCD DCE DCF DCG DCH DCI DCJ DCK DCL DCM DCN DCO DCP DCQ DCR DCS DCT DCU DDA DDB DDC DDD DDE DDF DDG DDH DDI DDJ DDK DDL'.split(' ');
const known=new Set(codes),used=new Set(['DAQ','DAC','DCT','DCS','DAB','DAD','DCU','DAG','DAH','DAI','DAJ','DAK','DBA','DCG']);
function summarize(raw){
 if(!raw.trim())return 'Scan an ID into the barcode box first.';
 if(raw.length>20000)return 'Scan layout L4: input too long. Clear the barcode box and scan once.';
 const text=raw.replace(/\r\n?/g,'\n').replace(/[\x1c-\x1f\t]/g,'\n');
 const lines=text.split('\n').map(x=>x.trim()).filter(x=>known.has(x.slice(0,3))).map(x=>x.slice(0,3));
 const start=text.indexOf('DAQ'),body=start<0?'':text.slice(start).split(/\n\s*Z[A-Z]/)[0];
 const matches=[...body.matchAll(new RegExp(codes.join('|'),'g'))],counts={};matches.forEach(m=>counts[m[0]]=(counts[m[0]]||0)+1);
 const duplicate=codes.filter(k=>counts[k]>1).map(k=>k+' x'+counts[k]).join(', ')||'none';
 const count=re=>(raw.match(re)||[]).length;
 const report=['Scan layout L4 (field labels only; no ID values)','ANSI headers: '+count(/ANSI\s*\d{6}/g),'Separator counts: CR='+count(/\r/g)+' LF='+count(/\n/g)+' TAB='+count(/\t/g)+' control='+count(/[\x1c-\x1f]/g),'Literal escaped newline text: '+(/\\[rn]|<CR>|<LF>|\^M|\^J/.test(raw)?'present':'absent'),'Parser mode: '+(lines.includes('DAQ')&&lines.includes('DCS')?'line-separated':'joined-field recovery'),'Line-start labels: '+(lines.slice(0,160).join(' ')||'none'),'Recovery labels from DAQ: '+(matches.slice(0,160).map(m=>m[0]).join(' ')||'none'),'Repeated recovery labels: '+duplicate];
 let n=0;matches.forEach((m,i)=>{if(m[0]!=='DDA'||++n>8)return;const before=matches.slice(0,i).map(x=>x[0]);const missing=['DAQ','DBA','DAG','DAI','DAJ','DAK'].filter(k=>!before.includes(k));if(!before.includes('DAC')&&!before.includes('DCT'))missing.push('first-name label');if(!before.includes('DCS')&&!before.includes('DAB'))missing.push('last-name label');const after=[...new Set(matches.slice(i+1).map(x=>x[0]).filter(k=>used.has(k)))];const value=body.slice(m.index+3,i+1<matches.length?matches[i+1].index:body.length).trim();report.push('DDA occurrence '+n+': single-letter F/N shape=' + (/^[FN]$/.test(value)?'yes':'no')+'; required labels missing before='+(missing.join(' ')||'none')+'; customer labels after='+(after.join(' ')||'none'));});
 if(matches.length>160||lines.length>160)report.push('Label order truncated to 160 labels.');return report.join('\n');
}
function install(){
 const parse=document.getElementById('parse'),barcode=document.getElementById('barcode');if(!parse||!barcode||document.getElementById('safeScanLayout'))return;
 const box=document.createElement('div');box.id='safeScanLayout';box.className='no-print';const button=document.createElement('button');button.type='button';button.className='alt';button.textContent='Show safe scan layout';const label=document.createElement('label');label.textContent='Safe scan layout report — share only this report, not the barcode box';const output=document.createElement('textarea');output.readOnly=true;output.rows=10;output.className='hidden';output.setAttribute('aria-label','Safe scan layout report');output.spellcheck=false;label.append(output);box.append(button,label);parse.after(box);
 button.onclick=()=>{try{output.value=summarize(barcode.value);}catch{output.value='Scan layout L4: unable to analyze. No ID values were recorded.';}output.classList.remove('hidden');output.focus();output.select();};barcode.addEventListener('input',()=>{output.value='';output.classList.add('hidden');});
}
const app=document.getElementById('app');if(app){new MutationObserver(install).observe(app,{childList:true,subtree:true});install();}
