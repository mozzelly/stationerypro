import { supabase } from '../lib/supabase.js';

export async function renderSales(root, user, profile) {
  // Set default dates (Mwezi huu)
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayString = today.toISOString().split('T')[0];

  root.innerHTML = `
    <div class="sales-container">
      <div class="page-header">
        <h1>Historia ya Mauzo</h1>
        <button id="export-sales" class="btn btn-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>
      </div>

      <!-- Summary Stats -->
      <div class="stats-grid" id="sales-stats">
        <div class="stat-card">
          <div class="stat-icon" style="background: #dbeafe; color: #1e40af;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Jumla ya Mauzo</p>
            <h3 class="stat-value" id="total-sales">TSh 0</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #dcfce7; color: #166534;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Idadi ya Risiti</p>
            <h3 class="stat-value" id="total-count">0</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #fef3c7; color: #92400e;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Wastani kwa Risiti</p>
            <h3 class="stat-value" id="avg-sale">TSh 0</h3>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-card">
        <div class="filter-row">
          <div class="form-group">
            <label>Kuanzia</label>
            <input type="date" id="sales-from" value="${firstDayOfMonth}" />
          </div>
          <div class="form-group">
            <label>Mpaka</label>
            <input type="date" id="sales-to" value="${todayString}" />
          </div>
          <div class="form-group">
            <label>Tafuta</label>
            <input type="text" id="search-sale" placeholder="Namba ya risiti..." />
          </div>
          <div class="form-group" style="align-self: flex-end;">
            <button id="filter-sales" class="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
              Tafuta
            </button>
          </div>
        </div>
      </div>

      <!-- Sales Table -->
      <div class="table-wrap">
        <table id="sales-table">
          <thead>
            <tr>
              <th>Namba ya Risiti</th>
              <th>Tarehe</th>
              <th>Mteja</th>
              <th>Subtotal</th>
              <th>Discount</th>
              <th>Jumla</th>
              <th>Hali ya Malipo</th>
              <th>Vitendo</th>
            </tr>
          </thead>
          <tbody id="sales-body">
            <tr><td colspan="8" class="empty-state">Inapakia...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Sale Details Modal -->
      <div id="sale-modal" class="modal-overlay" style="display: none;">
        <div class="modal" style="max-width: 600px;">
          <div class="modal-header">
            <h3>Maelezo ya Mauzo</h3>
            <button class="modal-close" id="close-modal">×</button>
          </div>
          <div class="modal-body" id="sale-details-content">
            <p class="muted">Inapakia maelezo...</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-view">Funga</button>
            <button class="btn btn-primary" id="print-sale">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
              Print Risiti
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  let salesData = [];

  async function loadSales() {
    const from = document.getElementById('sales-from').value;
    const to = document.getElementById('sales-to').value;
    const search = document.getElementById('search-sale').value;
    const tbody = document.getElementById('sales-body');

    let query = supabase
      .from('sales')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(500);

    // Filter by date
    if (from) {
      query = query.gte('created_at', new Date(from + 'T00:00:00').toISOString());
    }
    if (to) {
      query = query.lt('created_at', new Date(new Date(to + 'T00:00:00').getTime() + 86400000).toISOString());
    }

    // Filter by cashier if not owner
    if (profile.role !== 'owner') {
      query = query.eq('cashier_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading sales:', error);
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Hitilafu: ${error.message}</td></tr>`;
      return;
    }

    salesData = data || [];

    // Filter by search
    if (search) {
      salesData = salesData.filter(s => 
        s.receipt_number.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Update stats
    const totalSales = salesData.reduce((sum, s) => sum + parseFloat(s.total), 0);
    const avgSale = salesData.length > 0 ? totalSales / salesData.length : 0;

    document.getElementById('total-sales').textContent = window.money(totalSales);
    document.getElementById('total-count').textContent = salesData.length;
    document.getElementById('avg-sale').textContent = window.money(avgSale);

    // Render table
    if (salesData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Hakuna mauzo yaliyopatikana</td></tr>';
      return;
    }

    tbody.innerHTML = salesData.map(sale => {
      const paymentStatus = sale.payment_status || 'unpaid';
      let statusBadge = '';
      
      if (paymentStatus === 'paid') {
        statusBadge = '<span class="badge badge-success">Imelipwa</span>';
      } else if (paymentStatus === 'partial') {
        statusBadge = '<span class="badge badge-warning">Imelipwa Kiasi</span>';
      } else {
        statusBadge = '<span class="badge badge-danger">Haijalipwa</span>';
      }

      return `
        <tr>
          <td><strong>${sale.receipt_number}</strong></td>
          <td>${new Date(sale.created_at).toLocaleString('sw-TZ')}</td>
          <td>${sale.profiles?.full_name || 'Mfanyakazi'}</td>
          <td>${window.money(sale.subtotal)}</td>
          <td>${window.money(sale.discount)}</td>
          <td><strong>${window.money(sale.total)}</strong></td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="viewSaleDetails('${sale.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Details
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.viewSaleDetails = async (saleId) => {
    const modal = document.getElementById('sale-modal');
    const content = document.getElementById('sale-details-content');
    
    modal.style.display = 'flex';
    content.innerHTML = '<p class="muted">Inapakia maelezo...</p>';

    try {
      const [saleResult, itemsResult, paymentsResult] = await Promise.all([
        supabase.from('sales').select('*').eq('id', saleId).single(),
        supabase.from('sale_items').select('*').eq('sale_id', saleId),
        supabase.from('payments').select('*').eq('sale_id', saleId)
      ]);

      if (saleResult.error) throw saleResult.error;
      if (itemsResult.error) throw itemsResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      const sale = saleResult.data;
      const items = itemsResult.data || [];
      const payments = paymentsResult.data || [];

      content.innerHTML = `
        <div class="receipt" style="border: none; box-shadow: none; margin: 0; max-width: 100%;">
          <div class="receipt-center" style="margin-bottom: 20px;">
            <h2 style="margin: 0; color: var(--blue-dark);">StationeryPro</h2>
            <p style="margin: 4px 0; color: var(--muted);">Risiti Namba: <strong>${sale.receipt_number}</strong></p>
            <p style="margin: 4px 0; color: var(--muted);">${new Date(sale.created_at).toLocaleString('sw-TZ')}</p>
            <p style="margin: 4px 0; color: var(--muted);">Mfanyakazi: ${sale.profiles?.full_name || '-'}</p>
          </div>

          <hr style="margin: 16px 0; border: none; border-top: 1px dashed var(--border);">

          <div style="margin-bottom: 16px;">
            ${items.map(item => `
              <div class="receipt-row" style="padding: 8px 0;">
                <div>
                  <strong>${item.product_name}</strong>
                  <small style="color: var(--muted); display: block;">${item.quantity} × ${window.money(item.unit_price)}</small>
                </div>
                <div style="text-align: right;">
                  <strong>${window.money(item.line_total)}</strong>
                </div>
              </div>
            `).join('')}
          </div>

          <hr style="margin: 16px 0; border: none; border-top: 1px dashed var(--border);">

          <div class="receipt-row" style="padding: 8px 0;">
            <span>Subtotal:</span>
            <span>${window.money(sale.subtotal)}</span>
          </div>
          <div class="receipt-row" style="padding: 8px 0;">
            <span>Discount:</span>
            <span>${window.money(sale.discount)}</span>
          </div>
          <div class="receipt-row receipt-total" style="padding: 12px 0; margin-top: 8px; border-top: 2px solid var(--border); font-size: 16px;">
            <strong>Jumla:</strong>
            <strong style="color: var(--blue); font-size: 18px;">${window.money(sale.total)}</strong>
          </div>

          ${payments.length > 0 ? `
            <hr style="margin: 16px 0; border: none; border-top: 1px dashed var(--border);">
            <div style="margin-top: 16px;">
              <h4 style="margin-bottom: 12px; color: var(--blue-dark);">Malipo Yaliyopokelewa:</h4>
              ${payments.map(p => `
                <div class="receipt-row" style="padding: 6px 0;">
                  <span>${p.method === 'cash' ? 'Cash' : p.method === 'mobile_money' ? 'Mobile Money' : p.method === 'bank' ? 'Bank' : p.method === 'card' ? 'Card' : 'Nyingine'}</span>
                  <span>${window.money(p.amount)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${sale.balance > 0 ? `
            <div style="margin-top: 16px; padding: 12px; background: var(--danger-light); border-radius: var(--radius); color: var(--danger); text-align: center;">
              <strong>Baki: ${window.money(sale.balance)}</strong>
            </div>
          ` : ''}
        </div>
      `;

      // Store sale data for printing
      modal.dataset.currentSaleId = saleId;

    } catch (error) {
      console.error('Error loading sale details:', error);
      content.innerHTML = `<div class="notice error">Hitilafu: ${error.message}</div>`;
    }
  };

  // Event Listeners
  document.getElementById('filter-sales').addEventListener('click', loadSales);
  
  document.getElementById('search-sale').addEventListener('input', (e) => {
    if (e.target.value.length === 0 || e.target.value.length >= 3) {
      loadSales();
    }
  });

  document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('sale-modal').style.display = 'none';
  });

  document.getElementById('cancel-view').addEventListener('click', () => {
    document.getElementById('sale-modal').style.display = 'none';
  });

  document.getElementById('print-sale').addEventListener('click', () => {
    window.print();
  });

  document.getElementById('export-sales').addEventListener('click', () => {
    if (salesData.length === 0) {
      alert('Hakuna data ya kutoa nje.');
      return;
    }

    const headers = ['Namba ya Risiti', 'Tarehe', 'Mfanyakazi', 'Subtotal', 'Discount', 'Jumla', 'Hali ya Malipo'];
    const rows = salesData.map(sale => [
      sale.receipt_number,
      new Date(sale.created_at).toLocaleString('sw-TZ'),
      sale.profiles?.full_name || '-',
      sale.subtotal,
      sale.discount,
      sale.total,
      sale.payment_status || 'unpaid'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mauzo_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Close modal on outside click
  document.getElementById('sale-modal').addEventListener('click', (e) => {
    if (e.target.id === 'sale-modal') {
      document.getElementById('sale-modal').style.display = 'none';
    }
  });

  // Initial load
  await loadSales();
}