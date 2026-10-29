'use strict';
let sellerCsrf='';
let currentSeller=null;
let productCache=[];
let orderCache=[];
let currentSellerView='products';
const sellerApp=document.getElementById('sellerApp');
const SELLER_CATEGORIES=['Watches','Perfumes','Attar','Wireless Speakers','Wireless Neckband','Wired Earphones','TWS Earbuds','Power Banks','Mobile Accessories','Microphones','Holders & Stands','Headphone','Fans','Data Cables','Charger'];
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
async function sellerApi(path,opt={}){
  const isForm=typeof FormData!=='undefined'&&opt.body instanceof FormData;
  const headers={...(isForm?{}:{'content-type':'application/json'}),...(opt.headers||{})};
  const response=await fetch(path,{credentials:'same-origin',...opt,headers});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||'Request failed');
  return data;
}
function showNotice(message,type='success'){
  const el=document.getElementById('sellerNotice');if(!el)return;
  el.textContent=message;el.className='seller-notice '+(type==='error'?'is-error':'is-success');el.hidden=false;
}
function showAuth(mode='register',notice=''){
  currentSeller=null;sellerCsrf='';
  sellerApp.innerHTML=`<div class="seller-auth-card seller-auth-card-pro">
    <div class="seller-auth-intro"><div class="eyebrow">SELLER CENTRE · INDIA</div><h2>${mode==='login'?'Welcome back, seller':'Start selling on Luxurious Hub'}</h2><p>${mode==='login'?'Sign in to manage your products and orders.':'Create your seller account in a few simple steps. Your application will be reviewed by our team.'}</p></div>
    <div class="seller-auth-tabs" role="tablist"><button type="button" class="${mode==='register'?'active':''}" data-seller-auth="register">Create account</button><button type="button" class="${mode==='login'?'active':''}" data-seller-auth="login">Seller login</button></div>
    <div class="seller-stepper" id="sellerStepper" ${mode==='register'?'':'hidden'}><div class="seller-step active" data-step-indicator="1"><span>1</span><div><b>Account details</b><small>Email, mobile & password</small></div></div><div class="seller-step" data-step-indicator="2"><span>2</span><div><b>Business details</b><small>Store & business address</small></div></div></div>
    <div id="sellerNotice" class="seller-notice ${notice?'is-success':''}" ${notice?'':'hidden'}>${esc(notice)}</div>
    <form id="sellerRegisterForm" class="seller-form seller-register-wizard" ${mode==='register'?'':'hidden'}>
      <section class="seller-wizard-page" data-wizard-page="1"><div class="seller-section-heading"><span>STEP 1 OF 2</span><h3>Create your login</h3><p>Use an email address and mobile number you can access.</p></div>
        <label>Email address *<input name="email" type="email" required maxlength="254" autocomplete="email" placeholder="you@example.com"></label>
        <label>Mobile number *<input name="phone" type="tel" required inputmode="numeric" pattern="[0-9 +()-]{10,18}" autocomplete="tel" placeholder="10-digit Indian mobile number"></label>
        <div class="seller-form-two"><label>Password *<input name="password" type="password" minlength="10" required autocomplete="new-password" placeholder="At least 10 characters"></label><label>Confirm password *<input name="confirmPassword" type="password" minlength="10" required autocomplete="new-password" placeholder="Re-enter password"></label></div>
        <div class="seller-security-note"><strong>Keep your account safe</strong><span>Use a unique password. Email/mobile OTP verification is not currently enabled on this portal.</span></div>
        <button class="btn seller-submit seller-next" type="button" id="sellerNextStep">Continue to business details →</button>
      </section>
      <section class="seller-wizard-page" data-wizard-page="2" hidden><div class="seller-section-heading"><span>STEP 2 OF 2</span><h3>Tell us about your business</h3><p>These details help our team review your seller application.</p></div>
        <label>Business / store name *<input name="businessName" required maxlength="160" autocomplete="organization" placeholder="e.g. Your Store Name"></label>
        <label>Contact person / owner name *<input name="contactName" required maxlength="120" autocomplete="name" placeholder="Full name"></label>
        <label>GSTIN <span class="seller-optional">Optional</span><input name="gstin" maxlength="15" autocapitalize="characters" placeholder="15-character GSTIN, if available"></label>
        <label>Business / pickup address <span class="seller-optional">Optional for application</span><textarea name="address" rows="3" maxlength="600" autocomplete="street-address" placeholder="Shop / building, street, area, city, state and PIN code"></textarea></label>
        <div class="seller-review-box"><strong>What happens next?</strong><p>Submit your application. Luxurious Hub admin will review it and approve or decline access. You can sign in after approval. This form does not perform GST, KYC, bank or address verification.</p></div>
        <div class="seller-form-actions"><button type="button" class="mini" id="sellerBackStep">← Back</button><button class="btn seller-submit" type="submit">Submit seller application →</button></div>
      </section>
      <p class="seller-form-note">By applying, you confirm that the details provided are accurate. Never share payment card details or passwords used on other websites.</p>
    </form>
    <form id="sellerLoginForm" class="seller-form" ${mode==='login'?'':'hidden'}><label>Email address *<input name="email" type="email" required autocomplete="email" placeholder="Seller email"></label><label>Password *<input name="password" type="password" required autocomplete="current-password" placeholder="Your password"></label><button type="submit" class="btn seller-submit">Sign in to Seller Centre →</button><p class="seller-form-note">You can sign in after the admin approves your application.</p></form>
  </div>`;
  sellerApp.querySelectorAll('[data-seller-auth]').forEach(button=>button.addEventListener('click',()=>showAuth(button.dataset.sellerAuth)));
  const registerForm=document.getElementById('sellerRegisterForm');
  let wizardStep=1;
  const setWizardStep=step=>{wizardStep=step;registerForm.querySelectorAll('[data-wizard-page]').forEach(page=>page.hidden=Number(page.dataset.wizardPage)!==step);sellerApp.querySelectorAll('[data-step-indicator]').forEach(item=>{const n=Number(item.dataset.stepIndicator);item.classList.toggle('active',n===step);item.classList.toggle('complete',n<step);});const notice=document.getElementById('sellerNotice');if(notice)notice.hidden=true;};
  document.getElementById('sellerNextStep').addEventListener('click',()=>{const page=registerForm.querySelector('[data-wizard-page="1"]');const required=[...page.querySelectorAll('input[required]')];for(const input of required){if(!input.reportValidity())return;}const form=new FormData(registerForm);if(String(form.get('password')||'')!==String(form.get('confirmPassword')||'')){showNotice('Passwords do not match.','error');return;}if(String(form.get('password')||'').length<10){showNotice('Password must be at least 10 characters.','error');return;}setWizardStep(2);});
  document.getElementById('sellerBackStep').addEventListener('click',()=>setWizardStep(1));
  registerForm.addEventListener('submit',async event=>{
    event.preventDefault();if(wizardStep!==2)return;const form=new FormData(registerForm);const password=String(form.get('password')||'');
    if(password!==String(form.get('confirmPassword')||'')){showNotice('Passwords do not match.','error');setWizardStep(1);return;}
    const submit=registerForm.querySelector('button[type="submit"]');submit.disabled=true;submit.textContent='Submitting application…';
    try{
      const result=await sellerApi('/api/seller/register',{method:'POST',body:JSON.stringify({businessName:form.get('businessName'),contactName:form.get('contactName'),email:form.get('email'),phone:form.get('phone'),gstin:form.get('gstin'),address:form.get('address'),password})});
      showAuth('login',result.message||'Application submitted. Please wait for admin approval before signing in.');
    }catch(error){showNotice(error.message,'error');}
    finally{const active=document.getElementById('sellerRegisterForm');const button=active?.querySelector('button[type="submit"]');if(button){button.disabled=false;button.textContent='Submit seller application →';}}
  });
  const loginForm=document.getElementById('sellerLoginForm');
  loginForm.addEventListener('submit',async event=>{
    event.preventDefault();const form=new FormData(loginForm);const submit=loginForm.querySelector('button[type="submit"]');submit.disabled=true;submit.textContent='Signing in…';
    try{const result=await sellerApi('/api/seller/login',{method:'POST',body:JSON.stringify({email:form.get('email'),password:form.get('password')})});sellerCsrf=result.csrf;await loadSellerDashboard();}
    catch(error){showNotice(error.message,'error');}
    finally{const active=document.getElementById('sellerLoginForm');const button=active?.querySelector('button[type="submit"]');if(button){button.disabled=false;button.textContent='Sign in to Seller Centre →';}}
  });
}
function renderDashboardShell(){
  sellerApp.innerHTML=`<div class="seller-dashboard-head"><div><div class="eyebrow">SELLER DASHBOARD</div><h2>${esc(currentSeller?.business_name||'Your store')}</h2><p>Signed in as ${esc(currentSeller?.email||'')}</p></div><button type="button" class="mini" data-seller-action="logout">Logout</button></div><div class="seller-dashboard-tabs"><button type="button" data-seller-tab="products" class="${currentSellerView==='products'?'active':''}">My products</button><button type="button" data-seller-tab="orders" class="${currentSellerView==='orders'?'active':''}">My orders</button><button type="button" data-seller-tab="profile" class="${currentSellerView==='profile'?'active':''}">Account details</button></div><div id="sellerNotice" class="seller-notice" hidden></div><div id="sellerPanel"><div class="panel">Loading…</div></div>`;
  sellerApp.querySelectorAll('[data-seller-tab]').forEach(button=>button.addEventListener('click',()=>{currentSellerView=button.dataset.sellerTab;renderDashboardShell();loadSellerView().catch(showLoadError);}));
  sellerApp.querySelector('[data-seller-action="logout"]').addEventListener('click',logoutSeller);
}
async function loadSellerDashboard(){
  const session=await sellerApi('/api/seller/session');
  if(!session.authenticated){showAuth('register');return;}
  currentSeller=session.seller;sellerCsrf=session.csrf;currentSellerView='products';renderDashboardShell();await loadSellerView();
}
async function loadSellerView(){if(currentSellerView==='products')return loadProducts();if(currentSellerView==='orders')return loadOrders();return loadProfile();}
function showLoadError(error){const panel=document.getElementById('sellerPanel');if(panel)panel.innerHTML=`<div class="seller-notice is-error">${esc(error.message||'Could not load this section.')}</div>`;}
async function loadProducts(){
  const result=await sellerApi('/api/seller/products');sellerCsrf=result.csrf||sellerCsrf;productCache=result.products||[];
  const panel=document.getElementById('sellerPanel');if(!panel)return;
  panel.innerHTML=`<div class="seller-panel-title"><div><h3>My products</h3><p>Add products for admin review. Unapproved products do not appear in the public store.</p></div><button type="button" class="btn" data-seller-action="add-product">+ Add product</button></div>${productCache.length?`<div class="seller-products-grid">${productCache.map(product=>`<article class="seller-product-card"><div class="seller-product-image">${product.image_url?`<img src="${esc(product.image_url)}" alt="${esc(product.name)}">`:'<span>No image yet</span>'}</div><div class="seller-product-info"><div class="seller-card-top"><span class="seller-status status-${esc(product.approval_status||'approved')}">${esc(product.approval_status||'approved')}</span><span class="muted">Stock: ${Number(product.stock)}</span></div><h4>${esc(product.name)}</h4><div class="muted">${esc(product.category)}</div><div class="prices"><span class="price">${money(product.price)}</span><span class="mrp">${money(product.mrp)}</span></div>${product.approval_note?`<p class="seller-review-note">Admin note: ${esc(product.approval_note)}</p>`:''}<button class="mini seller-edit-button" data-seller-action="edit-product" data-product-id="${Number(product.id)}">Edit product</button></div></article>`).join('')}</div>`:'<div class="seller-empty"><h3>No products yet</h3><p>Add your first product. It will be reviewed before it goes live.</p><button type="button" class="btn" data-seller-action="add-product">Add your first product →</button></div>'}`;
  panel.querySelectorAll('[data-seller-action="add-product"]').forEach(button=>button.addEventListener('click',()=>renderProductForm()));
  panel.querySelectorAll('[data-seller-action="edit-product"]').forEach(button=>button.addEventListener('click',()=>renderProductForm(productCache.find(p=>Number(p.id)===Number(button.dataset.productId)))));
}
function renderProductForm(product=null){
  const panel=document.getElementById('sellerPanel');if(!panel)return;
  const specs=product?.specifications&&typeof product.specifications==='object'?JSON.stringify(product.specifications,null,2):'{}';
  panel.innerHTML=`<div class="seller-panel-title"><div><h3>${product?'Edit product':'Add a product'}</h3><p>${product?'Saving changes sends the listing back to admin review.':'New listings stay hidden from customers until approved.'}</p></div><button type="button" class="mini" id="sellerCancelEdit">← Back to products</button></div><form id="sellerProductForm" class="seller-form seller-product-form">
    <label>Product name *<input name="name" required maxlength="160" value="${esc(product?.name||'')}" placeholder="e.g. Classic Gold Watch"></label>
    <div class="seller-form-two"><label>Category *<select name="category" required>${SELLER_CATEGORIES.map(category=>`<option value="${esc(category)}" ${product?.category===category?'selected':''}>${esc(category)}</option>`).join('')}</select></label><label>Available stock *<input name="stock" type="number" min="0" max="1000000" step="1" required value="${Number(product?.stock||0)}"></label></div>
    <div class="seller-form-two"><label>Selling price (₹) *<input name="price" type="number" min="1" step="1" required value="${Number(product?.price||'')}" placeholder="799"></label><label>MRP (₹) *<input name="mrp" type="number" min="1" step="1" required value="${Number(product?.mrp||'')}" placeholder="1199"></label></div>
    <label>Product description<textarea name="description" rows="4" maxlength="5000" placeholder="Describe the product clearly">${esc(product?.description||'')}</textarea></label>
    <label>Specifications (JSON, optional)<textarea name="specifications" rows="4" spellcheck="false">${esc(specs)}</textarea><small class="seller-help">Example: {"colour":"Black","material":"Steel"}</small></label>
    <label>Product image ${product?'(optional when editing)':'*'}<input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" ${product?'':'required'}><small class="seller-help">JPG, PNG, WebP or GIF · Maximum 5 MB.</small></label>
    ${product?.image_url?`<div class="seller-current-image"><span>Current image</span><img src="${esc(product.image_url)}" alt="Current product image"></div>`:''}
    <div class="seller-form-actions"><button type="submit" class="btn">${product?'Save changes for review':'Submit product for review →'}</button><button type="button" class="mini" id="sellerCancelEditBottom">Cancel</button></div><div id="sellerFormError" class="seller-notice" hidden></div>
  </form>`;
  const goBack=()=>loadProducts().catch(showLoadError);document.getElementById('sellerCancelEdit').addEventListener('click',goBack);document.getElementById('sellerCancelEditBottom').addEventListener('click',goBack);
  document.getElementById('sellerProductForm').addEventListener('submit',async event=>{
    event.preventDefault();const form=event.currentTarget;const formData=new FormData(form);const specificationsText=String(formData.get('specifications')||'{}').trim()||'{}';let specifications;
    try{specifications=JSON.parse(specificationsText);if(!specifications||typeof specifications!=='object'||Array.isArray(specifications))throw new Error();}catch{form.querySelector('#sellerFormError').textContent='Specifications must be valid JSON, e.g. {"colour":"Black"}.';form.querySelector('#sellerFormError').className='seller-notice is-error';form.querySelector('#sellerFormError').hidden=false;return;}
    const payload={name:formData.get('name'),category:formData.get('category'),stock:Number(formData.get('stock')),price:Number(formData.get('price')),mrp:Number(formData.get('mrp')),description:formData.get('description'),specifications};
    const submit=form.querySelector('button[type="submit"]');submit.disabled=true;submit.textContent='Saving…';
    try{
      let result;if(product)result=await sellerApi('/api/seller/products/'+Number(product.id),{method:'PUT',headers:{'X-CSRF-Token':sellerCsrf},body:JSON.stringify(payload)});else result=await sellerApi('/api/seller/products',{method:'POST',headers:{'X-CSRF-Token':sellerCsrf},body:JSON.stringify(payload)});
      const productId=Number(result.id||product?.id);const file=formData.get('image');
      if(file instanceof File&&file.size){const upload=new FormData();upload.append('file',file);upload.append('alt',payload.name);await sellerApi(`/api/seller/products/${productId}/image`,{method:'POST',headers:{'X-CSRF-Token':sellerCsrf},body:upload});}
      await loadProducts();showNotice(result.message||'Product submitted for admin review.');
    }catch(error){const errorEl=form.querySelector('#sellerFormError');if(errorEl){errorEl.textContent=error.message||'Could not save product.';errorEl.className='seller-notice is-error';errorEl.hidden=false;}}
    finally{const current=form.querySelector('button[type="submit"]');if(current){current.disabled=false;current.textContent=product?'Save changes for review':'Submit product for review →';}}
  });
}
async function loadOrders(){
  const result=await sellerApi('/api/seller/orders');sellerCsrf=result.csrf||sellerCsrf;orderCache=result.orders||[];
  const panel=document.getElementById('sellerPanel');if(!panel)return;
  panel.innerHTML=`<div class="seller-panel-title"><div><h3>Orders for my products</h3><p>Only order items assigned to your seller account are shown. Updating your fulfilment status does not change other sellers' items.</p></div></div>${orderCache.length?`<div class="seller-order-list">${orderCache.map(order=>`<article class="seller-order-card"><div class="seller-order-title"><div><strong>${esc(order.order_id)}</strong><div class="muted">${new Date(order.created_at).toLocaleString('en-IN')}</div></div><span class="seller-status status-${esc(String(order.seller_status||'New').toLowerCase())}">${esc(order.seller_status||'New')}</span></div><h4>${esc(order.name_snapshot)} × ${Number(order.qty)}</h4><p><strong>${money(Number(order.price_snapshot)*Number(order.qty))}</strong> · ${esc(order.payment_method)} payment</p><div class="seller-order-address"><strong>${esc(order.customer_name)}</strong> · ${esc(order.phone)}${order.email?` · ${esc(order.email)}`:''}<br>${esc([order.address,order.area,order.landmark,order.city,order.state,order.pincode].filter(Boolean).join(', '))}</div><div class="seller-order-actions"><label>Fulfilment status<select data-order-status="${Number(order.item_id)}">${['New','Accepted','Packed','Shipped','Delivered'].map(status=>`<option value="${status}" ${(order.seller_status||'New')===status?'selected':''} ${status==='New'?'disabled':''}>${status}</option>`).join('')}</select></label><label>Tracking number<input data-order-tracking="${Number(order.item_id)}" value="${esc(order.seller_tracking_number||'')}" placeholder="Optional tracking number"></label><button type="button" class="mini" data-order-save="${Number(order.item_id)}">Save status</button></div><div class="muted">Overall store order status: ${esc(order.order_status)}</div></article>`).join('')}</div>`:'<div class="seller-empty"><h3>No seller orders yet</h3><p>When customers order approved products belonging to your store, the relevant items will appear here.</p></div>'}`;
  panel.querySelectorAll('[data-order-save]').forEach(button=>button.addEventListener('click',async()=>{
    const id=Number(button.dataset.orderSave);const status=panel.querySelector(`[data-order-status="${id}"]`)?.value;const trackingNumber=panel.querySelector(`[data-order-tracking="${id}"]`)?.value||'';
    if(!status||status==='New'){showNotice('Choose a fulfilment status first.','error');return;}
    button.disabled=true;try{await sellerApi(`/api/seller/orders/${id}`,{method:'PATCH',headers:{'X-CSRF-Token':sellerCsrf},body:JSON.stringify({status,trackingNumber})});await loadOrders();showNotice('Order item status updated.');}catch(error){showNotice(error.message,'error');}finally{button.disabled=false;}
  }));
}
function loadProfile(){const panel=document.getElementById('sellerPanel');if(!panel)return;panel.innerHTML=`<div class="seller-profile panel"><div class="eyebrow">SELLER PROFILE</div><h3>${esc(currentSeller.business_name)}</h3><dl><dt>Contact person</dt><dd>${esc(currentSeller.contact_name)}</dd><dt>Email</dt><dd>${esc(currentSeller.email)}</dd><dt>Mobile</dt><dd>${esc(currentSeller.phone)}</dd><dt>GSTIN</dt><dd>${esc(currentSeller.gstin||'Not provided')}</dd><dt>Business address</dt><dd>${esc(currentSeller.address||'Not provided')}</dd><dt>Account status</dt><dd><span class="seller-status status-approved">Approved</span></dd><dt>Member since</dt><dd>${currentSeller.created_at?new Date(currentSeller.created_at).toLocaleDateString('en-IN'):'—'}</dd></dl><p class="seller-help">To change your registered contact details, contact the store admin for now.</p></div>`;}
async function logoutSeller(){try{await sellerApi('/api/seller/logout',{method:'POST'});}finally{showAuth('login','You have been logged out.');}}
(async function initSeller(){try{const session=await sellerApi('/api/seller/session');if(session.authenticated){currentSeller=session.seller;sellerCsrf=session.csrf;currentSellerView='products';renderDashboardShell();await loadSellerView();}else showAuth('register');}catch(error){sellerApp.innerHTML=`<div class="seller-notice is-error">Seller Centre could not connect to the server: ${esc(error.message)}. Confirm the marketplace database migration is deployed, then refresh.</div>`;}})();
