import { supabase } from './supabase.js';

/* Kama `total` kwenye sales tayari inajumuisha VAT, badilisha iwe true */
export const TOTAL_INCLUDES_VAT = false;

/* ---------- Icons ---------- */
export const ICONS = {
  'dollar-sign': '<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  'shopping-cart': '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  'package': '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  'trending-up': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  'trending-down': '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
  'wallet': '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  'banknote': '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  'smartphone': '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  'credit-card': '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  'landmark': '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'circle-help': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  'percent': '<line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  'tag': '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  'bar-chart': '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
  'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  'printer': '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
  'eye': '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'
};

export function icon(name, size = 24) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

/* ---------- Vitu vya kusaidia ---------- */
export const MONTHS_SW = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ago', 'Sep', 'Okt', 'Nov', 'Des'];
export const num = (v) => Number(v) || 0;
export const money = (v) => window.money(num(v));
export const sum = (arr, key) => arr.reduce((t, x) => t + num(x[key]), 0);
export const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('sw-TZ') : '-');
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('sw-TZ') : '-');
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseYmd = (s) => {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, m - 1, d);
};

/* ---------- Njia za malipo ---------- */
export const PAY_DEFS = [
  { key: 'cash', label: 'Cash', ic: 'banknote', bg: '#dcfce7', color: '#166534' },
  { key: 'mobile_money', label: 'Mobile Money', ic: 'smartphone', bg: '#dbeafe', color: '#1e40af' },
  { key: 'card', label: 'Card', ic: 'credit-card', bg: '#ede9fe', color: '#5b21b6' },
  { key: 'bank', label: 'Bank', ic: 'landmark', bg: '#fef3c7', color: '#92400e' },
  { key: 'credit', label: 'Mkopo', ic: 'clock', bg: '#fee2e2', color: '#991b1b' }
];
export const KNOWN_METHODS = ['cash', 'mobile_money', 'card', 'bank'];

const METHOD_ALIASES = {
  credit: 'credit', mkopo: 'credit', loan: 'credit', deni: 'credit', on_credit: 'credit', credit_sale: 'credit',
  cash: 'cash', taslimu: 'cash',
  mobile_money: 'mobile_money', mobile: 'mobile_money', mpesa: 'mobile_money', m_pesa: 'mobile_money',
  tigopesa: 'mobile_money', tigo_pesa: 'mobile_money', airtel_money: 'mobile_money', halopesa: 'mobile_money',
  card: 'card', kadi: 'card',
  bank: 'bank', bank_transfer: 'bank', transfer: 'bank'
};

export const normalizeMethod = (m) => {
  const k = String(m || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return METHOD_ALIASES[k] || k;
};
export const isCreditSale = (s) => normalizeMethod(s.payment_method) === 'credit';
export const methodLabel = (m) => {
  const k = normalizeMethod(m);
  const d = PAY_DEFS.find((x) => x.key === k);
  return d ? d.label : k || '-';
};

/* ---------- Mauzo: VAT, kilicholipwa, baki, hali ---------- */
export const isCancelled = (s) =>
  ['cancelled', 'canceled', 'void', 'voided', 'refunded'].includes(String(s.status || '').toLowerCase());
export const vatOf = (s) => num(s.vat_amount);
export const grossOf = (s) => (TOTAL_INCLUDES_VAT ? num(s.total) : num(s.total) + vatOf(s)); // pamoja na VAT
export const netOf = (s) => (TOTAL_INCLUDES_VAT ? num(s.total) - vatOf(s) : num(s.total)); // bila VAT

export const paidOf = (s) => {
  const gross = grossOf(s);
  if (num(s.amount_paid) > 0) return Math.min(num(s.amount_paid), gross);
  if (s.payment_status === 'paid') return gross;
  return 0;
};
export const balanceOf = (s) => Math.max(0, grossOf(s) - paidOf(s));
export const paidShown = (s) => (isCreditSale(s) ? 0 : paidOf(s));
export const balanceShown = (s) => Math.max(0, grossOf(s) - paidShown(s));

export function saleStatus(s) {
  if (isCancelled(s)) return 'cancelled';
  if (isCreditSale(s)) return 'credit';
  if (balanceOf(s) <= 0) return 'paid';
  return paidOf(s) > 0 ? 'partial' : 'unpaid';
}
export const STATUS_LABELS = {
  paid: 'Imelipwa', partial: 'Imelipwa Kiasi', unpaid: 'Haijalipwa', credit: 'Mkopo', cancelled: 'Imefutwa'
};
export function statusBadge(s) {
  const k = saleStatus(s);
  const cls = { paid: 'badge-success', partial: 'badge-warning', unpaid: 'badge-danger', credit: 'badge-warning', cancelled: 'badge-danger' }[k];
  return `<span class="badge ${cls}">${STATUS_LABELS[k]}</span>`;
}

/* ---------- Majina ya wafanyakazi ---------- */
const cashierCache = new Map();
export const cashierName = (s) => s.profiles?.full_name || cashierCache.get(s.cashier_id) || '-';
export async function loadCashierNames(sales) {
  const ids = [...new Set(sales.map((s) => s.cashier_id).filter(Boolean))].filter((id) => !cashierCache.has(id));
  if (!ids.length) return;
  try {
    const { data } = await supabase.from('profiles').select('id, full_name').in('id', ids);
    (data || []).forEach((p) => cashierCache.set(p.id, p.full_name));
  } catch (e) {
    /* majina ni ya ziada */
  }
}

/* ---------- Kusoma data ---------- */
export async function fetchAll(build) {
  const pageSize = 1000;
  let all = [];
  for (let page = 0; page < 30; page++) {
    const { data, error } = await build(page * pageSize, page * pageSize + pageSize - 1);
    if (error) throw error;
    all = all.concat(data || []);
    if (!data || data.length < pageSize) break;
  }
  return all;
}

export async function fetchByIds(table, column, ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const { data, error } = await supabase.from(table).select('*').in(column, ids.slice(i, i + 50));
    if (error) throw error;
    out.push(...(data || []));
  }
  return out;
}

