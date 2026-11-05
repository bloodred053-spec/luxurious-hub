let csrf='';
async function api(path,opt={}){const r=await fetch(path,{credentials:'same-origin',headers:{'content-type':'application/json',...(opt.headers||{})},...opt});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Request failed');return d}
const rupee=n=>'₹'+(Number.isFinite(Number(n))?Number(n):0).toLocaleString('en-IN');
const escapeHtml=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#39;');
const safeImageUrl=value=>{const raw=String(value||'').trim();if(!raw)return '';try{const u=new URL(raw,location.origin);return ['https:','http:'].includes(u.protocol)&&(u.origin===location.origin||/^https?:$/.test(u.protocol))?u.href:''}catch{return ''}};
const adminDate=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleString('en-IN')};
const adminPanel=()=>document.getElementById('panel');
const showAdminError=(error)=>{const target=adminPanel();if(target)target.insertAdjacentHTML('afterbegin',`<div class="notice-box" role="alert">${escapeHtml(error?.message||'Something went wrong. Please try again.')}</div>`)};
const ADMIN_STORE_CATEGORIES=['Watches','Perfumes','Attar','Wireless Speakers','Wireless Neckband','Wired Earphones','TWS Earbuds','Power Banks','Mobile Accessories','Microphones','Holders & Stands','Headphone','Fans','Data Cables','Charger'];
function adminGuessCategory(name,current='Mobile Accessories'){const categories=ADMIN_STORE_CATEGORIES;const legacy=['Mobile Accessories','Other Phone Accessories','Wireless Neckbands','Wireless Earbuds','Phone Holders & Stands','Chargers & Cables'];const aliases={'Wireless Neckbands':'Wireless Neckband','Wireless Earbuds':'TWS Earbuds','Phone Holders & Stands':'Holders & Stands','Other Phone Accessories':'Mobile Accessories'};const currentAlias=aliases[current]||current;if(categories.includes(currentAlias)&&!legacy.includes(current))return currentAlias;const n=String(name||'').toLowerCase();const rules=[[/speaker/,'Wireless Speakers'],[/wired.{0,12}(earphone|earbud|headphone|headset)|(earphone|earbud|headphone|headset).{0,12}wired/,'Wired Earphones'],[/neckband/,'Wireless Neckband'],[/\b(tws|earbuds?|airpods?)\b/,'TWS Earbuds'],[/power\s*bank|powerbank|slim bank/,'Power Banks'],[/microphone|\bmic\b/,'Microphones'],[/charger|power adapter/,'Charger'],[/\b(cable|cord|lead)\b|charging cable|data cable|lightning cable/,'Data Cables'],[/holder|\bstand\b/,'Holders & Stands'],[/headphones?|\bheadset\b/,'Headphone'],[/\bfan\b/,'Fans']];const hit=rules.find(([re])=>re.test(n));if(hit)return hit[1];return categories.includes(currentAlias)?currentAlias:'Mobile Accessories';}
const root=document.getElementById('adminRoot');function login(){root.innerHTML=`<div class="panel" style="max-width:460px;margin:60px auto"><div class="eyebrow">Luxurious Hub</div><h1 style="font-size:42px">Store Admin</h1><p class="muted">Sign in to manage products, images, orders, coupons and settings.</p><form id="login" class="formgrid" style="margin-top:18px"><input id="u" required placeholder="Username"><input id="p" required type="password" placeholder="Password"><button class="btn full">Sign in</button></form><div id="msg" class="muted" style="margin-top:10px"></div></div>`;document.getElementById('login').onsubmit=async e=>{e.preventDefault();try{const r=await api('/api/admin/login',{method:'POST',body:JSON.stringify({username:u.value,password:p.value})});csrf=r.csrf;home()}catch(err){document.getElementById('msg').textContent=err.message}}}async function boot(){try{const s=await api('/api/admin/session');if(!s.authenticated)return login();csrf=s.csrf;home()}catch{login()}}function home(){root.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap"><div><div class="eyebrow">LUXURIOUS HUB</div><h1 style="font-size:42px">Admin Dashboard</h1></div><button class="mini" data-admin-logout>Logout</button></div><div class="admin-tabs" style="display:flex;gap:7px;flex-wrap:wrap;margin:18px 0"><button class="mini" data-admin-view="dashboard">Overview</button><button class="mini" data-admin-view="products">Products</button><button class="mini" data-admin-view="orders">Orders</button><button class="mini" data-admin-view="coupons">Coupons</button><button class="mini" data-admin-view="customers">Customers</button><button class="mini" data-admin-view="sellers">Seller Applications</button><button class="mini" data-admin-view="seller-products">Seller Products</button><button class="mini" data-admin-view="settings">Settings</button></div><div id="panel"></div>`;root.querySelectorAll("[data-admin-view]").forEach(button=>button.addEventListener("click",()=>{const view=button.dataset.adminView;({dashboard,products,orders,coupons,customers,sellers:sellersAdmin,"seller-products":sellerProductsAdmin,settings}[view]||dashboard)()}));root.querySelector("[data-admin-logout]").addEventListener("click",logout);dashboard()}
async function dashboard(){
  const target=adminPanel();target.innerHTML='<div class="panel">Loading store overview…</div>';
  try{
    const [summary,productData,orderData]=await Promise.all([api('/api/admin/dashboard'),api('/api/admin/products'),api('/api/admin/orders')]);csrf=summary.csrf||productData.csrf||orderData.csrf||csrf;
    const products=productData.products||[],orders=orderData.orders||[];
    const lowStock=products.filter(p=>Number(p.active)!==0&&Number(p.stock)>0&&Number(p.stock)<=5);
    const outOfStock=products.filter(p=>Number(p.active)!==0&&Number(p.stock)<=0);
    const recent=orders.slice(0,6);
    target.innerHTML=`<div class="admin-section-head"><div><h2>Store overview</h2><p class="muted">A quick view of your catalogue and recent orders.</p></div><button class="mini" type="button" data-dashboard-refresh>Refresh</button></div>
      <div class="admin-metrics"><article class="admin-metric"><span>Active products</span><strong>${Number(summary.products)||0}</strong></article><article class="admin-metric"><span>Total orders</span><strong>${Number(summary.orders)||0}</strong></article><article class="admin-metric"><span>Recorded revenue</span><strong>${rupee(summary.revenue)}</strong><small>Captured online payments + COD orders</small></article><article class="admin-metric"><span>Low / no stock</span><strong>${lowStock.length+outOfStock.length}</strong><small>${lowStock.length} low stock · ${outOfStock.length} out of stock</small></article></div>
      <section class="panel admin-overview-block"><div class="admin-section-head"><div><h3>Recent orders</h3><p class="muted">Latest orders received by the store.</p></div><button class="mini" type="button" data-go-orders>View all orders</button></div>${recent.length?`<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>${recent.map(o=>`<tr><td><strong>${escapeHtml(o.id)}</strong></td><td>${escapeHtml(o.customer_name)}<br><span class="muted">${escapeHtml(o.phone)}</span></td><td>${escapeHtml(adminDate(o.created_at))}</td><td>${rupee(o.total)}</td><td><span class="admin-status">${escapeHtml(o.status||'Pending')}</span></td></tr>`).join('')}</tbody></table></div>`:'<div class="admin-empty">No orders have been placed yet.</div>'}</section>
      <section class="panel admin-overview-block"><div class="admin-section-head"><div><h3>Inventory attention</h3><p class="muted">Products with five or fewer units available.</p></div><button class="mini" type="button" data-go-products>Manage products</button></div>${lowStock.length||outOfStock.length?`<div class="admin-alert-list">${[...outOfStock,...lowStock].slice(0,8).map(p=>`<div class="admin-alert-row"><span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.category||'Uncategorised')}</small></span><span class="${Number(p.stock)<=0?'admin-stock-out':'admin-stock-low'}">${Number(p.stock)<=0?'Out of stock':`${Number(p.stock)} left`}</span><button class="mini" type="button" data-edit-product="${Number(p.id)}">Edit</button></div>`).join('')}</div>`:'<div class="admin-empty">No low-stock products right now.</div>'}</section>`;
    target.querySelector('[data-dashboard-refresh]')?.addEventListener('click',dashboard);target.querySelector('[data-go-orders]')?.addEventListener('click',orders);target.querySelector('[data-go-products]')?.addEventListener('click',products);target.querySelectorAll('[data-edit-product]').forEach(b=>b.addEventListener('click',()=>editProduct(Number(b.dataset.editProduct))));
  }catch(error){target.innerHTML='<div class="panel"><h2>Store overview unavailable</h2><p class="muted">'+escapeHtml(error.message)+'</p><button class="mini" data-dashboard-retry>Try again</button></div>';target.querySelector('[data-dashboard-retry]')?.addEventListener('click',dashboard)}
}
async function products(){
  const target=adminPanel();target.innerHTML='<div class="panel">Loading products…</div>';
  try{
    const r=await api('/api/admin/products');csrf=r.csrf||csrf;const all=r.products||[];
    target.innerHTML=`<div class="admin-section-head"><div><h2>Products</h2><p class="muted">Search, filter and manage your store catalogue.</p></div><button class="btn" type="button" data-add-product>+ Add Product</button></div>
      <div class="admin-toolbar"><input id="adminProductSearch" type="search" placeholder="Search product name or category…" aria-label="Search products"><select id="adminProductCategory" aria-label="Filter by category"><option value="">All categories</option>${[...new Set(all.map(p=>adminGuessCategory(p.name,p.category)))].sort().map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}</select><select id="adminProductStock" aria-label="Filter by stock"><option value="all">All stock levels</option><option value="available">In stock</option><option value="low">Low stock (1–5)</option><option value="out">Out of stock</option></select><span id="adminProductCount" class="muted"></span></div>
      <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Image</th><th>Product</th><th>Price</th><th>Stock</th><th>Visibility</th><th>Action</th></tr></thead><tbody id="adminProductRows"></tbody></table></div><div id="adminProductEmpty" class="admin-empty" hidden>No products match these filters.</div>`;
    const render=()=>{const q=document.getElementById('adminProductSearch').value.trim().toLowerCase(),cat=document.getElementById('adminProductCategory').value,stock=document.getElementById('adminProductStock').value;const rows=all.filter(p=>{const category=adminGuessCategory(p.name,p.category);const matchesText=!q||`${p.name} ${category} ${p.slug||''}`.toLowerCase().includes(q);const matchesCat=!cat||category===cat;const n=Number(p.stock)||0;const matchesStock=stock==='all'||(stock==='available'&&n>5)||(stock==='low'&&n>0&&n<=5)||(stock==='out'&&n<=0);return matchesText&&matchesCat&&matchesStock});
      document.getElementById('adminProductRows').innerHTML=rows.map(p=>{const img=safeImageUrl(p.image_url);return `<tr><td>${img?`<img src="${escapeHtml(img)}" alt="" loading="lazy" style="width:54px;height:54px;object-fit:contain">`:'—'}</td><td><strong>${escapeHtml(p.name)}</strong><br><span class="muted">${escapeHtml(adminGuessCategory(p.name,p.category))}</span></td><td>${rupee(p.price)}<br><span class="muted">MRP ${rupee(p.mrp)}</span></td><td><span class="${Number(p.stock)<=0?'admin-stock-out':Number(p.stock)<=5?'admin-stock-low':''}">${Number(p.stock)||0}</span></td><td>${Number(p.active)===0?'Hidden':'Visible'}</td><td><button class="mini" type="button" data-edit-product="${Number(p.id)}">Edit</button></td></tr>`}).join('');document.getElementById('adminProductCount').textContent=`${rows.length} of ${all.length} products`;document.getElementById('adminProductEmpty').hidden=rows.length>0;document.querySelectorAll('[data-edit-product]').forEach(b=>b.addEventListener('click',()=>editProduct(Number(b.dataset.editProduct))))};
    ['adminProductSearch','adminProductCategory','adminProductStock'].forEach(id=>document.getElementById(id).addEventListener(id==='adminProductSearch'?'input':'change',render));document.querySelector('[data-add-product]').addEventListener('click',()=>editProduct());render();
  }catch(error){target.innerHTML=`<div class="panel" role="alert">${escapeHtml(error.message)} <button class="mini" data-products-retry>Retry</button></div>`;target.querySelector('[data-products-retry]')?.addEventListener('click',products)}
}
async function editProduct(id){
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
          ${slots.map(slot=>{const v=p.image_variants?.[slot.key];const current=safeImageUrl(v?.url||(slot.key==='large'?p.image_url:''));return `<div style="border:1px solid #dddeda;border-radius:4px;padding:12px;background:#fff;min-width:0"><div style="background:#f3f3ef;padding:7px;text-align:center;font-weight:700;font-size:12px">${slot.label}</div><p class="muted" style="margin:8px 0">${slot.hint}</p>${current?`<img src="${safe(current)}" alt="${slot.label} current image" style="display:block;width:76px;height:76px;object-fit:contain;margin:0 auto 8px;border:1px solid #eee">${id?`<button type="button" class="mini" style="display:block;width:100%;margin:8px 0;color:#9e3f35" onclick="removeImageVariant(${Number(id)},'${slot.key}')">Remove ${slot.label.toLowerCase()} image</button>`:''}`:'<div style="height:76px;display:grid;place-items:center;color:#8a8f89;font-size:11px">No image saved</div>'}<div id="autoPreview_${slot.key}" style="margin:8px 0;text-align:center"></div><label style="display:block;font-size:12px">Choose image<input id="pi_${slot.key}" type="file" accept="image/png,image/jpeg,image/webp" style="display:block;width:100%;margin-top:7px"></label><label style="display:block;font-size:12px;margin-top:10px">Or enter full HTTPS URL<input id="piUrl_${slot.key}" type="url" placeholder="https://example.com/image.webp" style="${inputStyle}"></label></div>`}).join('')}
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
async function orders(){
  const target=adminPanel();target.innerHTML='<div class="panel">Loading orders…</div>';
  try{const r=await api('/api/admin/orders');csrf=r.csrf||csrf;const all=r.orders||[];const statuses=['Pending','Confirmed','Processing','Packed','Shipped','Out for Delivery','Delivered','Cancelled','Returned'];
    target.innerHTML=`<div class="admin-section-head"><div><h2>Orders</h2><p class="muted">Review customer orders and update fulfilment status.</p></div><button class="mini" type="button" data-orders-refresh>Refresh</button></div><div class="admin-toolbar"><input id="adminOrderSearch" type="search" placeholder="Search order ID, customer or phone…"><select id="adminOrderStatus"><option value="">All statuses</option>${statuses.map(x=>`<option>${x}</option>`).join('')}</select><span id="adminOrderCount" class="muted"></span></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Total / Payment</th><th>Update status</th><th>Tracking number</th><th>Save</th></tr></thead><tbody id="adminOrderRows"></tbody></table></div><div id="adminOrderEmpty" class="admin-empty" hidden>No orders match this search.</div>`;
    const render=()=>{const q=document.getElementById('adminOrderSearch').value.trim().toLowerCase(),status=document.getElementById('adminOrderStatus').value;const rows=all.filter(o=>(!status||o.status===status)&&(!q||`${o.id} ${o.customer_name} ${o.phone} ${o.email||''}`.toLowerCase().includes(q)));document.getElementById('adminOrderRows').innerHTML=rows.map(o=>`<tr><td><strong>${escapeHtml(o.id)}</strong><br><span class="muted">${escapeHtml(adminDate(o.created_at))}</span></td><td>${escapeHtml(o.customer_name)}<br><span class="muted">${escapeHtml(o.phone)}${o.email?` · ${escapeHtml(o.email)}`:''}</span><details class="admin-order-details"><summary>Delivery details</summary><span>${escapeHtml(o.address)}, ${escapeHtml(o.area||'')}, ${escapeHtml(o.city)}, ${escapeHtml(o.state)} ${escapeHtml(o.pincode)}</span></details></td><td><strong>${rupee(o.total)}</strong><br><span class="muted">${escapeHtml(String(o.payment_method||'').toUpperCase())} · ${escapeHtml(o.payment_status||'pending')}</span></td><td><select data-order-status="${escapeHtml(o.id)}">${statuses.map(x=>`<option value="${x}" ${o.status===x?'selected':''}>${x}</option>`).join('')}</select></td><td><input data-order-tracking="${escapeHtml(o.id)}" value="${escapeHtml(o.tracking_number||'')}" placeholder="Optional tracking ID" aria-label="Tracking number for ${escapeHtml(o.id)}"></td><td><button class="mini" type="button" data-save-order="${escapeHtml(o.id)}">Save</button></td></tr>`).join('');document.getElementById('adminOrderCount').textContent=`${rows.length} of ${all.length} orders`;document.getElementById('adminOrderEmpty').hidden=rows.length>0;target.querySelectorAll('[data-save-order]').forEach(button=>button.addEventListener('click',async()=>{const id=button.dataset.saveOrder,row=button.closest('tr'),status=row?.querySelector('[data-order-status]')?.value,trackingNumber=row?.querySelector('[data-order-tracking]')?.value||'';button.disabled=true;try{await setStatus(id,status,trackingNumber);const savedOrder=all.find(x=>String(x.id)===String(id));if(savedOrder){savedOrder.status=status;if(trackingNumber.trim())savedOrder.tracking_number=trackingNumber;const trackingInput=button.closest('tr')?.querySelector('[data-order-tracking]');if(trackingInput)trackingInput.value=savedOrder.tracking_number||''}button.textContent='Saved';setTimeout(()=>{if(button.isConnected){button.textContent='Save';button.disabled=false}},900)}catch(error){alert(error.message);button.disabled=false}}))};
    document.getElementById('adminOrderSearch').addEventListener('input',render);document.getElementById('adminOrderStatus').addEventListener('change',render);target.querySelector('[data-orders-refresh]').addEventListener('click',orders);render();
  }catch(error){target.innerHTML=`<div class="panel" role="alert">${escapeHtml(error.message)} <button class="mini" data-orders-retry>Retry</button></div>`;target.querySelector('[data-orders-retry]')?.addEventListener('click',orders)}
}
async function setStatus(id,status,trackingNumber=''){await api('/api/admin/orders/'+encodeURIComponent(id),{method:'PATCH',headers:{'X-CSRF-Token':csrf},body:JSON.stringify({status,trackingNumber})})}
async function coupons(){const r=await api('/api/admin/coupons');csrf=r.csrf||csrf;const target=adminPanel();target.innerHTML=`<div class="admin-section-head"><div><h2>Coupons</h2><p class="muted">Manage promotional codes and their availability.</p></div><button class="btn" type="button" data-add-coupon>+ Add Coupon</button></div>${r.coupons.length?r.coupons.map(c=>`<div class="panel admin-coupon-row"><div><strong>${escapeHtml(c.code)}</strong><div class="muted">${c.type==='percent'?`${Number(c.value)}%`:`${rupee(c.value)}`} off · Min ${rupee(c.min_cart)} · Used ${Number(c.used_count)||0}${c.usage_limit==null?'':` / ${Number(c.usage_limit)}`}</div></div><span class="admin-status">${Number(c.enabled)?'Active':'Disabled'}</span><button class="mini" type="button" data-toggle-coupon="${escapeHtml(c.code)}">${Number(c.enabled)?'Disable':'Enable'}</button></div>`).join(''):'<div class="admin-empty">No coupons created yet.</div>'}`;target.querySelector('[data-add-coupon]')?.addEventListener('click',addCoupon);target.querySelectorAll('[data-toggle-coupon]').forEach(b=>b.addEventListener('click',()=>toggleCoupon(b.dataset.toggleCoupon)))}
async function addCoupon(){const code=prompt('Coupon code');if(!code)return;const type=prompt('Type: percent or fixed','percent')==='fixed'?'fixed':'percent';const value=Number(prompt('Discount value','10'));const minCart=Number(prompt('Minimum cart','499'));const maxDiscount=Number(prompt('Maximum discount','500'));if(!Number.isFinite(value)||value<=0||!Number.isFinite(minCart)||minCart<0||!Number.isFinite(maxDiscount)||maxDiscount<0){alert('Enter valid positive discount values.');return}try{await api('/api/admin/coupons',{method:'POST',headers:{'X-CSRF-Token':csrf},body:JSON.stringify({code:code.trim().toUpperCase(),type,value,minCart,maxDiscount,enabled:true})});await coupons()}catch(error){alert(error.message)}}
async function toggleCoupon(code){try{const r=await api('/api/admin/coupons');const c=r.coupons.find(x=>x.code===code);if(!c)return;await api('/api/admin/coupons/'+encodeURIComponent(code),{method:'PATCH',headers:{'X-CSRF-Token':csrf},body:JSON.stringify({enabled:!c.enabled,value:Number(c.value),minCart:Number(c.min_cart),maxDiscount:Number(c.max_discount),expiresAt:c.expires_at,usageLimit:c.usage_limit})});await coupons()}catch(error){alert(error.message)}}
async function customers(){const r=await api('/api/admin/customers');csrf=r.csrf||csrf;const target=adminPanel(),all=r.customers||[];target.innerHTML=`<div class="admin-section-head"><div><h2>Customers</h2><p class="muted">Customer information from recorded orders.</p></div><span class="muted">${all.length} records</span></div><div class="admin-toolbar"><input id="adminCustomerSearch" type="search" placeholder="Search name, phone or email…"><span id="adminCustomerCount" class="muted"></span></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Name</th><th>Contact</th><th>Orders</th><th>Recorded spend</th><th>Last order</th></tr></thead><tbody id="adminCustomerRows"></tbody></table></div><div id="adminCustomerEmpty" class="admin-empty" hidden>No customers match this search.</div>`;const render=()=>{const q=document.getElementById('adminCustomerSearch').value.trim().toLowerCase();const rows=all.filter(c=>`${c.customer_name} ${c.phone} ${c.email||''}`.toLowerCase().includes(q));document.getElementById('adminCustomerRows').innerHTML=rows.map(c=>`<tr><td><strong>${escapeHtml(c.customer_name)}</strong></td><td>${escapeHtml(c.phone)}<br><span class="muted">${escapeHtml(c.email||'')}</span></td><td>${Number(c.orders)||0}</td><td>${rupee(c.spent)}</td><td>${escapeHtml(adminDate(c.last_order))}</td></tr>`).join('');document.getElementById('adminCustomerCount').textContent=`${rows.length} of ${all.length} customers`;document.getElementById('adminCustomerEmpty').hidden=rows.length>0};document.getElementById('adminCustomerSearch').addEventListener('input',render);render()}
async function settings(){const r=await api('/api/admin/settings');csrf=r.csrf||csrf;const s=r.settings||{},target=adminPanel();target.innerHTML=`<div class="admin-section-head"><div><h2>Store Settings</h2><p class="muted">Update store contact details, shipping and customer policies.</p></div></div><form id="sf" class="formgrid"><label>WhatsApp number<input id="wa" value="${escapeHtml(s.whatsapp||'')}" placeholder="WhatsApp number"></label><label>Phone<input id="phone" value="${escapeHtml(s.phone||'')}" placeholder="Phone"></label><label>Email<input id="email" type="email" value="${escapeHtml(s.email||'')}" placeholder="Email"></label><label>Free shipping threshold (₹)<input id="free" type="number" min="0" value="${Number(s.free_shipping??499)}"></label><label>Shipping fee (₹)<input id="ship" type="number" min="0" value="${Number(s.shipping_fee??49)}"></label><label class="full">Business address<textarea id="addr" rows="3">${escapeHtml(s.address||'')}</textarea></label><label class="full">About the store<textarea id="about" rows="4">${escapeHtml(s.about_text||'')}</textarea></label><label class="full">Shipping policy<textarea id="shipping" rows="3">${escapeHtml(s.shipping_policy||'')}</textarea></label><label class="full">Returns policy<textarea id="returns" rows="3">${escapeHtml(s.returns_policy||'')}</textarea></label><label class="full panel"><input id="cod" type="checkbox" ${s.cod_enabled!=='0'?'checked':''}> Enable COD</label><button class="btn full" type="submit">Save Settings</button><p id="settingsMessage" class="muted full" aria-live="polite"></p></form>`;document.getElementById('sf').onsubmit=async e=>{e.preventDefault();const message=document.getElementById('settingsMessage'),button=e.currentTarget.querySelector('button[type=submit]');button.disabled=true;message.textContent='Saving…';try{await api('/api/admin/settings',{method:'PUT',headers:{'X-CSRF-Token':csrf},body:JSON.stringify({whatsapp:document.getElementById('wa').value,phone:document.getElementById('phone').value,email:document.getElementById('email').value,free_shipping:document.getElementById('free').value,shipping_fee:document.getElementById('ship').value,address:document.getElementById('addr').value,about_text:document.getElementById('about').value,shipping_policy:document.getElementById('shipping').value,returns_policy:document.getElementById('returns').value,cod_enabled:document.getElementById('cod').checked?'1':'0'})});message.textContent='Settings saved successfully.'}catch(error){message.textContent=error.message}finally{button.disabled=false}}}
async function sellersAdmin(){
  const r=await api('/api/admin/sellers');csrf=r.csrf||csrf;const target=document.getElementById('panel');const safe=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  target.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px"><div><h2>Seller Applications</h2><p class="muted">Approve seller accounts before they can sign in and submit products.</p></div><button class="mini" data-seller-admin-refresh>Refresh</button></div>${r.sellers.length?`<div style="overflow-x:auto"><table class="admin-table"><thead><tr><th>Business</th><th>Contact</th><th>Details</th><th>Status</th><th>Actions</th></tr></thead><tbody>${r.sellers.map(s=>`<tr><td><strong>${safe(s.business_name)}</strong><br><span class="muted">Applied ${safe(new Date(s.created_at).toLocaleDateString('en-IN'))}</span></td><td>${safe(s.contact_name)}<br>${safe(s.email)}<br>${safe(s.phone)}</td><td>GSTIN: ${safe(s.gstin||'Not provided')}<br>${safe(s.address||'No address provided')}</td><td><span class="seller-status status-${safe(s.status)}">${safe(s.status)}</span>${s.status_note?`<br><small>${safe(s.status_note)}</small>`:''}</td><td><div class="seller-admin-actions">${s.status!=='approved'?`<button class="mini" data-seller-admin-action="approve" data-seller-id="${Number(s.id)}">Approve</button>`:''}${s.status!=='rejected'?`<button class="mini" data-seller-admin-action="reject" data-seller-id="${Number(s.id)}">Reject</button>`:''}${s.status==='approved'?`<button class="mini" data-seller-admin-action="suspend" data-seller-id="${Number(s.id)}">Suspend</button>`:''}</div></td></tr>`).join('')}</tbody></table></div>`:'<div class="seller-empty"><h3>No seller applications yet</h3><p>Applications submitted from /seller.html will appear here.</p></div>'}`;
  target.querySelector('[data-seller-admin-refresh]')?.addEventListener('click',sellersAdmin);
  target.querySelectorAll('[data-seller-admin-action]').forEach(button=>button.addEventListener('click',async()=>{const id=Number(button.dataset.sellerId);const action=button.dataset.sellerAdminAction;let status=action==='approve'?'approved':action==='reject'?'rejected':'suspended';let note='';if(status!=='approved')note=prompt('Optional note for this seller:','')||'';if(!confirm(`${status.charAt(0).toUpperCase()+status.slice(1)} this seller account?`))return;button.disabled=true;try{await api('/api/admin/sellers/'+id,{method:'PATCH',headers:{'X-CSRF-Token':csrf},body:JSON.stringify({status,note})});await sellersAdmin();}catch(error){alert(error.message);button.disabled=false;}}));
}
async function sellerProductsAdmin(status='pending'){
  const r=await api('/api/admin/seller-products?status='+encodeURIComponent(status));csrf=r.csrf||csrf;const target=document.getElementById('panel');const safe=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  target.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px"><div><h2>Seller Products</h2><p class="muted">Approve products before they become visible in the public catalogue.</p></div><label class="seller-filter-label">Review status <select id="sellerProductFilter"><option value="pending" ${status==='pending'?'selected':''}>Pending</option><option value="approved" ${status==='approved'?'selected':''}>Approved</option><option value="rejected" ${status==='rejected'?'selected':''}>Rejected</option><option value="all" ${status==='all'?'selected':''}>All</option></select></label></div>${r.products.length?`<div class="seller-moderation-list">${r.products.map(p=>`<article class="seller-moderation-card"><div class="seller-moderation-image">${p.image_url?`<img src="${safe(p.image_url)}" alt="${safe(p.name)}">`:'<span>No image</span>'}</div><div class="seller-moderation-body"><div class="seller-card-top"><span class="seller-status status-${safe(p.approval_status)}">${safe(p.approval_status)}</span><span class="muted">Stock ${Number(p.stock)}</span></div><h3>${safe(p.name)}</h3><div class="muted">${safe(p.category)} · ${safe(p.slug)}</div><p>${safe(p.description||'No description provided.')}</p><strong>${rupee(p.price)} <span class="mrp">${rupee(p.mrp)}</span></strong><div class="seller-review-seller"><strong>Seller: ${safe(p.seller_business_name||'Unknown seller')}</strong><br>${safe(p.seller_contact_name||'')} · ${safe(p.seller_email||'')} · ${safe(p.seller_phone||'')}</div>${p.approval_note?`<div class="seller-review-note">Current review note: ${safe(p.approval_note)}</div>`:''}<div class="seller-admin-actions">${p.approval_status!=='approved'?`<button type="button" class="btn" data-product-review="approved" data-product-id="${Number(p.id)}">Approve & publish</button>`:''}${p.approval_status!=='rejected'?`<button type="button" class="mini" data-product-review="rejected" data-product-id="${Number(p.id)}">Reject</button>`:''}</div></div></article>`).join('')}</div>`:'<div class="seller-empty"><h3>Nothing to review</h3><p>No seller products match this status.</p></div>'}`;
  document.getElementById('sellerProductFilter').addEventListener('change',event=>sellerProductsAdmin(event.target.value));
  target.querySelectorAll('[data-product-review]').forEach(button=>button.addEventListener('click',async()=>{const id=Number(button.dataset.productId);const nextStatus=button.dataset.productReview;const note=nextStatus==='rejected'?(prompt('Reason or note for the seller (optional):','')||''):'';if(!confirm(nextStatus==='approved'?'Approve and publish this product?':'Reject this product submission?'))return;button.disabled=true;try{await api('/api/admin/seller-products/'+id+'/approval',{method:'PATCH',headers:{'X-CSRF-Token':csrf},body:JSON.stringify({status:nextStatus,note})});await sellerProductsAdmin(status);}catch(error){alert(error.message);button.disabled=false;}}));
}
async function logout(){await api('/api/admin/logout',{method:'POST'});login()}boot();
