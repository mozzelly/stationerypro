import { requireSupabase } from '../lib/supabase.js';

const money = (value) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export async function renderDashboard(root) {
  root.innerHTML = `
    <section class="page-heading">
      <div>
        <p class="eyebrow">MUHTASARI WA BIASHARA</p>
        <h1>Dashboard</h1>
        <p class="muted">Muhtasari wa mauzo na hali ya bidhaa.</p>
      </div>
    </section>
    <p id="dashboard-error" class="error-message"></p>
    <section class="stats-grid" id="dashboard-stats">
      <article class="stat-card"><span>Mauzo ya leo</span><strong>Inapakia...</strong></article>
      <article class="stat-card"><span>Idadi ya bidhaa</span><strong>Inapakia...</strong></article>
      <article class="stat-card"><span>Stock inayoisha</span><strong>Inapakia...</strong></article>
      <article class="stat-card"><span>Matumizi ya leo</span><strong>Inapakia...</strong></article>
    </section>
    <section class="panel">
      <h2>Bidhaa zenye stock ndogo</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Bidhaa</th><th>Stock</th><th>Bei ya kuuza</th></tr></thead>
          <tbody id="low-stock-body"></tbody>
        </table>
      </div>
    </section>
  `;

  try {
    const db = requireSupabase();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [salesResult, productsResult, expensesResult, lowStockResult] =
      await Promise.all([
        db.from('sales')
          .select('total')
          .gte('created_at', start.toISOString())
          .eq('status', 'completed'),

        db.from('products')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),

        db.from('expenses')
          .select('amount')
          .gte('created_at', start.toISOString()),

        db.from('products')
          .select('id, name, stock_quantity, selling_price')
          .eq('is_active', true)
          .filter('stock_quantity', 'lte', 'reorder_level')
          .order('stock_quantity'),
      ]);

    for (const result of [salesResult, productsResult, expensesResult, lowStockResult]) {
      if (result.error) throw result.error;
    }

    const totalSales = salesResult.data.reduce(
      (sum, sale) => sum + Number(sale.total || 0), 0
    );

    const totalExpenses = expensesResult.data.reduce(
      (sum, expense) => sum + Number(expense.amount || 0), 0
    );

    const lowStock = lowStockResult.data || [];

    root.querySelector('#dashboard-stats').innerHTML = `
      <article class="stat-card"><span>Mauzo ya leo</span><strong>${money(totalSales)}</strong></article>
      <article class="stat-card"><span>Bidhaa hai</span><strong>${productsResult.count || 0}</strong></article>
      <article class="stat-card"><span>Stock ndogo</span><strong>${lowStock.length}</strong></article>
      <article class="stat-card"><span>Matumizi ya leo</span><strong>${money(totalExpenses)}</strong></article>
    `;

    root.querySelector('#low-stock-body').innerHTML = lowStock.length
      ? lowStock.map((product) => `
          <tr>
            <td>${escapeHtml(product.name)}</td>
            <td>${Number(product.stock_quantity)}</td>
            <td>${money(product.selling_price)}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="3">Hakuna bidhaa zenye stock ndogo.</td></tr>';
  } catch (error) {
    root.querySelector('#dashboard-error').textContent = error.message;
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}