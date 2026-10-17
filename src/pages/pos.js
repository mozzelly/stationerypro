import { supabase } from '../lib/supabase.js';

let cart = [];
let products = [];
let businessInfo = {};
let lastReceipt = null;

const num = (v) => Number(v) || 0;
const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byId = (id) => document.getElementById(id);

export async function renderPOS(root, user, profile) {
  cart = [];

  const { data: bs } = await supabase
    .from('business_settings')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();
  businessInfo = bs || {};

  root.innerHTML = `
    <div class="pos-layout">
      <div class="pos-products-section">
        <div class="pos-header">
          <h3>Chagua Bidhaa / Huduma</h3>
          <div class="pos-search">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="text" id="pos-search" placeholder="Tafuta kwa jina au SKU..." style="padding-left: 36px;" />
          </div>
        </div>
        <div id="pos-products-grid" class="pos-products">
          <div class="empty-state">Inapakia...</div>
        </div>
      </div>

      <div class="cart-section">
        <div class="cart-panel">
          <div class="cart-header">
            <h3>Kikapu cha Mteja</h3>
            <button id="clear-cart" class="btn btn-sm btn-danger">Futa Zote</button>
          </div>
          
          <div id="cart-items" class="cart-items">
            <div class="empty-state">Bado hujachagua chochote.</div>
          </div>

          <div class="cart-summary">
            <div class="cart-summary-row">
              <span>Jumla Ndogo:</span>
              <span id="subtotal">TSh 0.00</span>
            </div>
            <div class="cart-summary-row">
              <span>Discount:</span>
              <div class="discount-input">
                <input type="number" id="discount" value="0" min="0" step="100" />
              </div>
            </div>
            <div class="cart-summary-row">
              <span>VAT (%):</span>
              <div class="discount-input">
                <input type="number" id="vat-percent" value="${num(businessInfo.vat_percent)}" min="0" max="100" step="0.1" />
              </div>
            </div>
            <div class="cart-summary-row" id="vat-row" style="display: none;">
              <span>VAT Amount:</span>
              <span id="vat-amount" style="color: #64748b;">TSh 0.00</span>
            </div>
            <div class="cart-summary-row total">
              <span><strong>Jumla Kuu:</strong></span>
              <span id="total"><strong>TSh 0.00</strong></span>
            </div>
          </div>

          <div class="cart-payment">
            <div class="form-group">
              <label>Njia ya Malipo</label>
              <select id="payment-method">
                <option value="cash">Cash (Pesa Taslimu)</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank">Benki / Transfer</option>
                <option value="card">Kadi (Card)</option>
                <option value="credit">Mkopo (Credit)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Kiasi Kilicholipwa (TSh)</label>
              <div style="display: flex; gap: 8px;">
                <input type="number" id="amount-paid" value="0" min="0" step="100" style="flex: 1;" />
                <button type="button" id="pay-full" class="btn btn-sm btn-secondary">Lipa Jumla</button>
              </div>
            </div>
            <div class="cart-summary-row">
              <span id="balance-label">Baki (Change):</span>
              <span id="balance" style="color: #16a34a; font-weight: 700;">TSh 0.00</span>
            </div>
          </div>

          <div class="cart-actions">
            <button id="complete-sale" class="btn btn-primary btn-block btn-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Kamilisha Mauzo
            </button>
          </div>

          <div id="sale-message" class="form-message" style="display: none;"></div>
        </div>
      </div>
    </div>

    <!-- MODAL YA RISITI -->
    <div id="receipt-modal" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); z-index: 9999; justify-content: center; align-items: center; backdrop-filter: blur(4px);">
      <div style="background: white; max-width: 400px; width: 95%; max-height: 90vh; overflow-y: auto; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
        <div id="receipt-content" style="padding: 24px;"></div>
        
        <div style="display: flex; gap: 12px; padding: 0 24px 24px 24px;">
          <button onclick="printReceipt()" class="btn btn-primary" style="flex: 1; display: flex; align-items: center; justify-content: center; font-weight: 600;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print
          </button>
          <button onclick="shareWhatsApp()" class="btn" style="flex: 1; background: #25D366; color: white; border: none; display: flex; align-items: center; justify-content: center; font-weight: 600;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            WhatsApp
          </button>
          <button onclick="closeReceipt()" class="btn btn-secondary" style="flex: 1; font-weight: 600;">Funga</button>
        </div>
      </div>
    </div>
  `;

  await loadProducts();
  setupEventListeners();
}

