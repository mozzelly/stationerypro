import { supabase } from '../lib/supabase.js';

let cart = [];
let products = [];
let businessInfo = {}; 

export async function renderPOS(root, user, profile) {
  cart = [];
  
  const { data: bs } = await supabase
    .from('business_settings')
    .select('*')
    .eq('owner_id', user.id)
    .single();
  businessInfo = bs || {};
  
  root.innerHTML = `
    <div class="pos-layout">
      <div class="pos-products-section">
        <div class="pos-header">
          <h3>Chagua bidhaa</h3>
          <div class="pos-search">
            <input type="text" id="pos-search" placeholder="Tafuta bidhaa au scan barcode..." />
          </div>
        </div>
        <div id="pos-products-grid" class="pos-products">
          <div class="empty-state">Inapakia bidhaa...</div>
        </div>
      </div>

      <div class="cart-section">
        <div class="cart-panel">
          <div class="cart-header">
            <h3>Bidhaa za mteja</h3>
            <button id="clear-cart" class="btn btn-sm btn-danger">Futa zote</button>
          </div>
          
          <div id="cart-items" class="cart-items">
            <div class="empty-state">Bado hujachagua bidhaa.</div>
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
            <div class="cart-summary-row total">
              <span><strong>Jumla:</strong></span>
              <span id="total"><strong>TSh 0.00</strong></span>
            </div>
          </div>

          <div class="cart-payment">
            <div class="form-group">
              <label>Njia ya malipo</label>
              <select id="payment-method">
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank">Bank</option>
                <option value="card">Card</option>
                <option value="credit">Mkopo</option>
              </select>
            </div>
            <div class="form-group">
              <label>Kiasi kilichopokelewa (TSh)</label>
              <input type="number" id="amount-paid" value="0" min="0" step="100" />
            </div>
            <div class="cart-summary-row">
              <span>Baki:</span>
              <span id="balance" style="color: var(--danger); font-weight: 700;">TSh 0.00</span>
            </div>
          </div>

          <div class="cart-actions">
            <button id="complete-sale" class="btn btn-primary btn-block btn-lg">
              Kamilisha mauzo
            </button>
          </div>

          <div id="sale-message" class="form-message" style="display: none;"></div>
        </div>
      </div>
    </div>

    <!-- Modal ya Risiti ya Digital -->
    <div id="receipt-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 9999; justify-content: center; align-items: center; backdrop-filter: blur(4px);">
      <div style="background: white; max-width: 420px; width: 95%; max-height: 90vh; overflow-y: auto; border-radius: 16px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
        <div id="receipt-content"></div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button onclick="printReceipt()" class="btn btn-primary" style="flex: 1; display: flex; align-items: center; justify-content: center; font-weight: 600;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print
          </button>
          <button onclick="shareWhatsApp()" class="btn" style="flex: 1; background: #25D366; color: white; border: none; display: flex; align-items: center; justify-content: center; font-weight: 600;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            WhatsApp
          </button>
          <button onclick="closeReceipt()" class="btn btn-danger" style="flex: 1; font-weight: 600;">Funga</button>
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
    .gt('stock_quantity', 0)
    .order('name');

  if (error) {
    console.error('Error loading products:', error);
    return;
  }

  products = data || [];
  renderProductsGrid(products);
}

function renderProductsGrid(productsToRender) {
  const grid = document.getElementById('pos-products-grid');
  
  if (productsToRender.length === 0) {
    grid.innerHTML = '<div class="empty-state">Hakuna bidhaa zilizopatikana</div>';
    return;
  }

  const uniqueProducts = [];
  const seen = new Set();
  productsToRender.forEach(p => {
    const key = p.sku || p.name;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueProducts.push(p);
    }
  });

  grid.innerHTML = uniqueProducts.map(p => `
    <div class="pos-product" data-id="${p.id}">
      <strong>${p.name}</strong>
      <span>${window.money(p.selling_price)}</span>
      <small>Stock: ${p.stock_quantity}</small>
    </div>
  `).join('');

  grid.querySelectorAll('.pos-product').forEach(card => {
    card.addEventListener('click', () => {
      const productId = card.dataset.id;
      addToCart(productId);
    });
  });
}

function setupEventListeners() {
  document.getElementById('pos-search').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(search) || 
      (p.sku && p.sku.toLowerCase().includes(search))
    );
    renderProductsGrid(filtered);
  });

  document.getElementById('clear-cart').addEventListener('click', () => {
    if (confirm('Je, una uhakika unataka kufuta bidhaa zote kwenye cart?')) {
      cart = [];
      renderCart();
    }
  });

  document.getElementById('discount').addEventListener('input', () => {
    updateTotals();
  });

  document.getElementById('amount-paid').addEventListener('input', () => {
    updateTotals();
  });

  document.getElementById('complete-sale').addEventListener('click', completeSale);
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    if (existingItem.quantity < product.stock_quantity) {
      existingItem.quantity += 1;
    } else {
      alert(`Stock ya "${product.name}" haitoshi!`);
      return;
    }
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      cost: product.cost_price,
      quantity: 1,
      stock: product.stock_quantity
    });
  }

  renderCart();
}

function renderCart() {
  const cartItems = document.getElementById('cart-items');
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="empty-state">Bado hujachagua bidhaa.</div>';
    updateTotals();
    return;
  }

  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <div class="cart-item-name">
        <strong>${item.name}</strong>
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
  } else if (newQty <= item.stock) {
    item.quantity = newQty;
  } else {
    alert(`Stock ya "${item.name}" haitoshi!`);
    return;
  }
  
  renderCart();
};

function updateTotals() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = parseFloat(document.getElementById('discount').value) || 0;
  const total = Math.max(0, subtotal - discount);
  const amountPaid = parseFloat(document.getElementById('amount-paid').value) || 0;
  const balance = Math.max(0, total - amountPaid);

  document.getElementById('subtotal').textContent = window.money(subtotal);
  document.getElementById('total').innerHTML = `<strong>${window.money(total)}</strong>`;
  document.getElementById('balance').textContent = window.money(balance);
}

async function completeSale() {
  if (cart.length === 0) {
    alert('Cart ni tupu! Chagua bidhaa kwanza.');
    return;
  }

  const message = document.getElementById('sale-message');
  const button = document.getElementById('complete-sale');
  
  button.disabled = true;
  button.textContent = 'Inachakata...';

  try {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const total = Math.max(0, subtotal - discount);
    const amountPaid = parseFloat(document.getElementById('amount-paid').value) || 0;
    const paymentMethod = document.getElementById('payment-method').value;

    const items = cart.map(item => ({
      product_id: item.id,
      quantity: item.quantity
    }));

    const { data, error } = await supabase.rpc('complete_sale', {
      p_items: items,
      p_payment_method: paymentMethod,
      p_amount_paid: amountPaid,
      p_discount: discount
    });

    if (error) throw error;

    showReceipt(data, cart, total, amountPaid, discount, paymentMethod);

    cart = [];
    document.getElementById('discount').value = 0;
    document.getElementById('amount-paid').value = 0;
    renderCart();
    await loadProducts();

  } catch (error) {
    console.error('Sale error:', error);
    message.textContent = error.message || 'Imeshindikana kukamilisha mauzo.';
    message.className = 'form-message error';
    message.style.display = 'block';
  } finally {
    button.disabled = false;
    button.textContent = 'Kamilisha mauzo';
  }
}

// =================================================================
// Functions za Risiti ya Digital (Imeboreshwa kuwa "Kali" na Icons)
// =================================================================

window.showReceipt = (data, cartItems, total, amountPaid, discount, paymentMethod) => {
  const modal = document.getElementById('receipt-modal');
  const content = document.getElementById('receipt-content');
  
  const shopName = businessInfo.business_name || 'StationeryPro';
  const shopPhone = businessInfo.business_phone || '';
  const shopAddress = businessInfo.business_address || '';
  const receiptNumber = data.receipt_number || 'N/A';
  const date = new Date().toLocaleString('sw-TZ');
  const change = amountPaid - total;
  
  const paymentLabels = {
    cash: 'Cash',
    mobile_money: 'Mobile Money',
    bank: 'Bank',
    card: 'Card',
    credit: 'Mkopo'
  };

  content.innerHTML = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a;">
      <div style="text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 16px;">
        <h2 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${shopName}</h2>
        ${shopAddress ? `<p style="margin: 6px 0 0 0; color: #475569; font-size: 14px;">${shopAddress}</p>` : ''}
        ${shopPhone ? `<p style="margin: 4px 0 0 0; color: #475569; font-size: 14px;">Tel: ${shopPhone}</p>` : ''}
        <p style="margin: 12px 0 0 0; font-size: 13px; color: #64748b;">${date}</p>
        <p style="margin: 8px 0 0 0; font-weight: 700; color: #0f172a; font-size: 14px; background: #f1f5f9; display: inline-block; padding: 4px 12px; border-radius: 6px;">Risiti #: ${receiptNumber}</p>
      </div>

      <div style="border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 16px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0;">
              <th style="text-align: left; padding: 8px 4px; color: #475569; font-weight: 600;">Bidhaa</th>
              <th style="text-align: center; padding: 8px 4px; color: #475569; font-weight: 600;">Qty</th>
              <th style="text-align: right; padding: 8px 4px; color: #475569; font-weight: 600;">Bei</th>
              <th style="text-align: right; padding: 8px 4px; color: #475569; font-weight: 600;">Jumla</th>
            </tr>
          </thead>
          <tbody>
            ${cartItems.map(item => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 4px; color: #0f172a; font-weight: 500;">${item.name}</td>
                <td style="text-align: center; padding: 10px 4px; color: #475569;">${item.quantity}</td>
                <td style="text-align: right; padding: 10px 4px; color: #475569;">${window.money(item.price)}</td>
                <td style="text-align: right; padding: 10px 4px; color: #0f172a; font-weight: 700;">${window.money(item.price * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 16px; font-size: 15px;">
        <div style="display: flex; justify-content: space-between; margin: 8px 0; color: #475569;">
          <span>Jumla Ndogo:</span>
          <span>${window.money(total + discount)}</span>
        </div>
        ${discount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin: 8px 0; color: #ef4444;">
            <span>Discount:</span>
            <span>-${window.money(discount)}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; margin: 16px 0; font-size: 20px; font-weight: 800; color: #0f172a; border-top: 2px solid #e2e8f0; padding-top: 12px;">
          <span>JUMLA KUU:</span>
          <span>${window.money(total)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 8px 0; color: #475569;">
          <span>Malipo (${paymentLabels[paymentMethod] || paymentMethod}):</span>
          <span>${window.money(amountPaid)}</span>
        </div>
        ${change > 0 ? `
          <div style="display: flex; justify-content: space-between; margin: 8px 0; color: #16a34a; font-weight: 700; background: #f0fdf4; padding: 8px 12px; border-radius: 6px; border: 1px solid #bbf7d0;">
            <span>Baki / Change:</span>
            <span>${window.money(change)}</span>
          </div>
        ` : ''}
      </div>

      <div style="text-align: center; color: #64748b; font-size: 13px; margin-top: 20px;">
        <p style="margin: 0; font-weight: 600; color: #0f172a;">Asante kwa kununua kwako!</p>
        <p style="margin: 6px 0 0 0;">${businessInfo.receipt_footer || 'Powered by StationeryPro Mozz Elly'}</p>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
};

window.printReceipt = () => {
  const receiptContent = document.getElementById('receipt-content').innerHTML;
  const printWindow = window.open('', '', 'width=400,height=600');
  printWindow.document.write(`
    <html>
      <head>
        <title>Risiti</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; color: #0f172a; }
          table { width: 100%; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${receiptContent}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};

window.shareWhatsApp = () => {
  const shopName = businessInfo.business_name || 'StationeryPro';
  const receiptNumber = document.querySelector('#receipt-content p[style*="font-weight: 700"]')?.textContent || '';
  const date = new Date().toLocaleString('sw-TZ');
  const totalText = document.querySelector('#receipt-content div[style*="font-size: 20px"] span:last-child')?.textContent || '0';
  
  let message = `*${shopName}*\n`;
  message += `${receiptNumber}\n`;
  message += `${date}\n\n`;
  message += `*Bidhaa Zilizouzwa:*\n`;
  
  cart.forEach(item => {
    message += `▫️ ${item.name} x${item.quantity} = ${window.money(item.price * item.quantity)}\n`;
  });
  
  message += `\n*JUMLA KUU: ${totalText}*\n`;
  message += `\nAsante kwa kununua kwako!`;
  
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};

window.closeReceipt = () => {
  document.getElementById('receipt-modal').style.display = 'none';
};