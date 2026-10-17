import { supabase } from '../lib/supabase.js';

// Orodha ya bidhaa za kawaida za Tanzania (Mfumo utazipendekeza tu, hazijaingia database mpaka ubofye Hifadhi)
const commonProducts = [
  { name: 'Kalamu ya Mshale (Blue)', category: 'Writing', cost: 200, selling: 500 },
  { name: 'Kalamu ya Mshale (Black)', category: 'Writing', cost: 200, selling: 500 },
  { name: 'Kalamu ya Mshale (Red)', category: 'Writing', cost: 200, selling: 500 },
  { name: 'Kitabu cha Mazoezi A4 (80 pages)', category: 'Books', cost: 1500, selling: 3000 },
  { name: 'Kitabu cha Mazoezi A5 (60 pages)', category: 'Books', cost: 1000, selling: 2000 },
  { name: 'Daftari Kubwa (200 pages)', category: 'Books', cost: 3000, selling: 5000 },
  { name: 'Daftari Dogo (100 pages)', category: 'Books', cost: 1500, selling: 3000 },
  { name: 'Karatasi A4 (Ream 500)', category: 'Paper', cost: 8000, selling: 12000 },
  { name: 'Futa (Eraser)', category: 'Accessories', cost: 200, selling: 500 },
  { name: 'Kifutio (Sharpener)', category: 'Accessories', cost: 300, selling: 700 },
  { name: 'Rula 30cm', category: 'Accessories', cost: 500, selling: 1000 },
  { name: 'Penseli HB', category: 'Writing', cost: 200, selling: 500 },
  { name: 'Kalamu ya Kudumu (Permanent Marker)', category: 'Writing', cost: 1000, selling: 2000 },
  { name: 'Glue (Unga wa Kufuatia)', category: 'Accessories', cost: 500, selling: 1000 },
  { name: 'Mkasi (Scissors)', category: 'Accessories', cost: 1000, selling: 2000 },
  { name: 'Stapler (Kukutia)', category: 'Accessories', cost: 3000, selling: 5000 },
  { name: 'Staples (Vikokotoo)', category: 'Accessories', cost: 500, selling: 1000 },
  { name: 'File Folder (Manila)', category: 'Filing', cost: 300, selling: 700 },
  { name: 'Bahasha (Envelope) F4', category: 'Paper', cost: 100, selling: 300 },
  { name: 'Correction Fluid (Pen)', category: 'Accessories', cost: 1500, selling: 3000 },
  { name: 'Highlighter (Yellow/Green/Pink)', category: 'Writing', cost: 800, selling: 1500 },
  { name: 'Kikokotoo (Calculator) Small', category: 'Electronics', cost: 5000, selling: 10000 },
  { name: 'Mfuko wa Penseli (Pencil Case)', category: 'Accessories', cost: 2000, selling: 4000 }
];

// Bidhaa na huduma zote (zinatumika kutambua zinazojirudia wakati wa kuongeza)
let productCache = [];
let activeTab = 'products'; // 'products' au 'services'