async function loadProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or('stock_quantity.gt.0,is_service.eq.true')
    .order('is_service', { ascending: true })
    .order('name');

  if (error) {
    console.error('Error loading products:', error);
    return;
  }

  products = data || [];
  renderProductsGrid(products);
}

function renderProductsGrid(productsToRender) {
  const grid = byId('pos-products-grid');
  
  if (productsToRender.length === 0) {
    grid.innerHTML = '<div class="empty-state">Hakuna bidhaa wala huduma zilizopatikana</div>';
    return;
  }

  const services = productsToRender.filter(p => p.is_service === true);
  const bidhaa = productsToRender.filter(p => !p.is_service);

  let html = '';

  if (services.length > 0) {
    html += `<h4 style="grid-column: 1/-1; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; color: #059669; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> Huduma</h4>`;
    html += services.map(p => `
      <div class="pos-product" data-id="${esc(p.id)}" style="border-left: 4px solid #10b981; background: #f0fdf4;">
        <strong>${esc(p.name)}</strong>
        <span>${window.money(p.selling_price)}</span>
        <small style="color: #059669; font-weight: 600;">Huduma</small>
      </div>
    `).join('');
  }

  if (bidhaa.length > 0) {
    html += `<h4 style="grid-column: 1/-1; margin: ${services.length > 0 ? '24px' : '0'} 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; color: #2563eb; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg> Bidhaa</h4>`;
    html += bidhaa.map(p => `
      <div class="pos-product" data-id="${esc(p.id)}">
        <strong>${esc(p.name)}</strong>
        <span>${window.money(p.selling_price)}</span>
        <small>Stock: ${num(p.stock_quantity)}</small>
      </div>
    `).join('');
  }

  grid.innerHTML = html;

  grid.querySelectorAll('.pos-product').forEach(card => {
    card.addEventListener('click', () => {
      addToCart(card.dataset.id);
    });
  });
}

function setupEventListeners() {
  byId('pos-search').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(search) || 
      (p.sku && p.sku.toLowerCase().includes(search))
    );
    renderProductsGrid(filtered);
  });

  byId('clear-cart').addEventListener('click', () => {
    if (cart.length > 0 && confirm('Je, una uhakika unataka kufuta kikapu chote?')) {
      cart = [];
      renderCart();
    }
  });

  byId('discount').addEventListener('input', updateTotals);
  byId('vat-percent').addEventListener('input', updateTotals);
  byId('amount-paid').addEventListener('input', updateTotals);
  byId('pay-full').addEventListener('click', () => {
    byId('amount-paid').value = readTotals().total;
    updateTotals();
  });
  byId('complete-sale').addEventListener('click', completeSale);
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);
  
  if (product.is_service === true) {
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: num(product.selling_price),
        cost: num(product.cost_price),
        quantity: 1,
        stock: 999999,
        is_service: true
      });
    }
  } else {
    if (existingItem) {
      if (existingItem.quantity < product.stock_quantity) {
        existingItem.quantity += 1;
      } else {
        alert(`Stock ya "${product.name}" haitoshi!`);
        return;
      }
    } else {
      if (product.stock_quantity > 0) {
        cart.push({
          id: product.id,
          name: product.name,
          price: num(product.selling_price),
          cost: num(product.cost_price),
          quantity: 1,
          stock: num(product.stock_quantity)
        });
      } else {
        alert(`Stock ya "${product.name}" imeisha!`);
        return;
      }
    }
  }
  renderCart();
}

