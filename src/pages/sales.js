import { supabase } from "../lib/supabase.js";

export async function renderSales(root, user, profile) {
  root.innerHTML = `
    <section class="panel">
      <div class="panel-heading">
        <h3>Historia ya mauzo</h3>
        <button id="refresh-sales" class="btn btn-secondary">Refresh</button>
      </div>
      <div class="filters">
        <label>Kuanzia <input id="sales-from" type="date"></label>
        <label>Mpaka <input id="sales-to" type="date"></label>
        <button id="filter-sales" class="btn btn-primary">Tafuta</button>
      </div>
      <div id="sales-table"><p class="muted">Inapakia...</p></div>
    </section>
    <section id="sale-details"></section>
  `;

  const table = root.querySelector("#sales-table");

  async function loadSales() {
    let query = supabase.from("sales")
      .select("id,receipt_number,cashier_id,subtotal,discount,total,status,created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (profile.role !== "owner") query = query.eq("cashier_id", user.id);

    const from = root.querySelector("#sales-from").value;
    const to = root.querySelector("#sales-to").value;

    if (from) query = query.gte("created_at", new Date(from + "T00:00:00").toISOString());
    if (to) query = query.lt("created_at", new Date(
      new Date(to + "T00:00:00").getTime() + 86400000
    ).toISOString());

    const { data, error } = await query;
    if (error) throw error;

    table.innerHTML = data?.length ? `
      <div class="table-wrap"><table>
        <thead><tr><th>Risiti</th><th>Tarehe</th><th>Subtotal</th>
        <th>Discount</th><th>Jumla</th><th>Status</th><th></th></tr></thead>
        <tbody>${data.map(sale => `
          <tr>
            <td>${window.escapeHTML(sale.receipt_number)}</td>
            <td>${new Date(sale.created_at).toLocaleString()}</td>
            <td>${window.money(sale.subtotal)}</td>
            <td>${window.money(sale.discount)}</td>
            <td><strong>${window.money(sale.total)}</strong></td>
            <td>${window.escapeHTML(sale.status)}</td>
            <td><button class="btn btn-secondary" data-details="${sale.id}">Details</button></td>
          </tr>`).join("")}
        </tbody>
      </table></div>` : `<p class="empty-state">Hakuna mauzo yaliyopatikana.</p>`;

    table.querySelectorAll("[data-details]").forEach(button => {
      button.addEventListener("click", () => showDetails(button.dataset.details));
    });
  }

  async function showDetails(saleId) {
    const [saleResult, itemsResult, paymentsResult] = await Promise.all([
      supabase.from("sales").select("*").eq("id", saleId).single(),
      supabase.from("sale_items").select("*").eq("sale_id", saleId),
      supabase.from("payments").select("*").eq("sale_id", saleId)
    ]);

    if (saleResult.error) throw saleResult.error;
    if (itemsResult.error) throw itemsResult.error;
    if (paymentsResult.error) throw paymentsResult.error;

    const sale = saleResult.data;

    root.querySelector("#sale-details").innerHTML = `
      <section class="panel receipt">
        <div class="panel-heading">
          <h3>Risiti: ${window.escapeHTML(sale.receipt_number)}</h3>
          <button id="print-sale" class="btn btn-primary">Print</button>
        </div>
        ${(itemsResult.data || []).map(item => `
          <div class="receipt-row">
            <span>${window.escapeHTML(item.product_name)} × ${item.quantity}</span>
            <span>${window.money(item.line_total)}</span>
          </div>`).join("")}
        <hr>
        <div class="receipt-row"><span>Subtotal</span><span>${window.money(sale.subtotal)}</span></div>
        <div class="receipt-row"><span>Discount</span><span>${window.money(sale.discount)}</span></div>
        <div class="receipt-row receipt-total"><strong>Jumla</strong><strong>${window.money(sale.total)}</strong></div>
        ${(paymentsResult.data || []).map(p => `
          <p>Malipo: ${window.escapeHTML(p.method)} — ${window.money(p.amount)}</p>`).join("")}
      </section>`;

    root.querySelector("#print-sale").addEventListener("click", () => window.print());
  }

  root.querySelector("#refresh-sales").addEventListener("click", () => {
    loadSales().catch(e => alert(e.message));
  });

  root.querySelector("#filter-sales").addEventListener("click", () => {
    loadSales().catch(e => alert(e.message));
  });

  await loadSales();
}