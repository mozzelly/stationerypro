import { supabase } from '../lib/supabase.js';
import {
  icon, money, esc, fmtDateTime, parseYmd, addDays, isCancelled, normalizeMethod, KNOWN_METHODS,
  methodLabel, grossOf, vatOf, paidShown, balanceShown, STATUS_LABELS, saleStatus, statusBadge,
  receiptLink, cashierName, loadCashierNames, fetchAll, fetchByIds, computeFinance, payCardsHtml,
  statCard, ensureSharedStyles, createDetailModal, openFinanceBox, downloadCsv, chipsHtml,
  markChip, rangeFor
} from '../lib/shared.js';

export async function renderSales(root, user, profile) {
  ensureSharedStyles();
  const modal = createDetailModal();
  modal.bind(root);

  const $ = (sel) => root.querySelector(sel);
  const isOwner = profile.role === 'owner';
  const init = rangeFor('month');
  const st = { all: [], payments: [], filtered: [], f: null, visible: 100 };

  root.innerHTML = `
    <div class="sales-container">
      <div class="page-header">
        <h1>Historia ya Mauzo</h1>
        <button id="export-sales" class="btn btn-secondary">${icon('download', 18)} Export CSV</button>
      </div>

      <div class="filter-card">
        ${chipsHtml('month')}
        <div class="filter-row" style="margin-top: 12px;">
          <div class="form-group">
            <label>Kuanzia</label>
            <input type="date" id="sales-from" value="${init.from}" />
          </div>
          <div class="form-group">
            <label>Mpaka</label>
            <input type="date" id="sales-to" value="${init.to}" />
          </div>
          <div class="form-group">
            <label>Tafuta risiti</label>
            <input type="text" id="search-sale" placeholder="Namba ya risiti..." />
          </div>
          <div class="form-group">
            <label>Hali</label>
            <select id="filter-status">
              <option value="">Zote</option>
              <option value="paid">Imelipwa</option>
              <option value="partial">Imelipwa Kiasi</option>
              <option value="unpaid">Haijalipwa</option>
              <option value="credit">Mkopo</option>
              <option value="cancelled">Imefutwa</option>
            </select>
          </div>
          <div class="form-group">
            <label>Njia ya malipo</label>
            <select id="filter-method">
              <option value="">Zote</option>
              <option value="cash">Cash</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="card">Card</option>
              <option value="bank">Bank</option>
              <option value="credit">Mkopo</option>
              <option value="other">Nyingine</option>
            </select>
          </div>
          ${isOwner ? `
          <div class="form-group">
            <label>Mfanyakazi</label>
            <select id="filter-cashier"><option value="">Wote</option></select>
          </div>` : ''}
          <div class="form-group" style="align-self: flex-end;">
            <button id="filter-sales" class="btn btn-primary">${icon('search', 16)} Tafuta</button>
          </div>
        </div>
      </div>

      <div id="sales-stats" class="stats-grid" style="margin-top: 16px;"></div>

      <div class="ui-section"><h2>Mapato kwa Njia ya Malipo</h2></div>
      <div id="sales-pay"></div>

      <div class="table-wrap" style="margin-top: 24px;">
        <table id="sales-table">
          <thead>
            <tr>
              <th>Namba ya Risiti</th>
              <th>Tarehe</th>
              <th>Mfanyakazi</th>
              <th>Subtotal</th>
              <th>Discount</th>
              <th>VAT</th>
              <th>Jumla</th>
              <th>Njia</th>
              <th>Hali</th>
              <th>Vitendo</th>
            </tr>
          </thead>
          <tbody id="sales-body">
            <tr><td colspan="10" class="empty-state">Inapakia...</td></tr>
          </tbody>
        </table>
      </div>
      <div id="sales-more" style="text-align: center; margin: 14px 0;"></div>
    </div>
  `;

  function populateCashiers() {
    const select = $('#filter-cashier');
    if (!select) return;
    const current = select.value;
    const map = new Map();
    st.all.forEach((s) => { if (s.cashier_id) map.set(s.cashier_id, cashierName(s)); });
    select.innerHTML = '<option value="">Wote</option>' +
      [...map.entries()].map(([id, name]) => `<option value="${esc(id)}">${esc(name)}</option>`).join('');
    select.value = map.has(current) ? current : '';
  }

  async function loadSales() {
    const from = $('#sales-from').value;
    const to = $('#sales-to').value;
    const search = $('#search-sale').value.trim();
    const tbody = $('#sales-body');
    if (!from || !to) return;

    tbody.innerHTML = '<tr><td colspan="10" class="empty-state">Inapakia...</td></tr>';

    try {
      const fromDate = parseYmd(from);
      const toEx = addDays(parseYmd(to), 1);

      st.all = await fetchAll((a, b) => {
        let q = supabase
          .from('sales')
          .select('*, profiles(full_name)')
          .gte('created_at', fromDate.toISOString())
          .lt('created_at', toEx.toISOString())
          .order('created_at', { ascending: false });
        if (!isOwner) q = q.eq('cashier_id', user.id);
        if (search) q = q.ilike('receipt_number', `%${search}%`);
        return q.range(a, b);
      });

      await loadCashierNames(st.all);
      modal.known = st.all;
      st.payments = await fetchByIds('payments', 'sale_id', st.all.map((s) => s.id));
      populateCashiers();
      applyFilters();
    } catch (error) {
      console.error('Error loading sales:', error);
      tbody.innerHTML = `<tr><td colspan="10" class="empty-state">Hitilafu: ${esc(error.message)}</td></tr>`;
    }
  }

  function applyFilters() {
    const status = $('#filter-status').value;
    const method = $('#filter-method').value;
    const cashier = isOwner ? $('#filter-cashier').value : '';

    st.filtered = st.all.filter((s) => {
      if (status && saleStatus(s) !== status) return false;
      if (method) {
        const m = normalizeMethod(s.payment_method);
        const isOther = !KNOWN_METHODS.includes(m) && m !== 'credit';
        if (method === 'other' ? !isOther : m !== method) return false;
      }
      if (cashier && s.cashier_id !== cashier) return false;
      return true;
    });

    const active = st.filtered.filter((s) => !isCancelled(s));
    st.f = {
      ...computeFinance({ sales: active, payments: st.payments }),
      label: `${$('#sales-from').value} hadi ${$('#sales-to').value}`
    };
    st.visible = 100;
    paint();
  }

  function paint() {
    const f = st.f;

    $('#sales-stats').innerHTML = [
      statCard({ key: 'fin-sales', ic: 'dollar-sign', bg: '#dbeafe', color: '#1e40af', label: 'Jumla ya Mauzo', value: money(f.grossSales), sub: f.vat > 0 ? `Bila VAT: ${money(f.revenue)}` : '' }),
      statCard({ key: 'fin-count', ic: 'shopping-cart', bg: '#dcfce7', color: '#166534', label: 'Idadi ya Risiti', value: String(f.sales.length) }),
      statCard({ key: 'fin-avg', ic: 'dollar-sign', bg: '#fef3c7', color: '#92400e', label: 'Wastani kwa Risiti', value: money(f.sales.length ? f.grossSales / f.sales.length : 0) }),
      statCard({ key: 'fin-discount', ic: 'tag', bg: '#fee2e2', color: '#991b1b', label: 'Discount', value: money(f.discount) }),
      statCard({ key: 'fin-vat', ic: 'percent', bg: '#ede9fe', color: '#5b21b6', label: 'VAT', value: money(f.vat) })
    ].join('');

    $('#sales-pay').innerHTML = payCardsHtml(f);

    const tbody = $('#sales-body');
    if (st.filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="empty-state">Hakuna mauzo yaliyopatikana</td></tr>';
      $('#sales-more').innerHTML = '';
      return;
    }

    tbody.innerHTML = st.filtered.slice(0, st.visible).map((s) => `
      <tr>
        <td>${receiptLink(s, 'strong')}</td>
        <td>${fmtDateTime(s.created_at)}</td>
        <td>${esc(cashierName(s))}</td>
        <td>${money(s.subtotal)}</td>
        <td>${money(s.discount)}</td>
        <td>${vatOf(s) > 0 ? money(vatOf(s)) : '-'}</td>
        <td><strong>${money(grossOf(s))}</strong></td>
        <td>${esc(methodLabel(s.payment_method))}</td>
        <td>${statusBadge(s)}</td>
        <td>
          <button class="btn btn-sm btn-secondary" data-sale-id="${esc(s.id)}">${icon('eye', 16)} Risiti</button>
        </td>
      </tr>
    `).join('');

    const remaining = st.filtered.length - st.visible;
    $('#sales-more').innerHTML = remaining > 0
      ? `<button id="show-more" class="btn btn-secondary">Onyesha zaidi (${remaining} zimebaki)</button>`
      : '';
  }

  function exportCsv() {
    if (st.filtered.length === 0) return alert('Hakuna data ya kutoa nje.');
    downloadCsv(
      `Mauzo_${$('#sales-from').value}_${$('#sales-to').value}.csv`,
      ['Namba ya Risiti', 'Tarehe', 'Mfanyakazi', 'Subtotal', 'Discount', 'VAT', 'Jumla', 'Njia ya Malipo', 'Imelipwa', 'Baki', 'Hali'],
      st.filtered.map((s) => [
        s.receipt_number, fmtDateTime(s.created_at), cashierName(s), s.subtotal, s.discount,
        vatOf(s), grossOf(s), methodLabel(s.payment_method), paidShown(s), balanceShown(s),
        STATUS_LABELS[saleStatus(s)]
      ])
    );
  }

  root.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-range]');
    if (chip) {
      const r = rangeFor(chip.dataset.range);
      $('#sales-from').value = r.from;
      $('#sales-to').value = r.to;
      markChip(root, chip.dataset.range);
      loadSales();
      return;
    }
    const box = e.target.closest('[data-box]');
    if (box && root.contains(box)) return openFinanceBox(modal, box.dataset.box, st.f);

    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'filter-sales') { markChip(root, ''); loadSales(); }
    if (btn.id === 'export-sales') exportCsv();
    if (btn.id === 'show-more') { st.visible += 100; paint(); }
  });

  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const box = e.target.closest('[data-box]');
    if (box && root.contains(box)) {
      e.preventDefault();
      openFinanceBox(modal, box.dataset.box, st.f);
    }
  });

  ['#filter-status', '#filter-method', '#filter-cashier'].forEach((sel) => {
    const el = $(sel);
    if (el) el.addEventListener('change', applyFilters);
  });
  $('#sales-from').addEventListener('change', () => markChip(root, ''));
  $('#sales-to').addEventListener('change', () => markChip(root, ''));

  let searchTimer;
  $('#search-sale').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadSales, 350);
  });

  await loadSales();
}