const BUILD_VERSION='2026-10-24-premium-categories-2';
const state={products:[],cart:JSON.parse(localStorage.getItem('lh_cart')||'[]'),wishlist:JSON.parse(localStorage.getItem('lh_wish')||'[]'),coupon:'',config:{onlinePaymentEnabled:false,codEnabled:true}};
const ph={Watches:'ph-watch',Perfumes:'ph-perfume',Attar:'ph-attar','Mobile Accessories':'ph-tech','Wireless Speakers':'ph-tech','Wireless Neckband':'ph-tech','Wired Earphones':'ph-tech','TWS Earbuds':'ph-tech','Power Banks':'ph-tech','Microphones':'ph-tech','Holders & Stands':'ph-tech','Headphone':'ph-tech','Fans':'ph-tech','Data Cables':'ph-tech','Charger':'ph-tech'};
const STORE_CATEGORIES=[
  {name:'Watches',image:'/assets/categories/watches.webp',id:'watches',kicker:'THE TIME EDIT',title:'Make every moment count.'},
  {name:'Perfumes',image:'/assets/categories/perfumes.webp',id:'perfumes',kicker:'THE FRAGRANCE EDIT',title:'Find your signature scent.'},
  {name:'Attar',image:'/assets/categories/attar.webp',id:'attar',kicker:'THE ATTAR EDIT',title:'Quiet, lasting, unforgettable.'},
  {name:'Wireless Speakers',image:'/assets/categories/wireless-speakers.webp',id:'wireless-speakers',kicker:'AUDIO',title:'Bring the sound with you.'},
  {name:'Wireless Neckband',image:'/assets/categories/wireless-neckband.webp',id:'wireless-neckband',kicker:'WIRELESS AUDIO',title:'Comfort for everyday listening.'},
  {name:'Wired Earphones',image:'/assets/categories/wired-earphones.webp',id:'wired-earphones',kicker:'AUDIO ESSENTIALS',title:'Plug in and listen.'},
  {name:'TWS Earbuds',image:'/assets/categories/tws-earbuds.webp',id:'tws-earbuds',kicker:'TRUE WIRELESS',title:'Small size. Big sound.'},
  {name:'Power Banks',image:'/assets/categories/power-banks.webp',id:'power-banks',kicker:'POWER ON THE GO',title:'Power for wherever you go.'},
  {name:'Mobile Accessories',image:'/assets/categories/mobile-accessories.webp',id:'mobile-accessories',kicker:'MOBILE ESSENTIALS',title:'Useful extras for your devices.'},
  {name:'Microphones',image:'/assets/categories/microphones.webp',id:'microphones',kicker:'CREATOR AUDIO',title:'Make yourself heard.'},
  {name:'Holders & Stands',image:'/assets/categories/holders-stands.webp',id:'holders-stands',kicker:'USEFUL TECH',title:'Hands-free everyday convenience.'},
  {name:'Headphone',image:'/assets/categories/headphone.webp',id:'headphone',kicker:'PERSONAL AUDIO',title:'Your sound, your space.'},
  {name:'Fans',image:'/assets/categories/fans.webp',id:'fans',kicker:'EVERYDAY COMFORT',title:'A little comfort on the go.'},
  {name:'Data Cables',image:'/assets/categories/data-cables.webp',id:'data-cables',kicker:'CONNECTIVITY',title:'Stay connected.'},
  {name:'Charger',image:'/assets/categories/charger.webp',id:'charger',kicker:'POWER & CHARGING',title:'Power up your everyday.'}
];
function guessStoreCategory(name,current='Mobile Accessories'){
  const legacy=['Mobile Accessories','Other Phone Accessories','Wireless Neckbands','Wireless Earbuds','Phone Holders & Stands','Chargers & Cables'];
  const aliases={'Wireless Neckbands':'Wireless Neckband','Wireless Earbuds':'TWS Earbuds','Phone Holders & Stands':'Holders & Stands','Other Phone Accessories':'Mobile Accessories'};
  const currentAlias=aliases[current]||current;
  if(STORE_CATEGORIES.some(c=>c.name===currentAlias)&&!legacy.includes(current))return currentAlias;
  const n=String(name||'').toLowerCase();
  const rules=[
    [/speaker/,'Wireless Speakers'],
    [/wired.{0,12}(earphone|earbud|headphone|headset)|(earphone|earbud|headphone|headset).{0,12}wired/,'Wired Earphones'],
    [/neckband/,'Wireless Neckband'],
    [/\b(tws|earbuds?|airpods?)\b/,'TWS Earbuds'],
    [/power\s*bank|powerbank|slim bank/,'Power Banks'],
    [/microphone|\bmic\b/,'Microphones'],
    [/charger|power adapter/,'Charger'],
    [/\b(cable|cord|lead)\b|charging cable|data cable|lightning cable/,'Data Cables'],
    [/holder|\bstand\b/,'Holders & Stands'],
    [/headphones?|\bheadset\b/,'Headphone'],
    [/\bfan\b/,'Fans']
  ];
  const match=rules.find(([re])=>re.test(n));
  if(match)return match[1];
  return STORE_CATEGORIES.some(c=>c.name===currentAlias)?currentAlias:'Mobile Accessories';
}
function normalizeStoreProducts(list){for(const p of list){p.category=guessStoreCategory(p.name,p.category||'Mobile Accessories')}return list;}
function ensureStoreCategoryStyles(){if(document.getElementById('lhStoreCategoryStyles'))return;const style=document.createElement('style');style.id='lhStoreCategoryStyles';style.textContent=`
.lh-categories-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;margin-top:20px;width:100%}
.lh-category-card{appearance:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;min-width:0;min-height:184px;padding:15px 9px;border:1px solid #e6ddcd;border-radius:14px;background:linear-gradient(145deg,#fffdf8 0%,#fff 100%);color:#171b1f;cursor:pointer;text-align:center;box-shadow:0 3px 12px rgba(54,42,21,.045);transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}
.lh-category-card:hover,.lh-category-card:focus-visible{transform:translateY(-4px);border-color:#c7a76d;box-shadow:0 12px 26px rgba(83,62,29,.11);outline:none}
.lh-category-icon{display:grid;place-items:center;width:88px;height:88px;flex:0 0 88px;border-radius:19px;background:#f5f1e8;overflow:hidden}
.lh-category-icon img{display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit}
.lh-category-name{font:600 14px/1.35 Inter,Arial,sans-serif;overflow-wrap:anywhere;color:#171b1f}
.lh-category-link{font:12px/1.2 Inter,Arial,sans-serif;color:#a87935;letter-spacing:.01em;transition:color .2s ease}
.lh-category-card:hover .lh-category-link{color:#72501d}
#shop.lh-shop-category-section{padding-top:42px;padding-bottom:42px;position:relative}
#shop.lh-shop-category-section .section-head{align-items:flex-end;margin-bottom:20px}
#shop.lh-shop-category-section .section-head h2{font-size:clamp(32px,3.2vw,44px);line-height:1.08;letter-spacing:-.035em;color:#171714}
#shop .lh-heading-accent{color:#a87935}
#shop.lh-shop-category-section .section-head .link{color:#986e2f;font-size:13px;text-underline-offset:5px;white-space:nowrap}
.lh-dynamic-category .section-head{align-items:end}
.lh-dynamic-category .section-head h2{font-size:clamp(22px,2.4vw,30px)}
.lh-dynamic-category .grid,.lh-dynamic-category .product-grid{margin-top:14px}
.lh-dynamic-category[hidden]{display:none!important}
.lh-category-nav{display:flex;flex:1;min-width:0;gap:18px;flex-wrap:nowrap;white-space:nowrap;overflow-x:auto;scrollbar-width:none}
.lh-category-nav::-webkit-scrollbar{display:none}.lh-category-nav a{flex:0 0 auto;white-space:nowrap}
@media(max-width:1000px){.lh-categories-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.lh-category-card{min-height:170px}}
@media(max-width:680px){#shop.lh-shop-category-section{padding-top:30px;padding-bottom:30px}#shop.lh-shop-category-section .section-head h2{font-size:clamp(27px,6vw,36px)}.lh-categories-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.lh-category-card{min-height:145px;padding:10px 5px;gap:7px;border-radius:12px}.lh-category-icon{width:66px;height:66px;flex-basis:66px;border-radius:15px}.lh-category-name{font-size:11px}.lh-category-link{font-size:10px}#shop.lh-shop-category-section .section-head .link{font-size:11px}}
@media(max-width:420px){.lh-categories-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.lh-category-card{min-height:155px}.lh-category-icon{width:72px;height:72px;flex-basis:72px}.lh-category-name{font-size:12px}}
`;document.head.appendChild(style)}
function renderStoreCategoryTiles(){ensureStoreCategoryStyles();const grid=document.querySelector('#shop .categories, #shop .category-grid, #shop #categoryGrid');if(!grid)return;grid.classList.add('lh-categories-grid');grid.innerHTML=STORE_CATEGORIES.map(c=>`<button type="button" class="lh-category-card" aria-label="Shop ${c.name}" onclick="showCategory('${c.name}')"><span class="lh-category-icon" aria-hidden="true"><img src="${c.image}" alt="" loading="lazy" width="88" height="88"></span><span class="lh-category-name">${c.name}</span><span class="lh-category-link">Explore →</span></button>`).join('');const shop=document.getElementById('shop');if(shop){shop.classList.add('lh-shop-category-section');const kicker=shop.querySelector('.eyebrow');const heading=shop.querySelector('h2');if(kicker)kicker.textContent='SHOP BY CATEGORY';if(heading)heading.innerHTML='Shop by <span class="lh-heading-accent">Category</span>';}}
function renderStoreNavigation(){const nav=document.querySelector('.navlinks');if(!nav)return;nav.classList.add('lh-category-nav');nav.innerHTML=`<a href="#shop" onclick="document.getElementById('shop')?.scrollIntoView({behavior:'smooth'});return false">Shop All Categories</a><a href="#watches" onclick="showCategory('Watches');return false">Watches</a><a href="#perfumes" onclick="showCategory('Perfumes');return false">Perfumes</a><a href="#attar" onclick="showCategory('Attar');return false">Attar</a><a href="#shop" onclick="document.getElementById('shop')?.scrollIntoView({behavior:'smooth'});return false">Audio & Accessories</a><a href="#offers">Offers</a>`;}
function findStoreGrid(targetIds,sectionIds){for(const id of targetIds){if(document.getElementById(id))return document.getElementById(id)}for(const id of sectionIds){const section=document.getElementById(id);const grid=section?.querySelector('.grid,.product-grid');if(grid){if(!grid.id)grid.id='lhGrid-'+id;return grid}}return null}
function renderStoreCategorySections(){
  const fixed=[
    {name:'Watches',targets:['watchGrid','watchesGrid'],sections:['watches']},
    {name:'Perfumes',targets:['perfumeGrid','perfumesGrid'],sections:['perfumes']},
    {name:'Attar',targets:['attarGrid'],sections:['attar']},
    {name:'Mobile Accessories',targets:['accessoryGrid','accessoriesGrid'],sections:['accessories']}
  ];
  const used=new Set();
  for(const item of fixed){const grid=findStoreGrid(item.targets,item.sections);if(!grid)continue;used.add(item.name);const section=grid.closest('section');const count=state.products.filter(p=>p.category===item.name&&p.active).length;if(section)section.hidden=count===0;renderCategoryWithMore(item.name,grid.id);}
  let wrapper=document.getElementById('lhDynamicCategorySections');
  if(!wrapper){wrapper=document.createElement('div');wrapper.id='lhDynamicCategorySections';const anchor=document.getElementById('accessories')||findStoreGrid(['accessoryGrid','accessoriesGrid'],['accessories'])?.closest('section')||document.getElementById('attar')||document.getElementById('featured');if(anchor)anchor.insertAdjacentElement('afterend',wrapper);else document.querySelector('main')?.appendChild(wrapper);}
  wrapper.innerHTML='';
  const extra=STORE_CATEGORIES.filter(c=>!used.has(c.name)&&state.products.some(p=>p.category===c.name&&p.active));
  for(const c of extra){const id='lhGrid-'+c.id;const section=document.createElement('section');section.className='section lh-dynamic-category';section.id='lhSection-'+c.id;section.innerHTML=`<div class="section-head"><div><div class="eyebrow">${c.kicker}</div><h2>${c.title}</h2></div><button type="button" class="link" onclick="showCategory('${c.name}')">View all ${c.name} →</button></div><div class="grid" id="${id}"></div>`;wrapper.appendChild(section);renderCategoryWithMore(c.name,id);}
}
function refreshStoreCategoryViews(){renderStoreCategoryTiles();renderStoreCategorySections();}