/* ---------- Vipindi ---------- */
export const RANGE_CHIPS = [
  ['today', 'Leo'], ['yesterday', 'Jana'], ['week', 'Wiki hii'],
  ['month', 'Mwezi huu'], ['lastmonth', 'Mwezi uliopita'], ['year', 'Mwaka huu']
];

export function rangeFor(key) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let from = today;
  let to = today;
  if (key === 'yesterday') { from = addDays(today, -1); to = from; }
  else if (key === 'week') from = addDays(today, -((today.getDay() + 6) % 7));
  else if (key === 'month') from = new Date(today.getFullYear(), today.getMonth(), 1);
  else if (key === 'lastmonth') {
    from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    to = new Date(today.getFullYear(), today.getMonth(), 0);
  } else if (key === 'year') from = new Date(today.getFullYear(), 0, 1);
  return { from: ymd(from), to: ymd(to) };
}

export function chipsHtml(activeKey) {
  return `<div class="ui-chips">${RANGE_CHIPS.map(
    ([k, l]) => `<button type="button" class="btn btn-sm ${k === activeKey ? 'btn-primary' : 'btn-secondary'}" data-range="${k}">${l}</button>`
  ).join('')}</div>`;
}

export function markChip(root, key) {
  root.querySelectorAll('[data-range]').forEach((b) => {
    b.className = 'btn btn-sm ' + (b.dataset.range === key ? 'btn-primary' : 'btn-secondary');
  });
}

/* ---------- Mitindo ---------- */
export function ensureSharedStyles() {
  if (document.getElementById('ui-shared-styles')) return;
  const style = document.createElement('style');
  style.id = 'ui-shared-styles';
  style.textContent = `
    .stat-card.clickable { cursor: pointer; min-width: 0; overflow: hidden; transition: transform .12s ease, box-shadow .12s ease; }
    .stat-card.clickable:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(20, 86, 192, .14); }
    .stat-card.clickable:focus-visible { outline: 2px solid #1456c0; outline-offset: 2px; }
    .stat-card.clickable .stat-content { min-width: 0; flex: 1; max-width: 100%; }
    .stat-card.clickable .stat-value { font-size: clamp(16px, 1.4vw, 22px) !important; line-height: 1.25; white-space: normal !important; overflow-wrap: anywhere; }
    .ui-pay-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
    .ui-pay-grid .stat-card.clickable { flex-direction: column; align-items: flex-start; gap: 10px; }
    .ui-pay-grid .stat-card.clickable .stat-content { width: 100%; }
    .ui-section { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin: 28px 0 12px; }
    .ui-section h2 { margin: 0; font-size: 18px; }
    .ui-note { padding: 10px 12px; border-radius: 8px; background: #fff1f0; color: #912018; font-size: 13px; margin-bottom: 12px; overflow-wrap: anywhere; }
    .ui-summary { border: 1px solid #e1eae4; border-radius: 10px; padding: 6px 14px; margin-bottom: 16px; background: #fafcff; }
    .ui-summary-row { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px dashed #e1eae4; }
    .ui-summary-row:last-child { border-bottom: none; }
    .ui-modal-body h4 { margin: 18px 0 8px; }
    .ui-modal-body .hint { color: #68786e; font-size: 13px; margin: 8px 0; }
    .ui-toolbar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
    .ui-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .receipt-link { color: #1456c0; cursor: pointer; font-weight: 700; }
    .receipt-link:hover { text-decoration: underline; }
    .receipt-link:focus-visible { outline: 2px solid #1456c0; outline-offset: 2px; border-radius: 3px; }
    .ui-receipt-head { text-align: center; margin-bottom: 14px; }
    .ui-receipt-head h3 { margin: 0 0 4px; color: #0f3a8a; }
    .ui-receipt-head div { color: #68786e; font-size: 13px; margin: 2px 0; }
    .ui-trend { width: 100%; height: auto; display: block; }
  `;
  document.head.appendChild(style);
}

