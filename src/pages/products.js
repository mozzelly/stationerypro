import { supabase } from "../lib/supabase.js";

export async function renderProducts(root, user, profile) {
  const canManage = ["owner", "developer"].includes(profile.role);

  root.innerHTML = `
    <div class="page-actions">
      <input id="product-search" placeholder="Tafuta jina, SKU au barcode...">
      ${canManage ? `<button id="show-product-form" class="btn btn-primary">+ Ongeza bidhaa</button>` : ""}
    </div>

    <section id="product-form-wrap"></section>

    <section class="panel">
      <div class="panel-heading">
        <h3>Orodha ya bidhaa</h3>
        <button id="reload-products" class="btn btn-secondary">Refresh</button>
      </div>
      <div id="products-table"><p class="muted">Inapakia bidhaa...</p></div>
    </section>
  `;

  const table = root.querySelector("#products-table");
  const search = root.querySelector("#product-search");
  let products = [];

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("name");

    if (error) throw error;

    products = data || [];
    drawTable(search.value);
  }

  function drawTable(query = "") {
    const q = query.toLowerCase();
    const filtered = products.filter(p =>
      [p.name, p.sku, p.barcode, p.category]
        .some(v => String(v || "").toLowerCase().includes(q))
    );

    table.innerHTML = filtered.length ? `
      <div class="table-wrap"><table>
        <thead><tr>
          <th>Bidhaa</th><th>SKU / Barcode</th><th>Category</th>
          <th>Gharama</th><th>Bei ya kuuza</th><th>Stock</th>
        </tr></thead>
        <tbody>${filtered.map(p => `
          <tr>
            <td><strong>${window.escapeHTML(p.name)}</strong></td>
            <td>${window.escapeHTML(p.sku || p.barcode || "—")}</td>
            <td>${window.escapeHTML(p.category || "General")}</td>
            <td>${window.money(p.cost_price)}</td>
            <td>${window.money(p.selling_price)}</td>
            <td>${p.stock_quantity <= p.reorder_level
              ? `<span class="stock-warning">${p.stock_quantity}</span>`
              : p.stock_quantity}</td>
          </tr>`).join("")}
        </tbody>
      </table></div>` : `<p class="empty-state">Hakuna bidhaa zilizopatikana.</p>`;
  }

  function showForm() {
    root.querySelector("#product-form-wrap").innerHTML = `
      <form id="product-form" class="panel form-grid">
        <div class="panel-heading span-all"><h3>Ongeza bidhaa mpya</h3></div>

        <div class="field"><label>Jina la bidhaa *</label>
          <input name="name" required maxlength="150"></div>
        <div class="field"><label>SKU</label>
          <input name="sku" maxlength="80"></div>
        <div class="field"><label>Barcode</label>
          <input name="barcode" maxlength="100"></div>
        <div class="field"><label>Category</label>
          <input name="category" value="General"></div>
        <div class="field"><label>Bei ya kununua (TSh) *</label>
          <input name="cost_price" type="number" min="0" step="0.01" value="0" required></div>
        <div class="field"><label>Bei ya kuuza (TSh) *</label>
          <input name="selling_price" type="number" min="0" step="0.01" value="0" required></div>
        <div class="field"><label>Stock ya mwanzo *</label>
          <input name="stock_quantity" type="number" min="0" step="1" value="0" required></div>
        <div class="field"><label>Stock ya tahadhari</label>
          <input name="reorder_level" type="number" min="0" step="1" value="5" required></div>
        <div class="field"><label>Supplier</label>
          <input name="supplier"></div>

        <div class="span-all form-buttons">
          <button class="btn btn-primary" type="submit">Hifadhi bidhaa</button>
          <button class="btn btn-secondary" id="cancel-product" type="button">Ghairi</button>
        </div>
        <p class="form-message span-all" id="product-message"></p>
      </form>
    `;

    const form = root.querySelector("#product-form");

    root.querySelector("#cancel-product").addEventListener("click", () => {
      root.querySelector("#product-form-wrap").innerHTML = "";
    });

    form.addEventListener("submit", async event => {
      event.preventDefault();

      const button = form.querySelector('[type="submit"]');
      const message = form.querySelector("#product-message");
      button.disabled = true;
      message.textContent = "Inahifadhi...";

      const fd = new FormData(form);
      const payload = {
        name: String(fd.get("name")).trim(),
        sku: String(fd.get("sku") || "").trim() || null,
        barcode: String(fd.get("barcode") || "").trim() || null,
        category: String(fd.get("category") || "General").trim(),
        cost_price: Number(fd.get("cost_price")),
        selling_price: Number(fd.get("selling_price")),
        stock_quantity: Number(fd.get("stock_quantity")),
        reorder_level: Number(fd.get("reorder_level")),
        supplier: String(fd.get("supplier") || "").trim() || null,
        created_by: user.id
      };

      try {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;

        if (payload.stock_quantity > 0) {
          // Stock ya mwanzo itaonekana kwenye bidhaa.
          // Historia ya stock opening itaongezwa kupitia stock RPC katika hatua ya backend.
        }

        message.className = "form-message success";
        message.textContent = "Bidhaa imehifadhiwa.";
        form.reset();
        await loadProducts();
      } catch (error) {
        message.className = "form-message error";
        message.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    });
  }

  root.querySelector("#reload-products").addEventListener("click", () => {
    loadProducts().catch(e => alert(e.message));
  });

  search.addEventListener("input", () => drawTable(search.value));

  if (canManage) {
    root.querySelector("#show-product-form").addEventListener("click", showForm);
  }

  await loadProducts();
}