const json = (data, status=200, headers={}) => new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers}});
const bad = (message, status=400) => json({error:message}, status);
const text = (value) => value == null ? '' : String(value);
const now = () => new Date().toISOString();
const slugify = (s) => text(s).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || ('product-'+Date.now());
const enc = new TextEncoder();
async function sha256(value){const b=await crypto.subtle.digest('SHA-256',enc.encode(value));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function hmac(secret, value){const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=await crypto.subtle.sign('HMAC',key,enc.encode(value));return [...new Uint8Array(sig)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function timingSafe(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++)r|=a.charCodeAt(i)^b.charCodeAt(i);return r===0;}
function cookieOpts(url, maxAge=2592000){return `Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${url.protocol==='https:'?'; Secure':''}`;}
function cookie(name,value,opts=''){return `${name}=${encodeURIComponent(value)}; ${opts}`;}
function readCookie(request,name){const c=request.headers.get('Cookie')||'';for(const part of c.split(';')){const [k,...v]=part.trim().split('=');if(k===name)return decodeURIComponent(v.join('='));}return null;}
async function adminSession(request,env){const token=readCookie(request,'lh_session');if(!token)return null;const hash=await sha256(token);const row=await env.DB.prepare('SELECT * FROM sessions WHERE token_hash=? AND expires_at>?').bind(hash,now()).first();return row||null;}
async function requireAdmin(request,env){const session=await adminSession(request,env);if(!session)return {response:bad('Unauthorized',401)};const csrf=request.headers.get('X-CSRF-Token');if(['POST','PUT','PATCH','DELETE'].includes(request.method)&&csrf!==session.csrf_token)return {response:bad('Invalid CSRF token',403)};return {session};}
function hexFromBytes(bytes){return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function bytesFromHex(hex){const out=new Uint8Array(hex.length/2);for(let i=0;i<out.length;i++)out[i]=parseInt(hex.slice(i*2,i*2+2),16);return out;}
async function sellerPasswordHash(password,saltHex){const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:bytesFromHex(saltHex),iterations:100000,hash:'SHA-256'},key,256);return hexFromBytes(bits);}
async function customerSession(request,env){const token=readCookie(request,'lh_customer_session');if(!token)return null;return await env.DB.prepare('SELECT c.id,c.name,c.email,c.phone,cs.token_hash AS session_token_hash,cs.csrf_token,cs.expires_at AS session_expires_at FROM customer_sessions cs JOIN customers c ON c.id=cs.customer_id WHERE cs.token_hash=? AND cs.expires_at>?').bind(await sha256(token),now()).first();}
async function requireCustomer(request,env){const session=await customerSession(request,env);if(!session)return {response:bad('Customer login required.',401)};const csrf=request.headers.get('X-CSRF-Token');if(['POST','PUT','PATCH','DELETE'].includes(request.method)&&csrf!==session.csrf_token)return {response:bad('Invalid CSRF token',403)};return {session};}
async function sellerSession(request,env){const token=readCookie(request,'lh_seller_session');if(!token)return null;const tokenHash=await sha256(token);return await env.DB.prepare(`SELECT s.id,s.business_name,s.contact_name,s.email,s.phone,s.gstin,s.address,s.status,s.status_note,s.created_at,ss.token_hash AS session_token_hash,ss.csrf_token,ss.expires_at AS session_expires_at FROM seller_sessions ss JOIN sellers s ON s.id=ss.seller_id WHERE ss.token_hash=? AND ss.expires_at>? AND s.status='approved'`).bind(tokenHash,now()).first();}
async function requireSeller(request,env){const session=await sellerSession(request,env);if(!session)return {response:bad('Seller login required. Your application must be approved before using the dashboard.',401)};const csrf=request.headers.get('X-CSRF-Token');if(['POST','PUT','PATCH','DELETE'].includes(request.method)&&csrf!==session.csrf_token)return {response:bad('Invalid CSRF token',403)};return {session};}
const SELLER_CATEGORIES=['Watches','Perfumes','Attar','Wireless Speakers','Wireless Neckband','Wired Earphones','TWS Earbuds','Power Banks','Mobile Accessories','Microphones','Holders & Stands','Headphone','Fans','Data Cables','Charger'];
function sellerProductFields(d){const name=text(d?.name).trim().slice(0,160);const category=text(d?.category).trim();const price=Number(d?.price);const mrp=Number(d?.mrp);const stock=Number(d?.stock);const description=text(d?.description).trim().slice(0,5000);let specifications={};try{const input=d?.specifications;if(typeof input==='string'&&input.trim())specifications=JSON.parse(input);else if(input&&typeof input==='object'&&!Array.isArray(input))specifications=input;}catch{return {error:'Specifications must be valid JSON.'};}if(!specifications||typeof specifications!=='object'||Array.isArray(specifications))return {error:'Specifications must be a JSON object.'};if(!name)return {error:'Product name is required.'};if(!SELLER_CATEGORIES.includes(category))return {error:'Choose a supported product category.'};if(!Number.isFinite(price)||price<1||!Number.isFinite(mrp)||mrp<price)return {error:'Enter a valid price and MRP (MRP must be at least the selling price).'};if(!Number.isInteger(stock)||stock<0||stock>1000000)return {error:'Stock must be a whole number from 0 to 1,000,000.'};if(JSON.stringify(specifications).length>10000)return {error:'Specifications are too long.'};return {name,category,price:Math.round(price),mrp:Math.round(mrp),stock,description,specifications};}
async function bodyJSON(request){try{return await request.json()}catch{return null}}
async function rateLimited(request,env,scope,limit=8,windowSeconds=900){
  const ip=request.headers.get('CF-Connecting-IP')||'unknown';
  const key=await sha256(`${scope}:${ip}`);
  const cutoff=new Date(Date.now()-windowSeconds*1000).toISOString();
  await env.DB.prepare('DELETE FROM auth_rate_limits WHERE window_started<?').bind(cutoff).run();
  const row=await env.DB.prepare('SELECT attempts,window_started FROM auth_rate_limits WHERE bucket_key=?').bind(key).first();
  if(row&&row.window_started>cutoff&&Number(row.attempts)>=limit)return true;
  if(row&&row.window_started>cutoff)await env.DB.prepare('UPDATE auth_rate_limits SET attempts=attempts+1 WHERE bucket_key=?').bind(key).run();
  else await env.DB.prepare('INSERT INTO auth_rate_limits(bucket_key,attempts,window_started) VALUES(?,1,?) ON CONFLICT(bucket_key) DO UPDATE SET attempts=1,window_started=excluded.window_started').bind(key,now()).run();
  return false;
}
async function validImageFile(file,allowed,maxBytes){
  if(!(file instanceof File)||!file.size||file.size>maxBytes||!allowed.has(file.type))return false;
  const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
  if(file.type==='image/jpeg')return bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
  if(file.type==='image/png')return bytes.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
  if(file.type==='image/gif')return bytes.length>=6&&String.fromCharCode(...bytes.slice(0,6)).startsWith('GIF8');
  if(file.type==='image/webp')return bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  return false;
}
async function getSettings(env){const rows=await env.DB.prepare('SELECT key,value FROM settings').all();return Object.fromEntries((rows.results||[]).map(r=>[r.key,r.value]));}
async function shipmentForOrder(env,orderId){const shipment=await env.DB.prepare('SELECT carrier,tracking_number,tracking_url,estimated_delivery,shipment_status,updated_at FROM shipments WHERE order_id=?').bind(orderId).first();if(!shipment)return {shipment:null,events:[]};const {results:events=[]}=await env.DB.prepare('SELECT status,description,location,created_at FROM shipment_events WHERE order_id=? ORDER BY id DESC LIMIT 30').bind(orderId).all();return {shipment,events};}
function imageUrl(key){return key ? `/media/${encodeURIComponent(key).replace(/%2F/g,'/')}` : ''}
const IMAGE_SIZE_TYPES = new Set(['large','medium','listing','small']);
const IMAGE_CATEGORY_TYPES = new Set(['product','tech','gallery','lifestyle']);
const IMAGE_STYLE_TYPES = new Set(['none','studio','lifestyle']);
function productOut(r){let specs={};try{specs=JSON.parse(r.specifications||'{}')}catch{};return {...r,id:Number(r.id),price:Number(r.price),mrp:Number(r.mrp),stock:Number(r.stock),rating:Number(r.rating||0),active:Boolean(r.active),specifications:specs,image_url:imageUrl(r.image_key)};}
async function attachImageVariants(env, rows){
  if(!rows.length)return [];
  const ids=[...new Set(rows.map(r=>Number(r.id)))];
  const placeholders=ids.map(()=>'?').join(',');
  let results=[];
  try{({results=[]}=await env.DB.prepare(`SELECT * FROM product_image_variants WHERE product_id IN (${placeholders}) ORDER BY sort_order,id`).bind(...ids).all());}
  catch(e){if(/no such table: product_image_variants/i.test(e?.message||''))return rows.map(row=>{const p=productOut(row);p.image_variants={};p.images={large:p.image_url||'',medium:p.image_url||'',listing:p.image_url||'',small:p.image_url||''};return p;});throw e;}
  const grouped=new Map();
  for(const row of results){
    const pid=Number(row.product_id);if(!grouped.has(pid))grouped.set(pid,{});
    grouped.get(pid)[row.size_type]={url:row.external_url||imageUrl(row.object_key),object_key:row.object_key||null,title:row.title||'',image_type:row.image_type||'product',option_code:row.option_code||'0',sort_order:Number(row.sort_order||0),show_in_slider:Boolean(row.show_in_slider),image_style:row.image_style||'none'};
  }
  return rows.map(row=>{
    const p=productOut(row);const variants=grouped.get(Number(row.id))||{};
    const large=variants.large?.url||p.image_url||'';
    const medium=variants.medium?.url||large;
    const listing=variants.listing?.url||medium||large;
    const small=variants.small?.url||listing||medium||large;
    p.image_variants=variants;p.images={large,medium,listing,small};p.image_url=large;
    return p;
  });
}
async function listProducts(env,url,includeInactive=false){let q='SELECT * FROM products';const where=[];const binds=[];const search=url.searchParams.get('q');const category=url.searchParams.get('category');if(!includeInactive){where.push('active=1');where.push("(seller_id IS NULL OR approval_status='approved')");}if(search){where.push('(name LIKE ? OR slug LIKE ? OR category LIKE ?)');const s=`%${search}%`;binds.push(s,s,s);}if(category){where.push('category=?');binds.push(category);}if(where.length)q+=' WHERE '+where.join(' AND ');q+=' ORDER BY created_at DESC';const {results=[]}=await env.DB.prepare(q).bind(...binds).all();return attachImageVariants(env,results)}
async function createOrder(env,data,paymentMethod,customerId=null){if(!data||!Array.isArray(data.items)||!data.items.length)return bad('Cart is empty');const customer=data.customer||{};for(const k of ['name','phone','address','city','state','pincode'])if(!text(customer[k]).trim())return bad(`Missing ${k}`);if(!/^\d{10}$/.test(text(customer.phone).replace(/\D/g,'')))return bad('Invalid mobile number');if(!/^\d{6}$/.test(text(customer.pincode)))return bad('Invalid pincode');
  if(data.items.length>50)return bad('Too many items in one order.');
  const quantities=new Map();for(const x of data.items){const id=Number(x?.productId),qty=Number(x?.qty);if(!Number.isSafeInteger(id)||id<1||!Number.isSafeInteger(qty)||qty<1||qty>100)return bad('Invalid cart item');quantities.set(id,(quantities.get(id)||0)+qty);}
  const ids=[...quantities.keys()];
  const placeholders=ids.map(()=>'?').join(',');const {results:products=[]}=await env.DB.prepare(`SELECT * FROM products WHERE id IN (${placeholders}) AND active=1 AND (seller_id IS NULL OR approval_status='approved')`).bind(...ids).all();const map=new Map(products.map(p=>[Number(p.id),p]));
  let subtotal=0;const items=[];for(const [id,qty] of quantities){const p=map.get(id);if(!p)return bad('One or more products are unavailable.');if(Number(p.stock)<qty)return bad(`Insufficient stock for ${p.name}`);subtotal+=Number(p.price)*qty;items.push({p,qty});}
  let discount=0;let coupon=null;const code=text(data.couponCode).trim().toUpperCase();if(code){coupon=await env.DB.prepare('SELECT * FROM coupons WHERE code=? AND enabled=1').bind(code).first();if(!coupon)return bad('Coupon not found');if(coupon.expires_at&&new Date(coupon.expires_at)<=new Date())return bad('Coupon expired');if(subtotal<Number(coupon.min_cart))return bad(`Minimum cart value is ₹${coupon.min_cart}`);if(coupon.usage_limit!=null&&Number(coupon.used_count)>=Number(coupon.usage_limit))return bad('Coupon usage limit reached');discount=coupon.type==='percent'?Math.min(subtotal*Number(coupon.value)/100,Number(coupon.max_discount||0)||Number.MAX_SAFE_INTEGER):Math.min(Number(coupon.value),Number(coupon.max_discount||0)||Number(coupon.value));}
  const settings=await getSettings(env);const shipping=subtotal>=Number(settings.free_shipping||499)?0:Number(settings.shipping_fee||49);const total=Math.max(0,Math.round(subtotal-discount+shipping));if(!Number.isSafeInteger(total)||total>100000000)return bad('Order total is outside the supported range.');
  const orderId=`LH-${crypto.randomUUID().split('-')[0].toUpperCase()}`;const idem=text(data.idempotencyKey).trim().slice(0,128)||crypto.randomUUID();
  const existing=await env.DB.prepare('SELECT * FROM orders WHERE idempotency_key=?').bind(idem).first();if(existing){if(existing.payment_method!==paymentMethod)return {response:bad('This checkout key was already used for a different payment method.',409)};return {order:existing};}
  const changed=[];try{
    for(const {p,qty} of items){const r=await env.DB.prepare('UPDATE products SET stock=stock-?,updated_at=? WHERE id=? AND stock>=?').bind(qty,now(),p.id,qty).run();if(!(r.meta?.changes||0)){throw new Error(`Insufficient stock for ${p.name}`)}changed.push({id:p.id,qty});}
    if(coupon){const r=await env.DB.prepare('UPDATE coupons SET used_count=used_count+1,updated_at=? WHERE code=? AND enabled=1 AND (usage_limit IS NULL OR used_count<usage_limit)').bind(now(),coupon.code).run();if(!(r.meta?.changes||0))throw new Error('Coupon no longer available');}
    await env.DB.prepare(`INSERT INTO orders(id,idempotency_key,customer_name,phone,email,address,area,landmark,city,state,pincode,subtotal,discount,shipping,total,coupon_code,payment_method,payment_status,status,customer_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(orderId,idem,text(customer.name),text(customer.phone),text(customer.email),text(customer.address),text(customer.area),text(customer.landmark),text(customer.city),text(customer.state),text(customer.pincode),subtotal,Math.round(discount),shipping,total,coupon?.code||null,paymentMethod,'pending',paymentMethod==='cod'?'Confirmed':'Pending',customerId,now(),now()).run();
    for(const {p,qty} of items)await env.DB.prepare('INSERT INTO order_items(order_id,product_id,name_snapshot,price_snapshot,qty,image_key,seller_id) VALUES(?,?,?,?,?,?,?)').bind(orderId,p.id,p.name,p.price,qty,p.image_key||null,p.seller_id||null).run();
    return {order:{id:orderId,status:paymentMethod==='cod'?'Confirmed':'Pending',payment_method:paymentMethod,total,subtotal,discount,shipping},created:true};
  }catch(e){for(const x of changed)await env.DB.prepare('UPDATE products SET stock=stock+?,updated_at=? WHERE id=?').bind(x.qty,now(),x.id).run();if(coupon)await env.DB.prepare('UPDATE coupons SET used_count=CASE WHEN used_count>0 THEN used_count-1 ELSE 0 END,updated_at=? WHERE code=?').bind(now(),coupon.code).run();return bad(e.message||'Could not create order',409)}
}
async function restoreInventory(env,orderId){const order=await env.DB.prepare('SELECT inventory_released FROM orders WHERE id=?').bind(orderId).first();if(!order||Number(order.inventory_released))return;const {results=[]}=await env.DB.prepare('SELECT product_id,qty FROM order_items WHERE order_id=?').bind(orderId).all();for(const i of results)await env.DB.prepare('UPDATE products SET stock=stock+?,updated_at=? WHERE id=?').bind(i.qty,now(),i.product_id).run();await env.DB.prepare('UPDATE orders SET inventory_released=1,updated_at=? WHERE id=?').bind(now(),orderId).run();}
function razorpayAuth(env){return `Basic ${btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)}`;}
async function razorpayOrder(env,orderId,amount){if(!env.RAZORPAY_KEY_ID||!env.RAZORPAY_KEY_SECRET)return null;const res=await fetch('https://api.razorpay.com/v1/orders',{method:'POST',headers:{Authorization:razorpayAuth(env),'content-type':'application/json'},body:JSON.stringify({amount:Math.round(amount*100),currency:'INR',receipt:orderId,notes:{internal_order_id:orderId}})});if(!res.ok)throw new Error('Razorpay order creation failed');return res.json();}
async function razorpayPayment(env,paymentId){const res=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:razorpayAuth(env)}});if(!res.ok)throw new Error('Unable to confirm payment with Razorpay');return res.json();}
async function withHeaders(response){const h=new Headers(response.headers);h.set('x-content-type-options','nosniff');h.set('referrer-policy','strict-origin-when-cross-origin');h.set('x-frame-options','SAMEORIGIN');h.set('permissions-policy','camera=(),microphone=(),geolocation=()');h.set('content-security-policy',"default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self' https://checkout.razorpay.com; connect-src 'self' https://api.razorpay.com; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com; object-src 'none'; base-uri 'self'; form-action 'self';");return new Response(response.body,{status:response.status,headers:h});}
export default {async fetch(request,env){const url=new URL(request.url);try{
  if(url.pathname.startsWith('/api/')){
    if(request.method==='GET'&&url.pathname==='/api/config'){const s=await getSettings(env);return json({storeName:s.store_name||'LUXURIOUS HUB',tagline:s.tagline||'THE EVERYDAY EDIT',whatsapp:s.whatsapp||'',codEnabled:s.cod_enabled!=='0',onlinePaymentEnabled:Boolean(env.RAZORPAY_KEY_ID&&env.RAZORPAY_KEY_SECRET)})}
    if(request.method==='GET'&&url.pathname==='/api/products')return json({products:await listProducts(env,url,false)});
    if(request.method==='GET'&&url.pathname.startsWith('/api/products/')){const identifier=decodeURIComponent(url.pathname.split('/').pop());const p=/^\d+$/.test(identifier)?await env.DB.prepare("SELECT * FROM products WHERE id=? AND active=1 AND (seller_id IS NULL OR approval_status='approved')").bind(Number(identifier)).first():await env.DB.prepare("SELECT * FROM products WHERE slug=? AND active=1 AND (seller_id IS NULL OR approval_status='approved')").bind(identifier).first();if(!p)return bad('Product not found',404);return json({product:(await attachImageVariants(env,[p]))[0]});}
    if(request.method==='POST'&&url.pathname==='/api/coupons/validate'){const d=await bodyJSON(request);const c=await env.DB.prepare('SELECT * FROM coupons WHERE code=? AND enabled=1').bind(text(d?.code).trim().toUpperCase()).first();if(!c)return bad('Coupon not found',404);const subtotal=Number(d?.subtotal||0);if(c.expires_at&&new Date(c.expires_at)<=new Date())return bad('Coupon expired');if(subtotal<Number(c.min_cart))return bad(`Minimum cart value is ₹${c.min_cart}`);if(c.usage_limit!=null&&Number(c.used_count)>=Number(c.usage_limit))return bad('Coupon usage limit reached');const discount=c.type==='percent'?Math.min(subtotal*Number(c.value)/100,Number(c.max_discount||0)||Number.MAX_SAFE_INTEGER):Math.min(Number(c.value),Number(c.max_discount||0)||Number(c.value));return json({code:c.code,type:c.type,value:Number(c.value),discount:Math.round(discount)});}
    if(request.method==='POST'&&url.pathname==='/api/customer/register'){if(await rateLimited(request,env,'customer-register',5,3600))return bad('Too many registration attempts. Please try again later.',429);const d=await bodyJSON(request)||{};const name=text(d.name).trim().slice(0,120),email=text(d.email).trim().toLowerCase(),phone=text(d.phone).replace(/\D/g,'').slice(-10),password=text(d.password);if(!name)return bad('Enter your name.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return bad('Enter a valid email address.');if(!/^\d{10}$/.test(phone))return bad('Enter a valid 10-digit mobile number.');if(password.length<10)return bad('Password must be at least 10 characters long.');const saltHex=hexFromBytes(crypto.getRandomValues(new Uint8Array(16)));const passwordHash=await sellerPasswordHash(password,saltHex);try{const r=await env.DB.prepare('INSERT INTO customers(name,email,phone,password_hash,password_salt,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(name,email,phone,passwordHash,saltHex,now(),now()).run();const token=crypto.randomUUID()+crypto.randomUUID(),csrf=crypto.randomUUID();await env.DB.prepare('INSERT INTO customer_sessions(token_hash,csrf_token,customer_id,expires_at) VALUES(?,?,?,?)').bind(await sha256(token),csrf,r.meta.last_row_id,new Date(Date.now()+30*864e5).toISOString()).run();return json({ok:true,csrf,customer:{id:r.meta.last_row_id,name,email,phone}},201,{'Set-Cookie':cookie('lh_customer_session',token,cookieOpts(url))});}catch(e){if(/unique|constraint/i.test(e?.message||''))return bad('An account with this email already exists. Please sign in.',409);throw e;}}
    if(request.method==='POST'&&url.pathname==='/api/customer/login'){if(await rateLimited(request,env,'customer-login',8,900))return bad('Too many login attempts. Please try again in 15 minutes.',429);const d=await bodyJSON(request)||{};const email=text(d.email).trim().toLowerCase(),password=text(d.password);if(!email||!password)return bad('Enter your email and password.');const c=await env.DB.prepare('SELECT id,name,email,phone,password_hash,password_salt FROM customers WHERE email=?').bind(email).first();if(!c||!timingSafe(await sellerPasswordHash(password,c.password_salt),c.password_hash))return bad('Invalid email or password.',401);const token=crypto.randomUUID()+crypto.randomUUID(),csrf=crypto.randomUUID();await env.DB.prepare('INSERT INTO customer_sessions(token_hash,csrf_token,customer_id,expires_at) VALUES(?,?,?,?)').bind(await sha256(token),csrf,c.id,new Date(Date.now()+30*864e5).toISOString()).run();return json({ok:true,csrf,customer:{id:c.id,name:c.name,email:c.email,phone:c.phone}},200,{'Set-Cookie':cookie('lh_customer_session',token,cookieOpts(url))});}
    if(request.method==='GET'&&url.pathname==='/api/customer/session'){const c=await customerSession(request,env);return json({authenticated:Boolean(c),csrf:c?.csrf_token||null,customer:c?{id:c.id,name:c.name,email:c.email,phone:c.phone}:null});}
    if(request.method==='POST'&&url.pathname==='/api/customer/logout'){const token=readCookie(request,'lh_customer_session');if(token)await env.DB.prepare('DELETE FROM customer_sessions WHERE token_hash=?').bind(await sha256(token)).run();return json({ok:true},200,{'Set-Cookie':cookie('lh_customer_session','',cookieOpts(url,0))});}
    if(request.method==='GET'&&url.pathname==='/api/customer/orders'){const a=await requireCustomer(request,env);if(a.response)return a.response;const {results=[]}=await env.DB.prepare('SELECT id,status,payment_method,payment_status,total,created_at,updated_at,delivered_at,tracking_number FROM orders WHERE customer_id=? ORDER BY created_at DESC LIMIT 100').bind(a.session.id).all();const orders=[];for(const o of results){const {results:items=[]}=await env.DB.prepare('SELECT name_snapshot,qty,price_snapshot FROM order_items WHERE order_id=?').bind(o.id).all();const ret=await env.DB.prepare('SELECT id,status,reason,details,admin_note,created_at FROM return_requests WHERE order_id=?').bind(o.id).first();const tracking=await shipmentForOrder(env,o.id);orders.push({...o,total:Number(o.total),items,returnRequest:ret||null,...tracking});}return json({orders,csrf:a.session.csrf_token});}
    if(request.method==='POST'&&url.pathname==='/api/customer/returns'){const a=await requireCustomer(request,env);if(a.response)return a.response;const d=await bodyJSON(request)||{};const orderId=text(d.orderId).trim(),reason=text(d.reason).trim().slice(0,80),details=text(d.details).trim().slice(0,1000);if(!orderId||!['Damaged item','Wrong item','Missing item','Not as described','Other'].includes(reason))return bad('Choose a valid return reason.');const order=await env.DB.prepare('SELECT id,status,delivered_at,updated_at,payment_status FROM orders WHERE id=? AND customer_id=?').bind(orderId,a.session.id).first();if(!order)return bad('Order not found in your account.',404);if(order.status!=='Delivered')return bad('A return can only be requested after delivery.');const deliveredAt=order.delivered_at||order.updated_at;const configuredDays=Number((await getSettings(env)).returns_window_days||7);const days=Number.isFinite(configuredDays)?Math.trunc(Math.min(30,Math.max(1,configuredDays))):7;if(Date.now()-new Date(deliveredAt).getTime()>days*864e5)return bad(`The ${days}-day return request window has passed. Contact store support if you need help.`,409);try{await env.DB.prepare('INSERT INTO return_requests(order_id,customer_id,reason,details,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(orderId,a.session.id,reason,details,now(),now()).run();return json({ok:true,message:'Return request submitted. The store team will review it.'},201);}catch(e){if(/unique|constraint/i.test(e?.message||''))return bad('A return request already exists for this order.',409);throw e;}}
    if(request.method==='POST'&&url.pathname==='/api/orders'){const c=await customerSession(request,env);const result=await createOrder(env,await bodyJSON(request),'cod',c?.id||null);return result instanceof Response?result:json(result);}
    if(request.method==='GET'&&url.pathname.startsWith('/api/orders/')){const id=decodeURIComponent(url.pathname.split('/').pop());const phone=url.searchParams.get('phone')||'';const o=await env.DB.prepare('SELECT id,status,payment_method,payment_status,total,created_at,tracking_number,customer_name,phone FROM orders WHERE id=?').bind(id).first();if(!o)return bad('Order not found',404);if(phone&&o.phone!==phone)return bad('Order not found',404);if(!phone)return bad('Mobile number required',401);const {results:items=[]}=await env.DB.prepare('SELECT name_snapshot,qty,price_snapshot FROM order_items WHERE order_id=?').bind(id).all();const tracking=await shipmentForOrder(env,id);return json({order:{...o,total:Number(o.total),items,...tracking}});}
    if(request.method==='POST'&&url.pathname==='/api/payment/create'){
      if(!env.RAZORPAY_KEY_ID||!env.RAZORPAY_KEY_SECRET)return bad('Online payment is not configured',503);
      const c=await customerSession(request,env);const result=await createOrder(env,await bodyJSON(request),'razorpay',c?.id||null);if(result.response)return result.response;
      let order=result.order;
      if(order.payment_status==='captured')return bad('This order has already been paid.',409);
      if(order.status==='Cancelled'||Number(order.inventory_released))return bad('This order is no longer payable. Please start a new checkout.',409);
      if(order.razorpay_order_id)return json({keyId:env.RAZORPAY_KEY_ID,orderId:order.id,razorpayOrderId:order.razorpay_order_id,amount:Number(order.total),currency:'INR'});
      let rzp;try{rzp=await razorpayOrder(env,order.id,Number(order.total));}catch(e){await env.DB.prepare("UPDATE orders SET status='Cancelled',payment_status='failed',updated_at=? WHERE id=? AND payment_status<>'captured'").bind(now(),order.id).run();await restoreInventory(env,order.id);return bad(e.message||'Payment order creation failed',502);}
      await env.DB.prepare('UPDATE orders SET razorpay_order_id=?,updated_at=? WHERE id=? AND payment_status<>?').bind(rzp.id,now(),order.id,'captured').run();
      return json({keyId:env.RAZORPAY_KEY_ID,orderId:order.id,razorpayOrderId:rzp.id,amount:Number(order.total),currency:'INR'});
    }
    if(request.method==='POST'&&url.pathname==='/api/payment/verify'){
      if(!env.RAZORPAY_KEY_SECRET||!env.RAZORPAY_KEY_ID)return bad('Payment verification unavailable',503);
      const d=await bodyJSON(request);if(!d?.orderId||!d?.razorpay_order_id||!d?.razorpay_payment_id||!d?.razorpay_signature)return bad('Payment details are incomplete.');
      const o=await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(text(d.orderId)).first();if(!o||o.razorpay_order_id!==text(d.razorpay_order_id))return bad('Invalid payment order',400);
      const expected=await hmac(env.RAZORPAY_KEY_SECRET,`${d.razorpay_order_id}|${d.razorpay_payment_id}`);if(!timingSafe(expected,text(d.razorpay_signature)))return bad('Invalid payment signature',400);
      if(o.payment_status==='captured'&&o.razorpay_payment_id===text(d.razorpay_payment_id))return json({ok:true,orderId:o.id,paymentStatus:'captured'});
      if(o.status==='Cancelled'||Number(o.inventory_released))return bad('This order is no longer payable. Please contact store support.',409);
      let payment;try{payment=await razorpayPayment(env,text(d.razorpay_payment_id));}catch{return bad('Payment could not be confirmed with the payment provider. Please contact support before retrying.',502);}
      if(payment.order_id!==o.razorpay_order_id||Number(payment.amount)!==Math.round(Number(o.total)*100)||payment.currency!=='INR'||payment.status!=='captured')return bad('Payment details do not match this order or payment is not captured.',409);
      await env.DB.prepare("UPDATE orders SET razorpay_payment_id=?,payment_status='captured',status=CASE WHEN status='Pending' THEN 'Confirmed' ELSE status END,updated_at=? WHERE id=? AND payment_status<>'captured'").bind(text(d.razorpay_payment_id),now(),o.id).run();
      return json({ok:true,orderId:o.id,paymentStatus:'captured'});
    }
    if(request.method==='POST'&&url.pathname==='/api/webhooks/razorpay'){
      const raw=await request.text();if(raw.length>1024*1024)return bad('Webhook payload is too large.',413);
      if(!env.RAZORPAY_WEBHOOK_SECRET)return bad('Webhook secret not configured',503);
      const sig=request.headers.get('x-razorpay-signature')||'';const expected=await hmac(env.RAZORPAY_WEBHOOK_SECRET,raw);if(!timingSafe(expected,sig))return bad('Invalid webhook signature',400);
      let data;try{data=JSON.parse(raw);}catch{return bad('Invalid webhook payload.');}
      const eventId=request.headers.get('x-razorpay-event-id')||await sha256(raw+sig);
      const payment=data?.payload?.payment?.entity;const rzpOrder=payment?.order_id;
      if(payment&&rzpOrder){
        const order=await env.DB.prepare('SELECT * FROM orders WHERE razorpay_order_id=?').bind(rzpOrder).first();
        if(order){
          const validAmount=Number(payment.amount)===Math.round(Number(order.total)*100)&&payment.currency==='INR';
          if((data.event==='payment.captured'||data.event==='order.paid')&&validAmount&&payment.status==='captured'){
            await env.DB.prepare("UPDATE orders SET payment_status='captured',status=CASE WHEN status='Pending' THEN 'Confirmed' ELSE status END,razorpay_payment_id=COALESCE(?,razorpay_payment_id),updated_at=? WHERE id=? AND payment_status<>'captured'").bind(payment.id||null,now(),order.id).run();
          }else if(data.event==='payment.failed'&&validAmount&&order.payment_status!=='captured'){
            await env.DB.prepare("UPDATE orders SET payment_status='failed',updated_at=? WHERE id=? AND payment_status<>'captured'").bind(now(),order.id).run();await restoreInventory(env,order.id);
          }
        }
      }
      try{await env.DB.prepare('INSERT INTO webhook_events(event_id,event_type) VALUES(?,?)').bind(eventId,text(data.event||'unknown').slice(0,100)).run();}catch(e){if(!/unique|constraint/i.test(e?.message||''))throw e;}
      return json({ok:true});
    }
    if(url.pathname.startsWith('/api/seller/')){
      if(request.method==='POST'&&url.pathname==='/api/seller/register'){
        if(await rateLimited(request,env,'seller-register',5,3600))return bad('Too many registration attempts. Please try again later.',429);
        const d=await bodyJSON(request)||{};
        const businessName=text(d.businessName).trim().slice(0,160);
        const contactName=text(d.contactName).trim().slice(0,120);
        const email=text(d.email).trim().toLowerCase();
        const phone=text(d.phone).replace(/\D/g,'').slice(-10);
        const gstin=text(d.gstin).trim().toUpperCase();
        const address=text(d.address).trim().slice(0,600);
        const password=text(d.password);
        if(!businessName||!contactName)return bad('Business name and contact name are required.');
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return bad('Enter a valid email address.');
        if(!/^\d{10}$/.test(phone))return bad('Enter a valid 10-digit Indian mobile number.');
        if(gstin&&!/^[0-9A-Z]{15}$/.test(gstin))return bad('GSTIN must contain 15 letters/numbers. Leave it blank if you do not have one.');
        if(password.length<10)return bad('Password must be at least 10 characters long.');
        const existing=await env.DB.prepare('SELECT id FROM sellers WHERE email=?').bind(email).first();
        if(existing)return bad('An account with this email already exists. Use Seller Login or contact the store admin.',409);
        const salt=crypto.getRandomValues(new Uint8Array(16));const saltHex=hexFromBytes(salt);const passwordHash=await sellerPasswordHash(password,saltHex);
        try{
          const result=await env.DB.prepare('INSERT INTO sellers(business_name,contact_name,email,phone,gstin,address,password_hash,password_salt,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(businessName,contactName,email,phone,gstin,address,passwordHash,saltHex,'pending',now(),now()).run();
          return json({ok:true,id:result.meta?.last_row_id||null,status:'pending',message:'Application submitted. The store admin must approve your seller account before you can sign in.'},201);
        }catch(e){
          // Guard against two submissions racing for the same unique email.
          if(/unique|constraint/i.test(e?.message||''))return bad('An account with this email already exists.',409);
          throw e;
        }
      }
      if(request.method==='POST'&&url.pathname==='/api/seller/login'){
        if(await rateLimited(request,env,'seller-login',8,900))return bad('Too many login attempts. Please try again in 15 minutes.',429);
        const d=await bodyJSON(request)||{};const email=text(d.email).trim().toLowerCase();const password=text(d.password);
        if(!email||!password)return bad('Enter your email and password.');
        const seller=await env.DB.prepare('SELECT id,business_name,contact_name,email,phone,gstin,address,password_hash,password_salt,status,status_note FROM sellers WHERE email=?').bind(email).first();
        if(!seller)return bad('Invalid email or password.',401);
        const candidate=await sellerPasswordHash(password,seller.password_salt);
        if(!timingSafe(candidate,seller.password_hash))return bad('Invalid email or password.',401);
        if(seller.status==='pending')return bad('Your seller application is waiting for admin approval.',403);
        if(seller.status==='rejected')return bad(seller.status_note||'Your seller application was not approved. Contact the store admin for details.',403);
        if(seller.status!=='approved')return bad('Your seller account is currently suspended. Contact the store admin.',403);
        const token=crypto.randomUUID()+crypto.randomUUID();const csrf=crypto.randomUUID();
        await env.DB.prepare('INSERT INTO seller_sessions(token_hash,csrf_token,seller_id,expires_at) VALUES(?,?,?,?)').bind(await sha256(token),csrf,seller.id,new Date(Date.now()+30*864e5).toISOString()).run();
        return json({ok:true,csrf,seller:{id:seller.id,business_name:seller.business_name,contact_name:seller.contact_name,email:seller.email,status:seller.status}},200,{'Set-Cookie':cookie('lh_seller_session',token,cookieOpts(url))});
      }
      if(request.method==='GET'&&url.pathname==='/api/seller/session'){
        const s=await sellerSession(request,env);
        return json({authenticated:Boolean(s),csrf:s?.csrf_token||null,seller:s?{id:s.id,business_name:s.business_name,contact_name:s.contact_name,email:s.email,phone:s.phone,gstin:s.gstin,address:s.address,status:s.status,created_at:s.created_at}:null});
      }
      if(request.method==='POST'&&url.pathname==='/api/seller/logout'){
        const token=readCookie(request,'lh_seller_session');if(token)await env.DB.prepare('DELETE FROM seller_sessions WHERE token_hash=?').bind(await sha256(token)).run();
        return json({ok:true},200,{'Set-Cookie':cookie('lh_seller_session','',cookieOpts(url,0))});
      }
      const sellerAuth=await requireSeller(request,env);if(sellerAuth.response)return sellerAuth.response;const seller=sellerAuth.session;
      if(request.method==='GET'&&url.pathname==='/api/seller/products'){
        const {results=[]}=await env.DB.prepare('SELECT * FROM products WHERE seller_id=? ORDER BY updated_at DESC, id DESC').bind(seller.id).all();
        return json({products:await attachImageVariants(env,results),csrf:seller.csrf_token});
      }
      if(request.method==='POST'&&url.pathname==='/api/seller/products'){
        const d=await bodyJSON(request)||{};const f=sellerProductFields(d);if(f.error)return bad(f.error);
        const slug=`${slugify(f.name)}-s${seller.id}-${crypto.randomUUID().split('-')[0]}`;
        const result=await env.DB.prepare("INSERT INTO products(slug,name,category,price,mrp,stock,tag,rating,description,specifications,active,seller_id,approval_status,approval_note,created_at,updated_at) VALUES(?,?,?,?,?,?,?,0,?,?,0,?,'pending','',?,?)").bind(slug,f.name,f.category,f.price,f.mrp,f.stock,'Seller',f.description,JSON.stringify(f.specifications),seller.id,now(),now()).run();
        return json({ok:true,id:result.meta?.last_row_id,approval_status:'pending',message:'Product submitted for admin review.'},201);
      }
      if(request.method==='PUT'&&/^\/api\/seller\/products\/\d+$/.test(url.pathname)){
        const id=Number(url.pathname.split('/').pop());const existing=await env.DB.prepare('SELECT * FROM products WHERE id=? AND seller_id=?').bind(id,seller.id).first();if(!existing)return bad('Product not found.',404);
        const d=await bodyJSON(request)||{};const f=sellerProductFields(d);if(f.error)return bad(f.error);
        const slug=`${slugify(f.name)}-s${seller.id}-${crypto.randomUUID().split('-')[0]}`;
        await env.DB.prepare("UPDATE products SET slug=?,name=?,category=?,price=?,mrp=?,stock=?,tag='Seller',description=?,specifications=?,active=0,approval_status='pending',approval_note='',updated_at=? WHERE id=? AND seller_id=?").bind(slug,f.name,f.category,f.price,f.mrp,f.stock,f.description,JSON.stringify(f.specifications),now(),id,seller.id).run();
        return json({ok:true,id,approval_status:'pending',message:'Your changes were saved and sent for admin review. The listing will be hidden until approval.'});
      }
      if(request.method==='POST'&&/^\/api\/seller\/products\/\d+\/image$/.test(url.pathname)){
        const id=Number(url.pathname.split('/')[4]);const product=await env.DB.prepare('SELECT id FROM products WHERE id=? AND seller_id=?').bind(id,seller.id).first();if(!product)return bad('Product not found.',404);
        const form=await request.formData();const file=form.get('file');if(!(file instanceof File)||!file.size)return bad('Choose a product image.');
        const allowed=new Set(['image/jpeg','image/png','image/webp','image/gif']);if(!await validImageFile(file,allowed,5*1024*1024))return bad('Use a valid JPG, PNG, WebP or GIF image up to 5 MB.');
        const ext=({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'})[file.type];const key=`seller-products/${seller.id}/${id}/${crypto.randomUUID()}.${ext}`;
        await env.IMAGES.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type,cacheControl:'public, max-age=31536000, immutable'}});
        await env.DB.prepare('UPDATE products SET image_key=?,updated_at=? WHERE id=? AND seller_id=?').bind(key,now(),id,seller.id).run();
        await env.DB.prepare('INSERT INTO product_images(product_id,object_key,alt_text,sort_order) VALUES(?,?,?,0)').bind(id,key,text(form.get('alt')||'Product image').slice(0,200)).run();
        return json({ok:true,image_url:imageUrl(key),message:'Image uploaded.'},201);
      }
      if(request.method==='GET'&&url.pathname==='/api/seller/orders'){
        const {results=[]}=await env.DB.prepare(`SELECT oi.id AS item_id,oi.order_id,oi.name_snapshot,oi.price_snapshot,oi.qty,oi.seller_status,oi.seller_tracking_number,o.customer_name,o.phone,o.email,o.address,o.area,o.landmark,o.city,o.state,o.pincode,o.payment_method,o.payment_status,o.status AS order_status,o.created_at FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE oi.seller_id=? ORDER BY o.created_at DESC,oi.id DESC LIMIT 500`).bind(seller.id).all();
        return json({orders:results.map(x=>({...x,price_snapshot:Number(x.price_snapshot),qty:Number(x.qty)})),csrf:seller.csrf_token});
      }
      if(request.method==='PATCH'&&/^\/api\/seller\/orders\/\d+$/.test(url.pathname)){
        const id=Number(url.pathname.split('/').pop());const d=await bodyJSON(request)||{};const status=text(d.status);if(!['Accepted','Packed','Shipped','Delivered'].includes(status))return bad('Invalid fulfilment status.');
        const row=await env.DB.prepare('SELECT oi.id,o.status AS order_status FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE oi.id=? AND oi.seller_id=?').bind(id,seller.id).first();if(!row)return bad('Order item not found.',404);if(['Cancelled','Returned'].includes(row.order_status))return bad('This order has been cancelled or returned.');
        const tracking=text(d.trackingNumber).trim().slice(0,120);await env.DB.prepare('UPDATE order_items SET seller_status=?,seller_tracking_number=CASE WHEN ?<>\'\' THEN ? ELSE seller_tracking_number END WHERE id=? AND seller_id=?').bind(status,tracking,tracking,id,seller.id).run();
        return json({ok:true,status,trackingNumber:tracking});
      }
      return bad('Not found',404);
    }
    if(request.method==='POST'&&url.pathname==='/api/admin/login'){if(await rateLimited(request,env,'admin-login',6,900))return bad('Too many login attempts. Please try again in 15 minutes.',429);const d=await bodyJSON(request);if(!env.ADMIN_USERNAME||!env.ADMIN_PASSWORD)return bad('Admin credentials are not configured',503);const u=text(d?.username),p=text(d?.password);if(!timingSafe(await sha256(u),await sha256(env.ADMIN_USERNAME))||!timingSafe(await sha256(p),await sha256(env.ADMIN_PASSWORD)))return bad('Invalid credentials',401);const token=crypto.randomUUID()+crypto.randomUUID();const csrf=crypto.randomUUID();await env.DB.prepare('INSERT INTO sessions(token_hash,csrf_token,username,expires_at) VALUES(?,?,?,?)').bind(await sha256(token),csrf,u,new Date(Date.now()+30*864e5).toISOString()).run();return json({ok:true,csrf},200,{'Set-Cookie':cookie('lh_session',token,cookieOpts(url))});}
    if(request.method==='GET'&&url.pathname==='/api/admin/session'){const s=await adminSession(request,env);return json({authenticated:Boolean(s),csrf:s?.csrf_token||null,username:s?.username||null});}
    if(request.method==='POST'&&url.pathname==='/api/admin/logout'){const token=readCookie(request,'lh_session');if(token)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256(token)).run();return json({ok:true},200,{'Set-Cookie':cookie('lh_session','',cookieOpts(url,0))});}
    const auth=await requireAdmin(request,env);if(auth.response)return auth.response;
    if(request.method==='GET'&&url.pathname==='/api/admin/sellers'){
      const {results=[]}=await env.DB.prepare("SELECT id,business_name,contact_name,email,phone,gstin,address,status,status_note,created_at,updated_at FROM sellers ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 WHEN 'rejected' THEN 2 ELSE 3 END,created_at DESC").all();
      return json({sellers:results,csrf:auth.session.csrf_token});
    }
    if(request.method==='PATCH'&&/^\/api\/admin\/sellers\/\d+$/.test(url.pathname)){
      const id=Number(url.pathname.split('/').pop());const d=await bodyJSON(request)||{};const status=text(d.status);const note=text(d.note).trim().slice(0,500);
      if(!['approved','rejected','suspended'].includes(status))return bad('Invalid seller status.');
      const existing=await env.DB.prepare('SELECT id FROM sellers WHERE id=?').bind(id).first();if(!existing)return bad('Seller not found.',404);
      await env.DB.prepare('UPDATE sellers SET status=?,status_note=?,updated_at=? WHERE id=?').bind(status,note,now(),id).run();
      if(status!=='approved')await env.DB.prepare('DELETE FROM seller_sessions WHERE seller_id=?').bind(id).run();
      return json({ok:true,id,status,csrf:auth.session.csrf_token});
    }
    if(request.method==='GET'&&url.pathname==='/api/admin/seller-products'){
      const status=text(url.searchParams.get('status')||'pending');const valid=['pending','approved','rejected','all'];if(!valid.includes(status))return bad('Invalid approval filter.');
      let q=`SELECT p.*,s.business_name AS seller_business_name,s.contact_name AS seller_contact_name,s.email AS seller_email,s.phone AS seller_phone FROM products p LEFT JOIN sellers s ON s.id=p.seller_id WHERE p.seller_id IS NOT NULL`;
      if(status!=='all')q+=' AND p.approval_status=?';q+=' ORDER BY CASE p.approval_status WHEN \'pending\' THEN 0 WHEN \'rejected\' THEN 1 ELSE 2 END,p.updated_at DESC LIMIT 500';
      const result=status==='all'?await env.DB.prepare(q).all():await env.DB.prepare(q).bind(status).all();
      return json({products:await attachImageVariants(env,result.results||[]),csrf:auth.session.csrf_token});
    }
    if(request.method==='PATCH'&&/^\/api\/admin\/seller-products\/\d+\/approval$/.test(url.pathname)){
      const id=Number(url.pathname.split('/')[4]);const d=await bodyJSON(request)||{};const status=text(d.status);const note=text(d.note).trim().slice(0,500);
      if(!['approved','rejected','pending'].includes(status))return bad('Invalid product approval status.');
      const existing=await env.DB.prepare('SELECT id,seller_id FROM products WHERE id=? AND seller_id IS NOT NULL').bind(id).first();if(!existing)return bad('Seller product not found.',404);
      await env.DB.prepare('UPDATE products SET approval_status=?,approval_note=?,active=?,updated_at=? WHERE id=? AND seller_id IS NOT NULL').bind(status,note,status==='approved'?1:0,now(),id).run();
      return json({ok:true,id,status,csrf:auth.session.csrf_token});
    }
    if(request.method==='GET'&&url.pathname==='/api/admin/dashboard'){const [p,o,r]=await Promise.all([env.DB.prepare('SELECT COUNT(*) c FROM products WHERE active=1').first(),env.DB.prepare('SELECT COUNT(*) c FROM orders').first(),env.DB.prepare("SELECT COALESCE(SUM(total),0) r FROM orders WHERE payment_status='captured' OR payment_method='cod'").first()]);return json({products:Number(p?.c||0),orders:Number(o?.c||0),revenue:Number(r?.r||0),csrf:auth.session.csrf_token});}
    if(request.method==='GET'&&url.pathname==='/api/admin/orders'){const {results=[]}=await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 500').all();const orders=[];for(const o of results){const tracking=await shipmentForOrder(env,o.id);orders.push({...o,total:Number(o.total),subtotal:Number(o.subtotal),discount:Number(o.discount),shipping:Number(o.shipping),...tracking});}return json({orders,csrf:auth.session.csrf_token});}
    if(request.method==='GET'&&url.pathname==='/api/admin/returns'){const {results=[]}=await env.DB.prepare('SELECT rr.*,o.customer_name,o.phone,o.email,o.total,o.payment_method,o.payment_status FROM return_requests rr JOIN orders o ON o.id=rr.order_id ORDER BY rr.created_at DESC LIMIT 500').all();return json({returns:results,csrf:auth.session.csrf_token});}
    if(request.method==='PATCH'&&/^\/api\/admin\/returns\/\d+$/.test(url.pathname)){const id=Number(url.pathname.split('/').pop()),d=await bodyJSON(request)||{},status=text(d.status);if(!['approved','rejected','received','refunded'].includes(status))return bad('Invalid return status.');const old=await env.DB.prepare('SELECT * FROM return_requests WHERE id=?').bind(id).first();if(!old)return bad('Return request not found.',404);if(old.status==='rejected'||old.status==='refunded')return bad('This return request is already closed.',409);const allowedNext={requested:['approved','rejected'],approved:['received','rejected'],received:['refunded']};if(!(allowedNext[old.status]||[]).includes(status))return bad(`Cannot change a ${old.status} request to ${status}.`,409);const note=text(d.adminNote).trim().slice(0,1000);if(status==='refunded'){if(d.refundConfirmed!==true)return bad('Confirm that the refund has actually been completed before closing this request.',409);await env.DB.prepare("UPDATE orders SET payment_status='refunded',updated_at=? WHERE id=?").bind(now(),old.order_id).run();}await env.DB.prepare('UPDATE return_requests SET status=?,admin_note=?,updated_at=? WHERE id=?').bind(status,note,now(),id).run();return json({ok:true});}
    if(request.method==='POST'&&/^\/api\/admin\/orders\/[^/]+\/shipment$/.test(url.pathname)){
      const id=decodeURIComponent(url.pathname.split('/')[4]);const d=await bodyJSON(request)||{};const order=await env.DB.prepare('SELECT id,status FROM orders WHERE id=?').bind(id).first();if(!order)return bad('Order not found.',404);if(['Cancelled','Returned'].includes(order.status))return bad('Shipment updates are not allowed for cancelled or returned orders.',409);
      const carrier=text(d.carrier).trim().slice(0,100),trackingNumber=text(d.trackingNumber).trim().slice(0,120),trackingUrl=text(d.trackingUrl).trim().slice(0,500),estimatedDelivery=text(d.estimatedDelivery).trim().slice(0,40),status=text(d.status||'Label Created').trim();
      const allowed=['Label Created','Picked Up','In Transit','Out for Delivery','Delivered','Delivery Exception','RTO'];if(!allowed.includes(status))return bad('Choose a valid shipment status.');
      if(trackingUrl){try{const u=new URL(trackingUrl);if(!['https:','http:'].includes(u.protocol))throw new Error();}catch{return bad('Enter a valid HTTP or HTTPS tracking URL.');}}
      if(estimatedDelivery&&!/^\d{4}-\d{2}-\d{2}$/.test(estimatedDelivery))return bad('Estimated delivery must use YYYY-MM-DD.');
      const previous=await env.DB.prepare('SELECT shipment_status,tracking_number FROM shipments WHERE order_id=?').bind(id).first();
      await env.DB.prepare(`INSERT INTO shipments(order_id,carrier,tracking_number,tracking_url,estimated_delivery,shipment_status,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(order_id) DO UPDATE SET carrier=excluded.carrier,tracking_number=excluded.tracking_number,tracking_url=excluded.tracking_url,estimated_delivery=excluded.estimated_delivery,shipment_status=excluded.shipment_status,updated_at=excluded.updated_at`).bind(id,carrier,trackingNumber,trackingUrl,estimatedDelivery,status,now()).run();
      if(!previous||previous.shipment_status!==status||previous.tracking_number!==trackingNumber){const desc=text(d.description).trim().slice(0,300)||`Shipment status updated to ${status}.`;const location=text(d.location).trim().slice(0,120);await env.DB.prepare('INSERT INTO shipment_events(order_id,status,description,location,created_at) VALUES(?,?,?,?,?)').bind(id,status,desc,location,now()).run();}
      if(status==='Delivered'){await env.DB.prepare(`UPDATE orders SET status='Delivered',delivered_at=COALESCE(delivered_at,?),tracking_number=CASE WHEN ?<>'' THEN ? ELSE tracking_number END,updated_at=? WHERE id=?`).bind(now(),trackingNumber,trackingNumber,now(),id).run();}
      else if(['Picked Up','In Transit','Out for Delivery'].includes(status)&&!['Delivered','Cancelled','Returned'].includes(order.status)){const mapped=status==='Out for Delivery'?'Out for Delivery':'Shipped';await env.DB.prepare('UPDATE orders SET status=?,tracking_number=CASE WHEN ?<>'' THEN ? ELSE tracking_number END,updated_at=? WHERE id=?').bind(mapped,trackingNumber,trackingNumber,now(),id).run();}
      return json({ok:true,shipment:{carrier,trackingNumber,trackingUrl,estimatedDelivery,status}});
    }
    if(request.method==='PATCH'&&url.pathname.startsWith('/api/admin/orders/')){const id=decodeURIComponent(url.pathname.split('/').pop());const d=await bodyJSON(request);const status=text(d?.status);if(!['Pending','Confirmed','Processing','Packed','Shipped','Out for Delivery','Delivered','Cancelled','Returned'].includes(status))return bad('Invalid status');const old=await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(id).first();if(!old)return bad('Order not found',404);if(['Cancelled','Returned'].includes(status)&&old.payment_method==='razorpay'&&old.payment_status==='captured')return bad('This online payment is already captured. Complete the refund through your payment provider before marking this order cancelled or returned.',409);await env.DB.prepare("UPDATE orders SET status=?,tracking_number=COALESCE(?,tracking_number),delivered_at=CASE WHEN ?='Delivered' THEN COALESCE(delivered_at,?) ELSE delivered_at END,updated_at=? WHERE id=?").bind(status,text(d?.trackingNumber)||null,status,now(),now(),id).run();if((status==='Cancelled'||status==='Returned')&&old.inventory_released===0)await restoreInventory(env,id);return json({ok:true});}
    if(request.method==='GET'&&/^\/api\/admin\/products\/\d+$/.test(url.pathname)){const id=Number(url.pathname.split('/').pop());const p=await env.DB.prepare('SELECT * FROM products WHERE id=?').bind(id).first();if(!p)return bad('Product not found',404);return json({product:(await attachImageVariants(env,[p]))[0],csrf:auth.session.csrf_token});}
    if(request.method==='GET'&&url.pathname==='/api/admin/products')return json({products:await listProducts(env,url,true),csrf:auth.session.csrf_token});
    if(request.method==='POST'&&url.pathname==='/api/admin/products'){const d=await bodyJSON(request);const slug=slugify(d?.slug||d?.name);const r=await env.DB.prepare('INSERT INTO products(slug,name,category,price,mrp,stock,tag,rating,description,specifications,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(slug,text(d?.name),text(d?.category),Number(d?.price||0),Number(d?.mrp||0),Number(d?.stock||0),text(d?.tag||'New'),Number(d?.rating||0),text(d?.description||''),JSON.stringify(d?.specifications||{}),d?.active===false?0:1,now(),now()).run();return json({id:r.meta?.last_row_id,slug});}
    if(request.method==='PUT'&&url.pathname.startsWith('/api/admin/products/')){const id=Number(url.pathname.split('/').pop());const d=await bodyJSON(request);const p=await env.DB.prepare('SELECT * FROM products WHERE id=?').bind(id).first();if(!p)return bad('Product not found',404);const slug=slugify(d?.slug||d?.name||p.name);await env.DB.prepare('UPDATE products SET slug=?,name=?,category=?,price=?,mrp=?,stock=?,tag=?,rating=?,description=?,specifications=?,active=?,updated_at=? WHERE id=?').bind(slug,text(d?.name??p.name),text(d?.category??p.category),Number(d?.price??p.price),Number(d?.mrp??p.mrp),Number(d?.stock??p.stock),text(d?.tag??p.tag),Number(d?.rating??p.rating),text(d?.description??p.description),JSON.stringify(d?.specifications??JSON.parse(p.specifications||'{}')),d?.active===false?0:1,now(),id).run();return json({ok:true});}
    if(request.method==='DELETE'&&/^\/api\/admin\/products\/\d+\/image-variant\/(large|medium|listing|small)$/.test(url.pathname)){
      const parts=url.pathname.split('/');const id=Number(parts[4]);const sizeType=parts[6];
      const product=await env.DB.prepare('SELECT image_key FROM products WHERE id=?').bind(id).first();
      if(!product)return bad('Product not found',404);
      const variant=await env.DB.prepare('SELECT object_key FROM product_image_variants WHERE product_id=? AND size_type=?').bind(id,sizeType).first();
      const keys=new Set();if(variant?.object_key)keys.add(variant.object_key);
      if(sizeType==='large'&&product.image_key)keys.add(product.image_key);
      await env.DB.prepare('DELETE FROM product_image_variants WHERE product_id=? AND size_type=?').bind(id,sizeType).run();
      for(const key of keys)await env.DB.prepare('DELETE FROM product_images WHERE product_id=? AND object_key=?').bind(id,key).run();
      if(sizeType==='large'){
        const next=await env.DB.prepare('SELECT object_key FROM product_images WHERE product_id=? ORDER BY sort_order,id LIMIT 1').bind(id).first();
        await env.DB.prepare('UPDATE products SET image_key=?,updated_at=? WHERE id=?').bind(next?.object_key||null,now(),id).run();
      }
      for(const key of keys){
        const variantRefs=await env.DB.prepare('SELECT COUNT(*) AS c FROM product_image_variants WHERE object_key=?').bind(key).first();
        const productRefs=await env.DB.prepare('SELECT COUNT(*) AS c FROM product_images WHERE object_key=?').bind(key).first();
        const orderRefs=await env.DB.prepare('SELECT COUNT(*) AS c FROM order_items WHERE image_key=?').bind(key).first();
        if(!Number(variantRefs?.c||0)&&!Number(productRefs?.c||0)&&!Number(orderRefs?.c||0))await env.IMAGES.delete(key);
      }
      return json({ok:true,productId:id,sizeType});
    }
    if(request.method==='POST'&&/^\/api\/admin\/products\/\d+\/image$/.test(url.pathname)){
      const id=Number(url.pathname.split('/')[4]);const product=await env.DB.prepare('SELECT * FROM products WHERE id=?').bind(id).first();if(!product)return bad('Product not found',404);
      const form=await request.formData();const file=form.get('file');const hasFile=file instanceof File&&file.size>0;
      const sizeType=text(form.get('sizeType')||'large').trim().toLowerCase();
      const imageType=text(form.get('imageType')||'product').trim().toLowerCase();
      const title=text(form.get('title')||product.name).trim().slice(0,200);
      const optionCode=text(form.get('optionCode')||'0').trim().slice(0,80);
      const sortValue=Number.parseInt(text(form.get('sortOrder')||'0'),10);const sortOrder=Number.isFinite(sortValue)?sortValue:0;
      const showInSlider=['1','true','yes','on'].includes(text(form.get('showInSlider')).toLowerCase());
      const imageStyle=text(form.get('imageStyle')||'none').trim().toLowerCase();
      const externalText=hasFile?'':text(form.get('externalUrl')||'').trim();
      if(!IMAGE_SIZE_TYPES.has(sizeType))return bad('Invalid image size type');
      if(!IMAGE_CATEGORY_TYPES.has(imageType))return bad('Invalid image type');
      if(!IMAGE_STYLE_TYPES.has(imageStyle))return bad('Invalid image style');
      let externalUrl='';if(externalText){try{const u=new URL(externalText);if(u.protocol!=='https:')return bad('Image URL must start with https://');externalUrl=u.href;}catch{return bad('Please enter a valid HTTPS image URL');}}
      if(!hasFile&&!externalUrl)return bad('Choose an image file or enter an HTTPS URL');
      if(hasFile&&!await validImageFile(file,new Set(['image/jpeg','image/png','image/webp','image/gif']),6*1024*1024))return bad('Use a valid JPG, PNG, WebP or GIF image up to 6 MB');
      let key=null;if(hasFile){const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'})[file.type];key=`products/${id}/${sizeType}/${crypto.randomUUID()}.${ext}`;await env.IMAGES.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type||'image/jpeg',cacheControl:'public, max-age=31536000, immutable'}});}
      const existing=await env.DB.prepare('SELECT object_key FROM product_image_variants WHERE product_id=? AND size_type=?').bind(id,sizeType).first();
      await env.DB.prepare('INSERT INTO product_image_variants(product_id,size_type,image_type,object_key,external_url,title,option_code,sort_order,show_in_slider,image_style,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(product_id,size_type) DO UPDATE SET image_type=excluded.image_type,object_key=excluded.object_key,external_url=excluded.external_url,title=excluded.title,option_code=excluded.option_code,sort_order=excluded.sort_order,show_in_slider=excluded.show_in_slider,image_style=excluded.image_style,updated_at=excluded.updated_at').bind(id,sizeType,imageType,key,externalUrl||null,title,optionCode,sortOrder,showInSlider?1:0,imageStyle,now(),now()).run();
      if(sizeType==='large'){
        if(key){await env.DB.prepare('INSERT INTO product_images(product_id,object_key,alt_text,sort_order) VALUES(?,?,?,?)').bind(id,key,title,0).run();await env.DB.prepare('UPDATE products SET image_key=?,updated_at=? WHERE id=?').bind(key,now(),id).run();}
        // For an HTTPS Large URL, keep any legacy R2 image key as a fallback.
      }
      if(existing?.object_key&&existing.object_key!==key){const referenced=await env.DB.prepare('SELECT COUNT(*) AS c FROM product_images WHERE object_key=?').bind(existing.object_key).first();if(!Number(referenced?.c||0))await env.IMAGES.delete(existing.object_key);}
      return json({ok:true,sizeType,image_url:externalUrl||imageUrl(key),key,csrf:auth.session.csrf_token});
    }
    if(request.method==='DELETE'&&/^\/api\/admin\/products\/\d+\/image$/.test(url.pathname)){const id=Number(url.pathname.split('/')[4]);const d=await bodyJSON(request);const key=text(d?.key);if(key){await env.IMAGES.delete(key);await env.DB.prepare('DELETE FROM product_images WHERE product_id=? AND object_key=?').bind(id,key).run();}const next=await env.DB.prepare('SELECT object_key FROM product_images WHERE product_id=? ORDER BY sort_order,id LIMIT 1').bind(id).first();await env.DB.prepare('UPDATE products SET image_key=?,updated_at=? WHERE id=?').bind(next?.object_key||null,now(),id).run();return json({ok:true});}
    if(request.method==='GET'&&url.pathname==='/api/admin/coupons'){const {results=[]}=await env.DB.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();return json({coupons:results,csrf:auth.session.csrf_token});}
    if(request.method==='POST'&&url.pathname==='/api/admin/coupons'){const d=await bodyJSON(request);const code=text(d?.code).trim().toUpperCase();if(!code)return bad('Code required');await env.DB.prepare('INSERT INTO coupons(code,type,value,min_cart,max_discount,enabled,expires_at,usage_limit,used_count,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,0,?,?)').bind(code,d?.type==='fixed'?'fixed':'percent',Number(d?.value||0),Number(d?.minCart||0),Number(d?.maxDiscount||0),d?.enabled===false?0:1,text(d?.expiresAt)||null,d?.usageLimit==null?null:Number(d.usageLimit),now(),now()).run();return json({ok:true});}
    if(request.method==='PATCH'&&url.pathname.startsWith('/api/admin/coupons/')){const code=decodeURIComponent(url.pathname.split('/').pop()).toUpperCase();const d=await bodyJSON(request);await env.DB.prepare('UPDATE coupons SET enabled=?,value=?,min_cart=?,max_discount=?,expires_at=?,usage_limit=?,updated_at=? WHERE code=?').bind(d?.enabled===false?0:1,Number(d?.value||0),Number(d?.minCart||0),Number(d?.maxDiscount||0),text(d?.expiresAt)||null,d?.usageLimit==null?null:Number(d.usageLimit),now(),code).run();return json({ok:true});}
    if(request.method==='GET'&&url.pathname==='/api/admin/settings'){return json({settings:await getSettings(env),csrf:auth.session.csrf_token});}
    if(request.method==='PUT'&&url.pathname==='/api/admin/settings'){const d=await bodyJSON(request);for(const [key,value] of Object.entries(d||{}))await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,text(value)).run();return json({ok:true});}
    if(request.method==='GET'&&url.pathname==='/api/admin/customers'){const {results=[]}=await env.DB.prepare('SELECT customer_name,phone,email,COUNT(*) orders,COALESCE(SUM(total),0) spent,MAX(created_at) last_order FROM orders GROUP BY phone,email,customer_name ORDER BY last_order DESC LIMIT 500').all();return json({customers:results.map(x=>({...x,orders:Number(x.orders),spent:Number(x.spent)})),csrf:auth.session.csrf_token});}
    return bad('Not found',404);
  }
  if(url.pathname==='/media/'||url.pathname.startsWith('/media/')){const key=decodeURIComponent(url.pathname.slice('/media/'.length));if(!key)return bad('Not found',404);const obj=await env.IMAGES.get(key);if(!obj)return bad('Image not found',404);const headers=new Headers();obj.writeHttpMetadata(headers);headers.set('cache-control','public, max-age=31536000, immutable');headers.set('etag',obj.httpEtag);headers.set('x-content-type-options','nosniff');return new Response(obj.body,{headers});}
  if(url.pathname==='/'||url.pathname.startsWith('/index.html')||url.pathname.startsWith('/admin.html'))return withHeaders(await env.ASSETS.fetch(request));
  return withHeaders(await env.ASSETS.fetch(request));
 }catch(e){console.error(e);return bad(e?.message||'Server error',500)}}};