/* ---------- Vipande vya UI ---------- */
export function table(headers, rows, empty = 'Hakuna data') {
  if (!rows.length) return `<div class="empty-state">${empty}</div>`;
  return `<div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('')}</tbody></table></div>`;
}

export function summary(pairs) {
  return `<div class="ui-summary">${pairs
    .filter(Boolean)
    .map(([l, v, c]) => `<div class="ui-summary-row"><span>${l}</span><strong${c ? ` style="color:${c}"` : ''}>${v}</strong></div>`)
    .join('')}</div>`;
}

export const receiptLink = (s, tag = 'span') =>
  `<${tag} class="receipt-link" role="button" tabindex="0" data-sale-id="${esc(s.id)}">${esc(s.receipt_number)}</${tag}>`;

export function statCard({ key, ic, bg, color, label, value, sub = '' }) {
  return `
    <div class="stat-card clickable" data-box="${key}" role="button" tabindex="0">
      <div class="stat-icon" style="background:${bg};color:${color};">${icon(ic)}</div>
      <div class="stat-content">
        <p class="stat-label">${label}</p>
        <h3 class="stat-value">${value}</h3>
        ${sub ? `<span class="stat-change"><span>${sub}</span></span>` : ''}
      </div>
    </div>`;
}

export function payCardsHtml(f) {
  const cards = PAY_DEFS.map((d) => {
    const t = d.key === 'credit' ? f.credit : f.payTotals[d.key];
    return statCard({
      key: `pay-${d.key}`, ic: d.ic, bg: d.bg, color: d.color, label: d.label,
      value: money(t.amount),
      sub: d.key === 'credit' ? `${t.count} risiti za mkopo` : `${t.count} malipo`
    });
  });
  if (f.other.count > 0) {
    cards.push(statCard({
      key: 'pay-other', ic: 'circle-help', bg: '#e5e7eb', color: '#374151', label: 'Nyingine',
      value: money(f.other.amount), sub: `${f.other.count} malipo`
    }));
  }
  return `<div class="stats-grid ui-pay-grid">${cards.join('')}</div>`;
}

export function salesTable(list) {
  return table(
    ['Risiti', 'Tarehe', 'Mfanyakazi', 'Jumla', 'Imelipwa', 'Baki', 'Hali'],
    list.map((s) => [
      receiptLink(s, 'strong'),
      fmtDateTime(s.created_at),
      esc(cashierName(s)),
      money(grossOf(s)),
      money(paidShown(s)),
      money(balanceShown(s)),
      statusBadge(s)
    ]),
    'Hakuna mauzo'
  );
}

