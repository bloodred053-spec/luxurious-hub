let csrf='';async function api(path,opt={}){const r=await fetch(path,{credentials:'same-origin',headers:{'content-type':'application/json',...(opt.headers||{})},...opt});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Request failed');return d}const rupee=n=>'₹'+Number(n).toLocaleString('en-IN');const root=document.getElementById('adminRoot');function login(){root.innerHTML=`<div class="panel" style="max-width:460px;margin:60px auto"><div class="eyebrow">Luxurious Hub</div><h1 style="font-size:42px">Store Admin</h1><p class="muted">Sign in to manage products, images, orders, coupons and settings.</p><form id="login" class="formgrid" style="margin-top:18px"><input id="u" required placeholder="Username"><input id="p" required type="password" placeholder="Password"><button class="btn full">Sign in</button></form><div id="msg" class="muted" style="margin-top:10px"></div></div>`;document.getElementById('login').onsubmit=async e=>{e.preventDefault();try{const r=await api('/api/admin/login',{method:'POST',body:JSON.stringify({username:u.value,password:p.value})});csrf=r.csrf;home()}catch(err){document.getElementById('msg').textContent=err.message}}}async function boot(){try{const s=await api('/api/admin/session');if(!s.authenticated)return login();csrf=s.csrf;home()}catch{login()}}function home(){root.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap"><div><div class="eyebrow">LUXURIOUS HUB</div><h1 style="font-size:42px">Admin Dashboard</h1></div><button class="mini" onclick="logout()">Logout</button></div><div class="admin-tabs" style="display:flex;gap:7px;flex-wrap:wrap;margin:18px 0"><button class="mini" onclick="products()">Products</button><button class="mini" onclick="orders()">Orders</button><button class="mini" onclick="coupons()">Coupons</button><button class="mini" onclick="customers()">Customers</button><button class="mini" onclick="settings()">Settings</button></div><div id="panel"></div>`;products()}async function products(){const r=await api('/api/admin/products');csrf=r.csrf;panel.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h2>Products</h2><button class="btn" onclick="editProduct()">+ Add Product</button></div><table class="admin-table"><thead><tr><th>Image</th><th>Product</th><th>Price</th><th>Stock</th><th></th></tr></thead><tbody>${r.products.map(p=>`<tr><td>${p.image_url?`<img src="${p.image_url}" style="width:54px;height:54px;object-fit:cover">`:'—'}</td><td><strong>${p.name}</strong><br><span class="muted">${p.category}</span></td><td>${rupee(p.price)}<br><span class="muted">${rupee(p.mrp)}</span></td><td>${p.stock}</td><td><button class="mini" onclick="editProduct(${p.id})">Edit</button></td></tr>`).join('')}</tbody></table>`}async function editProduct(id){
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
      <input id="n" class="full" required placeholder="Product name" value="${safe(p.name)}">
      <input id="slug" placeholder="Slug" value="${safe(p.slug||'')}">
      <select id="cat"><option>Watches</option><option>Perfumes</option><option>Attar</option><option>Mobile Accessories</option></select>
      <input id="price" type="number" min="0" required value="${Number(p.price||0)}" placeholder="Selling price">
      <input id="mrp" type="number" min="0" required value="${Number(p.mrp||0)}" placeholder="MRP">
      <input id="stock" type="number" min="0" required value="${Number(p.stock||0)}" placeholder="Stock">
      <input id="tag" value="${safe(p.tag||'New')}" placeholder="Badge">
      <input id="rating" type="number" min="0" max="5" step="0.1" value="${Number(p.rating||0)}" placeholder="Rating (0–5)">
      <textarea id="desc" class="full" rows="4" placeholder="Description">${safe(p.description||'')}</textarea>
      <label class="full" style="${labelStyle}">Specifications JSON<textarea id="spec" class="full" rows="5" style="${inputStyle};font-family:monospace" placeholder='{"Brand":"Titan","Display Type":"Analog"}'>${safe(JSON.stringify(p.specifications||{},null,2))}</textarea></label>
      <div class="full panel" style="padding:14px">
        <h3 style="margin-bottom:7px">Product Image Sizes</h3>
        <p class="muted" style="line-height:1.6;margin:0 0 14px">Har size ke liye PNG/JPG/WebP file (max 6 MB) Choose image se upload karo, ya poora public HTTPS URL paste karo. Sirf filename jaise L-2026-...webp valid URL nahi hai. Image software mein filename par click karke full URL copy karo, ya file computer par download karke Choose image use karo. Existing image tab tak rahegi jab tak replace ya remove nahi karte.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:12px;margin-bottom:14px">
          <label style="${labelStyle}">Image Type<select id="pImageType" style="${inputStyle}"><option value="product">Product Image</option><option value="tech">Tech. Image</option><option value="gallery">Gallery Image</option><option value="lifestyle">Lifestyle Image</option></select></label>
          <label style="${labelStyle}">Title for Image<input id="pImageTitle" style="${inputStyle}" value="${safe(p.name)}" placeholder="Image title"></label>
          <label style="${labelStyle}">Option Code (OP-Code)<input id="pImageOption" style="${inputStyle}" value="0"></label>
          <label style="${labelStyle}">Sort Order<input id="pImageSort" type="number" style="${inputStyle}" value="0"></label>
          <label style="${labelStyle}">Image Style<select id="pImageStyle" style="${inputStyle}"><option value="none">None</option><option value="studio">Studio Image</option><option value="lifestyle">Lifestyle Image</option></select></label>
          <label style="${labelStyle};display:flex;align-items:center;gap:7px"><input id="pImageSlider" type="checkbox" style="width:auto"> Show image in slider</label>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
          ${slots.map(slot=>{const v=p.image_variants?.[slot.key];const current=v?.url||(slot.key==='large'?p.image_url:'');return `<div style="border:1px solid #dddeda;border-radius:4px;padding:12px;background:#fff;min-width:0"><div style="background:#f3f3ef;padding:7px;text-align:center;font-weight:700;font-size:12px">${slot.label}</div><p class="muted" style="margin:8px 0">${slot.hint}</p>${current?`<img src="${safe(current)}" alt="${slot.label} current image" style="display:block;width:76px;height:76px;object-fit:contain;margin:0 auto 8px;border:1px solid #eee">${id?`<button type="button" class="mini" style="display:block;width:100%;margin:8px 0;color:#9e3f35" onclick="removeImageVariant(${Number(id)},'${slot.key}')">Remove ${slot.label.toLowerCase()} image</button>`:''}`:'<div style="height:76px;display:grid;place-items:center;color:#8a8f89;font-size:11px">No image saved</div>'}<label style="display:block;font-size:12px">Choose image<input id="pi_${slot.key}" type="file" accept="image/png,image/jpeg,image/webp" style="display:block;width:100%;margin-top:7px"></label><label style="display:block;font-size:12px;margin-top:10px">Or enter full HTTPS URL<input id="piUrl_${slot.key}" type="url" placeholder="https://example.com/image.webp" style="${inputStyle}"></label></div>`}).join('')}
        </div>
      </div>
      <button class="btn full" type="submit">Save Product and Images</button>
    </form>`;
  document.getElementById('cat').value=p.category||'Watches';
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
    let specs={};
    try{specs=JSON.parse(document.getElementById('spec').value||'{}')}catch{alert('Specifications must be valid JSON.');return}
    const payload={slug:document.getElementById('slug').value,name:document.getElementById('n').value,category:document.getElementById('cat').value,price:Number(document.getElementById('price').value),mrp:Number(document.getElementById('mrp').value),stock:Number(document.getElementById('stock').value),tag:document.getElementById('tag').value,rating:Number(document.getElementById('rating').value||0),description:document.getElementById('desc').value,specifications:specs,active:true};
    try{
      let productId=id;
      if(id){await api('/api/admin/products/'+id,{method:'PUT',headers:{'X-CSRF-Token':csrf},body:JSON.stringify(payload)})}
      else{const created=await api('/api/admin/products',{method:'POST',headers:{'X-CSRF-Token':csrf},body:JSON.stringify(payload)});productId=created.id}
      let uploaded=0;
      for(const sizeType of ['large','medium','listing','small']){
        const file=document.getElementById('pi_'+sizeType).files?.[0];
        const externalUrl=document.getElementById('piUrl_'+sizeType).value.trim();
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
        if(externalUrl)fd.append('externalUrl',externalUrl);
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
