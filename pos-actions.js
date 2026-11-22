const $=id=>document.getElementById(id);
function addActions(){
 for(const card of document.querySelectorAll('#outRows > .card')){
  if(card.querySelector('[data-pos-actions]'))continue;
  const match=card.querySelector('p')?.textContent.match(/^Contract (\d+) ·/);if(!match)continue;
  const row=document.createElement('div');row.className='row';row.dataset.posActions='1';
  for(const [action,label] of [['view','View contract'],['return','Return item']]){
   const link=document.createElement('a');link.className='btn';link.textContent=label;const url=new URL('manager.html',location.href);url.searchParams.set('posContract',match[1]);url.searchParams.set('posAction',action);link.href=url.href;row.append(link);
  }card.append(row);
 }
}
const parameters=new URLSearchParams(location.search),number=parameters.get('posContract'),action=parameters.get('posAction');
let stage=number&&/^\d+$/.test(number)&&['view','return'].includes(action)?'waiting':'none';
let timer;
function clearRoute(){const url=new URL(location.href);url.searchParams.delete('posContract');url.searchParams.delete('posAction');history.replaceState(null,'',url.pathname+url.search+url.hash);}
function route(records=[]){
 if(!location.pathname.endsWith('manager.html')||stage==='none'||stage==='done')return;
 const logs=$('logs'),search=$('logSearch'),button=$('searchLog');if(!logs||!search||!button||!logs.children.length)return;
 if(stage==='waiting'){
  stage='searching';search.value=number;if($('logStatus'))$('logStatus').value='';
  timer=setTimeout(()=>{if(stage!=='searching')return;stage='done';clearRoute();const status=$('status');if(status){status.className='error';status.textContent='Could not automatically open contract '+number+'. Use Search, then Open contract or Mark returned. No return has been submitted.';}},30000);
  button.click();return;
 }
 if(!records.some(r=>r.target===logs||logs.contains(r.target)))return;
 const card=[...logs.querySelectorAll('.card')].find(c=>c.querySelector('p')?.textContent.startsWith('Contract '+number+' ·'));
 stage='done';clearTimeout(timer);clearRoute();
 const target=card?.querySelector(action==='view'?'[data-view]':'[data-return]');
 if(target){target.click();return;}
 const status=$('status');if(status){status.className='error';status.textContent=card?'This rental is not currently out. You can still open its contract.':'Contract not found or not available to this staff account. No return has been submitted.';}
}
const app=$('app');if(app){new MutationObserver(records=>{addActions();route(records);}).observe(app,{childList:true,subtree:true});addActions();route();}