const rupee=n=>'₹'+Number(n).toLocaleString('en-IN');
function productImage(p,size='large'){return p?.images?.[size]||p?.image_variants?.[size]?.url||p?.image_url||'';}
async function api(path,opt={}){const r=await fetch(path,{headers:{'content-type':'application/json',...(opt.headers||{})},credentials:'same-origin',...opt});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Request failed');return d}
function save(){localStorage.setItem('lh_cart',JSON.stringify(state.cart));localStorage.setItem('lh_wish',JSON.stringify(state.wishlist));updateCounts()}
function updateCounts(){const c=state.cart.reduce((s,x)=>s+Number(x.qty||0),0);const w=state.wishlist.length;const b=document.getElementById('bagCount')||document.getElementById('cartBadge');const wb=document.getElementById('wishCount')||document.getElementById('wishBadge');const mb=document.getElementById('mobileBagCount');if(b)b.textContent=c;if(wb)wb.textContent=w;if(mb)mb.textContent=c}function updateBadges(){updateCounts()}
function placeholder(cat){return `<div class="placeholder ${ph[cat]||'ph-tech'}">${cat}</div>`}
function card(p){const off=Math.max(0,Math.round((1-p.price/Math.max(p.mrp,1))*100));return `<article class="product"><div class="product-media">${productImage(p,'listing')?`<img src="${productImage(p,'listing')}" alt="${p.name}" loading="lazy">`:placeholder(p.category)}<span class="badge">${p.tag||'New'}</span><button class="heart" onclick="toggleWish(${p.id})">${state.wishlist.includes(Number(p.id))?'♥':'♡'}</button></div><div class="meta"><div class="muted">${p.category}</div><div class="name">${p.name}</div><div class="muted">${p.rating?p.rating.toFixed(1)+' ★':'New'} · ${p.stock>0?'In stock':'Out of stock'}</div><div class="prices"><span class="price">${rupee(p.price)}</span><span class="mrp">${rupee(p.mrp)}</span><span class="off">${off}% off</span></div><div class="mini-actions"><button class="mini" ${p.stock<1?'disabled':''} onclick="addCart(${p.id})">＋ Add to Cart</button><button class="mini" ${p.stock<1?'disabled':''} onclick="buyNow(${p.id})">Buy Now</button></div></div></article>`}
function render(list,target,limit=8){const el=document.getElementById(target);if(!el)return;const items=list.filter(p=>p.active);el.innerHTML=items.slice(0,limit).map(card).join('')||(list.length===0?'<div class="lh-empty-category" style="grid-column:1/-1;padding:22px;color:#737970">Products coming soon in this category. Add products from Admin to show them here.</div>':'')}
function renderCategoryWithMore(category,target){
  const items=state.products.filter(p=>p.category===category&&p.active);
  const grid=document.getElementById(target);
  const buttonId=target+'ViewAll';

  document.getElementById(buttonId)?.remove();
  if(!grid)return;

  render(items,target,4);
  if(items.length<=4)return;

  const btn=document.createElement('button');
  btn.id=buttonId;
  btn.className='btn alt';
  btn.textContent='View All '+category+' →';
  btn.style.cssText='display:block;margin:18px auto 0';
  btn.dataset.expanded='false';

  btn.onclick=()=>{
    const expanded=btn.dataset.expanded==='true';

    if(expanded){
      render(items,target,4);
      btn.dataset.expanded='false';
      btn.textContent='View All '+category+' →';
    }else{
      render(items,target,items.length);
      btn.dataset.expanded='true';
      btn.textContent='Show Less ↑';
    }
  };

  grid.insertAdjacentElement('afterend',btn);
}

async function load(){
  const cfg=await api('/api/config');
  state.config=cfg;
  const d=await api('/api/products');
  state.products=normalizeStoreProducts(d.products||[]);
  renderStoreNavigation();
  render(state.products,'productGrid',8);
  refreshStoreCategoryViews();
  updateCounts();
}
function showCategory(cat){const list=cat==='ALL'?state.products:state.products.filter(p=>p.category===cat);const title=document.getElementById('productTitle')||document.getElementById('catalogTitle');if(title)title.textContent=cat==='ALL'?'All products':list.length?`The ${String(cat).toLowerCase()} edit.`:`${cat} — products coming soon.`;render(list,'productGrid',40);document.getElementById('featured')?.scrollIntoView({behavior:'smooth'})}
function toggleWish(id){state.wishlist=state.wishlist.includes(Number(id))?state.wishlist.filter(x=>Number(x)!==Number(id)):[...state.wishlist,Number(id)];save();render(state.products,'productGrid',8);refreshStoreCategoryViews()}
function addCart(id){const p=state.products.find(x=>Number(x.id)===Number(id));if(!p||p.stock<1)return alert('Out of stock');const i=state.cart.find(x=>Number(x.id)===Number(id));if(i){if(i.qty>=p.stock)return alert('Maximum available stock reached');i.qty++}else state.cart.push({id:Number(id),qty:1});save()}
function buyNow(id){state.cart=[{id:Number(id),qty:1}];save();openCheckout()}
function openCart(){document.getElementById('cartOverlay').classList.add('show');renderCart()}
function closeCart(){document.getElementById('cartOverlay').classList.remove('show')}
function cartTotals(){let subtotal=0;for(const i of state.cart){const p=state.products.find(x=>Number(x.id)===Number(i.id));if(p)subtotal+=Number(p.price)*i.qty}let discount=0;if(state.coupon)discount=state.coupon.type==='percent'?Math.min(subtotal*state.coupon.value/100,state.coupon.max_discount||subtotal):Math.min(state.coupon.value,state.coupon.max_discount||state.coupon.value);const shipping=subtotal>=499||subtotal===0?0:49;return{subtotal,discount,shipping,total:subtotal-discount+shipping}}
function renderCart(){const el=document.getElementById('cartItems');if(!state.cart.length){el.innerHTML='<div style="padding:50px 0;text-align:center;color:#777">Your bag is empty.</div>';document.getElementById('cartSummary').innerHTML='';return}el.innerHTML=state.cart.map(i=>{const p=state.products.find(x=>Number(x.id)===Number(i.id));if(!p)return '';return `<div class="cart-item"><div>${productImage(p,'small')?`<img src="${productImage(p,'small')}" alt="${p.name}">`:placeholder(p.category)}</div><div><div class="muted">${p.category}</div><div class="name">${p.name}</div><strong>${rupee(p.price)}</strong><div class="qty"><button onclick="qty(${p.id},-1)">−</button><span>${i.qty}</span><button onclick="qty(${p.id},1)">＋</button></div></div><button class="action" onclick="removeCart(${p.id})">✕</button></div>`}).join('');const t=cartTotals();document.getElementById('cartSummary').innerHTML=`<div class="summary"><div class="cart-coupon"><input id="couponInput" placeholder="Coupon code"><button onclick="applyCoupon()">Apply</button></div>${state.coupon?`<div class="row"><span>Coupon ${state.coupon.code}</span><strong>− ${rupee(t.discount)}</strong></div>`:''}<div class="row"><span>Subtotal</span><strong>${rupee(t.subtotal)}</strong></div><div class="row"><span>Shipping</span><span>${t.shipping?rupee(t.shipping):'Free'}</span></div><div class="row" style="font-size:17px;border-top:1px solid #ddd;padding-top:10px"><strong>Total</strong><strong>${rupee(t.total)}</strong></div><button class="btn" style="width:100%" onclick="openCheckout()">Continue to checkout →</button></div>`}
function qty(id,d){const i=state.cart.find(x=>Number(x.id)===Number(id));const p=state.products.find(x=>Number(x.id)===Number(id));if(!i||!p)return;i.qty=Math.max(1,Math.min(p.stock,i.qty+d));save();renderCart()}
function removeCart(id){state.cart=state.cart.filter(x=>Number(x.id)!==Number(id));save();renderCart()}
async function applyCoupon(){const code=document.getElementById('couponInput').value.trim();if(!code)return;try{state.coupon=await api('/api/coupons/validate',{method:'POST',body:JSON.stringify({code,subtotal:cartTotals().subtotal})});renderCart()}catch(e){alert(e.message)}}
function openProduct(id){
  const p=state.products.find(x=>Number(x.id)===Number(id));
  if(!p)return;

  const modal=document.getElementById('modal');
  const panel=document.getElementById('modalContent')||
    document.getElementById('modalCard');
  if(!modal||!panel)return;

  const esc=v=>String(v??'').replace(/&/g,'&amp;')
    .replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');

  let specs=p.specifications||{};
  if(typeof specs==='string'){
    try{specs=JSON.parse(specs||'{}')}catch{specs={}}
  }

  function flatten(obj,prefix=''){
    if(Array.isArray(obj)){
      return [[prefix||'Details',obj.map(v=>
        typeof v==='object'?JSON.stringify(v):String(v)
      ).join(', ')]];
    }
    if(!obj||typeof obj!=='object'){
      return prefix?[[prefix,String(obj??'—')]]:[];
    }
    return Object.entries(obj).flatMap(([k,v])=>{
      const label=prefix?prefix+' · '+k:k;
      return v&&typeof v==='object'
        ?flatten(v,label)
        :[[label,String(v??'—')]];
    });
  }

  const entries=flatten(specs);
  const warrantyPattern=/warranty|guarantee|service period/i;
  const makerPattern=/brand|manufacturer|model name|model number|country of origin|manufactured by|marketed by|importer|packer/i;

  const highlights=entries.slice(0,4);

  const specificationRows=entries.filter(([k])=>
    !warrantyPattern.test(k)&&!makerPattern.test(k)
  );
  const warrantyRows=entries.filter(([k])=>warrantyPattern.test(k));
  const makerRows=entries.filter(([k])=>makerPattern.test(k));

  modal.classList.add('show');

  panel.innerHTML=`
    <button class="action" style="float:right"
      onclick="closeModal()">✕</button>

    <div class="product-detail">
      <div>
        ${p.image_url
          ?`<img class="mainimg" src="${esc(productImage(p,'large'))}"
              alt="${esc(p.name)}">`
          :placeholder(p.category)}
      </div>

      <div>
        <div class="eyebrow">${esc(p.category)}</div>
        <h2 style="font-size:36px">${esc(p.name)}</h2>

        <p class="muted" style="margin-top:10px">
          ${esc(p.description||'An everyday selection from Luxurious Hub.')}
        </p>

        <div class="prices" style="margin:16px 0">
          <span class="price" style="font-size:26px">${rupee(p.price)}</span>
          <span class="mrp">${rupee(p.mrp)}</span>
        </div>

        <h3 style="font:600 17px Arial;padding:12px 0;
          border-bottom:2px solid #222">Product Highlights</h3>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 14px">
          ${highlights.length?highlights.map(([k,v])=>`
            <div style="padding:11px 0;border-bottom:1px solid #e7e6df;font-size:12px;min-width:0">
              <div style="color:#737970;margin-bottom:5px">${esc(k)}</div>
              <strong style="font-weight:500;overflow-wrap:anywhere">${esc(v)}</strong>
            </div>
          `).join(''):'<p>No product highlights added yet.</p>'}
        </div>

        <h3 style="font:600 17px Arial;padding:12px 0;
          margin-top:20px;border-bottom:2px solid #222">All Details</h3>

        <div style="display:flex;flex-wrap:wrap;gap:6px;margin:12px 0">
          <button type="button" class="mini" data-spec-tab="Specifications">Specifications</button>
          <button type="button" class="mini" data-spec-tab="Warranty">Warranty</button>
          <button type="button" class="mini" data-spec-tab="Manufacturer Info">Manufacturer Info</button>
        </div>

        <div id="allDetailsContent"></div>

        <section style="margin-top:24px;padding:16px;background:#f7f7f2">
          <h3 style="font:600 17px Arial">Ratings and Reviews</h3>
          <p style="font-size:14px;margin:12px 0">
            ${Number(p.rating)>0?'★ '+Number(p.rating).toFixed(1)+' / 5':'Not rated yet'}
          </p>
          <p style="font-size:12px;color:#6f756f;line-height:1.6">
            Customer reviews will appear here when available.
          </p>
        </section>

        <div class="cta" style="margin-top:20px">
          <button class="btn"
            onclick="addCart(${Number(p.id)});closeModal();openCart()">
            Add to Cart
          </button>
          <button class="btn alt"
            onclick="buyNow(${Number(p.id)})">Buy Now</button>
        </div>
      </div>
    </div>`;

  let activeTab='Specifications';
  let expanded=false;

  function renderDetails(tab){
    activeTab=tab;
    const target=panel.querySelector('#allDetailsContent');
    if(!target)return;

    const rows=tab==='Warranty'?warrantyRows:
      tab==='Manufacturer Info'?makerRows:specificationRows;

    panel.querySelectorAll('[data-spec-tab]').forEach(btn=>{
      const active=btn.dataset.specTab===tab;
      btn.style.background=active?'#18392b':'#fff';
      btn.style.color=active?'#fff':'#333';
      btn.style.borderColor=active?'#18392b':'#dddeda';
    });

    const visible=expanded?rows:rows.slice(0,6);

    target.innerHTML=visible.length?visible.map(([k,v])=>`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;
        padding:11px 0;border-bottom:1px solid #e7e6df;font-size:12px">
        <span style="color:#737970;overflow-wrap:anywhere">${esc(k)}</span>
        <strong style="font-weight:500;overflow-wrap:anywhere">${esc(v)}</strong>
      </div>
    `).join(''):`<p style="font-size:12px;color:#737970;line-height:1.6">
      ${tab==='Warranty'?'Warranty details have not been added yet.':
        tab==='Manufacturer Info'?'Manufacturer details have not been added yet.':
        'Specifications have not been added yet.'}
    </p>`;

    if(rows.length>6){
      const more=document.createElement('button');
      more.type='button';
      more.className='mini';
      more.style.marginTop='12px';
      more.textContent=expanded?'See Less ↑':'See More ↓';
      more.onclick=()=>{
        expanded=!expanded;
        renderDetails(activeTab);
      };
      target.appendChild(more);
    }
  }

  panel.querySelectorAll('[data-spec-tab]').forEach(btn=>{
    btn.onclick=()=>{
      expanded=false;
      renderDetails(btn.dataset.specTab);
    };
  });

  renderDetails('Specifications');
}
function closeModal(){document.getElementById('modal').classList.remove('show')}
function openCheckout(){if(!state.cart.length){alert('Your bag is empty');return}closeCart();const t=cartTotals();const modal=document.getElementById('modal');const card=document.getElementById('modalContent')||document.getElementById('modalCard');if(!modal||!card){alert('Checkout panel is unavailable');return}modal.classList.add('show');card.style.cssText='background:#fff;width:100%;max-width:960px;max-height:92vh;overflow:auto;padding:28px;box-shadow:0 16px 50px rgba(20,30,20,.18);position:relative';card.innerHTML='<button class="action" style="float:right;border:0;background:none;font-size:24px;cursor:pointer" onclick="closeModal()">✕</button><div class="eyebrow">Secure checkout</div><h2 style="font-size:38px;margin:0 0 20px">Delivery details</h2><form id="checkoutForm" style="display:grid;grid-template-columns:1fr;gap:14px"><input name="name" required placeholder="Full name" style="padding:13px;border:1px solid #dddeda"><input name="phone" required pattern="[0-9]{10}" inputmode="numeric" placeholder="10-digit mobile number" style="padding:13px;border:1px solid #dddeda"><input name="email" type="email" placeholder="Email (optional)" style="padding:13px;border:1px solid #dddeda;grid-column:1/-1"><input name="address" required placeholder="Street address" style="padding:13px;border:1px solid #dddeda;grid-column:1/-1"><input name="area" placeholder="Area / Apartment" style="padding:13px;border:1px solid #dddeda"><input name="landmark" placeholder="Landmark (optional)" style="padding:13px;border:1px solid #dddeda"><input name="city" required placeholder="City" style="padding:13px;border:1px solid #dddeda"><input name="state" required placeholder="State" style="padding:13px;border:1px solid #dddeda"><input name="pincode" required pattern="[0-9]{6}" inputmode="numeric" placeholder="Pincode" style="padding:13px;border:1px solid #dddeda"><div style="grid-column:1/-1;border:1px solid #dddeda;padding:14px;background:#f7f7f2">● Cash on Delivery — Pay when your order arrives</div><div style="grid-column:1/-1;background:#f7f7f2;padding:18px"><div style="display:flex;justify-content:space-between;margin:7px 0"><span>Subtotal</span><strong>'+rupee(t.subtotal)+'</strong></div><div style="display:flex;justify-content:space-between;margin:7px 0"><span>Discount</span><strong>'+(t.discount?'− '+rupee(t.discount):'—')+'</strong></div><div style="display:flex;justify-content:space-between;margin:7px 0"><span>Shipping</span><strong>'+(t.shipping?rupee(t.shipping):'Free')+'</strong></div><div style="display:flex;justify-content:space-between;border-top:1px solid #ddd;padding-top:12px;margin-top:12px;font-size:18px"><strong>Total</strong><strong>'+rupee(t.total)+'</strong></div></div><button class="btn" type="submit" style="grid-column:1/-1">Place COD Order →</button></form>';document.getElementById('checkoutForm').onsubmit=submitOrder}
async function startOnlinePayment(){const form=document.getElementById('checkoutForm');if(!form.reportValidity())return;try{if(!window.Razorpay){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://checkout.razorpay.com/v1/checkout.js';s.onload=resolve;s.onerror=()=>reject(new Error('Could not load Razorpay checkout'));document.head.appendChild(s)})}const f=new FormData(form);const r=await api('/api/payment/create',{method:'POST',body:JSON.stringify({items:state.cart.map(i=>({productId:Number(i.id),qty:i.qty})),customer:Object.fromEntries(f.entries()),couponCode:state.coupon?.code||'',paymentMethod:'cod',idempotencyKey:crypto.randomUUID()})});const rz=new Razorpay({key:r.keyId,amount:Math.round(r.amount*100),currency:r.currency,name:'Luxurious Hub',description:'Luxurious Hub order '+r.orderId,order_id:r.razorpayOrderId,prefill:{name:f.get('name'),email:f.get('email'),contact:f.get('phone')},theme:{color:'#18392b'},handler:async response=>{const vr=await api('/api/payment/verify',{method:'POST',body:JSON.stringify({orderId:r.orderId,razorpay_order_id:response.razorpay_order_id,razorpay_payment_id:response.razorpay_payment_id,razorpay_signature:response.razorpay_signature})});state.cart=[];state.coupon='';save();closeModal();document.getElementById('modal').classList.add('show');(document.getElementById('modalContent')||document.getElementById('modalCard')).innerHTML=`<div style="text-align:center;padding:45px"><div style="font-size:40px">✓</div><div class="eyebrow">Payment successful</div><h2 style="font-size:38px">Order confirmed</h2><p>Your order ID is <strong>${vr.orderId}</strong></p><button id="payTrack" class="btn">Track your order →</button></div>`;document.getElementById('payTrack').onclick=()=>{closeModal();trackOrder(vr.orderId)};await load()}});rz.open()}catch(e){alert(e.message)}}
async function submitOrder(e){e.preventDefault();const f=new FormData(e.target);try{const r=await api('/api/orders',{method:'POST',body:JSON.stringify({items:state.cart.map(i=>({productId:Number(i.id),qty:i.qty})),customer:Object.fromEntries(f.entries()),couponCode:state.coupon?.code||'',paymentMethod:'cod',idempotencyKey:crypto.randomUUID()})});state.cart=[];state.coupon='';save();closeModal();document.getElementById('modal').classList.add('show');(document.getElementById('modalContent')||document.getElementById('modalCard')).innerHTML=`<div style="text-align:center;padding:45px"><div style="font-size:40px">✓</div><div class="eyebrow">Order placed successfully</div><h2 style="font-size:38px">Thank you for shopping with Luxurious Hub.</h2><p>Your order ID is <strong>${r.order.id}</strong></p><p class="muted">Cash on Delivery · We’ll confirm your order shortly.</p><button class="btn" onclick="closeModal();trackOrder('${r.order.id}')">Track your order →</button></div>`;await load()}catch(err){alert(err.message)}}
function trackOrder(order=''){document.getElementById('modal').classList.add('show');(document.getElementById('modalContent')||document.getElementById('modalCard')).innerHTML=`<button class="action" style="float:right" onclick="closeModal()">✕</button><div class="eyebrow">Order tracking</div><h2 style="font-size:38px">Track your order</h2><p class="muted">Enter your order ID and the mobile number used at checkout.</p><div class="formgrid" style="margin-top:15px"><input id="trackId" class="full" value="${order}" placeholder="Order ID"><input id="trackPhone" class="full" placeholder="Mobile number"><button class="btn full" onclick="lookupOrder()">Track Order</button></div><div id="trackResult"></div>`}
async function lookupOrder(){try{const o=(await api('/api/orders/'+encodeURIComponent(document.getElementById('trackId').value)+'?phone='+encodeURIComponent(document.getElementById('trackPhone').value))).order;document.getElementById('trackResult').innerHTML='<div class="panel" style="margin-top:16px"><div style="display:flex;justify-content:space-between"><strong>'+o.id+'</strong><span class="status">'+o.status+'</span></div><p class="muted">Placed '+new Date(o.created_at).toLocaleString('en-IN')+'</p><div>'+o.items.map(i=>i.name_snapshot+' × '+i.qty).join('<br>')+'</div><p><strong>Total '+rupee(o.total)+'</strong> · '+o.payment_method.toUpperCase()+'</p></div>'}catch(e){document.getElementById('trackResult').innerHTML='<div class="notice-box" style="margin-top:16px">'+e.message+'</div>'}}
function openAccount(){openSimple('Your account','Orders placed from this browser are not a login account. Use Track Order with your order ID and mobile number.')}function openWishlist(){const items=state.wishlist.map(id=>state.products.find(p=>Number(p.id)===Number(id))).filter(Boolean);openSimple('Wishlist',items.length?items.map(p=>'<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #e7e6df"><div><strong>'+p.name+'</strong><div style="margin-top:4px;color:#6f756f">'+rupee(p.price)+'</div></div><button class="mini" style="flex:0 0 auto" onclick="removeFromWishlist('+Number(p.id)+')">Remove</button></div>').join(''):'Your wishlist is empty.')}function removeFromWishlist(id){state.wishlist=state.wishlist.filter(x=>Number(x)!==Number(id));save();render(state.products,'productGrid',8);refreshStoreCategoryViews();openWishlist();toast('Removed from wishlist')}function openContact(){api('/api/config').then(c=>openSimple('Contact Us',(c.whatsapp?'<p><a class="btn" target="_blank" href="https://wa.me/'+c.whatsapp.replace(/\D/g,'')+'">Chat on WhatsApp →</a></p>':'')+'<p>Contact details can be added in Admin Settings.</p>')).catch(()=>openSimple('Contact Us','Contact details can be added in Admin Settings.'))}function openPolicy(t){openSimple(t,'Please configure the final store policy content in your business setup before launch.')}function openSimple(t,b){document.getElementById('modal').classList.add('show');(document.getElementById('modalContent')||document.getElementById('modalCard')).innerHTML='<button class="action" style="float:right" onclick="closeModal()">✕</button><div class="eyebrow">Luxurious Hub</div><h2 style="font-size:36px">'+t+'</h2><div style="margin-top:12px;color:#6f756f;line-height:1.7">'+b+'</div>'}
async function openAdmin(){document.getElementById('modal').classList.add('show');(document.getElementById('modalContent')||document.getElementById('modalCard')).innerHTML='<div id="adminRoot"></div>';await adminSession()}
let csrf='';async function adminSession(){const s=await api('/api/admin/session');if(!s.authenticated)return adminLogin();csrf=s.csrf;adminHome()}
function adminLogin(){document.getElementById('adminRoot').innerHTML='<div style="max-width:420px;margin:40px auto"><div class="eyebrow">Luxurious Hub</div><h2 style="font-size:36px">Admin Login</h2><form id="loginForm" class="formgrid" style="margin-top:18px"><input id="au" required placeholder="Username"><input id="ap" required type="password" placeholder="Password"><button class="btn full">Sign In</button></form><div id="loginMsg" class="muted" style="margin-top:10px"></div></div>';document.getElementById('loginForm').onsubmit=async e=>{e.preventDefault();try{const r=await api('/api/admin/login',{method:'POST',body:JSON.stringify({username:document.getElementById('au').value,password:document.getElementById('ap').value})});csrf=r.csrf;adminHome()}catch(err){document.getElementById('loginMsg').textContent=err.message}}}
function adminHome(){document.getElementById('adminRoot').innerHTML='<button class="action" style="float:right" onclick="closeModal()">✕</button><div class="eyebrow">Luxurious Hub</div><h2 style="font-size:36px">Admin Dashboard</h2><div class="admin-tabs"><button class="mini" onclick="adminProducts()">Products</button><button class="mini" onclick="adminOrders()">Orders</button><button class="mini" onclick="adminCoupons()">Coupons</button><button class="mini" onclick="adminCustomers()">Customers</button><button class="mini" onclick="adminSettings()">Settings</button><button class="mini" onclick="adminLogout()">Logout</button></div><div id="adminPanel"></div>';adminProducts()}
async function adminProducts(){const r=await api('/api/admin/products');csrf=r.csrf;document.getElementById('adminPanel').innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><strong>Products</strong><button class="btn" onclick="adminEditProduct()">+ Add Product</button></div><table class="admin-table"><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Image</th><th></th></tr></thead><tbody>'+r.products.map(p=>'<tr><td>'+p.name+'<br><span class="muted">'+p.category+'</span></td><td>'+rupee(p.price)+'</td><td>'+p.stock+'</td><td>'+ (p.image_url?'<span class="status">Uploaded</span>':'<span class="muted">No image</span>') +'</td><td><button class="mini" onclick="adminEditProduct('+p.id+')">Edit</button></td></tr>').join('')+'</tbody></table>'}
async function adminEditProduct(id) {
  const p = id
    ? (await api('/api/admin/products/' + id)).product
    : {
        name: '',
        category: 'Watches',
        price: 0,
        mrp: 0,
        stock: 0,
        tag: 'New',
        rating: 0,
        description: '',
        specifications: {},
        slug: ''
      };

  const safe = v => String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const labelStyle =
    'display:block;font-size:13px;font-weight:600;color:#333';

  const inputStyle =
    'display:block;width:100%;box-sizing:border-box;' +
    'margin-top:6px;padding:12px;border:1px solid #dddeda;' +
    'background:#fff';

  document.getElementById('adminPanel').innerHTML = `
    <button type="button" class="mini"
      onclick="adminProducts()">← Back to Products</button>

    <h2 style="margin:16px 0">
      ${id ? 'Edit Product' : 'Add Product'}
    </h2>

    <p style="font-size:12px;color:#666">
      Fill in the details below and then click Save Product.
    </p>

    <form id="pform" class="formgrid" style="gap:16px">

      <label class="full" style="${labelStyle}">
        1. Product Name
        <small style="display:block;font-weight:400;margin-top:4px">
          Name customers will see on your website.
        </small>
        <input id="pn" required
          style="${inputStyle}"
          placeholder="e.g. Titan Analog Watch"
          value="${safe(p.name)}">
      </label>

      <label style="${labelStyle}">
        2. URL Slug (Optional)
        <input id="pslug"
          style="${inputStyle}"
          placeholder="e.g. titan-analog-watch"
          value="${safe(p.slug || '')}">
      </label>

      <label style="${labelStyle}">
        3. Product Category
        <select id="pc" style="${inputStyle}">
          <option>Watches</option><option>Perfumes</option><option>Attar</option>
          <option>Wireless Speakers</option><option>Wireless Neckband</option><option>Wired Earphones</option><option>TWS Earbuds</option><option>Power Banks</option><option>Mobile Accessories</option><option>Microphones</option><option>Holders &amp; Stands</option><option>Headphone</option><option>Fans</option><option>Data Cables</option><option>Charger</option>
        </select>
      </label>

      <label style="${labelStyle}">
        4. Selling Price (₹)
        <small style="display:block;font-weight:400;margin-top:4px">
          Final price customer pays. Example: 24999
        </small>
        <input id="pp" type="number" min="0" step="1"
          required style="${inputStyle}"
          value="${p.price}">
      </label>

      <label style="${labelStyle}">
        5. MRP / Original Price (₹)
        <small style="display:block;font-weight:400;margin-top:4px">
          Original price before discount. Example: 32999
        </small>
        <input id="pm" type="number" min="0" step="1"
          required style="${inputStyle}"
          value="${p.mrp}">
      </label>

      <label style="${labelStyle}">
        6. Available Quantity / Stock
        <small style="display:block;font-weight:400;margin-top:4px">
          Number of units available to sell. Example: 5
        </small>
        <input id="pst" type="number" min="0" step="1"
          required style="${inputStyle}"
          value="${p.stock}">
      </label>

      <label style="${labelStyle}">
        7. Product Badge
        <small style="display:block;font-weight:400;margin-top:4px">
          Small tag shown on the product image.
        </small>
        <input id="pt"
          style="${inputStyle}"
          placeholder="New / Featured / Bestseller"
          value="${safe(p.tag || '')}">
      </label>

      <label style="${labelStyle}">
        8. Product Rating (0–5)
        <small style="display:block;font-weight:400;margin-top:4px">
          Enter a rating from 0 to 5.
        </small>
        <input id="pr" type="number" min="0" max="5"
          step="0.1" style="${inputStyle}"
          value="${Number(p.rating || 0)}">
      </label>

      <label class="full" style="${labelStyle}">
        9. Product Description
        <small style="display:block;font-weight:400;margin-top:4px">
          A short description customers read on your website.
        </small>
        <textarea id="pd" rows="4"
          style="${inputStyle}"
          placeholder="Describe the product, material, features and benefits.">${safe(p.description || '')}</textarea>
      </label>

      <label class="full" style="${labelStyle}">
        10. Product Specifications (JSON)
        <small style="display:block;font-weight:400;margin-top:4px">
          Technical details in JSON format. Keep the braces and quotation marks valid.
        </small>
        <textarea id="ps" rows="7"
          style="${inputStyle};font-family:monospace"
          placeholder='{"Brand":"Titan","Display Type":"Analog"}'>${safe(JSON.stringify(p.specifications || {}, null, 2))}</textarea>
      </label>

      <div class="full panel">
        <strong>11. Product Image Sizes</strong>
        <p class="muted" style="margin:8px 0 14px">Har size ki image alag upload kar sakte ho. File PNG/JPG/WebP ho aur 6 MB se chhoti ho. URL optional hai; URL https:// se shuru hona chahiye.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:14px">
          <label style="${labelStyle}">Image Type<select id="pImageType" style="${inputStyle}"><option value="product">Product Image</option><option value="tech">Tech. Image</option><option value="gallery">Gallery Image</option><option value="lifestyle">Lifestyle Image</option></select></label>
          <label style="${labelStyle}">Title for Image<input id="pImageTitle" style="${inputStyle}" value="${safe(p.name)}" placeholder="Image title"></label>
          <label style="${labelStyle}">Option Code (OP-Code)<input id="pImageOption" style="${inputStyle}" value="0"></label>
          <label style="${labelStyle}">Sort Order<input id="pImageSort" type="number" style="${inputStyle}" value="0"></label>
          <label style="${labelStyle}">Image Style<select id="pImageStyle" style="${inputStyle}"><option value="none">None</option><option value="studio">Studio Image</option><option value="lifestyle">Lifestyle Image</option></select></label>
          <label style="${labelStyle};display:flex;align-items:center;gap:8px"><input id="pImageSlider" type="checkbox" style="width:auto"> Show image in slider</label>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
          ${[
            {key:'large',label:'LARGE',hint:'Original / high resolution'},
            {key:'medium',label:'MEDIUM',hint:'600 × 600'},
            {key:'listing',label:'LISTING',hint:'360 × 360'},
            {key:'small',label:'SMALL',hint:'120 × 120'}
          ].map(slot=>{const v=p.image_variants?.[slot.key];const current=v?.url||(slot.key==='large'?p.image_url:'');return `<div style="border:1px solid #dddeda;border-radius:4px;padding:12px;background:#fff;min-width:0"><div style="background:#f3f3ef;padding:7px;text-align:center;font-weight:700;font-size:12px">${slot.label}</div><p class="muted" style="margin:8px 0">${slot.hint}</p>${current?`<img src="${safe(current)}" alt="${slot.label} current image" style="display:block;width:76px;height:76px;object-fit:contain;margin:0 auto 8px;border:1px solid #eee">`:'<div style="height:76px;display:grid;place-items:center;color:#8a8f89;font-size:11px">No image saved</div>'}<label style="display:block;font-size:12px">Choose image<input id="pi_${slot.key}" type="file" accept="image/png,image/jpeg,image/webp" style="display:block;width:100%;margin-top:7px"></label><label style="display:block;font-size:12px;margin-top:10px">Or enter URL<input id="piUrl_${slot.key}" type="url" placeholder="https://..." style="${inputStyle}"></label></div>`}).join('')}
        </div>
        <p class="muted" style="margin-top:12px">Existing main image rahegi jab tak aap Large image replace nahi karte. Medium/Listing/Small na dene par website available larger image ko fallback ke taur par use karegi.</p>
      </div>

      <div class="full">
        <button class="btn" type="submit">Save Product</button>
        <button type="button" class="mini"
          onclick="adminProducts()">Cancel</button>
      </div>
    </form>
  `;

  document.getElementById('pc').value = guessStoreCategory(p.name,p.category||'Watches');
  if (p.image_variants?.large) {
    const v = p.image_variants.large;
    document.getElementById('pImageType').value = v.image_type || 'product';
    document.getElementById('pImageTitle').value = v.title || p.name;
    document.getElementById('pImageOption').value = v.option_code || '0';
    document.getElementById('pImageSort').value = String(v.sort_order ?? 0);
    document.getElementById('pImageSlider').checked = Boolean(v.show_in_slider);
    document.getElementById('pImageStyle').value = v.image_style || 'none';
  }

  document.getElementById('pform').onsubmit = async e => {
    e.preventDefault();

    let specs = {};
    try {
      specs = JSON.parse(
        document.getElementById('ps').value || '{}'
      );
    } catch {
      alert('Specifications must be valid JSON.');
      return;
    }

    const payload = {
      slug: document.getElementById('pslug').value,
      name: document.getElementById('pn').value,
      category: document.getElementById('pc').value,
      price: Number(document.getElementById('pp').value),
      mrp: Number(document.getElementById('pm').value),
      stock: Number(document.getElementById('pst').value),
      tag: document.getElementById('pt').value,
      rating: Number(document.getElementById('pr').value || 0),
      description: document.getElementById('pd').value,
      specifications: specs,
      active: true
    };

    try {
      let productId = id;

      if (id) {
        await api('/api/admin/products/' + id, {
          method: 'PUT',
          headers: {'X-CSRF-Token': csrf},
          body: JSON.stringify(payload)
        });
      } else {
        const result = await api('/api/admin/products', {
          method: 'POST',
          headers: {'X-CSRF-Token': csrf},
          body: JSON.stringify(payload)
        });
        productId = result.id;
      }

      for (const sizeType of ['large','medium','listing','small']) {
        const file = document.getElementById('pi_' + sizeType).files?.[0];
        const externalUrl = document.getElementById('piUrl_' + sizeType).value.trim();
        if (!file && !externalUrl) continue;
        const fd = new FormData();
        if (file) fd.append('file', file);
        fd.append('sizeType', sizeType);
        fd.append('imageType', document.getElementById('pImageType').value);
        fd.append('title', document.getElementById('pImageTitle').value || document.getElementById('pn').value);
        fd.append('optionCode', document.getElementById('pImageOption').value || '0');
        fd.append('sortOrder', document.getElementById('pImageSort').value || '0');
        fd.append('showInSlider', document.getElementById('pImageSlider').checked ? '1' : '0');
        fd.append('imageStyle', document.getElementById('pImageStyle').value);
        if (externalUrl) fd.append('externalUrl', externalUrl);
        const response = await fetch('/api/admin/products/' + productId + '/image', {
          method: 'POST',
          headers: {'X-CSRF-Token': csrf},
          credentials: 'same-origin',
          body: fd
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || 'Image upload failed (' + sizeType + ')');
        }
      }

      await load();
      await adminProducts();
      alert('Product saved successfully!');
    } catch (err) {
      alert(err.message || 'Could not save product.');
    }
  };
}
async function adminOrders(){const r=await api('/api/admin/orders');csrf=r.csrf;document.getElementById('adminPanel').innerHTML='<table class="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>'+r.orders.map(o=>'<tr><td><strong>'+o.id+'</strong><br><span class="muted">'+new Date(o.created_at).toLocaleString('en-IN')+'</span></td><td>'+o.customer_name+'<br>'+o.phone+'</td><td>'+rupee(o.total)+'</td><td><select onchange="setOrderStatus(\''+o.id+'\',this.value)">'+['Pending','Confirmed','Processing','Packed','Shipped','Out for Delivery','Delivered','Cancelled','Returned'].map(s=>'<option '+(o.status===s?'selected':'')+'>'+s+'</option>').join('')+'</select></td></tr>').join('')+'</tbody></table>'}
async function setOrderStatus(id,status){await api('/api/admin/orders/'+id,{method:'PATCH',headers:{'X-CSRF-Token':csrf},body:JSON.stringify({status})});adminOrders()}
async function adminCoupons(){const r=await api('/api/admin/coupons');csrf=r.csrf;document.getElementById('adminPanel').innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><strong>Coupons</strong><button class="btn" onclick="adminAddCoupon()">+ Add Coupon</button></div>'+r.coupons.map(c=>'<div class="panel" style="margin-top:9px"><strong>'+c.code+'</strong> · '+(c.type==='percent'?c.value+'%':'₹'+c.value)+' off · Min ₹'+c.min_cart+' · '+(c.enabled?'Active':'Disabled')+'<button class="mini" style="float:right" onclick="toggleCouponAdmin(\''+c.code+'\','+(c.enabled?'false':'true')+')">'+(c.enabled?'Disable':'Enable')+'</button></div>').join('')}
async function adminAddCoupon(){const code=prompt('Coupon code');if(!code)return;const type=prompt('percent or fixed','percent')||'percent';const value=Number(prompt('Discount value','10'));const minCart=Number(prompt('Minimum cart','499'));const maxDiscount=Number(prompt('Maximum discount','500'));await api('/api/admin/coupons',{method:'POST',headers:{'X-CSRF-Token':csrf},body:JSON.stringify({code,type,value,minCart,maxDiscount,enabled:true})});adminCoupons()}
async function toggleCouponAdmin(code,enabled){const r=await api('/api/admin/coupons');const c=r.coupons.find(x=>x.code===code);await api('/api/admin/coupons/'+encodeURIComponent(code),{method:'PATCH',headers:{'X-CSRF-Token':csrf},body:JSON.stringify({enabled,value:Number(c.value),minCart:Number(c.min_cart),maxDiscount:Number(c.max_discount),expiresAt:c.expires_at,usageLimit:c.usage_limit})});adminCoupons()}
async function adminCustomers(){const r=await api('/api/admin/customers');csrf=r.csrf;document.getElementById('adminPanel').innerHTML='<table class="admin-table"><thead><tr><th>Customer</th><th>Contact</th><th>Orders</th><th>Spent</th></tr></thead><tbody>'+r.customers.map(c=>'<tr><td>'+c.customer_name+'</td><td>'+c.phone+'<br>'+c.email+'</td><td>'+c.orders+'</td><td>'+rupee(c.spent)+'</td></tr>').join('')+'</tbody></table>'}
async function adminSettings(){const r=await api('/api/admin/settings');csrf=r.csrf;const s=r.settings;document.getElementById('adminPanel').innerHTML='<form id="sform" class="formgrid"><input id="swa" placeholder="WhatsApp" value="'+String(s.whatsapp||'').replace(/"/g,'&quot;')+'"><input id="sp" placeholder="Phone" value="'+String(s.phone||'').replace(/"/g,'&quot;')+'"><input id="se" type="email" placeholder="Email" value="'+String(s.email||'').replace(/"/g,'&quot;')+'"><input id="sfree" type="number" value="'+Number(s.free_shipping||499)+'"><input id="sship" type="number" value="'+Number(s.shipping_fee||49)+'"><textarea id="saddr" class="full" rows="3" placeholder="Business address">'+String(s.address||'')+'</textarea><textarea id="sabout" class="full" rows="4" placeholder="About store">'+String(s.about_text||'')+'</textarea><textarea id="sshipping" class="full" rows="3" placeholder="Shipping policy">'+String(s.shipping_policy||'')+'</textarea><textarea id="sreturns" class="full" rows="3" placeholder="Returns policy">'+String(s.returns_policy||'')+'</textarea><label class="full panel"><input id="scod" type="checkbox" '+(s.cod_enabled!=='0'?'checked':'')+'> Enable COD</label><button class="btn full">Save Settings</button></form>';document.getElementById('sform').onsubmit=async e=>{e.preventDefault();const d={whatsapp:document.getElementById('swa').value,phone:document.getElementById('sp').value,email:document.getElementById('se').value,free_shipping:document.getElementById('sfree').value,shipping_fee:document.getElementById('sship').value,address:document.getElementById('saddr').value,about_text:document.getElementById('sabout').value,shipping_policy:document.getElementById('sshipping').value,returns_policy:document.getElementById('sreturns').value,cod_enabled:document.getElementById('scod').checked?'1':'0'};await api('/api/admin/settings',{method:'PUT',headers:{'X-CSRF-Token':csrf},body:JSON.stringify(d)});alert('Settings saved')}}
async function adminLogout(){await api('/api/admin/logout',{method:'POST'});adminLogin()}
function applyOffer(){navigator.clipboard?.writeText('LIVE15');state.coupon={code:'LIVE15',type:'percent',value:15,max_discount:500};openCart()}
function toggleFaq(btn){btn.parentElement.classList.toggle('open')}
const searchInput=document.getElementById('searchInput')||document.getElementById('search');
let searchResults=document.getElementById('searchResults');
if(searchInput){
  if(!searchResults){
    searchResults=document.createElement('div');
    searchResults.id='searchResults';
    searchResults.className='search-results';
    searchInput.parentElement.appendChild(searchResults);
  }
  searchInput.addEventListener('input',()=>{
    const q=searchInput.value.toLowerCase().trim();
    if(!q){
      searchResults.classList.remove('show');
      searchResults.innerHTML='';
      return;
    }
    const hits=state.products.filter(p=>
      (p.name+' '+p.category+' '+JSON.stringify(p.specifications||{}))
      .toLowerCase()
      .includes(q)
    ).slice(0,5);
    searchResults.innerHTML=hits.length
      ?hits.map(p=>`<button class="result" type="button" style="width:100%;background:#fff;border:0;text-align:left" onclick="openProduct(${p.id})"><span>${p.name}<small style="display:block;color:#818680">${rupee(p.price)}</small></span></button>`).join('')
      :'<div style="padding:15px;color:#777;font-size:12px">No products found.</div>';
    searchResults.classList.add('show');
  });
}
document.addEventListener('click',e=>{
  if(!e.target.closest('.search')&&searchResults){
    searchResults.classList.remove('show');
  }
});

function openProductImageZoom(src,alt='Product image'){
  const old=document.getElementById('productImageZoom');
  if(old)old.remove();
  const overlay=document.createElement('div');
  overlay.id='productImageZoom';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-label','Enlarged product image');
  overlay.style.cssText='position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:rgba(255,255,255,.98);padding:18px';
  const image=document.createElement('img');
  image.src=src;image.alt=alt;
  image.style.cssText='display:block;max-width:96vw;max-height:94vh;width:auto;height:auto;object-fit:contain;cursor:zoom-out';
  const close=document.createElement('button');
  close.type='button';close.textContent='×';close.setAttribute('aria-label','Close enlarged image');
  close.style.cssText='position:fixed;top:10px;left:12px;z-index:1;border:0;background:#fff;font-size:30px;line-height:1;padding:5px 12px;cursor:pointer';
  const cleanup=()=>{overlay.remove();document.removeEventListener('keydown',onKey)};
  const onKey=e=>{if(e.key==='Escape')cleanup()};
  close.addEventListener('click',cleanup);
  overlay.addEventListener('click',e=>{if(e.target===overlay||e.target===image)cleanup()});
  overlay.append(close,image);document.body.appendChild(overlay);
  document.addEventListener('keydown',onKey);
}
document.addEventListener('click',e=>{
  if(!(e.target instanceof Element))return;
  const detailImage=e.target.closest('#modalContent .product-detail img');
  if(detailImage){e.preventDefault();openProductImageZoom(detailImage.currentSrc||detailImage.src,detailImage.alt);return;}
  const cardImage=e.target.closest('.product-media img');
  const card=cardImage||e.target.closest('article.product');
  if(!card||e.target.closest('button,a,input,select,textarea'))return;
  const article=card.matches('article.product')?card:card.closest('article.product');
  if(!article)return;
  const name=article.querySelector('.name')?.textContent?.trim();
  const product=state.products.find(p=>String(p.name).trim()===name);
  if(product)openProduct(product.id);
});

load().catch(err=>{document.getElementById('productGrid').innerHTML='<div class="panel">Store is starting up. Please refresh in a moment.</div>'});updateCounts();