const num = (v) => Number(v) || 0;
const round3 = (v) => Math.round((Number(v) || 0) * 1000) / 1000;
const normalizeName = (s) => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export async function renderProducts(root, user, profile) {
  root.innerHTML = `
    <div class="page-header">
      <h1>Bidhaa na Huduma</h1>
      <button id="add-item-btn" class="btn btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
        <span id="add-item-label">Ongeza Bidhaa</span>
      </button>
    </div>

    <div style="display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;">
      <button type="button" id="tab-products" class="btn btn-primary">Bidhaa</button>
      <button type="button" id="tab-services" class="btn btn-secondary">Huduma</button>
    </div>

    <div class="filters">
      <input type="text" id="search-product" placeholder="Tafuta bidhaa kwa jina au SKU..." />
      <select id="filter-category"><option value="">Kategoria zote</option></select>
    </div>

    <div id="products-section" class="table-wrap">
      <table id="products-table">
        <thead>
          <tr>
            <th>Jina la Bidhaa</th>
            <th>SKU</th>
            <th>Kategoria</th>
            <th>Bei ya Kununua</th>
            <th>Bei ya Kuuza</th>
            <th>Stock (Zilizobaki / Jumla)</th>
            <th>Hali</th>
            <th>Vitendo</th>
          </tr>
        </thead>
        <tbody id="products-body"><tr><td colspan="8" class="empty-state">Inapakia...</td></tr></tbody>
      </table>
    </div>

    <div id="services-section" class="table-wrap" style="display: none;">
      <table id="services-table">
        <thead>
          <tr>
            <th>Jina la Huduma</th>
            <th>Kategoria</th>
            <th>Bei ya Huduma</th>
            <th>Vitendo</th>
          </tr>
        </thead>
        <tbody id="services-body"><tr><td colspan="4" class="empty-state">Inapakia...</td></tr></tbody>
      </table>
    </div>

    <div id="product-modal" class="modal-overlay" style="display: none;">
      <div class="modal" style="max-width: 700px;">
        <div class="modal-header">
          <h3 id="modal-title">Ongeza Bidhaa</h3>
          <button class="modal-close" id="close-modal">×</button>
        </div>
        <div class="modal-body">
          <form id="product-form">
            <div class="form-grid">
              <!-- TUMIA DATALIST KWA AUTOCOMPLETE -->
              <div class="form-group">
                <label>Jina la bidhaa *</label>
                <input type="text" name="name" id="product-name-input" list="common-products-list" required placeholder="Andika au chagua bidhaa..." />
                <datalist id="common-products-list"></datalist>
              </div>
              
              <div class="form-group"><label>SKU / Barcode Namba</label><input type="text" name="sku" /></div>
              <div class="form-group"><label>Kategoria</label><select name="category_id" id="category-select"><option value="">Chagua kategoria</option></select></div>
              <div class="form-group"><label>Unit (kipimo)</label><input type="text" name="unit" value="piece" /></div>
              <div class="form-group"><label>Bei ya kununua (TSh) *</label><input type="number" name="cost_price" step="0.01" min="0" required /></div>
              <div class="form-group"><label>Bei ya kuuza (TSh) *</label><input type="number" name="selling_price" step="0.01" min="0" required /></div>

              <!-- STOCK: INAHESABIWA NA MFUMO -->
              <div class="form-group">
                <label>Stock iliyopo sasa (zilikuwepo)</label>
                <input type="number" name="stock_quantity" step="0.001" value="0" readonly />
              </div>
              <div class="form-group">
                <label id="add-stock-label">Idadi uliyopokea leo (acha 0 kama hakuna)</label>
                <input type="number" name="add_stock" step="0.001" min="0" value="0" />
                <small id="stock-preview" style="display: block; margin-top: 6px; font-weight: 700; color: var(--blue-dark);"></small>
              </div>

              <div class="form-group"><label>Stock ya Kuagiza Tena (Alert)</label><input type="number" name="reorder_level" step="0.001" min="0" value="5" /></div>
              
              <div class="form-group span-all">
                <label>Picha ya Barcode (Hiari)</label>
                <input type="file" id="barcode-input" name="barcode_image" accept="image/*" />
                <small class="text-muted">Pakia picha ya barcode ikiwa nayo (si lazima).</small>
                <div id="barcode-preview" style="margin-top: 10px; max-width: 200px;"></div>
              </div>
            </div>
            <div id="form-message" class="form-message" style="display: none;"></div>
            <div class="form-buttons">
              <button type="button" class="btn btn-secondary" id="cancel-btn">Ghairi</button>
              <button type="submit" class="btn btn-primary">Hifadhi Bidhaa</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div id="service-modal" class="modal-overlay" style="display: none;">
      <div class="modal" style="max-width: 560px;">
        <div class="modal-header">
          <h3 id="service-modal-title">Ongeza Huduma</h3>
          <button class="modal-close" id="close-service-modal">×</button>
        </div>
        <div class="modal-body">
          <form id="service-form">
            <div class="form-grid">
              <div class="form-group span-all">
                <label>Jina la huduma *</label>
                <input type="text" name="service_name" required placeholder="Mfano: Ushauri, Kuprint, Kuscan..." />
              </div>
              <div class="form-group">
                <label>Kategoria</label>
                <select name="service_category_id" id="service-category-select"><option value="">Chagua kategoria</option></select>
              </div>
              <div class="form-group">
                <label>Bei ya huduma (TSh) *</label>
                <input type="number" name="service_price" step="0.01" min="0" required />
              </div>
              <div class="form-group span-all">
                <small class="text-muted">Huduma haina stock wala idadi. Unaweka jina na bei tu.</small>
              </div>
            </div>
            <div id="service-form-message" class="form-message" style="display: none;"></div>
            <div class="form-buttons">
              <button type="button" class="btn btn-secondary" id="cancel-service-btn">Ghairi</button>
              <button type="submit" class="btn btn-primary">Hifadhi Huduma</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  await loadProducts();
  await loadCategories();
  setupAutocomplete(); // Weka mapendekezo ya bidhaa
  setTab('products');

  document.getElementById('add-item-btn').addEventListener('click', () => {
    if (activeTab === 'services') openServiceModal();
    else openModal();
  });
  document.getElementById('tab-products').addEventListener('click', () => setTab('products'));
  document.getElementById('tab-services').addEventListener('click', () => setTab('services'));

  document.getElementById('close-modal').addEventListener('click', () => closeModal());
  document.getElementById('cancel-btn').addEventListener('click', () => closeModal());
  document.getElementById('product-form').addEventListener('submit', async (e) => { e.preventDefault(); await saveProduct(); });
  document.getElementById('search-product').addEventListener('input', () => loadProducts());
  document.getElementById('filter-category').addEventListener('change', () => loadProducts());

  document.getElementById('close-service-modal').addEventListener('click', () => closeServiceModal());
  document.getElementById('cancel-service-btn').addEventListener('click', () => closeServiceModal());
  document.getElementById('service-form').addEventListener('submit', async (e) => { e.preventDefault(); await saveService(); });

  // Tambua bidhaa iliyopo tayari (kwa jina au SKU) na uhesabu stock kiotomatiki
  document.getElementById('product-name-input').addEventListener('input', checkExisting);
  document.querySelector('#product-form input[name="sku"]').addEventListener('input', checkExisting);
  document.getElementById('product-form').add_stock.addEventListener('input', updateStockPreview);

  document.getElementById('barcode-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('barcode-preview');
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) { preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; border: 1px solid var(--border); border-radius: 4px;" />`; }
      reader.readAsDataURL(file);
    } else { preview.innerHTML = ''; }
  });
}