/* ---------- Mahesabu ya fedha ---------- */
export function groupSum(list, keyFn, valFn) {
  const map = new Map();
  list.forEach((x) => {
    const k = keyFn(x);
    const row = map.get(k) || { key: k, total: 0, count: 0 };
    row.total += valFn(x);
    row.count += 1;
    map.set(k, row);
  });
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function productProfitRows(items) {
  const map = new Map();
  items.forEach((it) => {
    const k = it.product_name || '-';
    const row = map.get(k) || { id: null, name: k, qty: 0, rev: 0, cost: 0 };
    if (!row.id && it.product_id) row.id = it.product_id;
    row.qty += num(it.quantity);
    row.rev += num(it.line_total) || num(it.quantity) * num(it.unit_price);
    row.cost += num(it.quantity) * num(it.unit_cost);
    map.set(k, row);
  });
  return [...map.values()].sort((a, b) => b.rev - b.cost - (a.rev - a.cost));
}

export function computeFinance({ sales, items = [], payments = [], expenses = [] }) {
  const grossSales = sales.reduce((t, s) => t + grossOf(s), 0);
  const revenue = sales.reduce((t, s) => t + netOf(s), 0);
  const vat = sales.reduce((t, s) => t + vatOf(s), 0);
  const discount = sum(sales, 'discount');
  const cogs = items.reduce((t, it) => t + num(it.quantity) * num(it.unit_cost), 0);
  const expensesTotal = sum(expenses, 'amount');
  const grossProfit = revenue - cogs;
  const net = grossProfit - expensesTotal;

  const paymentsBySale = new Map();
  payments.forEach((p) => {
    if (!paymentsBySale.has(p.sale_id)) paymentsBySale.set(p.sale_id, []);
    paymentsBySale.get(p.sale_id).push(p);
  });

  const payRows = [];
  sales.forEach((s) => {
    const rows = paymentsBySale.get(s.id);
    if (rows && rows.length) {
      rows.forEach((p) => {
        const m = normalizeMethod(p.method);
        if (m === 'credit') return;
        payRows.push({ sale_id: s.id, method: m || 'other', amount: num(p.amount), created_at: p.created_at || s.created_at });
      });
    } else if (!isCreditSale(s)) {
      const paid = paidOf(s);
      if (paid > 0) {
        payRows.push({ sale_id: s.id, method: normalizeMethod(s.payment_method) || 'other', amount: paid, created_at: s.created_at });
      }
    }
  });

  const payTotals = {};
  KNOWN_METHODS.forEach((k) => (payTotals[k] = { amount: 0, count: 0 }));
  const other = { amount: 0, count: 0 };
  payRows.forEach((r) => {
    const t = payTotals[r.method] || other;
    t.amount += r.amount;
    t.count += 1;
  });

  const paidBySale = new Map();
  payRows.forEach((r) => paidBySale.set(r.sale_id, (paidBySale.get(r.sale_id) || 0) + r.amount));
  const creditRows = sales
    .map((s) => {
      const creditSale = isCreditSale(s);
      const amount = creditSale ? Math.max(0, grossOf(s) - (paidBySale.get(s.id) || 0)) : balanceOf(s);
      return { sale: s, amount, creditSale };
    })
    .filter((r) => r.amount > 0);
  const credit = { amount: creditRows.reduce((t, r) => t + r.amount, 0), count: creditRows.length };

  return {
    sales, items, payments, expenses,
    salesById: new Map(sales.map((s) => [s.id, s])),
    grossSales, revenue, vat, discount, cogs, grossProfit, expensesTotal, net,
    payRows, payTotals, other, credit, creditRows
  };
}

/* ---------- Chati ya mwenendo ---------- */
export function trendSvg(sales, from, toEx) {
  const days = Math.max(1, Math.round((toEx - from) / 86400000));
  let buckets;
  let indexOf;

  if (days <= 1) {
    buckets = Array.from({ length: 24 }, (_, h) => ({ label: String(h), full: `Saa ${h}:00`, v: 0 }));
    indexOf = (d) => d.getHours();
  } else if (days <= 92) {
    buckets = Array.from({ length: days }, (_, i) => {
      const d = addDays(from, i);
      return { label: String(d.getDate()), full: fmtDate(d), v: 0 };
    });
    indexOf = (d) => Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - from) / 86400000);
  } else {
    const last = addDays(toEx, -1);
    const sy = from.getFullYear();
    const sm = from.getMonth();
    const count = (last.getFullYear() - sy) * 12 + (last.getMonth() - sm) + 1;
    buckets = Array.from({ length: count }, (_, i) => {
      const m = (sm + i) % 12;
      const y = sy + Math.floor((sm + i) / 12);
      return { label: MONTHS_SW[m], full: `${MONTHS_SW[m]} ${y}`, v: 0 };
    });
    indexOf = (d) => (d.getFullYear() - sy) * 12 + d.getMonth() - sm;
  }

  sales.forEach((s) => {
    const i = indexOf(new Date(s.created_at));
    if (i >= 0 && i < buckets.length) buckets[i].v += grossOf(s);
  });

  const max = Math.max(0, ...buckets.map((b) => b.v));
  if (max <= 0) return '<div class="empty-state">Hakuna mauzo kwa kipindi hiki</div>';

  const W = 640, H = 210, padL = 8, padR = 8, padT = 22, padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const step = chartW / buckets.length;
  const bw = Math.max(3, step * 0.62);
  const every = Math.ceil(buckets.length / 12);

  const bars = buckets
    .map((b, i) => {
      const x = padL + i * step + (step - bw) / 2;
      const h = (b.v / max) * chartH;
      const y = padT + chartH - h;
      const bar = b.v > 0
        ? `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="#1456c0"><title>${esc(b.full)}: ${esc(money(b.v))}</title></rect>`
        : '';
      const label = i % every === 0
        ? `<text x="${(x + bw / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#68786e">${esc(b.label)}</text>`
        : '';
      return bar + label;
    })
    .join('');

  return `<svg class="ui-trend" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mwenendo wa mauzo">
    <text x="${padL}" y="12" font-size="11" fill="#68786e">Juu: ${esc(money(max))}</text>
    <line x1="${padL}" y1="${padT + chartH}" x2="${W - padR}" y2="${padT + chartH}" stroke="#e1eae4" stroke-width="1"/>
    ${bars}
  </svg>`;
}