function renderCart() {
  const cartItems = byId('cart-items');
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="empty-state">Bado hujachagua chochote.</div>';
    updateTotals();
    return;
  }

  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <div class="cart-item-name">
        <strong>${esc(item.name)}</strong>
        <small>${window.money(item.price)} × ${item.quantity}</small>
      </div>
      <div class="quantity-controls">
        <button onclick="updateQuantity(${index}, -1)">−</button>
        <span>${item.quantity}</span>
        <button onclick="updateQuantity(${index}, 1)">+</button>
      </div>
      <div class="cart-item-price">${window.money(item.price * item.quantity)}</div>
    </div>
  `).join('');

  updateTotals();
}

window.updateQuantity = (index, change) => {
  const item = cart[index];
  const newQty = item.quantity + change;
  
  if (newQty <= 0) {
    cart.splice(index, 1);
  } else if (item.is_service === true || newQty <= item.stock) {
    item.quantity = newQty;
  } else {
    alert(`Stock ya "${item.name}" haitoshi!`);
    return;
  }
  renderCart();
};

// Mahesabu yote ya mauzo mahali pamoja (yanatumika kwenye skrini na wakati wa kuhifadhi)
function readTotals() {
  const subtotal = round2(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0));
  const discount = Math.min(Math.max(0, parseFloat(byId('discount').value) || 0), subtotal);
  const vatPercent = Math.min(Math.max(0, parseFloat(byId('vat-percent').value) || 0), 100);
  const afterDiscount = Math.max(0, subtotal - discount);
  const vatAmount = round2(afterDiscount * (vatPercent / 100));
  const total = round2(afterDiscount + vatAmount);
  const amountPaid = Math.max(0, parseFloat(byId('amount-paid').value) || 0);
  return { subtotal, discount, vatPercent, afterDiscount, vatAmount, total, amountPaid };
}

function updateTotals() {
  const t = readTotals();

  byId('subtotal').textContent = window.money(t.subtotal);

  const vatRow = byId('vat-row');
  if (t.vatPercent > 0) {
    vatRow.style.display = 'flex';
    byId('vat-amount').textContent = window.money(t.vatAmount);
  } else {
    vatRow.style.display = 'none';
  }

  byId('total').innerHTML = `<strong>${window.money(t.total)}</strong>`;

  const label = byId('balance-label');
  const value = byId('balance');
  if (t.amountPaid >= t.total) {
    label.textContent = 'Baki (Change):';
    value.textContent = window.money(t.amountPaid - t.total);
    value.style.color = '#16a34a';
  } else {
    label.textContent = 'Deni (Haijalipwa):';
    value.textContent = window.money(t.total - t.amountPaid);
    value.style.color = '#dc2626';
  }
}

async function completeSale() {
  if (cart.length === 0) {
    alert('Kikapu ni tupu! Chagua bidhaa au huduma kwanza.');
    return;
  }

  const message = byId('sale-message');
  const button = byId('complete-sale');
  const t = readTotals();
  const paymentMethod = byId('payment-method').value;
  const isCredit = paymentMethod === 'credit';

  // Kilicholipwa ni pungufu: thibitisha kabla ya kuhifadhi
  if (!isCredit && t.amountPaid < t.total) {
    const owed = round2(t.total - t.amountPaid);
    if (!confirm(`Kiasi kilicholipwa kimepungua kwa ${window.money(owed)}. Kitarekodiwa kama deni. Endelea?`)) return;
  }

  button.disabled = true;
  button.textContent = 'Inachakata...';
  message.style.display = 'none';

  try {
    const items = cart.map(item => ({
      product_id: item.id,
      quantity: item.quantity
    }));

    const { data, error } = await supabase.rpc('complete_sale', {
      p_items: items,
      p_payment_method: paymentMethod,
      p_amount_paid: t.amountPaid,
      p_discount: t.discount
    });

    if (error) throw error;

    // Hifadhi VAT (na hali ya malipo sahihi kama VAT imeongeza jumla).
    // Mauzo yameshahifadhiwa, kwa hiyo hitilafu hapa isizuie risiti kuonekana.
    if (t.vatPercent > 0 && (data?.sale_id || data?.receipt_number)) {
      try {
        const patch = { vat_percent: t.vatPercent, vat_amount: t.vatAmount };
        if (!isCredit && t.amountPaid < t.total) {
          patch.payment_status = t.amountPaid > 0 ? 'partial' : 'unpaid';
        }
        let query = supabase.from('sales').update(patch);
        query = data.sale_id ? query.eq('id', data.sale_id) : query.eq('receipt_number', data.receipt_number);
        const { error: patchError } = await query;
        if (patchError) console.warn('VAT haikuhifadhiwa:', patchError.message);
      } catch (patchErr) {
        console.warn('VAT haikuhifadhiwa:', patchErr);
      }
    }

    lastReceipt = {
      receiptNumber: data?.receipt_number || 'N/A',
      items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
      subtotal: t.subtotal,
      discount: t.discount,
      vatPercent: t.vatPercent,
      vatAmount: t.vatAmount,
      total: t.total,
      amountPaid: t.amountPaid,
      paymentMethod
    };
    showReceipt(lastReceipt);

    cart = [];
    byId('discount').value = 0;
    byId('amount-paid').value = 0;
    renderCart();
    await loadProducts();

  } catch (error) {
    console.error('Sale error:', error);
    message.textContent = error.message || 'Imeshindikana kukamilisha mauzo.';
    message.className = 'form-message error';
    message.style.display = 'block';
  } finally {
    button.disabled = false;
    button.textContent = 'Kamilisha Mauzo';
  }
}

// =================================================================
// RISITI YA KISASA NA QR CODE
// =================================================================
const paymentLabels = {
  cash: 'Cash',
  mobile_money: 'Mobile Money',
  bank: 'Benki',
  card: 'Kadi',
  credit: 'Mkopo'
};

window.showReceipt = (r) => {
  const modal = byId('receipt-modal');
  const content = byId('receipt-content');
  
  const shopName = esc(businessInfo.business_name || 'StationeryPro');
  const shopPhone = esc(businessInfo.business_phone || '');
  const shopAddress = esc(businessInfo.business_address || '');
  const receiptNumber = esc(r.receiptNumber);
  const date = new Date().toLocaleString('sw-TZ', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const change = r.amountPaid - r.total;
  const owed = r.total - r.amountPaid;
  const methodText = paymentLabels[r.paymentMethod] || r.paymentMethod;

  // QR Code data - inajumuisha taarifa za risiti
  const qrData = `RISITI: ${r.receiptNumber}\nDUKA: ${businessInfo.business_name || 'StationeryPro'}\nTAREHE: ${date}\nJUMLA: ${window.money(r.total)}\nMALIPO: ${methodText}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}`;

  content.innerHTML = `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; max-width: 380px; margin: 0 auto;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a;">${shopName}</h2>
        ${shopAddress ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: #64748b;">${shopAddress}</p>` : ''}
        ${shopPhone ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">Tel: ${shopPhone}</p>` : ''}
        <div style="margin-top: 12px; display: inline-block; background: #f1f5f9; padding: 6px 14px; border-radius: 20px;">
          <span style="font-size: 12px; font-weight: 700; color: #334155; letter-spacing: 0.5px;">RISITI # ${receiptNumber}</span>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">${date}</p>
      </div>

      <div style="border-top: 2px dashed #e2e8f0; margin: 16px 0;"></div>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tbody>
          ${r.items.map(item => `
            <tr style="border-bottom: 1px solid #f8fafc;">
              <td style="padding: 10px 0;">
                <div style="font-weight: 600; color: #0f172a;">${esc(item.name)}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${item.quantity} × ${window.money(item.price)}</div>
              </td>
              <td style="text-align: right; padding: 10px 0; font-weight: 700; color: #0f172a; font-size: 14px;">
                ${window.money(item.price * item.quantity)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="border-top: 2px dashed #e2e8f0; margin: 16px 0;"></div>

      <!-- Totals -->
      <div style="font-size: 14px; color: #475569;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>Jumla Ndogo:</span>
          <span style="font-weight: 500; color: #0f172a;">${window.money(r.subtotal)}</span>
        </div>
        ${r.discount > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #ef4444;">
          <span>Discount:</span>
          <span style="font-weight: 500;">-${window.money(r.discount)}</span>
        </div>
        ` : ''}
        ${r.vatPercent > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #64748b;">
          <span>VAT (${r.vatPercent}%):</span>
          <span style="font-weight: 500;">+${window.money(r.vatAmount)}</span>
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 20px; font-weight: 800; color: #0f172a;">
          <span>JUMLA KUU:</span>
          <span>${window.money(r.total)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 13px;">
          <span>Malipo (${esc(methodText)}):</span>
          <span style="font-weight: 600; color: #0f172a;">${window.money(r.amountPaid)}</span>
        </div>
        ${change > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-top: 10px; padding: 10px 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; color: #166534; font-weight: 700; font-size: 15px;">
          <span>Baki (Change):</span>
          <span>${window.money(change)}</span>
        </div>
        ` : ''}
        ${owed > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-top: 10px; padding: 10px 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #b91c1c; font-weight: 700; font-size: 15px;">
          <span>Deni (Haijalipwa):</span>
          <span>${window.money(owed)}</span>
        </div>
        ` : ''}
      </div>

      <!-- QR Code -->
      <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
        <img src="${qrUrl}" alt="QR Code" style="width: 100px; height: 100px; border-radius: 8px; border: 1px solid #e2e8f0;" />
        <p style="margin: 8px 0 0 0; font-size: 10px; color: #94a3b8;">Scan QR code kwa taarifa za risiti</p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 16px;">
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0f172a;">Wewe ni wa thamani kwetu karibu tena!</p>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">${esc(businessInfo.receipt_footer || 'Powered by StationeryPro Mozz Elly')}</p>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
};

window.printReceipt = () => {
  const receiptContent = byId('receipt-content').innerHTML;
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <html>
      <head>
        <title>Risiti</title>
        <style>
          body { font-family: 'Inter', system-ui, sans-serif; padding: 20px; max-width: 380px; margin: 0 auto; color: #0f172a; }
          table { width: 100%; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${receiptContent}</body>
    </html>
  `);
  doc.close();
  iframe.contentWindow.focus();
  // Subiri picha ya QR ipakie kabla ya kuchapisha
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1500);
  }, 600);
};

window.shareWhatsApp = () => {
  if (!lastReceipt) return;
  const r = lastReceipt;
  const shopName = businessInfo.business_name || 'StationeryPro';
  const date = new Date().toLocaleString('sw-TZ');

  let message = `*${shopName}*\n`;
  message += `RISITI # ${r.receiptNumber}\n`;
  message += `${date}\n\n`;
  message += `*VILIVYONUNULIWA:*\n`;

  r.items.forEach(item => {
    message += `▪️ ${item.name}\n   ${item.quantity} x ${window.money(item.price)} = *${window.money(item.price * item.quantity)}*\n`;
  });

  if (r.discount > 0) message += `\nDiscount: -${window.money(r.discount)}`;
  if (r.vatPercent > 0) message += `\nVAT (${r.vatPercent}%): ${window.money(r.vatAmount)}`;
  message += `\n*JUMLA KUU: ${window.money(r.total)}*`;
  message += `\nMalipo (${paymentLabels[r.paymentMethod] || r.paymentMethod}): ${window.money(r.amountPaid)}`;
  if (r.total - r.amountPaid > 0) message += `\n*Deni: ${window.money(r.total - r.amountPaid)}*`;
  message += `\n\nAsante kwa kununua kwako!`;

  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
};

window.closeReceipt = () => {
  byId('receipt-modal').style.display = 'none';
};s