// Kubadilisha kati ya Bidhaa na Huduma
function setTab(tab) {
  activeTab = tab;
  const isServices = tab === 'services';
  document.getElementById('products-section').style.display = isServices ? 'none' : '';
  document.getElementById('services-section').style.display = isServices ? '' : 'none';
  document.getElementById('tab-products').className = 'btn ' + (isServices ? 'btn-secondary' : 'btn-primary');
  document.getElementById('tab-services').className = 'btn ' + (isServices ? 'btn-primary' : 'btn-secondary');
  document.getElementById('add-item-label').textContent = isServices ? 'Ongeza Huduma' : 'Ongeza Bidhaa';
  document.getElementById('search-product').placeholder = isServices
    ? 'Tafuta huduma kwa jina...'
    : 'Tafuta bidhaa kwa jina au SKU...';
}

async function refreshProductCache() {
  const { data } = await supabase.from('products').select('*');
  productCache = data || [];
}

// Inatafuta bidhaa (si huduma) iliyopo tayari kwa jina au SKU
function findExisting(name, sku) {
  const n = normalizeName(name);
  const k = String(sku || '').trim().toLowerCase();
  return productCache.find(p =>
    !p.is_service && (
      (n && normalizeName(p.name) === n) ||
      (k && p.sku && String(p.sku).trim().toLowerCase() === k)
    )
  ) || null;
}

