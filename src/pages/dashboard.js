import { supabase } from "../lib/supabase.js";

export async function renderDashboard(root, user, profile) {
  if (profile.role !== "owner") {
    root.innerHTML = `<div class="notice">Dashboard hii inapatikana kwa Owner.</div>`;
    return;
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [salesResult, productsResult, expensesResult] = await Promise.all([
    supabase.from("sales")
      .select("id,total,status,created_at")
      .gte("created_at", start.toISOString())
      .eq("status", "completed"),
    supabase.from("products")
      .select("id,name,stock_quantity,reorder_level,selling_price,cost_price")
      .eq("active", true),
    supabase.from("expenses")
      .select("amount")
      .gte("created_at", start.toISOString())
  ]);

  for (const result of [salesResult, productsResult, expensesResult]) {
    if (result.error) throw result.error;
  }

  const sales = salesResult.data || [];
  const products = productsResult.data || [];
  const expenses = expensesResult.data || [];

  const revenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const lowStock = products.filter(p => p.stock_quantity <= p.reorder_level);

  const salesIds = sales.map(s => s.id);
  let grossProfit = 0;

  if (salesIds.length) {
    const { data: items, error } = await supabase
      .from("sale_items")
      .select("sale_id,quantity,unit_cost")
      .in("sale_id", salesIds);

    if (error) throw error;

    const cost = (items || []).reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unit_cost), 0
    );

    grossProfit = revenue - cost;
  }

  root.innerHTML = `
    <div class="welcome-row">
      <div><h2>Habari, ${window.escapeHTML(profile.full_name || "Owner")}</h2>
        <p class="muted">Muhtasari wa biashara yako leo.</p></div>
      <button class="btn btn-secondary" id="refresh-dashboard">Refresh</button>
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <span class="stat-label">Mauzo ya leo</span>
        <strong>${window.money(revenue)}</strong>
        <small>${sales.length} transaction(s)</small>
      </article>
      <article class="stat-card">
        <span class="stat-label">Faida ghafi ya mauzo ya leo</span>
        <strong>${window.money(grossProfit)}</strong>
        <small>Kabla ya matumizi mengine</small>
      </article>
      <article class="stat-card">
        <span class="stat-label">Matumizi ya leo</span>
        <strong>${window.money(expenseTotal)}</strong>
        <small>Matumizi yaliyorekodiwa</small>
      </article>
      <article class="stat-card">
        <span class="stat-label">Bidhaa za tahadhari</span>
        <strong>${lowStock.length}</strong>
        <small>Kiwango cha stock kimefikiwa</small>
      </article>
    </div>

    <div class="content-grid">
      <section class="panel">
        <div class="panel-heading">
          <h3>Stock inayohitaji kuangaliwa</h3>
          <a href="#products">Angalia bidhaa</a>
        </div>
        ${lowStock.length ? `
          <div class="table-wrap"><table>
            <thead><tr><th>Bidhaa</th><th>Stock</th><th>Kiwango cha chini</th></tr></thead>
            <tbody>${lowStock.map(p => `
              <tr>
                <td>${window.escapeHTML(p.name)}</td>
                <td><span class="stock-warning">${p.stock_quantity}</span></td>
                <td>${p.reorder_level}</td>
              </tr>`).join("")}
            </tbody>
          </table></div>` : `<p class="empty-state">Hakuna bidhaa za tahadhari kwa sasa.</p>`}
      </section>

      <section class="panel">
        <div class="panel-heading"><h3>Vitendo vya haraka</h3></div>
        <div class="quick-actions">
          <a class="quick-action" href="#pos"><strong>＋</strong><span>Anza mauzo</span></a>
          <a class="quick-action" href="#products"><strong>▤</strong><span>Bidhaa na stock</span></a>
          <a class="quick-action" href="#expenses"><strong>−</strong><span>Rekodi matumizi</span></a>
          <a class="quick-action" href="#reports"><strong>▥</strong><span>Ripoti</span></a>
        </div>
      </section>
    </div>
    <p class="muted small">Takwimu zinatokana na rekodi zilizohifadhiwa Supabase.</p>
  `;

  root.querySelector("#refresh-dashboard").addEventListener("click", () => {
    renderDashboard(root, user, profile).catch(e => alert(e.message));
  });
}