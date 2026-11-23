const $=id=>document.getElementById(id);
function detect(image){
 const c=document.createElement('canvas'),scale=Math.min(1,640/Math.max(image.width,image.height));c.width=Math.round(image.width*scale);c.height=Math.round(image.height*scale);const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,c.width,c.height);const w=c.width,h=c.height,p=ctx.getImageData(0,0,w,h).data;
 const corners=[[2,2],[w-3,2],[2,h-3],[w-3,h-3]].map(([x,y])=>{const i=(y*w+x)*4;return [p[i],p[i+1],p[i+2]]});
 if(corners.some(a=>corners.some(b=>a.some((v,k)=>Math.abs(v-b[k])>35))))return null;
 const bg=[0,1,2].map(k=>corners.reduce((n,a)=>n+a[k],0)/4),mask=new Uint8Array(w*h),seen=new Uint8Array(w*h),queue=new Int32Array(w*h),candidates=[];
 for(let i=0;i<mask.length;i++)mask[i]=Math.max(...bg.map((v,k)=>Math.abs(p[i*4+k]-v)))>38?1:0;
 for(let start=0;start<mask.length;start++){if(!mask[start]||seen[start])continue;let head=0,tail=1,minX=w,minY=h,maxX=0,maxY=0,count=0;queue[0]=start;seen[start]=1;
  while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);for(const n of [x?i-1:-1,x+1<w?i+1:-1,y?i-w:-1,y+1<h?i+w:-1])if(n>=0&&mask[n]&&!seen[n]){seen[n]=1;queue[tail++]=n;}}
  const bw=maxX-minX+1,bh=maxY-minY+1,ratio=Math.max(bw/bh,bh/bw),area=bw*bh;
  if(bw<35||bh<35||ratio<1.4||ratio>1.85||area<w*h*.006||area>w*h*.94||count<area*.3||minX<2||minY<2||maxX>w-3||maxY>h-3)continue;
  let top=0,bottom=0,left=0,right=0;for(let x=minX;x<=maxX;x++){let a=0,b=0;for(let d=0;d<3;d++){a|=mask[(minY+d)*w+x];b|=mask[(maxY-d)*w+x];}top+=a;bottom+=b;}for(let y=minY;y<=maxY;y++){let a=0,b=0;for(let d=0;d<3;d++){a|=mask[y*w+minX+d];b|=mask[y*w+maxX-d];}left+=a;right+=b;}
  if(Math.min(top/bw,bottom/bw,left/bh,right/bh)<.7)continue;
  const pad=Math.max(4,Math.ceil(Math.max(bw,bh)*.03));candidates.push({area,x:Math.max(0,minX-pad)/w,y:Math.max(0,minY-pad)/h,right:Math.min(w,maxX+pad+1)/w,bottom:Math.min(h,maxY+pad+1)/h});
 }
 candidates.sort((a,b)=>b.area-a.area);if(!candidates.length||(candidates[1]&&candidates[1].area>candidates[0].area*.25))return null;return candidates[0];
}
let active=false;
document.addEventListener('change',async event=>{
 const input=event.target;if(!(input instanceof HTMLInputElement)||!['idFile','idCamera'].includes(input.id)||!$('rentalForm')||typeof input.onchange!=='function'||!input.files?.[0])return;
 event.stopImmediatePropagation();const file=input.files[0],handler=input.onchange,form=$('rentalForm');input.value='';if(active)return;active=true;let image=null,dialog=null;
 function report(text){const status=$('status');if(status){status.textContent=text;status.className='error';}}
 try{
  if(file.size>15e6)throw Error('Use an ID image under 15 MB.');
  image=await createImageBitmap(file,{imageOrientation:'from-image'});if(!form.isConnected)return;if(image.width<20||image.height<20||image.width*image.height>50000000)throw Error('Use an image between 20 pixels and 50 megapixels.');
  let suggestion=null;try{suggestion=detect(image);}catch{}
  dialog=document.createElement('dialog');dialog.setAttribute('aria-label','Review ID crop');dialog.innerHTML='<h2>Review ID image</h2><p data-message></p><p>Keep all four corners and all ID information visible. Drag a rectangle on the image or adjust the percentages below. This preview stays in this browser.</p><canvas aria-label="ID crop selection; use the percentage fields for keyboard adjustment"></canvas><div class="grid"><label>Left (%)<input data-edge="x" type="number" min="0" max="99" step="0.1"></label><label>Top (%)<input data-edge="y" type="number" min="0" max="99" step="0.1"></label><label>Right (%)<input data-edge="right" type="number" min="1" max="100" step="0.1"></label><label>Bottom (%)<input data-edge="bottom" type="number" min="1" max="100" step="0.1"></label></div><p data-error role="alert"></p><button type="button" data-use>Use selected image</button><button type="button" class="alt" data-original>Use original</button><button type="button" class="alt" data-cancel>Cancel</button>';
  dialog.querySelector('[data-message]').textContent=suggestion?'An ID-shaped border was detected. Check the suggested crop before attaching.':'No clear single ID border detected. The full image is selected; adjust it manually or use the original.';
  const canvas=dialog.querySelector('canvas'),s=Math.min(1,900/Math.max(image.width,image.height));canvas.width=Math.round(image.width*s);canvas.height=Math.round(image.height*s);canvas.style.cssText='width:100%;height:auto;display:block;touch-action:none;cursor:crosshair';const ctx=canvas.getContext('2d');let rect=suggestion||{x:0,y:0,right:1,bottom:1},origin=null;
  const fields=[...dialog.querySelectorAll('[data-edge]')],use=dialog.querySelector('[data-use]'),original=dialog.querySelector('[data-original]'),cancel=dialog.querySelector('[data-cancel]');
  const valid=()=>rect.x>=0&&rect.y>=0&&rect.right<=1&&rect.bottom<=1&&(rect.right-rect.x)*image.width>=10&&(rect.bottom-rect.y)*image.height>=10;
  function draw(sync=true){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);const x=rect.x*canvas.width,y=rect.y*canvas.height,w=(rect.right-rect.x)*canvas.width,h=(rect.bottom-rect.y)*canvas.height;ctx.fillStyle='#0008';ctx.fillRect(0,0,canvas.width,y);ctx.fillRect(0,y+h,canvas.width,canvas.height-y-h);ctx.fillRect(0,y,x,h);ctx.fillRect(x+w,y,canvas.width-x-w,h);ctx.strokeStyle='#ff253b';ctx.lineWidth=3;ctx.strokeRect(x,y,w,h);if(sync)fields.forEach(f=>f.value=(rect[f.dataset.edge]*100).toFixed(1));use.disabled=!valid();}
  fields.forEach(f=>f.oninput=()=>{const value=Number(f.value);if(f.value===''||!Number.isFinite(value)){use.disabled=true;return;}rect={...rect,[f.dataset.edge]:value/100};draw(false);});
  const point=e=>{const b=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(e.clientX-b.left)/b.width)),y:Math.max(0,Math.min(1,(e.clientY-b.top)/b.height))};};
  canvas.onpointerdown=e=>{if(!e.isPrimary)return;origin=point(e);canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(!origin)return;const p=point(e);rect={x:Math.min(origin.x,p.x),y:Math.min(origin.y,p.y),right:Math.max(origin.x,p.x),bottom:Math.max(origin.y,p.y)};draw();};canvas.onpointerup=canvas.onpointercancel=()=>{origin=null;};
  const choice=await new Promise(resolve=>{use.onclick=()=>{if(valid())resolve('crop');};original.onclick=()=>resolve('original');cancel.onclick=()=>resolve('cancel');dialog.oncancel=e=>{e.preventDefault();resolve('cancel');};document.body.append(dialog);draw();dialog.showModal();});
  if(choice==='cancel'||!form.isConnected)return;use.disabled=original.disabled=cancel.disabled=true;
  let output=file;
  if(choice==='crop'){const x=Math.floor(rect.x*image.width),y=Math.floor(rect.y*image.height),w=Math.min(image.width-x,Math.ceil((rect.right-rect.x)*image.width)),h=Math.min(image.height-y,Math.ceil((rect.bottom-rect.y)*image.height)),out=document.createElement('canvas'),scale=Math.min(1,1800/Math.max(w,h));out.width=Math.max(1,Math.round(w*scale));out.height=Math.max(1,Math.round(h*scale));out.getContext('2d').drawImage(image,x,y,w,h,0,0,out.width,out.height);const blob=await new Promise(r=>out.toBlob(r,'image/jpeg',.96));if(!blob)throw Error('Could not create cropped image. Select the image again and choose Use original.');output=new File([blob],'id-cropped.jpg',{type:'image/jpeg'});}
  if(!form.isConnected)return;dialog.close();await handler.call(input,{target:{files:[output]}});
 }catch(e){report(e.message||'Could not prepare the ID image. Please select it again.');}
 finally{if(dialog){if(dialog.open)dialog.close();dialog.remove();}if(image)image.close();active=false;}
},true);