// Inaangalia kama bidhaa unayoandika tayari ipo, na kuonyesha zilizokuwepo
function checkExisting() {
  const form = document.getElementById('product-form');
  if (!form || form.dataset.productId) return; // tunahariri, si kuongeza

  const match = findExisting(form.name.value, form.sku.value);

  if (match) {
    if (form.dataset.matchId !== match.id) {
      // Jaza taarifa za bidhaa iliyopo ili zisibadilike kwa bahati mbaya
      form.category_id.value = match.category_id || '';
      form.unit.value = match.unit || 'piece';
      form.cost_price.value = match.cost_price;
      form.selling_price.value = match.selling_price;
      form.reorder_level.value = match.reorder_level;
      form.dataset.prefilled = '1';
    }
    form.dataset.matchId = match.id;
    form.dataset.matchName = match.name;
    form.stock_quantity.value = match.stock_quantity;
  } else {
    if (form.dataset.prefilled) {
      // Bidhaa iliyokuwa imepatikana haipo tena (jina limebadilishwa): futa tulichojaza
      form.category_id.value = '';
      form.unit.value = 'piece';
      form.cost_price.value = '';
      form.selling_price.value = '';
      form.reorder_level.value = 5;
      delete form.dataset.prefilled;
    }
    delete form.dataset.matchId;
    delete form.dataset.matchName;
    form.stock_quantity.value = 0;
  }

  updateStockPreview();
}

// Inaonyesha: zilikuwepo ngapi, umepokea ngapi, sasa zitakuwa ngapi
function updateStockPreview() {
  const form = document.getElementById('product-form');
  const preview = document.getElementById('stock-preview');
  if (!form || !preview) return;

  const current = round3(form.stock_quantity.value);
  const add = round3(form.add_stock.value);
  const editing = !!form.dataset.productId;
  const matched = !editing && form.dataset.matchId;

  if (editing) {
    preview.textContent = add !== 0
      ? `Zilikuwepo: ${current}, mabadiliko: ${add > 0 ? '+' : ''}${add}, sasa zitakuwa: ${round3(current + add)}`
      : '';
  } else if (matched) {
    preview.textContent = `Bidhaa hii ipo tayari ("${form.dataset.matchName}"). Zilikuwepo: ${current}, umepokea: ${add}, sasa zitakuwa: ${round3(current + add)}. Itaongezwa kwenye bidhaa hiyo, haitaunda nakala.`;
  } else {
    preview.textContent = add > 0
      ? `Bidhaa mpya. Zilikuwepo: 0, umepokea: ${add}, sasa zitakuwa: ${add}`
      : '';
  }
}

// Function ya kuweka mapendekezo na kujaza bei kiotomatiki
function setupAutocomplete() {
  const datalist = document.getElementById('common-products-list');
  datalist.innerHTML = commonProducts.map(p => `<option value="${p.name}">`).join('');

  const nameInput = document.getElementById('product-name-input');
  const categorySelect = document.getElementById('category-select');
  const costInput = document.querySelector('input[name="cost_price"]');
  const sellingInput = document.querySelector('input[name="selling_price"]');

  nameInput.addEventListener('input', function() {
    const selectedName = this.value;
    const product = commonProducts.find(p => p.name === selectedName);
    
    if (product) {
      // Ikiwa bidhaa imepatikana kwenye orodha, jaza kategoria na bei (lakini mtu anaweza kubadilisha)
      // Tafuta category ID inayolingana na jina la category
      const catOption = Array.from(categorySelect.options).find(opt => opt.text.toLowerCase() === product.category.toLowerCase());
      if (catOption) categorySelect.value = catOption.value;
      
      costInput.value = product.cost;
      sellingInput.value = product.selling;
    }
  });
}