/* ---------- Kuchapisha na kupakua ---------- */
export function printHtml(title, bodyHtml) {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<html><head><title>${esc(title)}</title><style>
    body { font-family: Arial, Helvetica, sans-serif; color: #183629; padding: 16px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th, td { text-align: left; padding: 6px 4px; border-bottom: 1px solid #e1eae4; }
    th { font-size: 11px; text-transform: uppercase; color: #68786e; }
    h1, h2, h3, h4 { margin: 10px 0 6px; }
    .ui-receipt-head { text-align: center; margin-bottom: 12px; }
    .ui-summary-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .badge { font-weight: 700; }
  </style></head><body>${bodyHtml}</body></html>`);
  doc.close();
  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1500);
  }, 250);
}

export function downloadCsv(filename, headers, rows) {
  const cell = (c) => `"${String(c ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(cell).join(','), ...rows.map((r) => r.map(cell).join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------- Dirisha la maelezo + risiti ---------- */
export function createDetailModal() {
  ensureSharedStyles();
  const old = document.getElementById('ui-detail-modal');
  if (old) old.remove();

  const el = document.createElement('div');
  el.id = 'ui-detail-modal';
  el.className = 'modal-overlay';
  el.style.display = 'none';
  el.innerHTML = `
    <div class="modal" style="max-width:880px;width:95%;max-height:90vh;display:flex;flex-direction:column;">
      <div class="modal-header">
        <h3 id="ui-modal-title"></h3>
        <button class="modal-close" data-action="close" aria-label="Funga">×</button>
      </div>
      <div class="modal-body ui-modal-body" id="ui-modal-body" style="overflow:auto;"></div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="close">Funga</button>
      </div>
    </div>`;
  document.body.appendChild(el);

  const api = { el, known: [], current: null, stack: [] };

  api.set = (title, html) => {
    api.current = { title, html };
    el.querySelector('#ui-modal-title').textContent = title;
    const body = el.querySelector('#ui-modal-body');
    body.innerHTML = html;
    body.scrollTop = 0;
    el.style.display = 'flex';
  };
  api.open = (title, html, { child = false } = {}) => {
    if (child && api.current) api.stack.push(api.current);
    else if (!child) api.stack = [];
    api.set(title, html);
  };
  api.back = () => {
    const prev = api.stack.pop();
    if (prev) api.set(prev.title, prev.html);
    else api.close();
  };
  api.close = () => {
    el.style.display = 'none';
    api.current = null;
    api.stack = [];
  };
  api.toolbar = (extra = '') =>
    `<div class="ui-toolbar">${api.stack.length ? '<button type="button" class="btn btn-secondary btn-sm" data-action="back">← Rudi</button>' : ''}${extra}</div>`;

  const openSale = (target) => {
    const sale = target.closest('[data-sale-id]');
    if (!sale) return false;
    showSaleReceipt(api, sale.dataset.saleId);
    return true;
  };

  el.addEventListener('click', (e) => {
    if (e.target === el) return api.close();
    if (openSale(e.target)) return e.preventDefault();
    const act = e.target.closest('[data-action]');
    if (!act) return;
    if (act.dataset.action === 'close') api.close();
    if (act.dataset.action === 'back') api.back();
    if (act.dataset.action === 'print-receipt') {
      const r = el.querySelector('#ui-receipt');
      if (r) printHtml('Risiti', r.innerHTML);
    }
  });
  el.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && openSale(e.target)) e.preventDefault();
  });

  // Kwa ukurasa: risiti zinazobofyeka nje ya dirisha
  api.bind = (root) => {
    root.addEventListener('click', (e) => {
      const s = e.target.closest('[data-sale-id]');
      if (s && root.contains(s)) {
        e.preventDefault();
        showSaleReceipt(api, s.dataset.saleId);
      }
    });
    root.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const s = e.target.closest('[data-sale-id]');
      if (s && root.contains(s)) {
        e.preventDefault();
        showSaleReceipt(api, s.dataset.saleId);
      }
    });
  };

  if (window.__uiModalEsc) document.removeEventListener('keydown', window.__uiModalEsc);
  window.__uiModalEsc = (e) => { if (e.key === 'Escape') api.close(); };
  document.addEventListener('keydown', window.__uiModalEsc);
  if (window.__uiModalHash) window.removeEventListener('hashchange', window.__uiModalHash);
  window.__uiModalHash = () => api.close();
  window.addEventListener('hashchange', window.__uiModalHash);

  return api;
}

