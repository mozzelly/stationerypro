import { supabase } from '../lib/supabase.js';

export async function renderProducts(root, user, profile) {
  root.innerHTML = `
    <div class="page-header">
      <h1>Bidhaa na Stock</h1>
      <button id="add-product-btn" class="btn btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
        Ongeza Bidhaa
      </button>
    </div>

    <div class="filters">
      <input type="text" id="search-product" placeholder="Tafuta bidhaa kwa jina au SKU..." />
      <select id="filter-category"><option value="">Kategoria zote</option></select>
    </div>

    <div class="table-wrap">
      <table id="products-table">
        <thead>
          <tr>
            <th>Jina la Bidhaa</th>
            <th>SKU</th>
            <th>Kategoria</th>
            <th>Bei ya Kununua</th>
            <th>Bei ya Kuuza</th>
            <th>Stock (Mwanzo / Sasa)</th>
            <th>Hali</th>
            <th>Vitendo</th>
          </tr>
        </thead>
        <tbody id="products-body"><tr><td colspan="8" class="empty-state">Inapakia...</td></tr></tbody>
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
              <div class="form-group"><label>Jina la bidhaa *</label><input type="text" name="name" required /></div>
              <div class="form-group"><label>SKU / Barcode Namba</label><input type="text" name="sku" /></div>
              <div class="form-group"><label>Kategoria</label><select name="category_id"><option value="">Chagua kategoria</option></select></div>
              <div class="form-group"><label>Unit (kipimo)</label><input type="text" name="unit" value="piece" /></div>
              <div class="form-group"><label>Bei ya kununua (TSh) *</label><input type="number" name="cost_price" step="0.01" min="0" required /></div>
              <div class="form-group"><label>Bei ya kuuza (TSh) *</label><input type="number" name="selling_price" step="0.01" min="0" required /></div>
              <div class="form-group"><label>Stock ya Mwanzo *</label><input type="number" name="initial_stock" step="0.001" min="0" required /></div>
              <div class="form-group"><label>Stock ya Sasa</label><input type="number" name="stock_quantity" step="0.001" min="0" value="0" /></div>
              <div class="form-group"><label>Stock ya Kuagiza Tena (Alert)</label><input type="number" name="reorder_level" step="0.001" min="0" value="5" /></div>
              <div class="form-group span-all">
                <label>Picha ya Barcode (Hiari)</label>
                <input type="file" id="barcode-input" name="barcode_image" accept="image/*" />
                <small class="text-muted">Pakia picha ya barcode ikiwa nayo.</small>
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
  `;

  await loadProducts();
  await loadCategories();

  document.getElementById('add-product-btn').addEventListener('click', () => openModal());
  document.getElementById('close-modal').addEventListener('click', () => closeModal());
  document.getElementById('cancel-btn').addEventListener('click', () => closeModal());
  document.getElementById('product-form').addEventListener('submit', async (e) => { e.preventDefault(); await saveProduct(); });
  document.getElementById('search-product').addEventListener('input', () => loadProducts());
  document.getElementById('filter-category').addEventListener('change', () => loadProducts());

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

async function loadProducts() {
  const search = document.getElementById('search-product')?.value || '';
  const categoryId = document.getElementById('filter-category')?.value || '';
  const tbody = document.getElementById('products-body');

  let query = supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
  if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  if (categoryId) query = query.eq('category_id', categoryId);

  const { data, error } = await query;
  if (error) { tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Hitilafu: ${error.message}</td></tr>`; return; }
  if (!data || data.length === 0) { tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Hakuna bidhaa zilizopatikana</td></tr>`; return; }

  tbody.innerHTML = data.map(p => {
    const stockStatus = p.stock_quantity <= p.reorder_level ? '<span class="badge badge-warning">Stock Chini</span>' : '<span class="badge badge-success">OK</span>';
    return `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td>${p.sku || '-'}</td>
        <td>${p.categories?.name || '-'}</td>
        <td>${window.money(p.cost_price)}</td>
        <td>${window.money(p.selling_price)}</td>
        <td><div style="display: flex; flex-direction: column; gap: 4px;"><span style="font-weight: 700; color: var(--blue-dark);">${p.stock_quantity}</span><small class="text-muted">Mwanzo: ${p.initial_stock || 0}</small></div></td>
        <td>${stockStatus}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="editProduct('${p.id}')">Hariri</button>
          <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')">Futa</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function loadCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) return;
  const categorySelect = document.querySelector('select[name="category_id"]');
  const filterSelect = document.getElementById('filter-category');
  if (categorySelect) {
    const val = categorySelect.value;
    categorySelect.innerHTML = '<option value="">Chagua kategoria</option>' + (data || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    categorySelect.value = val;
  }
  if (filterSelect) {
    const val = filterSelect.value;
    filterSelect.innerHTML = '<option value="">Kategoria zote</option>' + (data || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    filterSelect.value = val;
  }
}

function openModal(product = null) {
  const form = document.getElementById('product-form');
  const preview = document.getElementById('barcode-preview');
  if (product) {
    document.getElementById('modal-title').textContent = 'Hariri Bidhaa';
    form.name.value = product.name; form.sku.value = product.sku || ''; form.category_id.value = product.category_id || '';
    form.unit.value = product.unit || 'piece'; form.cost_price.value = product.cost_price; form.selling_price.value = product.selling_price;
    form.initial_stock.value = product.initial_stock || 0; form.stock_quantity.value = product.stock_quantity; form.reorder_level.value = product.reorder_level;
    form.dataset.productId = product.id;
    if (product.barcode_image) preview.innerHTML = `<img src="${product.barcode_image}" style="max-width: 100%; border: 1px solid var(--border); border-radius: 4px;" />`;
    else preview.innerHTML = '';
  } else {
    document.getElementById('modal-title').textContent = 'Ongeza Bidhaa';
    form.reset(); delete form.dataset.productId; preview.innerHTML = '';
  }
  document.getElementById('product-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('product-modal').style.display = 'none';
  document.getElementById('form-message').style.display = 'none';
}

async function saveProduct() {
  const form = document.getElementById('product-form');
  const message = document.getElementById('form-message');
  const productId = form.dataset.productId;
  const barcodeFile = form.barcode_image.files[0];

  const baseData = {
    name: form.name.value, sku: form.sku.value || null, category_id: form.category_id.value || null,
    unit: form.unit.value || 'piece', cost_price: parseFloat(form.cost_price.value), selling_price: parseFloat(form.selling_price.value),
    initial_stock: parseFloat(form.initial_stock.value) || 0, stock_quantity: parseFloat(form.stock_quantity.value) || 0,
    reorder_level: parseFloat(form.reorder_level.value) || 5
  };

  const executeSave = async (barcodeDataUrl) => {
    const finalData = { ...baseData, barcode_image: barcodeDataUrl };
    const result = productId ? await supabase.from('products').update(finalData).eq('id', productId) : await supabase.from('products').insert([finalData]);
    if (result.error) { message.textContent = result.error.message; message.className = 'form-message error'; message.style.display = 'block'; return; }
    message.textContent = productId ? 'Bidhaa imesasishwa!' : 'Bidhaa imeongezwa!';
    message.className = 'form-message success'; message.style.display = 'block';
    setTimeout(() => { closeModal(); loadProducts(); }, 1500);
  };

  if (barcodeFile) {
    const reader = new FileReader();
    reader.onload = (e) => executeSave(e.target.result);
    reader.readAsDataURL(barcodeFile);
  } else {
    if (productId) {
      const { data } = await supabase.from('products').select('barcode_image').eq('id', productId).single();
      executeSave(data?.barcode_image || null);
    } else { executeSave(null); }
  }
}

window.editProduct = async (id) => {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) return alert('Hitilafu: ' + error.message);
  openModal(data);
};

window.deleteProduct = async (id) => {
  if (!confirm('Je, una uhakika unataka kufuta bidhaa hii?')) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return alert('Hitilafu: ' + error.message);
  loadProducts();
};