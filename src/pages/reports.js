import { supabase } from '../lib/supabase.js';

export async function renderReports(root, user, profile) {
  // Owner pekee anaweza kuona ripoti kamili
  if (profile.role !== 'owner') {
    root.innerHTML = `
      <div class="notice error">
        <h3>Hauruhusiwi</h3>
        <p>Ripoti kamili za biashara zinapatikana kwa Wamiliki (Owners) pekee.</p>
      </div>
    `;
    return;
  }

  // Set default dates (Mwezi huu)
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayString = today.toISOString().split('T')[0];

  root.innerHTML = `
    <div class="reports-container">
      <div class="page-header">
        <h1>Ripoti za Biashara</h1>
      </div>

      <!-- Filter Card -->
      <div class="filter-card">
        <div class="filter-row">
          <div class="form-group">
            <label>Kuanzia</label>
            <input type="date" id="report-from" value="${firstDayOfMonth}" />
          </div>
          <div class="form-group">
            <label>Mpaka</label>
            <input type="date" id="report-to" value="${todayString}" />
          </div>
          <div class="form-group" style="align-self: flex-end;">
            <button id="generate-report" class="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
              Tengeneza Ripoti
            </button>
          </div>
        </div>
      </div>

      <!-- Results Container -->
      <div id="report-results">
        <div class="empty-state" style="padding: 60px 20px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--muted); margin-bottom: 16px;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
          <h3>Bado hakuna ripoti iliyotengenezwa</h3>
          <p>Chagua muda (tarehe) kisha bofya "Tengeneza Ripoti".</p>
        </div>
      </div>
    </div>
  `;

  let reportRows = [];

  function csvEscape(value) {
    const s = String(value ?? "");
    return `"${s.replace(/"/g, '""')}"`;
  }

  // Generate Report Logic
  root.querySelector('#generate-report').addEventListener('click', async () => {
    const button = root.querySelector('#generate-report');
    const resultsDiv = root.querySelector('#report-results');
    
    button.disabled = true;
    button.innerHTML = `<svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Inachakata...`;

    try {
      const from = root.querySelector('#report-from').value;
      const to = root.querySelector('#report-to').value;

      if (!from || !to) {
        throw new Error('Tafadhali chagua tarehe ya kuanzia na ya mwisho.');
      }

      // 1. Fetch Sales
      let salesQuery = supabase
        .from('sales')
        .select('id, receipt_number, total, subtotal, discount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5000);

      salesQuery = salesQuery.gte('created_at', new Date(from + 'T00:00:00').toISOString());
      salesQuery = salesQuery.lt('created_at', new Date(new Date(to + 'T00:00:00').getTime() + 86400000).toISOString());

      const { data: sales, error: salesError } = await salesQuery;
      if (salesError) throw salesError;

      const completedSales = (sales || []).filter(s => s.status === 'completed');
      const saleIds = completedSales.map(s => s.id);

      // 2. Fetch Sale Items for COGS
      let items = [];
      let cogs = 0;
      if (saleIds.length > 0) {
        const { data: saleItems, error: itemError } = await supabase
          .from('sale_items')
          .select('sale_id, quantity, unit_cost')
          .in('sale_id', saleIds);

        if (itemError) throw itemError;
        items = saleItems || [];
        cogs = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_cost)), 0);
      }

      // 3. Fetch Expenses
      let expensesQuery = supabase.from('expenses').select('amount');
      expensesQuery = expensesQuery.gte('expense_date', from);
      expensesQuery = expensesQuery.lte('expense_date', to);

      const { data: expenses, error: expenseError } = await expensesQuery;
      if (expenseError) throw expenseError;

      const expenseTotal = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);

      // 4. Calculate Metrics
      const revenue = completedSales.reduce((sum, s) => sum + Number(s.total), 0);
      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - expenseTotal;

      // 5. Prepare Rows for Table & CSV
      reportRows = completedSales.map(s => ({
        receipt_number: s.receipt_number,
        date: new Date(s.created_at).toLocaleString('sw-TZ'),
        subtotal: Number(s.subtotal),
        discount: Number(s.discount),
        total: Number(s.total),
        status: s.status
      }));

      // 6. Render Results
      resultsDiv.innerHTML = `
        <!-- Action Buttons -->
        <div class="report-actions">
          <button id="export-csv" class="btn btn-secondary btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Export CSV
          </button>
          <button id="print-report" class="btn btn-secondary btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
            Print / PDF
          </button>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background: #dbeafe; color: #1e40af;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div class="stat-content">
              <p class="stat-label">Jumla ya Mapato (Revenue)</p>
              <h3 class="stat-value">${window.money(revenue)}</h3>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: #fef3c7; color: #92400e;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>
            </div>
            <div class="stat-content">
              <p class="stat-label">Gharama ya Bidhaa (COGS)</p>
              <h3 class="stat-value">${window.money(cogs)}</h3>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: #dcfce7; color: #166534;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div class="stat-content">
              <p class="stat-label">Faida Ghafi (Gross Profit)</p>
              <h3 class="stat-value" style="color: ${grossProfit >= 0 ? 'var(--success)' : 'var(--danger)'}">${window.money(grossProfit)}</h3>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: ${netProfit >= 0 ? '#dcfce7' : '#fee2e2'}; color: ${netProfit >= 0 ? '#166534' : '#991b1b'};">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            </div>
            <div class="stat-content">
              <p class="stat-label">Faida Halisi (Net Profit)</p>
              <h3 class="stat-value" style="color: ${netProfit >= 0 ? 'var(--success)' : 'var(--danger)'}">${window.money(netProfit)}</h3>
              <small class="text-muted">Baada ya kukata matumizi: ${window.money(expenseTotal)}</small>
            </div>
          </div>
        </div>

        <!-- Data Table -->
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Namba ya Risiti</th>
                <th>Tarehe & Muda</th>
                <th>Subtotal</th>
                <th>Discount</th>
                <th>Jumla (Total)</th>
                <th>Hali</th>
              </tr>
            </thead>
            <tbody>
              ${reportRows.length > 0 ? reportRows.map(row => `
                <tr>
                  <td><strong>${window.escapeHTML(row.receipt_number)}</strong></td>
                  <td>${window.escapeHTML(row.date)}</td>
                  <td>${window.money(row.subtotal)}</td>
                  <td>${window.money(row.discount)}</td>
                  <td><strong>${window.money(row.total)}</strong></td>
                  <td><span class="badge badge-success">Imekamilika</span></td>
                </tr>
              `).join('') : '<tr><td colspan="6" class="empty-state">Hakuna mauzo yaliyopatikana kwa muda huo.</td></tr>'}
            </tbody>
          </table>
        </div>
      `;

      // Re-attach event listeners for new buttons
      root.querySelector('#export-csv')?.addEventListener('click', exportToCSV);
      root.querySelector('#print-report')?.addEventListener('click', () => window.print());

    } catch (error) {
      console.error('Report error:', error);
      resultsDiv.innerHTML = `
        <div class="notice error">
          <strong>Hitilafu:</strong> ${window.escapeHTML(error.message)}
        </div>
      `;
    } finally {
      button.disabled = false;
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
        Tengeneza Ripoti
      `;
    }
  });

  function exportToCSV() {
    if (!reportRows || reportRows.length === 0) {
      alert('Hakuna data ya kutoa nje. Tengeneza ripoti kwanza.');
      return;
    }

    const headers = ['Namba ya Risiti', 'Tarehe', 'Subtotal', 'Discount', 'Jumla', 'Hali'];
    const rows = reportRows.map(row => [
      row.receipt_number,
      row.date,
      row.subtotal,
      row.discount,
      row.total,
      row.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => csvEscape(cell)).join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ripoti_Ya_Mauzo_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}