export async function showSaleReceipt(modal, saleId) {
  modal.open('Risiti', '<div class="empty-state">Inapakia risiti...</div>', { child: true });
  try {
    let sale = modal.known.find((s) => s.id === saleId);
    if (!sale) {
      const { data, error } = await supabase.from('sales').select('*, profiles(full_name)').eq('id', saleId).single();
      if (error) throw error;
      sale = data;
    }
    await loadCashierNames([sale]);

    const [itemsRes, paymentsRes] = await Promise.all([
      supabase.from('sale_items').select('*').eq('sale_id', saleId),
      supabase.from('payments').select('*').eq('sale_id', saleId)
    ]);
    if (itemsRes.error) throw itemsRes.error;
    if (paymentsRes.error) throw paymentsRes.error;
    const items = itemsRes.data || [];
    const payments = paymentsRes.data || [];

    const gross = grossOf(sale);
    const vat = vatOf(sale);
    const credit = isCreditSale(sale);
    const real = payments.filter((p) => normalizeMethod(p.method) !== 'credit').reduce((t, p) => t + num(p.amount), 0);
    const paid = credit ? Math.min(real, gross) : payments.length ? Math.min(real, gross) : paidOf(sale);
    const baki = Math.max(0, gross - paid);

    const itemsTable = table(
      ['Bidhaa', 'Idadi', 'Bei', 'Jumla'],
      items.map((it) => [
        `<strong>${esc(it.product_name)}</strong>`,
        String(num(it.quantity)),
        money(it.unit_price),
        `<strong>${money(num(it.line_total) || num(it.quantity) * num(it.unit_price))}</strong>`
      ]),
      'Hakuna bidhaa kwenye risiti hii'
    );

    const totals = summary([
      ['Subtotal', money(sale.subtotal)],
      ['Discount', money(sale.discount)],
      vat > 0 ? [`VAT (${num(sale.vat_percent)}%)`, money(vat)] : null,
      ['Jumla', `<span style="font-size:18px;color:#1456c0;">${money(gross)}</span>`],
      ['Njia ya malipo', esc(methodLabel(sale.payment_method))],
      [credit ? 'Kilicholipwa' : 'Kilichopokelewa', money(paid)],
      [credit ? 'Kiasi cha mkopo' : 'Baki', money(baki), baki > 0 ? '#991b1b' : ''],
      ['Hali', statusBadge(sale)]
    ]);

    const paymentsHtml = payments.length
      ? '<h4>Malipo yaliyopokelewa</h4>' +
        table(['Njia', 'Kiasi', 'Tarehe'], payments.map((p) => [esc(methodLabel(p.method)), money(p.amount), fmtDateTime(p.created_at)]))
      : '';

    const receipt = `
      <div id="ui-receipt">
        <div class="ui-receipt-head">
          <h3>StationeryPro</h3>
          <div>Risiti Namba: <strong>${esc(sale.receipt_number)}</strong></div>
          <div>${fmtDateTime(sale.created_at)}</div>
          <div>Mfanyakazi: ${esc(cashierName(sale))}</div>
        </div>
        ${itemsTable}
        <div style="margin-top:14px;">${totals}</div>
        ${paymentsHtml}
      </div>`;

    modal.set(
      `Risiti ${sale.receipt_number}`,
      modal.toolbar(`<button type="button" class="btn btn-primary btn-sm" data-action="print-receipt">${icon('printer', 16)} Print Risiti</button>`) + receipt
    );
  } catch (error) {
    console.error('Receipt error:', error);
    modal.set('Risiti', modal.toolbar() + `<div class="ui-note">Hitilafu: ${esc(error.message)}</div>`);
  }
}

