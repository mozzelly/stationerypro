import { createClient } from '@supabase/supabase-js';
import './style.css';

const SUPABASE_URL = 'PASTE_SUPABASE_PROJECT_URL_HERE';
const SUPABASE_ANON_KEY = 'PASTE_SUPABASE_ANON_KEY_HERE';
const configured = SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('PASTE_') && !SUPABASE_ANON_KEY.includes('PASTE_');
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
}) : null;

const state = { session: null, profile: null, products: [], cart: [], page: 'dashboard', loading: false };
const app = document.querySelector('#app');
const money = n => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(Number(n || 0));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isOwner = () => ['owner','super_admin'].includes(state.profile?.role);
const isDeveloper = () => state.profile?.role === 'developer';
const can = permission => isOwner() || isDeveloper() || (state.profile?.permissions || []).includes(permission);

function notice(message, type='info') {
  const el = document.querySelector('#notice');
  if (!el) return;
  el.textContent = message; el.className = `notice ${type}`; el.hidden = false;
  window.setTimeout(() => { if (el) el.hidden = true; }, 4500);
}
function boot() {
  if (!configured) return renderSetup();
  supabase.auth.getSession().then(({data, error}) => {
    if (error) console.error(error);
    state.session = data.session;
    state.session ? loadProfile() : renderLogin();
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    state.session = session;
    if (!session) { state.profile = null; renderLogin(); }
  });
}
function renderSetup() {
  app.innerHTML = `<main class="setup-wrap"><section class="setup-card"><div class="brand-mark">S</div><p class="eyebrow">SETUP REQUIRED</p><h1>Unganisha Supabase</h1><p>Fungua <b>src/main.js</b> na uweke Project URL pamoja na anon/publishable key kutoka Supabase → Project Settings → API Keys.</p><p>Kisha endesha SQL iliyo kwenye <b>supabase/schema.sql</b> kwenye Supabase SQL Editor.</p><div class="callout">Usiweke service_role key kwenye frontend. Tumia anon/publishable key pekee; usalama unalindwa na RLS policies.</div><ol><li>Unda Supabase project.</li><li>Endesha schema.sql.</li><li>Weka URL na anon key kwenye main.js.</li><li>Endesha <code>npm install</code>, kisha <code>npm run dev</code>.</li></ol></section></main>`;
}
function renderLogin() {
  app.innerHTML = `<main class="login-wrap"><section class="login-card"><div class="brand-mark">S</div><p class="eyebrow">STATIONERY BUSINESS SYSTEM</p><h1>Karibu tena.</h1><p class="muted">Ingia kusimamia biashara.</p><form id="login-form"><label>Email<input name="email" type="email" autocomplete="username" required placeholder="jina@biashara.co.tz"></label><label>Password<input name="password" type="password" autocomplete="current-password" required minlength="6" placeholder="Password yako"></label><button class="primary wide" type="submit">Ingia kwenye mfumo</button><p class="form-error" id="form-error"></p></form><p class="small muted">Akaunti ya kwanza itengenezwe kupitia Supabase Authentication. Owner ataongezwa kwa kufuata README.</p></section></main>`;
  document.querySelector('#login-form').addEventListener('submit', async e => {
    e.preventDefault(); const fd = new FormData(e.currentTarget);
    const btn = e.currentTarget.querySelector('button'); btn.disabled = true; btn.textContent = 'Inaingia...';
    const {error} = await supabase.auth.signInWithPassword({email: fd.get('email'), password: fd.get('password')});
    if (error) { document.querySelector('#form-error').textContent = error.message; btn.disabled = false; btn.textContent = 'Ingia kwenye mfumo'; }
    else { state.session = (await supabase.auth.getSession()).data.session; await loadProfile(); }
  });
}
async function loadProfile() {
  if (!state.session) return renderLogin();
  const {data, error} = await supabase.from('profiles').select('id, full_name, role, active, permissions').eq('id', state.session.user.id).single();
  if (error || !data || !data.active) {
    await supabase.auth.signOut();
    app.innerHTML = `<main class="login-wrap"><section class="login-card"><h1>Akaunti haijawezeshwa</h1><p>Muombe owner aangalie profile yako kwenye Supabase.</p><button class="secondary wide" id="back-login">Rudi login</button></section></main>`;
    document.querySelector('#back-login').onclick = renderLogin; return;
  }
  state.profile = data;
  await loadProducts();
  renderShell();
  loadDashboard();
}
async function loadProducts() {
  const {data, error} = await supabase.from('products').select('id,name,sku,category,unit,cost_price,selling_price,stock_qty,reorder_level,active').eq('active', true).order('name').limit(1000);
  if (error) { console.error(error); state.products = []; } else state.products = data || [];
}
function renderShell() {
  const nav = [
    ['dashboard','▦','Muhtasari','dashboard.view'],
    ['pos','＋','Mauzo (POS)','sales.create'],
    ['products','▤','Bidhaa & Stock','products.view'],
    ['history','◷','Historia ya mauzo','sales.view'],
    ['expenses','↘','Matumizi','expenses.view'],
    ['reports','▥','Ripoti','reports.view'],
    ['users','♙','Watumiaji','users.manage'],
    ['settings','⚙','Mipangilio','settings.manage']
  ].filter(([key,, , permission]) => ['dashboard','pos'].includes(key) || can(permission));
  app.innerHTML = `<div class="app-shell"><aside class="sidebar"><a class="brand" href="#"><span class="brand-mark small-mark">S</span><span>Stationery<span class="brand-light">Pro</span></span></a><div class="shop-label">BIASHARA</div><nav>${nav.map(([key,icon,label])=>`<button class="nav-link ${state.page===key?'active':''}" data-page="${key}"><span>${icon}</span>${label}</button>`).join('')}</nav><div class="sidebar-bottom"><div class="user-mini"><div class="avatar">${esc((state.profile.full_name||'U').slice(0,1).toUpperCase())}</div><div><b>${esc(state.profile.full_name)}</b><small>${esc(state.profile.role)}</small></div></div><button id="logout" class="logout">↪ Toka</button></div></aside><main class="main-area"><header class="topbar"><button id="mobile-menu" class="icon-btn" aria-label="Fungua menyu">☰</button><div><p class="eyebrow">STATIONERY MANAGEMENT</p><h2 id="page-title">Muhtasari</h2></div><div class="top-user"><span class="online-dot"></span><span>${esc(state.profile.full_name)}</span></div></header><section id="notice" class="notice" hidden></section><section id="page-content" class="page-content"><div class="loading">Inapakia...</div></section><footer>StationeryPro <span>•</span> Biashara yako, kwa mpangilio.</footer></main></div>`;
  document.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => { state.page=b.dataset.page; renderShell(); if(state.page==='dashboard') loadDashboard(); else renderPage(); document.querySelector('.sidebar').classList.remove('open'); }));
  document.querySelector('#logout').onclick = async () => { await supabase.auth.signOut(); };
  document.querySelector('#mobile-menu').onclick = () => document.querySelector('.sidebar').classList.toggle('open');
}
async function loadDashboard() {
  const root = document.querySelector('#page-content'); if (!root) return;
  root.innerHTML = `<div class="loading">Inapakia taarifa za biashara...</div>`;
  const today = new Date(); const start = new Date(today.getFullYear(),today.getMonth(),today.getDate()).toISOString();
  const {data: sales, error} = await supabase.from('sales').select('id,total_amount,created_at,status,payment_status').gte('created_at',start).neq('status','void').order('created_at',{ascending:false}).limit(500);
  if (error) { root.innerHTML = `<div class="empty-state">Imeshindikana kupakia mauzo. Hakikisha schema.sql na RLS vimewekwa. <small>${esc(error.message)}</small></div>`; return; }
  const total = (sales||[]).reduce((sum,s)=>sum+Number(s.total_amount||0),0);
  const {count: productsCount} = await supabase.from('products').select('*',{count:'exact',head:true}).eq('active',true);
  const low = state.products.filter(p=>Number(p.stock_qty)<=Number(p.reorder_level)).length;
  const recent = (sales||[]).slice(0,7);
  root.innerHTML = `<div class="welcome-row"><div><h3>Habari, ${esc((state.profile.full_name||'').split(' ')[0])} 👋</h3><p class="muted">Huu ndio muhtasari wa biashara ya leo.</p></div><span class="date-chip">${new Intl.DateTimeFormat('sw-TZ',{dateStyle:'medium'}).format(new Date())}</span></div><div class="stat-grid"><article class="stat-card"><div class="stat-top"><span>Mauzo ya leo</span><span class="stat-icon green">↗</span></div><strong>${money(total)}</strong><small>Jumla ya mauzo yaliyorekodiwa</small></article><article class="stat-card"><div class="stat-top"><span>Idadi ya mauzo</span><span class="stat-icon blue">▤</span></div><strong>${(sales||[]).length}</strong><small>Miamala ya leo (hadi 500)</small></article><article class="stat-card"><div class="stat-top"><span>Bidhaa hai</span><span class="stat-icon amber">□</span></div><strong>${productsCount ?? state.products.length}</strong><small>Bidhaa kwenye katalogi</small></article><article class="stat-card"><div class="stat-top"><span>Stock ya tahadhari</span><span class="stat-icon red">!</span></div><strong>${low}</strong><small>Bidhaa zimefika reorder level</small></article></div><div class="content-grid"><section class="panel wide-panel"><div class="panel-head"><div><h3>Mauzo ya hivi karibuni</h3><p class="muted">Miamala ya leo</p></div><button class="text-button" data-go="history">Ona yote →</button></div>${recent.length?`<div class="table-wrap"><table><thead><tr><th>Namba ya risiti</th><th>Muda</th><th>Jumla</th><th>Hali</th></tr></thead><tbody>${recent.map(s=>`<tr><td>#${esc(s.id.slice(0,8).toUpperCase())}</td><td>${new Date(s.created_at).toLocaleTimeString('sw-TZ',{hour:'2-digit',minute:'2-digit'})}</td><td class="money">${money(s.total_amount)}</td><td><span class="status paid">${esc(s.payment_status||'recorded')}</span></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state"><div class="empty-icon">▤</div><b>Bado hakuna mauzo leo</b><p>Mauzo utakayorekodi yataonekana hapa.</p><button class="primary" data-go="pos">Anza mauzo</button></div>`}</section><section class="panel"><div class="panel-head"><div><h3>Stock ya tahadhari</h3><p class="muted">Bidhaa za kuangalia</p></div></div>${state.products.filter(p=>Number(p.stock_qty)<=Number(p.reorder_level)).slice(0,6).map(p=>`<div class="stock-row"><div class="product-bullet">▤</div><div class="stock-info"><b>${esc(p.name)}</b><small>${esc(p.sku||'Bila SKU')}</small></div><span class="stock-count">${Number(p.stock_qty)} ${esc(p.unit||'pcs')}</span></div>`).join('') || `<div class="empty-small">Hakuna bidhaa kwenye tahadhari.</div>`}</section></div>`;
  root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{state.page=b.dataset.go;renderShell();renderPage();});
}
function renderPage() {
  const root = document.querySelector('#page-content'); if(!root)return;
  const titles={pos:'Mauzo (POS)',products:'Bidhaa & Stock',history:'Historia ya mauzo',expenses:'Matumizi',reports:'Ripoti',users:'Watumiaji',settings:'Mipangilio'};
  document.querySelector('#page-title').textContent=titles[state.page]||'Muhtasari';
  if(state.page==='pos') return renderPOS(root);
  if(state.page==='products') return renderProducts(root);
  if(state.page==='history') return renderHistory(root);
  if(state.page==='expenses') return renderExpenses(root);
  if(state.page==='reports') return renderReports(root);
  if(state.page==='users') return renderUsers(root);
  if(state.page==='settings') return renderSettings(root);
  root.innerHTML='<div class="empty-state">Sehemu hii inakuja kwenye hatua inayofuata.</div>';
}
function renderPOS(root) {
  root.innerHTML=`<div class="pos-layout"><section class="panel"><div class="panel-head"><div><h3>Chagua bidhaa</h3><p class="muted">Tafuta kwa jina au SKU</p></div></div><input id="product-search" class="search-input" placeholder="Tafuta bidhaa..." /><div id="product-list" class="product-grid"></div></section><section class="panel cart-panel"><div class="panel-head"><div><h3>Mauzo mapya</h3><p class="muted">${state.cart.length} bidhaa kwenye kikapu</p></div><button id="clear-cart" class="text-button">Futa vyote</button></div><div id="cart-items"></div><div class="cart-total"><span>Jumla</span><strong id="cart-total">${money(0)}</strong></div><label>Njia ya malipo<select id="payment-method"><option value="cash">Cash</option><option value="mobile_money">Mobile money</option><option value="card">Card</option><option value="credit">Mkopo</option><option value="mixed">Malipo mchanganyiko</option></select></label><button id="complete-sale" class="primary wide">Kamilisha mauzo</button><p class="tiny muted">Mauzo yakikamilika yatapunguza stock kwenye database.</p></section></div>`;
  const list=root.querySelector('#product-list');
  const drawProducts=(term='')=>{const ps=state.products.filter(p=>(p.name+' '+(p.sku||'')).toLowerCase().includes(term.toLowerCase()));list.innerHTML=ps.map(p=>`<button class="product-tile" data-add="${p.id}" ${Number(p.stock_qty)<=0?'disabled':''}><span class="tile-icon">▤</span><b>${esc(p.name)}</b><small>${esc(p.sku||'')}</small><strong>${money(p.selling_price)}</strong><em>Stock: ${Number(p.stock_qty)}</em></button>`).join('')||'<div class="empty-small">Hakuna bidhaa. Ongeza kwanza kwenye Bidhaa & Stock.</div>';list.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const p=state.products.find(x=>x.id===b.dataset.add);const line=state.cart.find(x=>x.id===p.id);if(line){if(line.qty<Number(p.stock_qty))line.qty++;else return notice('Stock haitoshi.','error');}else state.cart.push({id:p.id,name:p.name,price:Number(p.selling_price),cost:Number(p.cost_price),stock:Number(p.stock_qty),qty:1});drawCart();});};
  const drawCart=()=>{const c=root.querySelector('#cart-items');c.innerHTML=state.cart.map(x=>`<div class="cart-line"><div class="cart-line-info"><b>${esc(x.name)}</b><small>${money(x.price)} × ${x.qty}</small></div><div class="qty-control"><button data-minus="${x.id}">−</button><span>${x.qty}</span><button data-plus="${x.id}">+</button><button class="remove-item" data-remove="${x.id}">×</button></div></div>`).join('')||'<div class="empty-small">Kikapu bado tupu.</div>';root.querySelector('#cart-total').textContent=money(state.cart.reduce((s,x)=>s+x.qty*x.price,0));c.querySelectorAll('[data-minus]').forEach(b=>b.onclick=()=>{const x=state.cart.find(y=>y.id===b.dataset.minus);x.qty--;if(x.qty<=0)state.cart=state.cart.filter(y=>y.id!==x.id);drawCart();});c.querySelectorAll('[data-plus]').forEach(b=>b.onclick=()=>{const x=state.cart.find(y=>y.id===b.dataset.plus);if(x.qty<x.stock)x.qty++;else notice('Stock haitoshi.','error');drawCart();});c.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{state.cart=state.cart.filter(x=>x.id!==b.dataset.remove);drawCart();});};
  root.querySelector('#product-search').oninput=e=>drawProducts(e.target.value);
  root.querySelector('#clear-cart').onclick=()=>{state.cart=[];drawCart();};
  root.querySelector('#complete-sale').onclick=async()=>{
    if(!state.cart.length)return notice('Ongeza bidhaa kwanza.','error');
    const btn=root.querySelector('#complete-sale');btn.disabled=true;btn.textContent='Inahifadhi...';
    const method=root.querySelector('#payment-method').value;
    const total=state.cart.reduce((s,x)=>s+x.qty*x.price,0);
    const items=state.cart.map(x=>({product_id:x.id,product_name:x.name,quantity:x.qty,unit_price:x.price,unit_cost:x.cost,line_total:x.qty*x.price}));
    const {data: sale, error}=await supabase.rpc('create_sale',{p_items:items,p_payment_method:method,p_total_amount:total});
    if(error){notice(`Mauzo hayakuhifadhiwa: ${error.message}`,'error');btn.disabled=false;btn.textContent='Kamilisha mauzo';return;}
    state.cart=[];await loadProducts();notice(`Mauzo yamehifadhiwa. Risiti: ${String(sale).slice(0,8)}`,'success');renderPOS(root);
  };
  drawProducts();drawCart();
}
function renderProducts(root) {
  root.innerHTML=`<section class="panel"><div class="panel-head"><div><h3>Bidhaa zote</h3><p class="muted">Sajili bidhaa, bei na stock.</p></div>${can('products.manage')?'<button id="add-product" class="primary">＋ Ongeza bidhaa</button>':''}</div><input id="products-search" class="search-input" placeholder="Tafuta bidhaa..." /><div id="products-table" class="table-wrap"></div></section><div id="product-modal"></div>`;
  const table=root.querySelector('#products-table');
  const draw=term=>{const ps=state.products.filter(p=>(p.name+' '+(p.sku||'')+' '+(p.category||'')).toLowerCase().includes(term.toLowerCase()));table.innerHTML=`<table><thead><tr><th>Bidhaa</th><th>SKU</th><th>Gharama</th><th>Bei ya kuuza</th><th>Stock</th>${can('products.manage')?'<th>Vitendo</th>':''}</tr></thead><tbody>${ps.map(p=>`<tr><td><b>${esc(p.name)}</b><small class="cell-sub">${esc(p.category||'')}</small></td><td>${esc(p.sku||'—')}</td><td>${money(p.cost_price)}</td><td class="money">${money(p.selling_price)}</td><td><span class="${Number(p.stock_qty)<=Number(p.reorder_level)?'stock-low':'stock-ok'}">${Number(p.stock_qty)} ${esc(p.unit||'pcs')}</span></td>${can('products.manage')?`<td><button class="small-btn" data-edit="${p.id}">Hariri</button><button class="small-btn" data-stock="${p.id}">Stock +</button></td>`:''}</tr>`).join('')}</tbody></table>`;table.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>productForm(root,state.products.find(p=>p.id===b.dataset.edit)));table.querySelectorAll('[data-stock]').forEach(b=>b.onclick=()=>stockForm(root,state.products.find(p=>p.id===b.dataset.stock)));};
  root.querySelector('#products-search').oninput=e=>draw(e.target.value);
  if(can('products.manage'))root.querySelector('#add-product').onclick=()=>productForm(root,null);
  draw('');
}
function productForm(root,p) {
  const modal=root.querySelector('#product-modal');
  modal.innerHTML=`<div class="modal-backdrop"><form id="product-form" class="modal-card"><div class="panel-head"><h3>${p?'Hariri bidhaa':'Ongeza bidhaa'}</h3><button type="button" id="close-modal" class="icon-btn">×</button></div><label>Jina la bidhaa<input name="name" required value="${esc(p?.name||'')}"></label><div class="form-two"><label>SKU / Barcode<input name="sku" value="${esc(p?.sku||'')}"></label><label>Category<input name="category" value="${esc(p?.category||'')}"></label></div><div class="form-two"><label>Bei ya kununua (TSh)<input name="cost_price" type="number" min="0" step="0.01" required value="${p?.cost_price??0}"></label><label>Bei ya kuuza (TSh)<input name="selling_price" type="number" min="0" step="0.01" required value="${p?.selling_price??0}"></label></div><div class="form-two"><label>Stock ya mwanzo<input name="stock_qty" type="number" min="0" step="1" required value="${p?.stock_qty??0}" ${p?'disabled':''}></label><label>Reorder level<input name="reorder_level" type="number" min="0" step="1" required value="${p?.reorder_level??5}"></label></div><label>Unit<input name="unit" value="${esc(p?.unit||'pcs')}" required></label><p class="form-error" id="product-error"></p><button class="primary wide" type="submit">Hifadhi bidhaa</button></form></div>`;
  modal.querySelector('#close-modal').onclick=()=>modal.innerHTML='';
  modal.querySelector('#product-form').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const values={name:fd.get('name').trim(),sku:fd.get('sku').trim()||null,category:fd.get('category').trim()||null,cost_price:Number(fd.get('cost_price')),selling_price:Number(fd.get('selling_price')),reorder_level:Number(fd.get('reorder_level')),unit:fd.get('unit').trim()};let result;
    if(p) result=await supabase.from('products').update(values).eq('id',p.id);
    else {values.stock_qty=Number(fd.get('stock_qty'));result=await supabase.rpc('create_product_with_stock',{p_name:values.name,p_sku:values.sku,p_category:values.category,p_unit:values.unit,p_cost_price:values.cost_price,p_selling_price:values.selling_price,p_stock_qty:values.stock_qty,p_reorder_level:values.reorder_level});}
    if(result.error){modal.querySelector('#product-error').textContent=result.error.message;return;}
    modal.innerHTML='';await loadProducts();renderProducts(root);notice('Bidhaa imehifadhiwa.','success');
  };
}
function stockForm(root,p) {
  const modal=root.querySelector('#product-modal');
  modal.innerHTML=`<div class="modal-backdrop"><form id="stock-form" class="modal-card"><div class="panel-head"><h3>Ongeza stock</h3><button type="button" id="close-modal" class="icon-btn">×</button></div><p>${esc(p.name)} · Stock ya sasa: <b>${p.stock_qty}</b></p><label>Quantity inayoingia<input name="qty" type="number" min="1" step="1" required></label><label>Sababu<input name="reason" required value="Manunuzi / stock received"></label><p class="form-error" id="stock-error"></p><button class="primary wide">Hifadhi stock</button></form></div>`;
  modal.querySelector('#close-modal').onclick=()=>modal.innerHTML='';
  modal.querySelector('#stock-form').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const {error}=await supabase.rpc('adjust_stock',{p_product_id:p.id,p_quantity:Number(fd.get('qty')),p_reason:fd.get('reason')});if(error){modal.querySelector('#stock-error').textContent=error.message;return;}modal.innerHTML='';await loadProducts();renderProducts(root);notice('Stock imeongezwa.','success');};
}
async function renderHistory(root) {
  root.innerHTML='<section class="panel"><div class="panel-head"><div><h3>Historia ya mauzo</h3><p class="muted">Miamala ya karibuni</p></div></div><div class="loading">Inapakia...</div></section>';
  const {data,error}=await supabase.from('sales').select('id,total_amount,payment_method,payment_status,status,created_at,profiles(full_name)').order('created_at',{ascending:false}).limit(200);
  if(error){root.innerHTML=`<div class="empty-state">${esc(error.message)}</div>`;return;}
  root.innerHTML=`<section class="panel"><div class="panel-head"><div><h3>Historia ya mauzo</h3><p class="muted">Miamala 200 ya karibuni</p></div><button class="secondary" id="export-sales">Pakua CSV</button></div><div class="table-wrap"><table><thead><tr><th>Risiti</th><th>Tarehe</th><th>Mfanyakazi</th><th>Malipo</th><th>Jumla</th><th>Hali</th></tr></thead><tbody>${(data||[]).map(s=>`<tr><td>#${s.id.slice(0,8).toUpperCase()}</td><td>${new Date(s.created_at).toLocaleString('sw-TZ')}</td><td>${esc(s.profiles?.full_name||'—')}</td><td>${esc(s.payment_method||'—')}</td><td class="money">${money(s.total_amount)}</td><td>${esc(s.status)}</td></tr>`).join('')}</tbody></table></div></section>`;
  root.querySelector('#export-sales').onclick=()=>downloadCSV('mauzo.csv',['Risiti','Tarehe','Mfanyakazi','Malipo','Jumla','Hali'],(data||[]).map(s=>[s.id,new Date(s.created_at).toISOString(),s.profiles?.full_name||'',s.payment_method,s.total_amount,s.status]));
}
async function renderExpenses(root) {
  root.innerHTML=`<section class="panel"><div class="panel-head"><div><h3>Matumizi ya biashara</h3><p class="muted">Rekodi matumizi ya kila siku.</p></div>${can('expenses.manage')?'<button id="add-expense" class="primary">＋ Rekodi matumizi</button>':''}</div><div id="expenses-content" class="loading">Inapakia...</div></section><div id="expense-modal"></div>`;
  const wrap=root.querySelector('#expenses-content');const {data,error}=await supabase.from('expenses').select('id,title,category,amount,notes,created_at,profiles(full_name)').order('created_at',{ascending:false}).limit(200);
  if(error){wrap.textContent=error.message;return;}
  wrap.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Matumizi</th><th>Aina</th><th>Tarehe</th><th>Aliyeingiza</th><th>Kiasi</th></tr></thead><tbody>${(data||[]).map(x=>`<tr><td><b>${esc(x.title)}</b><small class="cell-sub">${esc(x.notes||'')}</small></td><td>${esc(x.category||'Nyingine')}</td><td>${new Date(x.created_at).toLocaleDateString('sw-TZ')}</td><td>${esc(x.profiles?.full_name||'—')}</td><td class="money">${money(x.amount)}</td></tr>`).join('')}</tbody></table></div>`;
  const b=root.querySelector('#add-expense');if(b)b.onclick=()=>{const m=root.querySelector('#expense-modal');m.innerHTML=`<div class="modal-backdrop"><form id="expense-form" class="modal-card"><div class="panel-head"><h3>Rekodi matumizi</h3><button type="button" id="close-modal" class="icon-btn">×</button></div><label>Maelezo<input name="title" required></label><label>Aina<input name="category" placeholder="Kodi, umeme, usafiri..."></label><label>Kiasi (TSh)<input name="amount" type="number" min="1" required></label><label>Maelezo ya ziada<textarea name="notes"></textarea></label><p id="expense-error" class="form-error"></p><button class="primary wide">Hifadhi</button></form></div>`;m.querySelector('#close-modal').onclick=()=>m.innerHTML='';m.querySelector('#expense-form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const {error}=await supabase.from('expenses').insert({title:f.get('title'),category:f.get('category')||'Nyingine',amount:Number(f.get('amount')),notes:f.get('notes')||''});if(error){m.querySelector('#expense-error').textContent=error.message;return;}renderExpenses(root);notice('Matumizi yamehifadhiwa.','success');};};
}
async function renderReports(root) {
  root.innerHTML='<section class="panel"><div class="panel-head"><div><h3>Ripoti</h3><p class="muted">Chagua kipindi cha ripoti.</p></div></div><form id="report-filter" class="filter-row"><label>Kuanzia<input type="date" name="from" required></label><label>Mpaka<input type="date" name="to" required></label><button class="primary">Tengeneza ripoti</button></form><div id="report-result"></div></section>';
  const now=new Date();const start=new Date(now.getFullYear(),now.getMonth(),1);root.querySelector('[name=from]').value=start.toISOString().slice(0,10);root.querySelector('[name=to]').value=now.toISOString().slice(0,10);
  const form=root.querySelector('#report-filter');form.onsubmit=async e=>{e.preventDefault();const f=new FormData(form);const from=new Date(f.get('from')+'T00:00:00').toISOString();const to=new Date(f.get('to')+'T23:59:59.999').toISOString();const result=root.querySelector('#report-result');result.innerHTML='<div class="loading">Inatengeneza...</div>';const {data,error}=await supabase.from('sales').select('id,total_amount,created_at,status').gte('created_at',from).lte('created_at',to).neq('status','void').order('created_at');if(error){result.textContent=error.message;return;}const total=(data||[]).reduce((s,x)=>s+Number(x.total_amount),0);result.innerHTML=`<div class="stat-grid report-stats"><article class="stat-card"><span>Mauzo yote</span><strong>${money(total)}</strong></article><article class="stat-card"><span>Idadi ya miamala</span><strong>${data.length}</strong></article></div><button id="export-report" class="secondary">Pakua ripoti CSV</button>`;result.querySelector('#export-report').onclick=()=>downloadCSV('ripoti-mauzo.csv',['Risiti','Tarehe','Jumla','Hali'],data.map(x=>[x.id,x.created_at,x.total_amount,x.status]));};form.requestSubmit();
}
async function renderUsers(root) {
  if(!isOwner()&&!isDeveloper()){root.innerHTML='<div class="empty-state">Huna ruhusa ya kusimamia watumiaji.</div>';return;}
  root.innerHTML='<section class="panel"><div class="panel-head"><div><h3>Watumiaji</h3><p class="muted">Akaunti na roles za mfumo.</p></div></div><div class="callout">Kwa usalama, unda mtumiaji kupitia Supabase Authentication → Users → Add user. Kisha owner anaweza kuweka role kwenye profiles. Usitengeneze password kwenye database.</div><div id="users-table" class="loading">Inapakia...</div></section>';
  const {data,error}=await supabase.from('profiles').select('id,full_name,role,active,created_at').order('created_at',{ascending:false});
  const wrap=root.querySelector('#users-table');if(error){wrap.textContent=error.message;return;}
  wrap.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Jina</th><th>Role</th><th>Hali</th><th>User ID</th></tr></thead><tbody>${data.map(u=>`<tr><td><b>${esc(u.full_name||'—')}</b></td><td><span class="status">${esc(u.role)}</span></td><td>${u.active?'Active':'Inactive'}</td><td><code>${esc(u.id)}</code></td></tr>`).join('')}</tbody></table></div>`;
}
function renderSettings(root) {
  root.innerHTML=`<div class="content-grid"><section class="panel"><div class="panel-head"><div><h3>Taarifa za biashara</h3><p class="muted">Jina litaonekana kwenye risiti.</p></div></div><form id="settings-form"><label>Jina la stationary<input name="business_name" required></label><label>Namba ya simu<input name="phone"></label><label>Anwani / eneo<input name="address"></label><label>Ujumbe wa risiti<textarea name="receipt_footer"></textarea></label><button class="primary wide">Hifadhi mipangilio</button><p id="settings-error" class="form-error"></p></form></section><section class="panel"><h3>Backup na usalama</h3><p class="muted">Data iko Supabase. Export ya CSV ni nakala ya taarifa zilizopakuliwa, si backup kamili ya database.</p><a class="text-link" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Fungua Supabase Dashboard ↗</a><div class="callout">Weka backup ya database na ujaribu restore mara kwa mara. Usishiriki anon key yenyewe kama siri, na usiweke service_role key kwenye browser.</div></section></div>`;
  const {data}=await supabase.from('business_settings').select('business_name,phone,address,receipt_footer').limit(1).maybeSingle();
  const form=root.querySelector('#settings-form');if(data)Object.entries(data).forEach(([k,v])=>{if(form.elements[k])form.elements[k].value=v||'';});
  form.onsubmit=async e=>{e.preventDefault();if(!isOwner()){root.querySelector('#settings-error').textContent='Owner pekee anaweza kubadilisha mipangilio.';return;}const f=new FormData(form);const values={business_name:f.get('business_name'),phone:f.get('phone'),address:f.get('address'),receipt_footer:f.get('receipt_footer')};const {error}=await supabase.from('business_settings').upsert({...values,id:1,updated_by:state.profile.id});root.querySelector('#settings-error').textContent=error?error.message:'Mipangilio imehifadhiwa.';};
}
function downloadCSV(filename,headers,rows) {
  const quote=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  const csv='\uFEFF'+[headers,...rows].map(r=>r.map(quote).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}
boot();
if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js').catch(console.error);
