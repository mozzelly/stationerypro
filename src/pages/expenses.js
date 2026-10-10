import { supabase } from "../lib/supabase.js";

export async function renderExpenses(root, user, profile) {
  root.innerHTML = `
    <section class="panel">
      <div class="panel-heading"><h3>Rekodi matumizi</h3></div>
      <form id="expense-form" class="form-grid">
        <div class="field"><label>Maelezo ya matumizi *</label>
          <input name="description" required maxlength="200" placeholder="Mfano: Kodi ya duka"></div>
        <div class="field"><label>Category</label>
          <select name="category">
            <option>Rent</option><option>Transport</option><option>Electricity</option>
            <option>Internet</option><option>Salary</option><option>Supplies</option>
            <option>Maintenance</option><option>Other</option>
          </select></div>
        <div class="field"><label>Kiasi (TSh) *</label>
          <input name="amount" type="number" min="0.01" step="0.01" required></div>
        <div class="field"><label>Maelezo ya ziada</label>
          <input name="notes" maxlength="500"></div>
        <div class="span-all">
          <button class="btn btn-primary" type="submit">Hifadhi matumizi</button>
          <p id="expense-message" class="form-message"></p>
        </div>
      </form>
    </section>

    <section class="panel">
      <div class="panel-heading"><h3>Historia ya matumizi</h3>
        <button id="refresh-expenses" class="btn btn-secondary">Refresh</button></div>
      <div id="expenses-table"></div>
    </section>
  `;

  const form = root.querySelector("#expense-form");
  const message = root.querySelector("#expense-message");
  const table = root.querySelector("#expenses-table");

  async function loadExpenses() {
    let query = supabase.from("expenses").select("*")
      .order("created_at", { ascending: false }).limit(200);

    if (profile.role !== "owner") query = query.eq("created_by", user.id);

    const { data, error } = await query;
    if (error) throw error;

    const total = (data || []).reduce((sum, row) => sum + Number(row.amount), 0);

    table.innerHTML = `
      <p><strong>Jumla ya rekodi zilizoonyeshwa: ${window.money(total)}</strong></p>
      ${data?.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Tarehe</th><th>Maelezo</th><th>Category</th><th>Kiasi</th><th>Aliyeingiza</th></tr></thead>
        <tbody>${data.map(row => `
          <tr>
            <td>${new Date(row.created_at).toLocaleString()}</td>
            <td>${window.escapeHTML(row.description)}
              ${row.notes ? `<small class="table-subtext">${window.escapeHTML(row.notes)}</small>` : ""}
            </td>
            <td>${window.escapeHTML(row.category)}</td>
            <td>${window.money(row.amount)}</td>
            <td>${row.created_by === user.id ? "Wewe" : "Mtumiaji"}</td>
          </tr>`).join("")}
        </tbody>
      </table></div>` : `<p class="empty-state">Bado hakuna matumizi yaliyorekodiwa.</p>`}
    `;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    message.textContent = "Inahifadhi...";

    const fd = new FormData(form);
    const payload = {
      description: String(fd.get("description")).trim(),
      category: String(fd.get("category")),
      amount: Number(fd.get("amount")),
      notes: String(fd.get("notes") || "").trim() || null,
      created_by: user.id
    };

    try {
      const { error } = await supabase.from("expenses").insert(payload);
      if (error) throw error;

      form.reset();
      message.textContent = "Matumizi yamehifadhiwa.";
      message.className = "form-message success";
      await loadExpenses();
    } catch (error) {
      message.textContent = error.message;
      message.className = "form-message error";
    } finally {
      button.disabled = false;
    }
  });

  root.querySelector("#refresh-expenses").addEventListener("click", () => {
    loadExpenses().catch(e => alert(e.message));
  });

  await loadExpenses();
}