/* ---------- Madirisha ya vibox vya fedha ---------- */
const expensesTable = (expenses) =>
  table(
    ['Tarehe', 'Maelezo', 'Kategoria', 'Njia ya malipo', 'Kiasi', 'Maelezo ya ziada'],
    expenses.map((e) => [
      fmtDate(e.expense_date || e.created_at),
      esc(e.description || e.title || '-'),
      esc(e.category || '-'),
      esc(e.payment_method || '-'),
      `<strong>${money(e.amount)}</strong>`,
      esc(e.notes || '')
    ]),
    'Hakuna matumizi kwa kipindi hiki'
  );

const breakdown = (f) =>
  summary([
    ['Jumla ya mauzo (bila VAT, baada ya discount)', money(f.revenue)],
    ['Gharama ya bidhaa zilizouzwa', `- ${money(f.cogs)}`],
    ['Faida ya bidhaa (kabla ya matumizi)', money(f.grossProfit)],
    ['Matumizi', `- ${money(f.expensesTotal)}`],
    [f.net >= 0 ? 'Faida halisi' : 'Hasara halisi', money(Math.abs(f.net)), f.net >= 0 ? '#166534' : '#991b1b']
  ]);

const productProfitTable = (items) =>
  table(
    ['Bidhaa', 'Idadi', 'Mauzo', 'Gharama', 'Faida'],
    productProfitRows(items).map((r) => [
      `<strong>${esc(r.name)}</strong>`, String(r.qty), money(r.rev), money(r.cost), `<strong>${money(r.rev - r.cost)}</strong>`
    ]),
    'Hakuna mauzo kwa kipindi hiki'
  );

