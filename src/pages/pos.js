import { supabase } from "../lib/supabase.js";

export async function renderPOS(root, user, profile) {
  const cart = new Map();

  root.innerHTML = `
    <div class="pos-layout">
      <section class="panel">
        <div class="panel-heading"><h3>Chagua bidhaa</h3></div>
        <input id="pos-search" placeholder="Tafuta bidhaa au scan barcode...">
        <div id="pos-products" class="pos-products"></div>
      </section>

      <section class="panel cart-panel">
        <div class="panel-heading"><h3>Bidhaa za mteja</h3>
          <button id="clear-cart" class="btn btn-ghost">Futa zote</button></div>
        <div id="pos-cart"></div>

        <div class="cart-summary">
          <label>Discount (TSh)
            <input id="pos-discount" type="number" min="0" step="0.01" value="0">
          </label>
          <label>Njia ya malipo
            <select id="payment-method">
              <option value="cash">Cash</option>
              <option value="mobile_money">Mobile money</option>
              <option value="bank">Bank</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>Kiasi kilichopokelewa (TSh)
            <input id="amount-tendered" type="number" min="0" step="0.01" value="0">
          </label>
          <div class="total-line"><span>Jumla</span><strong id="pos-total">TSh 0</strong></div>
          <button id="complete-sale" class="btn btn-primary full-width">Kamilisha mauzo</button>
          <p id="pos-message" class="form-message"></p>
        </div>
      </section>
    </div>
    <div id="receipt-area"></div>
  `;

  const search = root.querySelector("#pos-search");
  const productsContainer = root.querySelector("#pos-products");
  const cartContainer = root.querySelector("#pos-cart");
  const discountInput = root.querySelector("#pos-discount");
  const methodInput = root.querySelector("#payment-method");
  const tenderedInput = root.querySelector("#amount-tendered");
  const message = root.querySelector("#pos-message");

  let products = [];

  const { data, error } = await supabase
    .from("products")
    .select("id,name,sku,barcode,selling_price,stock_quantity")
    .eq("active", true)
    .gt("stock_quantity", 0)
    .order("name");

  if (error) throw error;
  products = data || [];

  function drawProducts() {
    const q = search.value.toLowerCase();
    const filtered = products.filter(p =>
      [p.name, p.sku, p.barcode]
        .some(v => String(v || "").toLowerCase().includes(q))
    );

    productsContainer.innerHTML = filtered.map(p => `
      <button class="pos-product" data-id="${p.id}" type="button">
        <strong>${window.escapeHTML(p.name)}</strong>
        <span>${window.money(p.selling_price)}</span>
        <small>Stock: ${p.stock_quantity}</small>
      </button>
    `).join("") || `<p class="empty-state">Hakuna bidhaa iliyopatikana.</p>`;

    productsContainer.querySelectorAll("[data-id]").forEach(button => {
      button.addEventListener("click", () => addProduct(button.dataset.id));
    });
  }

  function addProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const current = cart.get(id);
    const nextQuantity = (current?.quantity || 0) + 1;

    if (nextQuantity > product.stock_quantity) {
      message.textContent = "Idadi imezidi stock iliyopo.";
      message.className = "form-message error";
      return;
    }

    cart.set(id, { product, quantity: nextQuantity });
    message.textContent = "";
    drawCart();
  }

  function drawCart() {
    const items = [...cart.values()];

    cartContainer.innerHTML = items.length ? items.map(item => `
      <div class="cart-item">
        <div class="cart-item-name">
          <strong>${window.escapeHTML(item.product.name)}</strong>
          <small>${window.money(item.product.selling_price)} kila moja</small>
        </div>
        <div class="quantity-controls">
          <button type="button" data-minus="${item.product.id}">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-plus="${item.product.id}">+</button>
        </div>
        <strong>${window.money(item.quantity * Number(item.product.selling_price))}</strong>
      </div>
    `).join("") : `<p class="empty-state">Bado hujachagua bidhaa.</p>`;

    cartContainer.querySelectorAll("[data-minus]").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.minus;
        const item = cart.get(id);
        if (!item) return;

        if (item.quantity <= 1) cart.delete(id);
        else item.quantity--;

        drawCart();
      });
    });

    cartContainer.querySelectorAll("[data-plus]").forEach(button => {
      button.addEventListener("click", () => addProduct(button.dataset.plus));
    });

    updateTotal();
  }

  function updateTotal() {
    const subtotal = [...cart.values()].reduce(
      (sum, item) => sum + Number(item.product.selling_price) * item.quantity, 0
    );

    const discount = Math.max(0, Number(discountInput.value || 0));
    const total = Math.max(0, subtotal - discount);

    root.querySelector("#pos-total").textContent = window.money(total);
    return { subtotal, discount, total };
  }

  search.addEventListener("input", drawProducts);
  discountInput.addEventListener("input", updateTotal);

  root.querySelector("#clear-cart").addEventListener("click", () => {
    cart.clear();
    drawCart();
  });

  methodInput.addEventListener("change", () => {
    tenderedInput.required = methodInput.value === "cash";
  });

  root.querySelector("#complete-sale").addEventListener("click", async event => {
    if (!cart.size) {
      message.textContent = "Chagua angalau bidhaa moja.";
      message.className = "form-message error";
      return;
    }

    const { discount, total } = updateTotal();
    const method = methodInput.value;
    const tendered = Number(tenderedInput.value || 0);

    if (method === "cash" && tendered < total) {
      message.textContent = "Kiasi kilichopokelewa hakitoshi.";
      message.className = "form-message error";
      return;
    }

    if (profile.role !== "owner" && discount > 0) {
      message.textContent = "Discount inahitaji ruhusa ya Owner.";
      message.className = "form-message error";
      return;
    }

    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = "Inakamilisha mauzo...";
    message.textContent = "";

    try {
      // UUID mpya kwa ombi hili la mauzo.
      const idempotencyKey = crypto.randomUUID();

      const items = [...cart.values()].map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }));

      const { data: sale, error } = await supabase.rpc("complete_sale", {
        p_idempotency_key: idempotencyKey,
        p_items: items,
        p_discount: discount,
        p_payment_method: method,
        p_amount_tendered: tendered,
        p_payment_reference: null
      });

      if (error) throw error;

      const { data: saleItems, error: itemError } = await supabase
        .from("sale_items")
        .select("*")
        .eq("sale_id", sale.sale_id);

      if (itemError) throw itemError;

      const { data: payment } = await supabase
        .from("payments")
        .select("*")
        .eq("sale_id", sale.sale_id)
        .maybeSingle();

      root.querySelector("#receipt-area").innerHTML = `
        <section class="receipt" id="receipt">
          <div class="receipt-center">
            <h2>StationeryPro</h2>
            <p>Powered by Mozz Elly</p>
            <p>RISITI YA MAUZO</p>
          </div>
          <hr>
          <p>Risiti: ${window.escapeHTML(sale.receipt_number)}</p>
          <p>Tarehe: ${new Date().toLocaleString()}</p>
          <p>Cashier: ${window.escapeHTML(profile.full_name || user.email)}</p>
          <hr>
          ${(saleItems || []).map(item => `
            <div class="receipt-row">
              <span>${window.escapeHTML(item.product_name)} × ${item.quantity}</span>
              <span>${window.money(item.line_total)}</span>
            </div>
          `).join("")}
          <hr>
          <div class="receipt-row"><span>Subtotal</span><span>${window.money(sale.subtotal)}</span></div>
          <div class="receipt-row"><span>Discount</span><span>${window.money(sale.discount)}</span></div>
          <div class="receipt-row receipt-total"><strong>JUMLA</strong><strong>${window.money(sale.total)}</strong></div>
          <p>Malipo: ${window.escapeHTML(payment?.method || method)}</p>
          <p>Imepokelewa: ${window.money(payment?.amount_tendered ?? sale.total)}</p>
          <p>Baki: ${window.money(sale.change_due || 0)}</p>
          <hr>
          <p class="receipt-center">Asante kwa kununua nasi!</p>
          <button class="btn btn-primary full-width no-print" id="print-receipt">Chapisha risiti</button>
        </section>
      `;

      root.querySelector("#print-receipt").addEventListener("click", () => window.print());

      cart.clear();
      drawCart();
      discountInput.value = "0";
      tenderedInput.value = "0";
      await reloadProducts();

      message.textContent = `Mauzo yamekamilika. Risiti: ${sale.receipt_number}`;
      message.className = "form-message success";
    } catch (error) {
      message.textContent = error.message || "Mauzo hayakukamilika.";
      message.className = "form-message error";
    } finally {
      button.disabled = false;
      button.textContent = "Kamilisha mauzo";
    }
  });

  async function reloadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id,name,sku,barcode,selling_price,stock_quantity")
      .eq("active", true)
      .gt("stock_quantity", 0)
      .order("name");

    if (error) throw error;
    products = data || [];
    drawProducts();
  }

  drawProducts();
  drawCart();
}