const app=document.getElementById('app');
function install(){
 const form=document.getElementById('itemForm'),importer=document.getElementById('priceImport');
 if(!form||!importer||document.getElementById('managerItemActions'))return;
 const section=document.createElement('section');section.id='managerItemActions';section.className='no-print';
 const heading=document.createElement('h2');heading.textContent='Items and pricing';
 const row=document.createElement('div');row.className='row';
 const add=document.createElement('button');add.type='button';add.textContent='Add item';
 add.onclick=()=>{
  const fields=[...form.querySelectorAll('input,textarea')];
  if(fields.some(field=>field.value.trim())&&!window.confirm('Clear the current item form and start a new item? Unsaved changes in this form will be lost.'))return;
  form.reset();document.getElementById('editItemId').value='';form.scrollIntoView({behavior:'smooth',block:'start'});document.getElementById('itemName').focus({preventScroll:true});
 };
 const upload=document.createElement('button');upload.type='button';upload.textContent='Import price sheet';
 upload.onclick=()=>{importer.scrollIntoView({behavior:'smooth',block:'start'});document.getElementById('priceFile').focus({preventScroll:true});};
 row.append(add,upload);const note=document.createElement('p');note.className='muted';note.textContent='Add items individually or import a CSV price spreadsheet. Review the import preview before saving.';
 section.append(heading,row,note);app.prepend(section);
}
if(app){new MutationObserver(install).observe(app,{childList:true,subtree:true});install();}