export function openFinanceBox(modal, key, f) {
  if (!f) {
    modal.open('Taarifa', '<div class="empty-state">Data bado inapakia au imeshindikana kupakia.</div>');
    return;
  }
  const L = f.label || '';
  const hint = '<p class="hint">Bofya namba ya risiti kuona risiti nzima.</p>';

  switch (key) {
    case 'fin-sales':
    case 'fin-count':
      modal.open(
        `${key === 'fin-sales' ? 'Mauzo' : 'Idadi ya Risiti'} - ${L}`,
        summary([
          ['Jumla ya mauzo (pamoja na VAT)', money(f.grossSales)],
          ['Idadi ya risiti', String(f.sales.length)]
        ]) + hint + salesTable(f.sales)
      );
      break;

    case 'fin-avg': {
      const sorted = [...f.sales].sort((a, b) => grossOf(b) - grossOf(a));
      const avg = f.sales.length ? f.grossSales / f.sales.length : 0;
      modal.open(
        `Wastani kwa Risiti - ${L}`,
        summary([
          ['Wastani kwa risiti', money(avg)],
          ['Risiti kubwa zaidi', money(sorted[0] ? grossOf(sorted[0]) : 0)],
          ['Risiti ndogo zaidi', money(sorted.length ? grossOf(sorted[sorted.length - 1]) : 0)]
        ]) + '<h4>Risiti 20 kubwa zaidi</h4>' + hint + salesTable(sorted.slice(0, 20))
      );
      break;
    }

    case 'fin-discount': {
      const list = f.sales.filter((s) => num(s.discount) > 0);
      modal.open(
        `Discount - ${L}`,
        summary([['Jumla ya discount', money(f.discount)], ['Risiti zenye discount', String(list.length)]]) + hint +
          table(
            ['Risiti', 'Tarehe', 'Subtotal', 'Discount', 'Jumla'],
            list.map((s) => [receiptLink(s, 'strong'), fmtDateTime(s.created_at), money(s.subtotal), money(s.discount), money(grossOf(s))]),
            'Hakuna discount kwa kipindi hiki'
          )
      );
      break;
    }

    case 'fin-vat': {
      const list = f.sales.filter((s) => vatOf(s) > 0);
      modal.open(
        `VAT - ${L}`,
        summary([['VAT iliyokusanywa', money(f.vat)], ['Risiti zenye VAT', String(list.length)]]) + hint +
          table(
            ['Risiti', 'Tarehe', 'Asilimia', 'VAT', 'Jumla pamoja na VAT'],
            list.map((s) => [receiptLink(s, 'strong'), fmtDateTime(s.created_at), `${num(s.vat_percent)}%`, money(vatOf(s)), money(grossOf(s))]),
            'Hakuna VAT kwa kipindi hiki'
          )
      );
      break;
    }

    case 'fin-cogs':
      modal.open(
        `Gharama ya Bidhaa - ${L}`,
        summary([['Gharama ya bidhaa zilizouzwa', money(f.cogs)]]) +
          table(
            ['Bidhaa', 'Idadi', 'Gharama'],
            productProfitRows(f.items).sort((a, b) => b.cost - a.cost).map((r) => [`<strong>${esc(r.name)}</strong>`, String(r.qty), money(r.cost)]),
            'Hakuna mauzo kwa kipindi hiki'
          )
      );
      break;

    case 'fin-grossprofit':
    case 'fin-profit':
      modal.open(
        `${key === 'fin-profit' ? 'Faida Halisi' : 'Faida Ghafi'} - ${L}`,
        breakdown(f) + '<h4>Faida kwa bidhaa</h4>' + productProfitTable(f.items) +
          '<p class="hint">Faida inahesabiwa kwa mauzo yote ya kipindi, pamoja na ya mkopo. Faida kwa bidhaa haijajumuisha discount.</p>'
      );
      break;

    case 'fin-loss': {
      const below = f.items
        .filter((it) => num(it.unit_cost) > 0 && num(it.unit_price) < num(it.unit_cost))
        .map((it) => [
          `<strong>${esc(it.product_name)}</strong>`, String(num(it.quantity)), money(it.unit_price), money(it.unit_cost),
          money((num(it.unit_cost) - num(it.unit_price)) * num(it.quantity))
        ]);
      modal.open(
        `Hasara - ${L}`,
        breakdown(f) +
          (f.net >= 0 ? '<p class="hint">Hakuna hasara kwa kipindi hiki: mauzo yamevuka gharama na matumizi.</p>' : '') +
          '<h4>Bidhaa zilizouzwa chini ya gharama</h4>' +
          table(['Bidhaa', 'Idadi', 'Bei ya kuuzia', 'Gharama', 'Hasara'], below, 'Hakuna bidhaa iliyouzwa chini ya gharama') +
          '<h4>Matumizi ya kipindi</h4>' + expensesTable(f.expenses)
      );
      break;
    }

    case 'fin-expenses': {
      const cats = groupSum(f.expenses, (e) => e.category || 'Nyingine', (e) => num(e.amount));
      modal.open(
        `Matumizi - ${L}`,
        summary([['Jumla ya matumizi', money(f.expensesTotal)], ['Idadi', String(f.expenses.length)]]) +
          '<h4>Kwa kategoria</h4>' +
          table(['Kategoria', 'Idadi', 'Kiasi'], cats.map((c) => [esc(c.key), String(c.count), `<strong>${money(c.total)}</strong>`]), 'Hakuna matumizi') +
          '<h4>Orodha ya matumizi</h4>' + expensesTable(f.expenses)
      );
      break;
    }

    default: {
      if (!key.startsWith('pay-')) return;
      const method = key.slice(4);

      if (method === 'credit') {
        modal.open(
          `Mkopo - ${L}`,
          summary([['Jumla ya mikopo', money(f.credit.amount)], ['Idadi ya risiti', String(f.credit.count)]]) + hint +
            table(
              ['Risiti', 'Tarehe', 'Mfanyakazi', 'Jumla ya risiti', 'Aina', 'Kiasi cha mkopo'],
              f.creditRows.map((r) => [
                receiptLink(r.sale, 'strong'), fmtDateTime(r.sale.created_at), esc(cashierName(r.sale)),
                money(grossOf(r.sale)), r.creditSale ? 'Mauzo ya mkopo' : 'Baki ya malipo kiasi', `<strong>${money(r.amount)}</strong>`
              ]),
              'Hakuna mikopo kwa kipindi hiki'
            )
        );
        return;
      }

      const def = PAY_DEFS.find((d) => d.key === method);
      const list = f.payRows.filter((r) => (method === 'other' ? !KNOWN_METHODS.includes(r.method) : r.method === method));
      const total = list.reduce((t, r) => t + r.amount, 0);
      modal.open(
        `${def ? def.label : 'Nyingine'} - ${L}`,
        summary([['Jumla', money(total)], ['Idadi ya malipo', String(list.length)]]) + hint +
          table(
            ['Risiti', 'Tarehe', 'Mfanyakazi', 'Kiasi'],
            list.map((r) => {
              const s = f.salesById.get(r.sale_id);
              return [s ? receiptLink(s, 'strong') : '<strong>-</strong>', fmtDateTime(r.created_at), s ? esc(cashierName(s)) : '-', `<strong>${money(r.amount)}</strong>`];
            }),
            'Hakuna malipo kwa njia hii'
          )
      );
    }
  }
}