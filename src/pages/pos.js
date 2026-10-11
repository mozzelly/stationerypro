import { supabase } from '../lib/supabase.js';

let cart = [];
let products = [];

export async function renderPOS(root, user, profile) {
  cart = [];
  
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
  `;

  await loadProducts();
  setupEventListeners();
}

async function loadProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
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

  // Remove duplicates by SKU or name
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

  // Add click listeners
  grid.querySelectorAll('.pos-product').forEach(card => {
    card.addEventListener('click', () => {
      const productId = card.dataset.id;
      addToCart(productId);
    });
  });
}

function setupEventListeners() {
  // Search
  document.getElementById('pos-search').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(search) || 
      (p.sku && p.sku.toLowerCase().includes(search))
    );
    renderProductsGrid(filtered);
  });

  // Clear cart
  document.getElementById('clear-cart').addEventListener('click', () => {
    if (confirm('Je, una uhakika unataka kufuta bidhaa zote kwenye cart?')) {
      cart = [];
      renderCart();
    }
  });

  // Discount
  document.getElementById('discount').addEventListener('input', () => {
    updateTotals();
  });

  // Amount paid
  document.getElementById('amount-paid').addEventListener('input', () => {
    updateTotals();
  });

  // Complete sale
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

    message.textContent = `Mauzo yamekamilika! Risiti: ${data.receipt_number}`;
    message.className = 'form-message success';
    message.style.display = 'block';

    // Reset
    cart = [];
    document.getElementById('discount').value = 0;
    document.getElementById('amount-paid').value = 0;
    renderCart();
    await loadProducts();

    setTimeout(() => {
      message.style.display = 'none';
    }, 5000);

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