// Inapakia bidhaa na huduma, kisha kuzigawa kwenye majedwali mawili
async function loadProducts() {
  const search = document.getElementById('search-product')?.value || '';
  const categoryId = document.getElementById('filter-category')?.value || '';
  const tbody = document.getElementById('products-body');
  const servicesBody = document.getElementById('services-body');

  let query = supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
  if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  if (categoryId) query = query.eq('category_id', categoryId);

  const { data, error } = await query;
  if (error) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Hitilafu: ${esc(error.message)}</td></tr>`;
    servicesBody.innerHTML = `<tr><td colspan="4" class="empty-state">Hitilafu: ${esc(error.message)}</td></tr>`;
    return;
  }

  const all = data || [];
  const products = all.filter(p => !p.is_service);
  const services = all.filter(p => p.is_service);

  const tabProducts = document.getElementById('tab-products');
  const tabServices = document.getElementById('tab-services');
  if (tabProducts) tabProducts.textContent = `Bidhaa (${products.length})`;
  if (tabServices) tabServices.textContent = `Huduma (${services.length})`;

  // Bidhaa
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Hakuna bidhaa zilizopatikana</td></tr>`;
  } else {
    tbody.innerHTML = products.map(p => {
      const stock = num(p.stock_quantity);
      const received = Math.max(num(p.initial_stock), stock);
      const out = Math.max(0, received - stock);
      const stockStatus = p.stock_quantity <= p.reorder_level ? '<span class="badge badge-warning">Stock Chini</span>' : '<span class="badge badge-success">OK</span>';
      return `
        <tr>
          <td><strong>${esc(p.name)}</strong></td>
          <td>${esc(p.sku || '-')}</td>
          <td>${esc(p.categories?.name || '-')}</td>
          <td>${window.money(p.cost_price)}</td>
          <td>${window.money(p.selling_price)}</td>
          <td><div style="display: flex; flex-direction: column; gap: 4px;"><span style="font-weight: 700; color: var(--blue-dark);">${round3(stock)}</span><small class="text-muted">Jumla: ${round3(received)} · Zimetoka: ${round3(out)}</small></div></td>
          <td>${stockStatus}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="editProduct('${p.id}')">Hariri</button>
            <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')">Futa</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Huduma
  if (services.length === 0) {
    servicesBody.innerHTML = `<tr><td colspan="4" class="empty-state">Hakuna huduma zilizoongezwa bado</td></tr>`;
  } else {
    servicesBody.innerHTML = services.map(s => `
      <tr>
        <td><strong>${esc(s.name)}</strong></td>
        <td>${esc(s.categories?.name || '-')}</td>
        <td>${window.money(s.selling_price)}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="editService('${s.id}')">Hariri</button>
          <button class="btn btn-sm btn-danger" onclick="deleteService('${s.id}')">Futa</button>
        </td>
      </tr>
    `).join('');
  }
}

async function loadCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) return;
  const options = (data || []).map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');

  const categorySelect = document.querySelector('select[name="category_id"]');
  const serviceSelect = document.getElementById('service-category-select');
  const filterSelect = document.getElementById('filter-category');
  if (categorySelect) {
    const val = categorySelect.value;
    categorySelect.innerHTML = '<option value="">Chagua kategoria</option>' + options;
    categorySelect.value = val;
  }
  if (serviceSelect) {
    const val = serviceSelect.value;
    serviceSelect.innerHTML = '<option value="">Chagua kategoria</option>' + options;
    serviceSelect.value = val;
  }
  if (filterSelect) {
    const val = filterSelect.value;
    filterSelect.innerHTML = '<option value="">Kategoria zote</option>' + options;
    filterSelect.value = val;
  }
}

function openModal(product = null) {
  const form = document.getElementById('product-form');
  const preview = document.getElementById('barcode-preview');
  const addLabel = document.getElementById('add-stock-label');
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = false;

  delete form.dataset.matchId;
  delete form.dataset.matchName;
  delete form.dataset.prefilled;

  if (product) {
    document.getElementById('modal-title').textContent = 'Hariri Bidhaa';
    form.name.value = product.name; form.sku.value = product.sku || ''; form.category_id.value = product.category_id || '';
    form.unit.value = product.unit || 'piece'; form.cost_price.value = product.cost_price; form.selling_price.value = product.selling_price;
    form.stock_quantity.value = product.stock_quantity; form.add_stock.value = 0; form.reorder_level.value = product.reorder_level;
    form.dataset.productId = product.id;

    // Kuhariri: inaruhusu kuongeza au kupunguza (namba hasi)
    form.add_stock.removeAttribute('min');
    addLabel.textContent = 'Ongeza stock mpya (tumia − kupunguza)';

    if (product.barcode_image) preview.innerHTML = `<img src="${product.barcode_image}" style="max-width: 100%; border: 1px solid var(--border); border-radius: 4px;" />`;
    else preview.innerHTML = '';
  } else {
    document.getElementById('modal-title').textContent = 'Ongeza Bidhaa';
    delete form.dataset.productId;
    form.reset(); preview.innerHTML = '';

    form.add_stock.setAttribute('min', '0');
    addLabel.textContent = 'Idadi uliyopokea leo (acha 0 kama hakuna)';

    // Pakia orodha ya bidhaa ili kutambua zilizopo tayari
    refreshProductCache().then(checkExisting);
  }

  updateStockPreview();
  document.getElementById('product-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('product-modal').style.display = 'none';
  document.getElementById('form-message').style.display = 'none';
}

// Inajumlisha stock kwa usalama (database inafanya hesabu, si kivinjari)
async function adjustStock(productId, qty) {
  const { data, error } = await supabase.rpc('add_product_stock', { p_product_id: productId, p_qty: qty });
  if (!error) {
    const n = Number(data);
    return { newQty: Number.isFinite(n) ? n : null, error: null };
  }

  // Kama function haijawekwa kwenye database, tumia njia mbadala
  const missing = error.code === 'PGRST202' || /could not find the function|does not exist/i.test(error.message || '');
  if (!missing) return { newQty: null, error };

  const { data: row, error: readError } = await supabase
    .from('products').select('stock_quantity, initial_stock').eq('id', productId).single();
  if (readError) return { newQty: null, error: readError };

  const newQty = (Number(row.stock_quantity) || 0) + qty;
  if (newQty < 0) return { newQty: null, error: { message: 'Stock haiwezi kuwa chini ya 0.' } };

  const patch = { stock_quantity: newQty };
  if (qty > 0) patch.initial_stock = (Number(row.initial_stock) || 0) + qty;

  const { error: updateError } = await supabase.from('products').update(patch).eq('id', productId);
  return { newQty, error: updateError || null };
}

async function saveProduct() {
  const form = document.getElementById('product-form');
  const message = document.getElementById('form-message');
  const button = form.querySelector('button[type="submit"]');
  if (button.disabled) return; // zuia kubofya mara mbili
  button.disabled = true;
  let keepDisabled = false;

  const showError = (text) => {
    message.textContent = text;
    message.className = 'form-message error';
    message.style.display = 'block';
  };

  try {
    const editingId = form.dataset.productId || '';
    const skuValue = form.sku.value.trim();
    const nameValue = form.name.value.trim().replace(/\s+/g, ' ');
    const barcodeFile = form.barcode_image.files[0];
    const rawAdd = parseFloat(form.add_stock.value) || 0;
    const received = editingId ? rawAdd : Math.max(0, rawAdd);

    // Wakati wa kuongeza: tafuta tena bidhaa iliyopo kwa taarifa mpya kabisa,
    // ili isitengeneze nakala hata orodha ilikuwa bado haijapakiwa.
    let match = null;
    if (!editingId) {
      await refreshProductCache();
      match = findExisting(nameValue, skuValue);
    }
    const targetId = editingId || (match ? match.id : '');
    // Kama bidhaa iliyopo haikuonyeshwa kwa mtumiaji kwenye fomu, usibadilishe bei zake
    const skipFieldUpdate = !!match && form.dataset.matchId !== match.id;

    // Stock haimo hapa: inashughulikiwa tofauti ili isiandikwe juu ya mauzo yanayoendelea
    const baseData = {
      name: match ? match.name : nameValue,
      sku: skuValue === '' ? null : skuValue,
      category_id: form.category_id.value === '' ? null : form.category_id.value,
      unit: form.unit.value.trim() || 'piece',
      cost_price: parseFloat(form.cost_price.value) || 0,
      selling_price: parseFloat(form.selling_price.value) || 0,
      reorder_level: parseFloat(form.reorder_level.value) || 5
    };
    // Bidhaa iliyopo: usifute SKU yake ikiwa hukuijaza
    if (match && skuValue === '') delete baseData.sku;

    const barcodeDataUrl = barcodeFile ? await readFile(barcodeFile) : null;

    if (targetId) {
      if (!skipFieldUpdate) {
        // Bidhaa ipo: sasisha taarifa zake (stock inaongezwa baadaye kwa hesabu ya mfumo)
        const updateData = { ...baseData };
        if (barcodeDataUrl) updateData.barcode_image = barcodeDataUrl;
        const result = await supabase.from('products').update(updateData).eq('id', targetId);
        if (result.error) { showError(result.error.message); return; }
      }
    } else {
      // Bidhaa mpya: stock ya sasa = ulichopokea (0 kama hakuna)
      const result = await supabase.from('products').insert([{
        ...baseData,
        barcode_image: barcodeDataUrl,
        initial_stock: received,
        stock_quantity: received
      }]);
      if (result.error) { showError(result.error.message); return; }
    }

    let note = '';
    if (targetId && received !== 0) {
      const adj = await adjustStock(targetId, received);
      if (adj.error) {
        showError('Bidhaa imehifadhiwa, lakini stock haikubadilika: ' + adj.error.message);
        loadProducts();
        return;
      }
      if (adj.newQty !== null) note = ` Stock: ${round3(adj.newQty - received)} → ${round3(adj.newQty)}.`;
    } else if (!targetId && received > 0) {
      note = ` Stock: 0 → ${received}.`;
    }

    message.textContent = (targetId
      ? (match ? 'Bidhaa ilikuwepo, imesasishwa!' : 'Bidhaa imesasishwa!')
      : 'Bidhaa imeongezwa!') + note;
    message.className = 'form-message success';
    message.style.display = 'block';

    keepDisabled = true; // kitufe kinabaki kimezimwa mpaka dirisha lifungwe
    setTimeout(() => { closeModal(); loadProducts(); }, 1500);
  } catch (error) {
    showError(error.message || 'Imeshindikana kuhifadhi bidhaa.');
  } finally {
    if (!keepDisabled) button.disabled = false;
  }
}

/* ---------- Huduma (hazina stock wala idadi) ---------- */
function openServiceModal(service = null) {
  const form = document.getElementById('service-form');
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = false;
  document.getElementById('service-form-message').style.display = 'none';

  if (service) {
    document.getElementById('service-modal-title').textContent = 'Hariri Huduma';
    form.service_name.value = service.name;
    form.service_category_id.value = service.category_id || '';
    form.service_price.value = service.selling_price;
    form.dataset.serviceId = service.id;
  } else {
    document.getElementById('service-modal-title').textContent = 'Ongeza Huduma';
    form.reset();
    delete form.dataset.serviceId;
  }
  document.getElementById('service-modal').style.display = 'flex';
}

function closeServiceModal() {
  document.getElementById('service-modal').style.display = 'none';
  document.getElementById('service-form-message').style.display = 'none';
}

async function saveService() {
  const form = document.getElementById('service-form');
  const message = document.getElementById('service-form-message');
  const button = form.querySelector('button[type="submit"]');
  if (button.disabled) return;
  button.disabled = true;
  let keepDisabled = false;

  const showError = (text) => {
    message.textContent = text;
    message.className = 'form-message error';
    message.style.display = 'block';
  };

  try {
    const editingId = form.dataset.serviceId || '';
    const name = form.service_name.value.trim().replace(/\s+/g, ' ');
    const price = parseFloat(form.service_price.value);
    const categoryId = form.service_category_id.value === '' ? null : form.service_category_id.value;

    if (!name) { showError('Andika jina la huduma.'); return; }
    if (!Number.isFinite(price) || price < 0) { showError('Weka bei sahihi ya huduma.'); return; }

    // Zuia huduma inayojirudia
    await refreshProductCache();
    const duplicate = productCache.find(p =>
      p.is_service && p.id !== editingId && normalizeName(p.name) === normalizeName(name)
    );
    if (duplicate) {
      showError('Huduma hii ipo tayari. Tumia "Hariri" kubadilisha bei yake.');
      return;
    }

    let result;
    if (editingId) {
      result = await supabase.from('products')
        .update({ name, category_id: categoryId, selling_price: price })
        .eq('id', editingId);
    } else {
      result = await supabase.from('products').insert([{
        name,
        category_id: categoryId,
        unit: 'huduma',
        selling_price: price,
        cost_price: 0,
        stock_quantity: 0,
        initial_stock: 0,
        reorder_level: 0,
        is_service: true
      }]);
    }

    if (result.error) {
      if (/is_service/i.test(result.error.message || '')) {
        showError('Database bado haijaandaliwa kwa huduma. Endesha SQL ya Hatua A1 kwanza.');
      } else {
        showError(result.error.message);
      }
      return;
    }

    message.textContent = editingId ? 'Huduma imesasishwa!' : 'Huduma imeongezwa!';
    message.className = 'form-message success';
    message.style.display = 'block';

    keepDisabled = true;
    setTimeout(() => { closeServiceModal(); loadProducts(); }, 1200);
  } catch (error) {
    showError(error.message || 'Imeshindikana kuhifadhi huduma.');
  } finally {
    if (!keepDisabled) button.disabled = false;
  }
}

window.editProduct = async (id) => {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) return alert('Hitilafu: ' + error.message);
  openModal(data);
};

window.editService = async (id) => {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) return alert('Hitilafu: ' + error.message);
  openServiceModal(data);
};

async function deleteItem(id, label) {
  if (!confirm(`Je, una uhakika unataka kufuta ${label} hii?`)) return;
  
  // Jaribu kufuta kwanza
  const { error } = await supabase.from('products').delete().eq('id', id);

  // Kama kuna error inayohusiana na mauzo (foreign key)
  if (error && error.message.includes('sale_items_product_id_fkey')) {
    alert(`⚠️ Huwezi kufuta ${label} hii kwa sababu tayari imekwishaingia kwenye mauzo (risiti).\n\nBadala yake, mfumo utaiweka Stock iwe 0 na kuibadilisha jina kuwa "ZIMEISHA".`);
    
    // Badilisha jina na stock badala ya kufuta
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        name: 'ZIMEISHA - ' + Date.now(), 
        stock_quantity: 0,
        selling_price: 0,
        cost_price: 0
      })
      .eq('id', id);

    if (updateError) {
      alert('Hitilafu: ' + updateError.message);
      return;
    }
    
    loadProducts(); // Refresh jedwali
    return;
  }

  // Kama kuna error nyingine yoyote
  if (error) {
    alert('Hitilafu: ' + error.message);
    return;
  }

  // Kama imefutwa vizuri
  loadProducts();
}

window.deleteProduct = (id) => deleteItem(id, 'bidhaa');
window.deleteService = (id) => deleteItem(id, 'huduma');