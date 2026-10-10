import { supabase } from "../lib/supabase.js";

export async function renderReports(root, user, profile) {
  if (profile.role !== "owner") {
    root.innerHTML = `<div class="notice">Ripoti kamili zinapatikana kwa Owner pekee.</div>`;
    return;
  }

  root.innerHTML = `
    <section class="panel">
      <div class="panel-heading"><h3>Ripoti za biashara</h3></div>
      <div class="filters">
        <label>Kuanzia <input id="report-from" type="date"></label>
        <label>Mpaka <input id="report-to" type="date"></label>
        <button id="generate-report" class="btn btn-primary">Tengeneza ripoti</button>
        <button id="export-report" class="btn btn-secondary">Export CSV</button>
        <button id="print-report" class="btn btn-secondary">Print / PDF</button>
      </div>
      <div id="report-results"><p class="muted">Chagua tarehe na tengeneza ripoti.</p></div>
    </section>
  `;

  let reportRows = [];

  function csvEscape(value) {
    const s = String(value ?? "");
    return `"${s.replace(/"/g, '""')}"`;
  }

  root.querySelector("#generate-report").addEventListener("click", async () => {
    const button = root.querySelector("#generate-report");
    button.disabled = true;

    try {
      const from = root.querySelector("#report-from").value;
      const to = root.querySelector("#report-to").value;

      let query = supabase.from("sales")
        .select("id,receipt_number,total,subtotal,discount,status,created_at,cashier_id")
        .order("created_at", { ascending: true })
        .limit(5000);

      if (from) query = query.gte("created_at", new Date(from + "T00:00:00").toISOString());
      if (to) query = query.lt("created_at", new Date(
        new Date(to + "T00:00:00").getTime() + 86400000
      ).toISOString());

      const { data: sales, error } = await query;
      if (error) throw error;

      const completed = (sales || []).filter(s => s.status === "completed");
      const ids = completed.map(s => s.id);

      let items = [];

      if (ids.length) {
        const { data, error: itemError } = await supabase
          .from("sale_items")
          .select("sale_id,product_name,quantity,unit_price,unit_cost,line_total")
          .in("sale_id", ids);

        if (itemError) throw itemError;
        items = data || [];
      }

      const revenue = completed.reduce((sum, s) => sum + Number(s.total), 0);
      const cogs = items.reduce(
        (sum, i) => sum + Number(i.quantity) * Number(i.unit_cost), 0
      );
      const grossProfit = revenue - cogs;

      let expensesQuery = supabase.from("expenses").select("amount,created_at");
      if (from) expensesQuery = expensesQuery.gte(
        "created_at", new Date(from + "T00:00:00").toISOString()
      );
      if (to) expensesQuery = expensesQuery.lt("created_at", new Date(
        new Date(to + "T00:00:00").getTime() + 86400000
      ).toISOString());

      const { data: expenses, error: expenseError } = await expensesQuery;
      if (expenseError) throw expenseError;

      const expenseTotal = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);

      reportRows = completed.map(s => ({
        receipt_number: s.receipt_number,
        date: new Date(s.created_at).toLocaleString(),
        subtotal: Number(s.subtotal),
        discount: Number(s.discount),
        total: Number(s.total),
        status: s.status
      }));

      root.querySelector("#report-results").innerHTML = `
        <div class="stats-grid">
          <article class="stat-card"><span class="stat-label">Mapato</span><strong>${window.money(revenue)}</strong></article>
          <article class="stat-card"><span class="stat-label">Gharama za bidhaa zilizouzwa</span><strong>${window.money(cogs)}</strong></article>
          <article class="stat-card"><span class="stat-label">Faida ghafi</span><strong>${window.money(grossProfit)}</strong></article>
          <article class="stat-card"><span class="stat-label">Matumizi</span><strong>${window.money(expenseTotal)}</strong></article>
        </div>
        <div class="notice">
          <strong>Faida baada ya matumizi yaliyorekodiwa:</strong>
          ${window.money(grossProfit - expenseTotal)}
          <p class="small">Hesabu hii haijajumuisha gharama nyingine ambazo hazijaingizwa kwenye mfumo.</p>
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>Risiti</th><th>Tarehe</th><th>Subtotal</th><th>Discount</th><th>Jumla</th></tr></thead>
          <tbody>${reportRows.map(row => `
            <tr>
              <td>${window.escapeHTML(row.receipt_number)}</td>
              <td>${window.escapeHTML(row.date)}</td>
              <td>${window.money(row.subtotal)}</td>
              <td>${window.money(row.discount)}</td>
              <td>${window.money(row.total)}</td>
            </tr>`).join("")}
          </tbody>
        </table></div>
      `;
    } catch (error) {
      root.querySelector("#report-results").innerHTML =
        `<div class="notice error">${window.escapeHTML(error.message)}</div>`;
    } finally {
      button.disabled = false;
    }
  });

  root.querySelector("#export-report").addEventListener("click", () => {
    if (!reportRows.length) {
      alert("Tengeneza ripoti kwanza.");
      return;
    }

    const headers = ["receipt_number", "date", "subtotal", "discount", "total", "status"];
    const csv = [
      headers.join(","),
      ...reportRows.map(row => headers.map(key => csvEscape(row[key])).join(","))
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stationerypro-sales-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

  root.querySelector("#print-report").addEventListener("click", () => window.print());
}