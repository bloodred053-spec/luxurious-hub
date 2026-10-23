let csrf='';async function api(path,opt={}){const r=await fetch(path,{credentials:'same-origin',headers:{'content-type':'application/json',...(opt.headers||{})},...opt});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Request failed');return d}const rupee=n=>'₹'+Number(n).toLocaleString('en-IN');
const ADMIN_STORE_CATEGORIES=['Watches','Perfumes','Attar','Wireless Speakers','Wireless Neckband','Wired Earphones','TWS Earbuds','Power Banks','Mobile Accessories','Microphones','Holders & Stands','Headphone','Fans','Data Cables','Charger'];
function adminGuessCategory(name,current='Mobile Accessories'){const categories=ADMIN_STORE_CATEGORIES;const legacy=['Mobile Accessories','Other Phone Accessories','Wireless Neckbands','Wireless Earbuds','Phone Holders & Stands','Chargers & Cables'];const aliases={'Wireless Neckbands':'Wireless Neckband','Wireless Earbuds':'TWS Earbuds','Phone Holders & Stands':'Holders & Stands','Other Phone Accessories':'Mobile Accessories'};const currentAlias=aliases[current]||current;if(categories.includes(currentAlias)&&!legacy.includes(current))return currentAlias;const n=String(name||'').toLowerCase();const rules=[[/speaker/,'Wireless Speakers'],[/wired.{0,12}(earphone|earbud|headphone|headset)|(earphone|earbud|headphone|headset).{0,12}wired/,'Wired Earphones'],[/neckband/,'Wireless Neckband'],[/\b(tws|earbuds?|airpods?)\b/,'TWS Earbuds'],[/power\s*bank|powerbank|slim bank/,'Power Banks'],[/microphone|\bmic\b/,'Microphones'],[/charger|power adapter/,'Charger'],[/\b(cable|cord|lead)\b|charging cable|data cable|lightning cable/,'Data Cables'],[/holder|\bstand\b/,'Holders & Stands'],[/headphones?|\bheadset\b/,'Headphone'],[/\bfan\b/,'Fans']];const hit=rules.find(([re])=>re.test(n));if(hit)return hit[1];return categories.includes(currentAlias)?currentAlias:'Mobile Accessories';}
const root=document.getElementById('adminRoot');function login(){root.innerHTML=`<div class="panel" style="max-width:460px;margin:60px auto"><div class="eyebrow">Luxurious Hub</div><h1 style="font-size:42px">Store Admin</h1><p class="muted">Sign in to manage products, images, orders, coupons and settings.</p><form id="login" class="formgrid" style="margin-top:18px"><input id="u" required placeholder="Username"><input id="p" required type="password" placeholder="Password"><button class="btn full">Sign in</button></form><div id="msg" class="muted" style="margin-top:10px"></div></div>`;document.getElementById('login').onsubmit=async e=>{e.preventDefault();try{const r=await api('/api/admin/login',{method:'POST',body:JSON.stringify({username:u.value,password:p.value})});csrf=r.csrf;home()}catch(err){document.getElementById('msg').textContent=err.message}}}async function boot(){try{const s=await api('/api/admin/session');if(!s.authenticated)return login();csrf=s.csrf;home()}catch{login()}}function home(){root.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap"><div><div class="eyebrow">LUXURIOUS HUB</div><h1 style="font-size:42px">Admin Dashboard</h1></div><button class="mini" onclick="logout()">Logout</button></div><div class="admin-tabs" style="display:flex;gap:7px;flex-wrap:wrap;margin:18px 0"><button class="mini" onclick="products()">Products</button><button class="mini" onclick="orders()">Orders</button><button class="mini" onclick="coupons()">Coupons</button><button class="mini" onclick="customers()">Customers</button><button class="mini" onclick="settings()">Settings</button></div><div id="panel"></div>`;products()}async function products(){const r=await api('/api/admin/products');csrf=r.csrf;panel.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h2>Products</h2><button class="btn" onclick="editProduct()">+ Add Product</button></div><table class="admin-table"><thead><tr><th>Image</th><th>Product</th><th>Price</th><th>Stock</th><th></th></tr></thead><tbody>${r.products.map(p=>`<tr><td>${p.image_url?`<img src="${p.image_url}" style="width:54px;height:54px;object-fit:cover">`:'—'}</td><td><strong>${p.name}</strong><br><span class="muted">${adminGuessCategory(p.name,p.category)}</span></td><td>${rupee(p.price)}<br><span class="muted">${rupee(p.mrp)}</span></td><td>${p.stock}</td><td><button class="mini" onclick="editProduct(${p.id})">Edit</button></td></tr>`).join('')}</tbody></table>`}async function editProduct(id){
  const result=await api('/api/admin/products');
  csrf=result.csrf||csrf;
  const p=id?result.products.find(x=>Number(x.id)===Number(id)):{name:'',slug:'',category:'Watches',price:0,mrp:0,stock:0,tag:'New',rating:0,description:'',specifications:{},image_url:'',image_variants:{}};
  if(id&&!p){alert('Product not found. Refresh the product list and try again.');return}
  const safe=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const labelStyle='display:block;font-size:12px;font-weight:600;color:#333;min-width:0';
  const inputStyle='display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:10px;border:1px solid #dddeda;background:#fff';
  const slots=[{key:'large',label:'LARGE',hint:'Original / high resolution'},{key:'medium',label:'MEDIUM',hint:'600 × 600'},{key:'listing',label:'LISTING',hint:'360 × 360'},{key:'small',label:'SMALL',hint:'120 × 120'}];
  panel.innerHTML=`
    <button class="mini" type="button" onclick="products()">← Products</button>
    <h2 style="margin:16px 0">${id?'Edit':'Add'} product</h2>
    <form id="pf" class="formgrid" style="gap:14px">
      <section class="full panel" style="padding:16px;display:grid;gap:14px">
        <div><h3 style="margin:0 0 5px">Product basics</h3><p class="muted" style="margin:0;line-height:1.5">Product name customer ko website par dikhega. URL slug naam se automatically banega; zaroorat ho toh edit kar sakte ho.</p></div>
        <label class="full" style="${labelStyle}">Product name
          <input id="n" required style="${inputStyle}" placeholder="e.g. Casio Analog Watch" value="${safe(p.name)}">
        </label>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">
          <label style="${labelStyle}">Product URL slug
            <div style="display:flex;gap:7px;align-items:center;margin-top:6px"><input id="slug" style="display:block;min-width:0;flex:1;box-sizing:border-box;padding:10px;border:1px solid #dddeda;background:#fff;margin:0" placeholder="casio-analog-watch" value="${safe((!p.slug||String(p.slug)!==String(p.slug).toLowerCase()||/[^a-z0-9-]/.test(String(p.slug)))?String(p.name||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''):p.slug)}"><button id="generateSlug" type="button" class="mini" style="flex:0 0 auto;padding:10px">Generate</button></div>
            <small style="display:block;font-weight:400;color:#737970;margin-top:5px">Lowercase letters and hyphens, e.g. casio-analog-watch.</small>
          </label>
          <label style="${labelStyle}">Category
            <select id="cat" style="${inputStyle}">${ADMIN_STORE_CATEGORIES.map(category=>`<option value="${category}">${category}</option>`).join('')}</select>
          </label>
        </div>
      </section>

      <section class="full panel" style="padding:16px;display:grid;gap:14px">
        <div><h3 style="margin:0 0 5px">Price & stock</h3><p class="muted" style="margin:0;line-height:1.5">Set the selling price, original price and available quantity.</p></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px">
          <label style="${labelStyle}">Selling price (₹)
            <input id="price" type="number" min="0" required style="${inputStyle}" value="${Number(p.price||0)}" placeholder="e.g. 24999">
          </label>
          <label style="${labelStyle}">MRP / original price (₹)
            <input id="mrp" type="number" min="0" required style="${inputStyle}" value="${Number(p.mrp||0)}" placeholder="e.g. 32999">
          </label>
          <label style="${labelStyle}">Available quantity
            <input id="stock" type="number" min="0" required style="${inputStyle}" value="${Number(p.stock||0)}" placeholder="e.g. 5">
          </label>
        </div>
      </section>

      <section class="full panel" style="padding:16px;display:grid;gap:14px">
        <div><h3 style="margin:0 0 5px">Product card display</h3><p class="muted" style="margin:0;line-height:1.5">Ye label aur rating product ki card par dikhte hain.</p></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">
          <label style="${labelStyle}">Card badge (optional)
            <input id="tag" style="${inputStyle}" value="${safe(p.tag||'New')}" placeholder="New / Featured / Bestseller">
            <small style="display:block;font-weight:400;color:#737970;margin-top:5px">Small tag, jaise New ya Bestseller.</small>
          </label>
          <label style="${labelStyle}">Displayed rating (out of 5)
            <input id="rating" type="number" min="0" max="5" step="0.1" style="${inputStyle}" value="${Number(p.rating||0)}" placeholder="e.g. 4.5">
            <small style="display:block;font-weight:400;color:#737970;margin-top:5px">Sirf genuine customer rating enter karein. Rating nahi hai toh 0 rakhein.</small>
          </label>
        </div>
      </section>

      <section class="full panel" style="padding:16px">
        <label class="full" style="${labelStyle}">Product description
          <small style="display:block;font-weight:400;color:#737970;margin-top:4px">Customer ko product ke baare mein short aur clear information dein.</small>
          <textarea id="desc" rows="4" style="${inputStyle}" placeholder="Write a few lines about the product...">${safe(p.description||'')}</textarea>
        </label>
      </section>

      <div class="full panel" style="padding:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div><h3 style="margin:0 0 5px">Product specifications</h3><p class="muted" style="margin:0;line-height:1.5">Normal fields fill karo—JSON code ki zaroorat nahi. Blank rows save nahi hongi.</p></div>
          <button id="addSpecRow" class="mini" type="button" style="flex:0 0 auto">+ Add specification</button>
        </div>
        <div id="specRows" style="display:grid;gap:10px;margin-top:14px"></div>
        <p class="muted" style="margin:10px 0 0">Examples: Brand, Display Type, Ideal For, Mechanism, Warranty, Country of Origin.</p>
      </div>
      <div class="full panel" style="padding:14px">
        <h3 style="margin-bottom:7px">Product Image Sizes</h3>
        <p class="muted" style="line-height:1.6;margin:0 0 14px">Shortcut: sirf LARGE image upload karo. Admin automatically 600 × 600 MEDIUM, 360 × 360 LISTING aur 120 × 120 SMALL versions banayega aur preview dikhayega. Product poora visible rahega—crop ya stretch nahi hoga. Kisi size ki apni image/HTTPS URL dena ho toh woh auto version ko override karegi. Existing saved images Save dabane tak change nahi hoti.</p>
        <div id="autoSizeStatus" class="notice-box" style="margin:0 0 14px" aria-live="polite">Choose a LARGE image to automatically create the other 3 sizes.</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:12px;margin-bottom:14px">
          <label style="${labelStyle}">Image Type<select id="pImageType" style="${inputStyle}"><option value="product">Product Image</option><option value="tech">Tech. Image</option><option value="gallery">Gallery Image</option><option value="lifestyle">Lifestyle Image</option></select></label>
          <label style="${labelStyle}">Title for Image<input id="pImageTitle" style="${inputStyle}" value="${safe(p.name)}" placeholder="Image title"></label>
          <label style="${labelStyle}">Option Code (OP-Code)<input id="pImageOption" style="${inputStyle}" value="0"></label>
          <label style="${labelStyle}">Sort Order<input id="pImageSort" type="number" style="${inputStyle}" value="0"></label>
          <label style="${labelStyle}">Image Style<select id="pImageStyle" style="${inputStyle}"><option value="none">None</option><option value="studio">Studio Image</option><option value="lifestyle">Lifestyle Image</option></select></label>
          <label style="${labelStyle};display:flex;align-items:center;gap:7px"><input id="pImageSlider" type="checkbox" style="width:auto"> Show image in slider</label>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
          ${slots.map(slot=>{const v=p.image_variants?.[slot.key];const current=v?.url||(slot.key==='large'?p.image_url:'');return `<div style="border:1px solid #dddeda;border-radius:4px;padding:12px;background:#fff;min-width:0"><div style="background:#f3f3ef;padding:7px;text-align:center;font-weight:700;font-size:12px">${slot.label}</div><p class="muted" style="margin:8px 0">${slot.hint}</p>${current?`<img src="${safe(current)}" alt="${slot.label} current image" style="display:block;width:76px;height:76px;object-fit:contain;margin:0 auto 8px;border:1px solid #eee">${id?`<button type="button" class="mini" style="display:block;width:100%;margin:8px 0;color:#9e3f35" onclick="removeImageVariant(${Number(id)},'${slot.key}')">Remove ${slot.label.toLowerCase()} image</button>`:''}`:'<div style="height:76px;display:grid;place-items:center;color:#8a8f89;font-size:11px">No image saved</div>'}<div id="autoPreview_${slot.key}" style="margin:8px 0;text-align:center"></div><label style="display:block;font-size:12px">Choose image<input id="pi_${slot.key}" type="file" accept="image/png,image/jpeg,image/webp" style="display:block;width:100%;margin-top:7px"></label><label style="display:block;font-size:12px;margin-top:10px">Or enter full HTTPS URL<input id="piUrl_${slot.key}" type="url" placeholder="https://example.com/image.webp" style="${inputStyle}"></label></div>`}).join('')}
        </div>
      </div>
      <button class="btn full" type="submit">Save Product and Images</button>
    </form>`;
  document.getElementById('cat').value=adminGuessCategory(p.name,p.category||'Watches');
  const nameInput=document.getElementById('n');
  const slugInput=document.getElementById('slug');
  const slugifyValue=value=>String(value??'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  let slugEdited=false;
  slugInput.addEventListener('input',()=>{slugEdited=true;});
  nameInput.addEventListener('input',()=>{
    if(!slugEdited)slugInput.value=slugifyValue(nameInput.value);
    const imageTitle=document.getElementById('pImageTitle');
    if(imageTitle&&!imageTitle.dataset.manuallyEdited)imageTitle.value=nameInput.value;
  });
  slugInput.addEventListener('change',()=>{slugInput.value=slugifyValue(slugInput.value);});
  document.getElementById('generateSlug').addEventListener('click',()=>{slugEdited=false;slugInput.value=slugifyValue(nameInput.value);});
  document.getElementById('pImageTitle').addEventListener('input',e=>{e.target.dataset.manuallyEdited='true';});
  function flattenSpecification(obj,prefix=''){
    if(Array.isArray(obj))return [[prefix,obj.map(v=>typeof v==='object'?JSON.stringify(v):String(v)).join(', ')]];
    if(obj&&typeof obj==='object')return Object.entries(obj).flatMap(([key,value])=>flattenSpecification(value,prefix?prefix+' > '+key:key));
    return prefix?[[prefix,String(obj??'')]]:[];
  }
  function suggestedSpecKeys(category){
    if(category==='Watches')return ['Brand','Display Type','Ideal For','Mechanism','Strap Material','Case Material','Dial Color','Water Resistance','Warranty'];
    if(category==='Perfumes')return ['Brand','Fragrance Type','Volume','Fragrance Notes','Ideal For','Country of Origin','Warranty'];
    if(category==='Attar')return ['Brand','Fragrance Type','Volume','Fragrance Notes','Country of Origin'];
    return ['Brand','Accessory Type','Compatible Devices','Connector / Interface','Key Features','Warranty','Country of Origin'];
  }
  const specRows=document.getElementById('specRows');
  function addSpecificationRow(label='',value=''){
    const row=document.createElement('div');row.className='spec-editor-row';
    row.style.cssText='display:grid;grid-template-columns:1fr 1.25fr auto;gap:10px;align-items:end;padding:10px;border:1px solid #e7e6df;background:#fff';
    row.innerHTML=`<label style="${labelStyle}">Specification name<input data-spec-label style="${inputStyle}" value="${safe(label)}" placeholder="e.g. Brand"></label><label style="${labelStyle}">Value<input data-spec-value style="${inputStyle}" value="${safe(value)}" placeholder="e.g. Casio"></label><button type="button" class="mini" style="flex:0 0 auto;color:#9e3f35" aria-label="Remove specification">Remove</button>`;
    row.querySelector('button').onclick=()=>row.remove();specRows.appendChild(row);
  }
  function renderSpecificationRows(rows){specRows.innerHTML='';(rows.length?rows:suggestedSpecKeys(document.getElementById('cat').value).map(key=>[key,''])).forEach(([key,value])=>addSpecificationRow(key,value));}
  const existingSpecRows=flattenSpecification(p.specifications||{}).filter(([key])=>key);
  renderSpecificationRows(existingSpecRows);
  document.getElementById('addSpecRow').onclick=()=>addSpecificationRow();
  document.getElementById('cat').addEventListener('change',()=>{
    const rows=[...specRows.querySelectorAll('.spec-editor-row')];
    if(rows.every(row=>!row.querySelector('[data-spec-value]').value.trim()))renderSpecificationRows([]);
  });
  // Keep generated files and object-URL previews local to this product editor.
  const generatedImageFiles=Object.create(null);
  const generatedImageUrls=Object.create(null);
  let pendingResize=Promise.resolve();
  let resizeError='';
  function showAutoPreview(sizeType,blobOrFile,label){
    const target=document.getElementById('autoPreview_'+sizeType);
    if(!target)return;
    if(generatedImageUrls[sizeType])URL.revokeObjectURL(generatedImageUrls[sizeType]);
    const previewUrl=URL.createObjectURL(blobOrFile);
    generatedImageUrls[sizeType]=previewUrl;
    target.innerHTML=`<img src="${previewUrl}" alt="${label}" style="display:block;width:100%;max-width:150px;height:105px;object-fit:contain;background:#fff;margin:0 auto 5px;border:1px solid #e7e6df"><div class="muted">${label}</div>`;
  }
  async function makeSquareVariant(bitmap,size,baseName){
    const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image canvas is not available in this browser.');
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,size,size);
    const scale=Math.min(size/bitmap.width,size/bitmap.height);
    const width=Math.max(1,Math.round(bitmap.width*scale));
    const height=Math.max(1,Math.round(bitmap.height*scale));
    ctx.drawImage(bitmap,(size-width)/2,(size-height)/2,width,height);
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not make the resized image.')),'image/webp',0.88));
    const mime=blob.type||'image/png';const ext=mime==='image/webp'?'webp':mime==='image/jpeg'?'jpg':'png';
    return new File([blob],`${baseName}-${size}.${ext}`,{type:mime,lastModified:Date.now()});
  }
  async function generateImageSizes(file){
    resizeError='';for(const key of Object.keys(generatedImageFiles))delete generatedImageFiles[key];
    if(!file)return;
    if(!file.type.startsWith('image/'))throw new Error('Please choose a valid image file.');
    if(file.size>6*1024*1024)throw new Error('Large image must be 6 MB or smaller.');
    showAutoPreview('large',file,'Selected original · Large');
    document.getElementById('autoSizeStatus').textContent='Creating MEDIUM, LISTING and SMALL previews…';
    const bitmap=await createImageBitmap(file);
    try{
      const baseName=(file.name.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_-]+/g,'-')||'product-image');
      for(const item of [{key:'medium',size:600},{key:'listing',size:360},{key:'small',size:120}]){
        const out=await makeSquareVariant(bitmap,item.size,baseName);
        generatedImageFiles[item.key]=out;
        showAutoPreview(item.key,out,`Auto-created · ${item.size} × ${item.size}`);
      }
      document.getElementById('autoSizeStatus').textContent='Ready! 3 sizes created automatically. Save Product and Images to upload all 4 versions.';
    }finally{bitmap.close?.()}
  }
  document.getElementById('pi_large').addEventListener('change',e=>{
    const file=e.target.files?.[0];if(!file)return;
    const submit=document.querySelector('#pf button[type=submit]');if(submit){submit.disabled=true;submit.textContent='Generating image sizes…'}
    pendingResize=generateImageSizes(file).catch(err=>{resizeError=err.message||'Could not create image sizes.';document.getElementById('autoSizeStatus').textContent=resizeError;alert(resizeError)}).finally(()=>{if(submit){submit.disabled=false;submit.textContent='Save Product and Images'}});
  });
  const large=p.image_variants?.large;
  if(large){
    document.getElementById('pImageType').value=large.image_type||'product';
    document.getElementById('pImageTitle').value=large.title||p.name||'';
    document.getElementById('pImageOption').value=large.option_code||'0';
    document.getElementById('pImageSort').value=String(large.sort_order??0);
    document.getElementById('pImageSlider').checked=Boolean(large.show_in_slider);
    document.getElementById('pImageStyle').value=large.image_style||'none';
  }
  document.getElementById('pf').onsubmit=async e=>{
    e.preventDefault();
    const specs={};
    for(const row of specRows.querySelectorAll('.spec-editor-row')){
      const key=row.querySelector('[data-spec-label]').value.trim();
      const value=row.querySelector('[data-spec-value]').value.trim();
      if(!key||!value)continue;
      const parts=key.split('>').map(part=>part.trim()).filter(Boolean);if(!parts.length)continue;
      let target=specs;
      for(const part of parts.slice(0,-1)){if(!target[part]||typeof target[part]!=='object'||Array.isArray(target[part]))target[part]={};target=target[part];}
      target[parts[parts.length-1]]=value;
    }
    const payload={slug:document.getElementById('slug').value,name:document.getElementById('n').value,category:document.getElementById('cat').value,price:Number(document.getElementById('price').value),mrp:Number(document.getElementById('mrp').value),stock:Number(document.getElementById('stock').value),tag:document.getElementById('tag').value,rating:Number(document.getElementById('rating').value||0),description:document.getElementById('desc').value,specifications:specs,active:true};
    try{
      await pendingResize;
      if(resizeError)throw new Error(resizeError);
      let productId=id;
      if(id){await api('/api/admin/products/'+id,{method:'PUT',headers:{'X-CSRF-Token':csrf},body:JSON.stringify(payload)})}
      else{const created=await api('/api/admin/products',{method:'POST',headers:{'X-CSRF-Token':csrf},body:JSON.stringify(payload)});productId=created.id}
      let uploaded=0;
      for(const sizeType of ['large','medium','listing','small']){
        const manuallySelectedFile=document.getElementById('pi_'+sizeType).files?.[0]||null;
        const externalUrl=document.getElementById('piUrl_'+sizeType).value.trim();
        // Priority: a manually selected file, then a typed HTTPS URL, then an auto-generated size.
        const file=manuallySelectedFile||(!externalUrl?generatedImageFiles[sizeType]||null:null);
        if(!file&&!externalUrl)continue;
        const fd=new FormData();
        if(file)fd.append('file',file);
        fd.append('sizeType',sizeType);
        fd.append('imageType',document.getElementById('pImageType').value);
        fd.append('title',document.getElementById('pImageTitle').value||document.getElementById('n').value);
        fd.append('optionCode',document.getElementById('pImageOption').value||'0');
        fd.append('sortOrder',document.getElementById('pImageSort').value||'0');
        fd.append('showInSlider',document.getElementById('pImageSlider').checked?'1':'0');
        fd.append('imageStyle',document.getElementById('pImageStyle').value);
        if(externalUrl&&!file)fd.append('externalUrl',externalUrl);
        const response=await fetch('/api/admin/products/'+productId+'/image',{method:'POST',headers:{'X-CSRF-Token':csrf},credentials:'same-origin',body:fd});
        if(!response.ok){const error=await response.json().catch(()=>({}));throw new Error(error.error||('Image upload failed ('+sizeType+')'))}
        uploaded++;
      }
      await products();
      alert(uploaded?'Product saved and '+uploaded+' image size(s) uploaded.':'Product details saved. Existing images were kept.');
    }catch(err){alert(err.message||'Could not save product.')}
  };
}
async function removeImageVariant(productId,sizeType){
  if(!confirm('Remove the saved '+sizeType.toUpperCase()+' image for this product?'))return;
  try{
    await api('/api/admin/products/'+encodeURIComponent(productId)+'/image-variant/'+encodeURIComponent(sizeType),{
      method:'DELETE',
      headers:{'X-CSRF-Token':csrf}
    });
    await editProduct(productId);
    alert(sizeType.toUpperCase()+' image removed.');
  }catch(err){alert(err.message||'Could not remove image.');}
}
async function orders(){const r=await api('/api/admin/orders');csrf=r.csrf;panel.innerHTML=`<h2 style="margin-bottom:12px">Orders</h2><table class="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>${r.orders.map(o=>`<tr><td><strong>${o.id}</strong><br><span class="muted">${new Date(o.created_at).toLocaleString('en-IN')}</span></td><td>${o.customer_name}<br>${o.phone}</td><td>${rupee(o.total)}</td><td><select onchange="setStatus('${o.id}',this.value)">${['Pending','Confirmed','Processing','Packed','Shipped','Out for Delivery','Delivered','Cancelled','Returned'].map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table>`}async function setStatus(id,status){await api('/api/admin/orders/'+id,{method:'PATCH',headers:{'X-CSRF-Token':csrf},body:JSON.stringify({status})});orders()}async function coupons(){const r=await api('/api/admin/coupons');csrf=r.csrf;panel.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><h2>Coupons</h2><button class="btn" onclick="addCoupon()">+ Add Coupon</button></div>${r.coupons.map(c=>`<div class="panel" style="margin-top:9px"><strong>${c.code}</strong> · ${c.type==='percent'?c.value+'%':'₹'+c.value} off · Min ₹${c.min_cart} · ${c.enabled?'Active':'Disabled'}<button class="mini" style="float:right" onclick="toggleCoupon('${c.code}')">${c.enabled?'Disable':'Enable'}</button></div>`).join('')}`}async function addCoupon(){const code=prompt('Coupon code');if(!code)return;const type=prompt('Type: percent or fixed','percent')==='fixed'?'fixed':'percent';const value=Number(prompt('Discount value','10'));const minCart=Number(prompt('Minimum cart','499'));const maxDiscount=Number(prompt('Maximum discount','500'));await api('/api/admin/coupons',{method:'POST',headers:{'X-CSRF-Token':csrf},body:JSON.stringify({code,type,value,minCart,maxDiscount,enabled:true})});coupons()}async function toggleCoupon(code){const r=await api('/api/admin/coupons');const c=r.coupons.find(x=>x.code===code);await api('/api/admin/coupons/'+encodeURIComponent(code),{method:'PATCH',headers:{'X-CSRF-Token':csrf},body:JSON.stringify({enabled:!c.enabled,value:Number(c.value),minCart:Number(c.min_cart),maxDiscount:Number(c.max_discount),expiresAt:c.expires_at,usageLimit:c.usage_limit})});coupons()}async function customers(){const r=await api('/api/admin/customers');csrf=r.csrf;panel.innerHTML=`<h2 style="margin-bottom:12px">Customers</h2><table class="admin-table"><thead><tr><th>Name</th><th>Contact</th><th>Orders</th><th>Spent</th></tr></thead><tbody>${r.customers.map(c=>`<tr><td>${c.customer_name}</td><td>${c.phone}<br>${c.email||''}</td><td>${c.orders}</td><td>${rupee(c.spent)}</td></tr>`).join('')}</tbody></table>`}async function settings(){const r=await api('/api/admin/settings');csrf=r.csrf;const s=r.settings;panel.innerHTML=`<h2 style="margin-bottom:12px">Store Settings</h2><form id="sf" class="formgrid"><input id="wa" placeholder="WhatsApp number" value="${s.whatsapp||''}"><input id="phone" placeholder="Phone" value="${s.phone||''}"><input id="email" placeholder="Email" value="${s.email||''}"><input id="free" type="number" value="${Number(s.free_shipping||499)}"><input id="ship" type="number" value="${Number(s.shipping_fee||49)}"><textarea id="addr" class="full" rows="3" placeholder="Business address">${s.address||''}</textarea><textarea id="about" class="full" rows="4" placeholder="About store">${s.about_text||''}</textarea><textarea id="shipping" class="full" rows="3" placeholder="Shipping policy">${s.shipping_policy||''}</textarea><textarea id="returns" class="full" rows="3" placeholder="Returns policy">${s.returns_policy||''}</textarea><label class="full panel"><input id="cod" type="checkbox" ${s.cod_enabled!=='0'?'checked':''}> Enable COD</label><button class="btn full">Save Settings</button></form>`;sf.onsubmit=async e=>{e.preventDefault();await api('/api/admin/settings',{method:'PUT',headers:{'X-CSRF-Token':csrf},body:JSON.stringify({whatsapp:wa.value,phone:phone.value,email:email.value,free_shipping:free.value,shipping_fee:ship.value,address:addr.value,about_text:about.value,shipping_policy:shipping.value,returns_policy:returns.value,cod_enabled:cod.checked?'1':'0'})});alert('Settings saved')}}async function logout(){await api('/api/admin/logout',{method:'POST'});login()}boot();
