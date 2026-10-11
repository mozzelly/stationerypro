import { requireSupabase } from '../lib/supabase.js';

const money = (value) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);

export async function renderProducts(root) {
  root.innerHTML = `
    <section class="page-heading">
      <div><p class="eyebrow">USIMAMIZI WA STOCK</p><h1>Bidhaa</h1></div>
      <button id="add-product" class="btn btn-primary">Ongeza bidhaa</button>
    </section>
    <p id="products-message" class="error-message"></p>
    <section class="panel">
      <input id="product-search" placeholder="Tafuta bidhaa..." aria-label="Tafuta bidhaa">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Jina</th><th>SKU</th><th>Bei ya kununua</th><th>Bei ya kuuza</th><th>Stock</th></tr></thead>
          <tbody id="products-body"></tbody>
        </table>
      </div>
    </section>
    <dialog id="product-dialog">
      <form id="product-form" class="dialog-form">
        <h2>Ongeza bidhaa</h2>
        <label>Jina la bidhaa<input name="name" required maxlength="150"></label>
        <label>SKU / Barcode<input name="sku" maxlength="100"></label>
        <label>Bei ya kununua (TSh)<input name="cost_price" type="number" min="0" step="1" required></label>
        <label>Bei ya kuuza (TSh)<input name="selling_price" type="number" min="0" step="1" required></label>
        <label>Stock ya mwanzo<input name="stock_quantity" type="number" min="0" step="1" value="0" required></label>
        <label>Stock ya kuagiza tena inapofikia<input name="reorder_level" type="number" min="0" step="1" value="5" required></label>
        <p id="product-form-error" class="error-message"></p>
        <div class="dialog-actions">
          <button type="button" id="cancel-product" class="btn btn-light">Ghairi</button>
          <button type="submit" class="btn btn-primary">Hifadhi</button>
        </div>
      </form>
    </dialog>
  `;

  const db = requireSupabase();
  const dialog = root.querySelector('#product-dialog');
  const form = root.querySelector('#product-form');
  const errorBox = root.querySelector('#product-form-error');
  let products = [];

  async function loadProducts() {
    const { data, error } = await db.from('products')
      .select('id, name, sku, cost_price, selling_price, stock_quantity, reorder_level')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    products = data || [];
    drawProducts(products);
  }

  function drawProducts(list) {
    root.querySelector('#products-body').innerHTML = list.length
      ? list.map((p) => `
        <tr>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.sku || '—')}</td>
          <td>${money(p.cost_price)}</td>
          <td>${money(p.selling_price)}</td>
          <td>${Number(p.stock_quantity)}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="5">Hakuna bidhaa zilizopatikana.</td></tr>';
  }

  root.querySelector('#product-search').addEventListener('input', (event) => {
    const q = event.target.value.trim().toLowerCase();
    drawProducts(products.filter((p) =>
      p.name.toLowerCase().includes(q) || String(p.sku || '').toLowerCase().includes(q)
    ));
  });

  root.querySelector('#add-product').addEventListener('click', () => {
    form.reset();
    errorBox.textContent = '';
    dialog.showModal();
  });

  root.querySelector('#cancel-product').addEventListener('click', () => dialog.close());

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.textContent = '';

    const values = new FormData(form);
    const name = String(values.get('name')).trim();
    const sku = String(values.get('sku') || '').trim() || null;
    const cost = Number(values.get('cost_price'));
    const selling = Number(values.get('selling_price'));
    const stock = Number(values.get('stock_quantity'));
    const reorder = Number(values.get('reorder_level'));

    if (!name || [cost, selling, stock, reorder].some((n) => !Number.isFinite(n) || n < 0)) {
      errorBox.textContent = 'Kagua taarifa ulizoingiza.';
      return;
    }

    try {
      const { data: userResult, error: userError } = await db.auth.getUser();
      if (userError) throw userError;

      const { data: product, error } = await db.from('products').insert({
        name,
        sku,
        cost_price: cost,
        selling_price: selling,
        stock_quantity: stock,
        reorder_level: reorder,
        created_by: userResult.user.id,
      }).select('id').single();

      if (error) throw error;

      if (stock > 0) {
        const { error: movementError } = await db.from('stock_movements').insert({
          product_id: product.id,
          movement_type: 'opening',
          quantity: stock,
          note: 'Stock ya mwanzo',
          user_id: userResult.user.id,
        });

        if (movementError) throw movementError;
      }

      dialog.close();
      await loadProducts();
    } catch (error) {
      errorBox.textContent = error.message || 'Imeshindikana kuhifadhi bidhaa.';
    }
  });

  try {
    await loadProducts();
  } catch (error) {
    root.querySelector('#products-message').textContent = error.message;
  }
}