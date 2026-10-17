import { supabase } from '../lib/supabase.js';
import {
  icon, num, money, esc, fmtDateTime, parseYmd, addDays, isCancelled, methodLabel,
  grossOf, vatOf, paidShown, balanceShown, STATUS_LABELS, saleStatus, statusBadge, receiptLink,
  cashierName, loadCashierNames, fetchAll, fetchByIds, computeFinance, payCardsHtml, statCard,
  ensureSharedStyles, createDetailModal, openFinanceBox, downloadCsv, chipsHtml, markChip, rangeFor,
  productProfitRows, groupSum, trendSvg, table, summary, printHtml, PAY_DEFS
} from '../lib/shared.js';

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

  ensureSharedStyles();
  const modal = createDetailModal();
  modal.bind(root);

  const $ = (sel) => root.querySelector(sel);
  const init = rangeFor('month');
  const st = { f: null, products: null, visible: 100 };

  root.innerHTML = `
    <div class="reports-container">
      <div class="page-header">
        <h1>Ripoti za Biashara</h1>
      </div>

      <div class="filter-card">
        ${chipsHtml('month')}
        <div class="filter-row" style="margin-top: 12px;">
          <div class="form-group">
            <label>Kuanzia</label>
            <input type="date" id="report-from" value="${init.from}" />
          </div>
          <div class="form-group">
            <label>Mpaka</label>
            <input type="date" id="report-to" value="${init.to}" />
          </div>
          <div class="form-group" style="align-self: flex-end;">
            <button id="generate-report" class="btn btn-primary">${icon('bar-chart', 16)} Tengeneza Ripoti</button>
          </div>
        </div>
      </div>

      <div id="report-results">
        <div class="empty-state" style="padding: 60px 20px;">Inapakia ripoti...</div>
      </div>
    </div>
  `;

  async function ensureProducts() {
    if (st.products) return;
    const { data } = await supabase.from('products').select('*');
    st.products = (data || []).filter((p) => !p.is_service);
  }

  async function generate() {
    const fromStr = $('#report-from').value;
    const toStr = $('#report-to').value;
    const out = $('#report-results');
    const button = $('#generate-report');

    if (!fromStr || !toStr) {
      out.innerHTML = '<div class="notice error">Tafadhali chagua tarehe ya kuanzia na ya mwisho.</div>';
      return;
    }
    if (fromStr > toStr) {
      out.innerHTML = '<div class="notice error">Tarehe ya kuanzia haiwezi kuwa baada ya ya mwisho.</div>';
      return;
    }

    button.disabled = true;
    button.textContent = 'Inachakata...';

    try {
      const from = parseYmd(fromStr);
      const toEx = addDays(parseYmd(toStr), 1);

      const sales = (
        await fetchAll((a, b) =>
          supabase
            .from('sales')
            .select('*, profiles(full_name)')
            .gte('created_at', from.toISOString())
            .lt('created_at', toEx.toISOString())
            .order('created_at', { ascending: false })
            .range(a, b)
        )
      ).filter((s) => !isCancelled(s));

      await loadCashierNames(sales);
      modal.known = sales;

      const ids = sales.map((s) => s.id);
      const [items, payments, expenses] = await Promise.all([
        fetchByIds('sale_items', 'sale_id', ids),
        fetchByIds('payments', 'sale_id', ids),
        fetchAll((a, b) =>
          supabase
            .from('expenses')
            .select('*')
            .gte('expense_date', fromStr)
            .lte('expense_date', toStr)
            .order('expense_date', { ascending: false })
            .range(a, b)
        )
      ]);
      await ensureProducts();

      st.f = {
        ...computeFinance({ sales, items, payments, expenses }),
        label: `${fromStr} hadi ${toStr}`, fromStr, toStr, from, toEx
      };
      st.visible = 100;
      paint();
    } catch (error) {
      console.error('Report error:', error);
      out.innerHTML = `<div class="notice error"><strong>Hitilafu:</strong> ${esc(error.message)}</div>`;
    } finally {
      button.disabled = false;
      button.innerHTML = `${icon('bar-chart', 16)} Tengeneza Ripoti`;
    }
  }

  function paint() {
    const f = st.f;
    const top = productProfitRows(f.items).sort((a, b) => b.rev - a.rev);
    const cashiers = groupSum(f.sales, (s) => cashierName(s), (s) => grossOf(s));
    const cats = groupSum(f.expenses, (e) => e.category || 'Nyingine', (e) => num(e.amount));
    const low = (st.products || []).filter((p) => p.reorder_level != null && num(p.stock_quantity) <= num(p.reorder_level));

    const row = (title, sub, value) => `
      <div class="recent-sale-item">
        <div class="recent-sale-info"><strong>${title}</strong><small>${sub}</small></div>
        <div class="recent-sale-amount"><strong>${value}</strong></div>
      </div>`;
    const list = (rows, empty) => (rows.length ? rows.join('') : `<div class="empty-state">${empty}</div>`);
    const panel = (title, ic, inner) => `
      <div class="dashboard-panel">
        <div class="panel-header"><h3>${icon(ic, 18)} ${title}</h3></div>
        ${inner}
      </div>`;

    const kpis = [
      statCard({ key: 'fin-sales', ic: 'dollar-sign', bg: '#dbeafe', color: '#1e40af', label: 'Jumla ya Mauzo', value: money(f.grossSales), sub: f.vat > 0 ? `Bila VAT: ${money(f.revenue)}` : `Risiti ${f.sales.length}` }),
      statCard({ key: 'fin-profit', ic: 'trending-up', bg: '#dcfce7', color: '#166534', label: 'Faida Halisi', value: money(Math.max(f.net, 0)), sub: 'Baada ya matumizi' }),
      statCard({ key: 'fin-loss', ic: 'trending-down', bg: '#fee2e2', color: '#991b1b', label: 'Hasara', value: money(Math.max(-f.net, 0)), sub: 'Matumizi yakizidi faida' }),
      statCard({ key: 'fin-expenses', ic: 'wallet', bg: '#fef3c7', color: '#92400e', label: 'Matumizi', value: money(f.expensesTotal), sub: `${f.expenses.length} matumizi` }),
      statCard({ key: 'fin-grossprofit', ic: 'bar-chart', bg: '#dcfce7', color: '#166534', label: 'Faida Ghafi', value: money(f.grossProfit), sub: 'Kabla ya matumizi' }),
      statCard({ key: 'fin-cogs', ic: 'package', bg: '#fef3c7', color: '#92400e', label: 'Gharama ya Bidhaa', value: money(f.cogs), sub: 'COGS' }),
      statCard({ key: 'fin-vat', ic: 'percent', bg: '#ede9fe', color: '#5b21b6', label: 'VAT Iliyokusanywa', value: money(f.vat) }),
      statCard({ key: 'fin-discount', ic: 'tag', bg: '#fee2e2', color: '#991b1b', label: 'Discount', value: money(f.discount) }),
      statCard({ key: 'fin-count', ic: 'shopping-cart', bg: '#dcfce7', color: '#166534', label: 'Idadi ya Risiti', value: String(f.sales.length) }),
      statCard({ key: 'fin-avg', ic: 'dollar-sign', bg: '#dbeafe', color: '#1e40af', label: 'Wastani kwa Risiti', value: money(f.sales.length ? f.grossSales / f.sales.length : 0) })
    ].join('');

    const salesRows = f.sales.slice(0, st.visible).map((s) => `
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
      </tr>`).join('');

    $('#report-results').innerHTML = `
      <p class="muted" style="margin: 16px 0 8px;">Kipindi: <strong>${esc(f.fromStr)}</strong> hadi <strong>${esc(f.toStr)}</strong></p>

      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
        <button id="export-sales" class="btn btn-secondary btn-sm">${icon('download', 16)} Export CSV (Mauzo)</button>
        <button id="export-products" class="btn btn-secondary btn-sm">${icon('download', 16)} Export CSV (Bidhaa)</button>
        <button id="print-report" class="btn btn-secondary btn-sm">${icon('printer', 16)} Print / PDF</button>
      </div>

      <div class="stats-grid">${kpis}</div>

      <div class="ui-section"><h2>Mapato kwa Njia ya Malipo</h2></div>
      ${payCardsHtml(f)}

      <div class="dashboard-grid" style="margin-top: 24px;">
        ${panel('Mwenendo wa Mauzo', 'trending-up', trendSvg(f.sales, f.from, f.toEx))}
        ${panel('Bidhaa Zinazouzwa Zaidi', 'package', list(
          top.slice(0, 8).map((r) => row(esc(r.name), `Zimeuzwa: ${r.qty} · Faida: ${money(r.rev - r.cost)}`, money(r.rev))),
          'Hakuna mauzo kwa kipindi hiki'
        ))}
      </div>

      <div class="dashboard-grid" style="margin-top: 24px;">
        ${panel('Mauzo kwa Mfanyakazi', 'users', list(
          cashiers.map((c) => row(esc(c.key), `Risiti: ${c.count}`, money(c.total))),
          'Hakuna mauzo kwa kipindi hiki'
        ))}
        ${panel('Matumizi kwa Kategoria', 'wallet', list(
          cats.map((c) => row(esc(c.key), `${c.count} matumizi`, money(c.total))),
          'Hakuna matumizi kwa kipindi hiki'
        ))}
      </div>

      <div class="dashboard-grid" style="margin-top: 24px;">
        ${panel('Bidhaa zenye Stock Chini', 'alert-triangle', list(
          low.slice(0, 8).map((p) => row(esc(p.name), `Stock: ${num(p.stock_quantity)} / Min: ${num(p.reorder_level)}`, '<span class="badge badge-warning">Chini</span>')),
          'Hakuna bidhaa zenye stock chini'
        ))}
      </div>

      <div class="ui-section"><h2>Orodha ya Mauzo</h2></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Namba ya Risiti</th><th>Tarehe & Muda</th><th>Mfanyakazi</th><th>Subtotal</th>
              <th>Discount</th><th>VAT</th><th>Jumla</th><th>Njia</th><th>Hali</th>
            </tr>
          </thead>
          <tbody>
            ${salesRows || '<tr><td colspan="9" class="empty-state">Hakuna mauzo yaliyopatikana kwa muda huo.</td></tr>'}
          </tbody>
        </table>
      </div>
      ${f.sales.length > st.visible ? `<div style="text-align:center;margin:14px 0;"><button id="show-more" class="btn btn-secondary">Onyesha zaidi (${f.sales.length - st.visible} zimebaki)</button></div>` : ''}
    `;
  }

  function exportSalesCsv() {
    const f = st.f;
    if (!f || !f.sales.length) return alert('Hakuna data ya kutoa nje. Tengeneza ripoti kwanza.');
    downloadCsv(
      `Ripoti_Ya_Mauzo_${f.fromStr}_${f.toStr}.csv`,
      ['Namba ya Risiti', 'Tarehe', 'Mfanyakazi', 'Subtotal', 'Discount', 'VAT', 'Jumla', 'Njia ya Malipo', 'Imelipwa', 'Baki', 'Hali'],
      f.sales.map((s) => [
        s.receipt_number, fmtDateTime(s.created_at), cashierName(s), num(s.subtotal), num(s.discount),
        vatOf(s), grossOf(s), methodLabel(s.payment_method), paidShown(s), balanceShown(s), STATUS_LABELS[saleStatus(s)]
      ])
    );
  }

  function exportProductsCsv() {
    const f = st.f;
    if (!f || !f.items.length) return alert('Hakuna data ya kutoa nje. Tengeneza ripoti kwanza.');
    downloadCsv(
      `Ripoti_Ya_Bidhaa_${f.fromStr}_${f.toStr}.csv`,
      ['Bidhaa', 'Idadi', 'Mauzo', 'Gharama', 'Faida'],
      productProfitRows(f.items).map((r) => [r.name, r.qty, r.rev, r.cost, r.rev - r.cost])
    );
  }

  function printReport() {
    const f = st.f;
    if (!f) return;
    const kv = (rows) =>
      `<table>${rows.map(([k, v]) => `<tr><td>${k}</td><td style="text-align:right;"><strong>${v}</strong></td></tr>`).join('')}</table>`;
    const top = productProfitRows(f.items).sort((a, b) => b.rev - a.rev);
    const cats = groupSum(f.expenses, (e) => e.category || 'Nyingine', (e) => num(e.amount));

    printHtml('Ripoti ya Biashara', `
      <h1>Ripoti ya Biashara</h1>
      <p>Kipindi: ${esc(f.fromStr)} hadi ${esc(f.toStr)}</p>
      <h3>Muhtasari</h3>
      ${kv([
        ['Jumla ya mauzo (pamoja na VAT)', money(f.grossSales)],
        ['Mauzo bila VAT', money(f.revenue)],
        ['Gharama ya bidhaa', money(f.cogs)],
        ['Faida ghafi', money(f.grossProfit)],
        ['Matumizi', money(f.expensesTotal)],
        [f.net >= 0 ? 'Faida halisi' : 'Hasara halisi', money(Math.abs(f.net))],
        ['VAT iliyokusanywa', money(f.vat)],
        ['Discount', money(f.discount)],
        ['Idadi ya risiti', String(f.sales.length)]
      ])}
      <h3>Njia za Malipo</h3>
      ${kv([
        ...PAY_DEFS.filter((d) => d.key !== 'credit').map((d) => [d.label, money(f.payTotals[d.key].amount)]),
        ['Nyingine', money(f.other.amount)],
        ['Mkopo (baki)', money(f.credit.amount)]
      ])}
      <h3>Bidhaa Zinazouzwa Zaidi</h3>
      ${table(['Bidhaa', 'Idadi', 'Mauzo', 'Faida'], top.slice(0, 15).map((r) => [esc(r.name), String(r.qty), money(r.rev), money(r.rev - r.cost)]), 'Hakuna data')}
      <h3>Matumizi kwa Kategoria</h3>
      ${table(['Kategoria', 'Idadi', 'Kiasi'], cats.map((c) => [esc(c.key), String(c.count), money(c.total)]), 'Hakuna matumizi')}
      <h3>Orodha ya Mauzo</h3>
      ${table(
        ['Risiti', 'Tarehe', 'Mfanyakazi', 'Jumla', 'Njia', 'Hali'],
        f.sales.map((s) => [esc(s.receipt_number), fmtDateTime(s.created_at), esc(cashierName(s)), money(grossOf(s)), esc(methodLabel(s.payment_method)), STATUS_LABELS[saleStatus(s)]]),
        'Hakuna mauzo'
      )}
    `);
  }

  root.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-range]');
    if (chip) {
      const r = rangeFor(chip.dataset.range);
      $('#report-from').value = r.from;
      $('#report-to').value = r.to;
      markChip(root, chip.dataset.range);
      generate();
      return;
    }
    const box = e.target.closest('[data-box]');
    if (box && root.contains(box)) return openFinanceBox(modal, box.dataset.box, st.f);

    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'generate-report') { markChip(root, ''); generate(); }
    if (btn.id === 'export-sales') exportSalesCsv();
    if (btn.id === 'export-products') exportProductsCsv();
    if (btn.id === 'print-report') printReport();
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

  $('#report-from').addEventListener('change', () => markChip(root, ''));
  $('#report-to').addEventListener('change', () => markChip(root, ''));

  await generate();
}