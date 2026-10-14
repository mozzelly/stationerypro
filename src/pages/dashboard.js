import { supabase } from '../lib/supabase.js';

/* ---------- Icons (SVG, hakuna emoji) ---------- */
const ICONS = {
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
  'zap': '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  'plus': '<path d="M5 12h14"/><path d="M12 5v14"/>',
  'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  'arrow-up-right': '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  'arrow-down-right': '<path d="m7 7 10 10"/><path d="M17 7v10H7"/>'
};

function icon(name, size = 24) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

/* ---------- Mipangilio ---------- */
const PERIODS = { today: 'Leo', week: 'Wiki hii', month: 'Mwezi huu', year: 'Mwaka huu' };

const PAY_DEFS = [
  { key: 'cash', label: 'Cash', ic: 'banknote', bg: '#dcfce7', color: '#166534' },
  { key: 'mobile_money', label: 'Mobile Money', ic: 'smartphone', bg: '#dbeafe', color: '#1e40af' },
  { key: 'card', label: 'Card', ic: 'credit-card', bg: '#ede9fe', color: '#5b21b6' },
  { key: 'bank', label: 'Bank', ic: 'landmark', bg: '#fef3c7', color: '#92400e' },
  { key: 'credit', label: 'Mkopo (Baki)', ic: 'clock', bg: '#fee2e2', color: '#991b1b' }
];
const KNOWN_METHODS = ['cash', 'mobile_money', 'card', 'bank'];

let state = { products: [], todaySales: [], fin: null };

/* ---------- Vitu vya kusaidia ---------- */
const num = (v) => Number(v) || 0;
const money = (v) => window.money(num(v));
const sum = (arr, key) => arr.reduce((t, x) => t + num(x[key]), 0);
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('sw-TZ') : '-');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('sw-TZ') : '-');
const isCancelled = (s) =>
  ['cancelled', 'canceled', 'void', 'voided', 'refunded'].includes(String(s.status || '').toLowerCase());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const setText = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

// Kilicholipwa na baki: sales haina safu ya balance, kwa hiyo tunahesabu
// kutoka payment_status na amount_paid.
const paidOf = (s) => {
  if (s.payment_status === 'paid') return num(s.total);
  if (s.amount_paid != null) return Math.min(num(s.amount_paid), num(s.total));
  return 0;
};
const balanceOf = (s) => Math.max(0, num(s.total) - paidOf(s));

function periodRange(key) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (key === 'week') start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  if (key === 'month') start.setDate(1);
  if (key === 'year') start.setMonth(0, 1);
  return { from: start, to: addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 1) };
}

async function fetchAll(build) {
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

async function fetchByIds(table, column, ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const { data, error } = await supabase.from(table).select('*').in(column, ids.slice(i, i + 50));
    if (error) throw error;
    out.push(...(data || []));
  }
  return out;
}

function table(headers, rows, empty = 'Hakuna data') {
  if (!rows.length) return `<div class="empty-state">${empty}</div>`;
  return `<div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('')}</tbody></table></div>`;
}

function summary(pairs) {
  return `<div class="dash-summary">${pairs
    .map(
      ([l, v, c]) =>
        `<div class="dash-summary-row"><span>${l}</span><strong${c ? ` style="color:${c}"` : ''}>${v}</strong></div>`
    )
    .join('')}</div>`;
}

function statusBadge(s) {
  const st = s.payment_status || 'unpaid';
  if (st === 'paid') return '<span class="badge badge-success">Imelipwa</span>';
  if (st === 'partial') return '<span class="badge badge-warning">Imelipwa Kiasi</span>';
  return '<span class="badge badge-danger">Haijalipwa</span>';
}

function salesTable(list) {
  return table(
    ['Risiti', 'Tarehe', 'Mfanyakazi', 'Jumla', 'Imelipwa', 'Baki', 'Hali'],
    list.map((s) => [
      `<strong>${esc(s.receipt_number)}</strong>`,
      fmtDateTime(s.created_at),
      esc(s.profiles?.full_name || '-'),
      money(s.total),
      money(paidOf(s)),
      money(balanceOf(s)),
      statusBadge(s)
    ]),
    'Hakuna mauzo'
  );
}

/* ---------- Vibox ---------- */
function statBox({ key, ic, bg, color, label, valueId, value = 'TSh 0', subHtml = '' }) {
  return `
    <div class="stat-card clickable" data-box="${key}" role="button" tabindex="0">
      <div class="stat-icon" style="background:${bg};color:${color};">${icon(ic)}</div>
      <div class="stat-content">
        <p class="stat-label">${label}</p>
        <h3 class="stat-value" id="${valueId}">${value}</h3>
        ${subHtml}
      </div>
    </div>`;
}

function payCardsHtml(fin) {
  const cards = PAY_DEFS.map((d) => {
    let amount = 0;
    let count = 0;
    if (fin) {
      const t = d.key === 'credit' ? fin.credit : fin.payTotals[d.key];
      amount = t.amount;
      count = t.count;
    }
    const sub = d.key === 'credit' ? `${count} risiti zenye deni` : `${count} malipo`;
    return statBox({
      key: `pay-${d.key}`,
      ic: d.ic,
      bg: d.bg,
      color: d.color,
      label: d.label,
      valueId: `pay-val-${d.key}`,
      value: money(amount),
      subHtml: `<span class="stat-change"><span>${sub}</span></span>`
    });
  });
  if (fin && fin.other.count > 0) {
    cards.push(
      statBox({
        key: 'pay-other',
        ic: 'circle-help',
        bg: '#e5e7eb',
        color: '#374151',
        label: 'Nyingine',
        valueId: 'pay-val-other',
        value: money(fin.other.amount),
        subHtml: `<span class="stat-change"><span>${fin.other.count} malipo</span></span>`
      })
    );
  }
  return cards.join('');
}

/* ---------- Ukurasa mkuu ---------- */
export async function renderDashboard(root, user, profile) {
  state = { products: [], todaySales: [], fin: null };

  root.innerHTML = `
    <div class="dashboard-container">
      <style>
        .stat-card.clickable { cursor: pointer; min-width: 0; overflow: hidden; transition: transform .12s ease, box-shadow .12s ease; }
        .stat-card.clickable:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(20, 86, 192, .14); }
        .stat-card.clickable:focus-visible { outline: 2px solid #1456c0; outline-offset: 2px; }
        .stat-card.clickable .stat-content { min-width: 0; flex: 1; max-width: 100%; }
        .stat-card.clickable .stat-value { font-size: clamp(16px, 1.4vw, 22px) !important; line-height: 1.25; white-space: normal !important; overflow-wrap: anywhere; }
        #pay-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
        #pay-grid .stat-card.clickable { flex-direction: column; align-items: flex-start; gap: 10px; }
        #pay-grid .stat-card.clickable .stat-content { width: 100%; }
        .fin-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin: 28px 0 12px; }
        .fin-toolbar h2 { margin: 0; font-size: 18px; }
        .dash-note { padding: 10px 12px; border-radius: 8px; background: #fff1f0; color: #912018; font-size: 13px; margin-bottom: 12px; overflow-wrap: anywhere; }
        .dash-summary { border: 1px solid #e1eae4; border-radius: 10px; padding: 6px 14px; margin-bottom: 16px; background: #fafcff; }
        .dash-summary-row { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px dashed #e1eae4; }
        .dash-summary-row:last-child { border-bottom: none; }
        .dash-modal-body h4 { margin: 18px 0 8px; }
        .dash-modal-body .hint { color: #68786e; font-size: 13px; margin: 8px 0; }
      </style>

      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-title">Karibu, ${esc(profile.full_name || 'Mmiliki')}</h1>
          <p class="dashboard-subtitle">Hapa kuna muhtasari wa biashara yako leo</p>
        </div>
        <div class="dashboard-date">
          <span id="current-date"></span>
        </div>
      </div>

      <div id="dash-errors"></div>

      <div class="stats-grid">
        ${statBox({
          key: 'today-sales', ic: 'dollar-sign', bg: '#dbeafe', color: '#1e40af',
          label: 'Mauzo ya Leo', valueId: 'today-sales',
          subHtml: `<span class="stat-change positive" id="sales-change-wrap">${icon('arrow-up-right', 14)}<span id="sales-change">-</span></span>`
        })}
        ${statBox({
          key: 'today-count', ic: 'shopping-cart', bg: '#dcfce7', color: '#166534',
          label: 'Idadi ya Mauzo', valueId: 'today-transactions', value: '0',
          subHtml: `<span class="stat-change positive">${icon('arrow-up-right', 14)}<span>Leo</span></span>`
        })}
        ${statBox({
          key: 'products', ic: 'package', bg: '#fef3c7', color: '#92400e',
          label: 'Bidhaa Zote', valueId: 'total-products', value: '0',
          subHtml: `<span class="stat-change"><span>Jumla ya stock</span></span>`
        })}
        ${statBox({
          key: 'low-stock', ic: 'alert-triangle', bg: '#fee2e2', color: '#991b1b',
          label: 'Stock Chini', valueId: 'low-stock-count', value: '0',
          subHtml: `<span class="stat-change negative">${icon('arrow-down-right', 14)}<span>Inahitaji kuagizwa</span></span>`
        })}
      </div>

      <div class="fin-toolbar">
        <h2>Muhtasari wa Fedha</h2>
        <select id="fin-period" style="padding:8px 12px;border:1px solid #dbe3ef;border-radius:8px;background:#fff;">
          ${Object.entries(PERIODS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
        </select>
      </div>

      <div class="stats-grid">
        ${statBox({
          key: 'fin-sales', ic: 'dollar-sign', bg: '#dbeafe', color: '#1e40af',
          label: 'Jumla ya Mauzo', valueId: 'fin-sales',
          subHtml: `<span class="stat-change"><span id="fin-sales-sub">${PERIODS.today}</span></span>`
        })}
        ${statBox({
          key: 'fin-profit', ic: 'trending-up', bg: '#dcfce7', color: '#166534',
          label: 'Faida', valueId: 'fin-profit',
          subHtml: `<span class="stat-change positive"><span id="fin-profit-sub">Baada ya matumizi</span></span>`
        })}
        ${statBox({
          key: 'fin-loss', ic: 'trending-down', bg: '#fee2e2', color: '#991b1b',
          label: 'Hasara', valueId: 'fin-loss',
          subHtml: `<span class="stat-change negative"><span id="fin-loss-sub">Matumizi yakizidi faida</span></span>`
        })}
        ${statBox({
          key: 'fin-expenses', ic: 'wallet', bg: '#fef3c7', color: '#92400e',
          label: 'Matumizi', valueId: 'fin-expenses',
          subHtml: `<span class="stat-change"><span id="fin-expenses-sub">${PERIODS.today}</span></span>`
        })}
      </div>

      <div class="fin-toolbar">
        <h2>Mapato kwa Njia ya Malipo</h2>
        <span class="muted" id="fin-period-label">${PERIODS.today}</span>
      </div>
      <div class="stats-grid" id="pay-grid">${payCardsHtml(null)}</div>

      <div class="dashboard-grid" style="margin-top: 24px;">
        <div class="dashboard-panel">
          <div class="panel-header">
            <h3>${icon('trending-up', 18)} Mauzo ya Hivi Karibuni</h3>
            <a href="#sales" class="btn-link">Tazama Zote →</a>
          </div>
          <div id="recent-sales">
            <div class="empty-state">Inapakia...</div>
          </div>
        </div>

        <div class="dashboard-panel">
          <div class="panel-header">
            <h3>${icon('alert-triangle', 18)} Bidhaa zenye Stock Chini</h3>
            <a href="#products" class="btn-link">Tazama Zote →</a>
          </div>
          <div id="low-stock-products">
            <div class="empty-state">Inapakia...</div>
          </div>
        </div>
      </div>

      <div class="quick-actions-panel">
        <h3>${icon('zap', 18)} Vitendo vya Haraka</h3>
        <div class="quick-actions-grid">
          <a href="#pos" class="quick-action">${icon('shopping-cart')}<span>Fanya Mauzo</span></a>
          <a href="#products" class="quick-action">${icon('plus')}<span>Ongeza Bidhaa</span></a>
          <a href="#reports" class="quick-action">${icon('file-text')}<span>Ripoti</span></a>
          <a href="#users" class="quick-action">${icon('users')}<span>Watumiaji</span></a>
        </div>
      </div>

      <div id="dash-modal" class="modal-overlay" style="display:none;">
        <div class="modal" style="max-width:880px;width:95%;max-height:90vh;display:flex;flex-direction:column;">
          <div class="modal-header">
            <h3 id="dash-modal-title"></h3>
            <button class="modal-close" id="dash-modal-close" aria-label="Funga">×</button>
          </div>
          <div class="modal-body dash-modal-body" id="dash-modal-body" style="overflow:auto;"></div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="dash-modal-cancel">Funga</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const container = root.querySelector('.dashboard-container');

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  setText('current-date', new Date().toLocaleDateString('sw-TZ', options));

  // Matukio
  container.addEventListener('click', (e) => {
    const box = e.target.closest('[data-box]');
    if (box && container.contains(box)) openBox(box.dataset.box);
  });
  container.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const box = e.target.closest('[data-box]');
    if (box) {
      e.preventDefault();
      openBox(box.dataset.box);
    }
  });
  document.getElementById('dash-modal-close').addEventListener('click', closeModal);
  document.getElementById('dash-modal-cancel').addEventListener('click', closeModal);
  document.getElementById('dash-modal').addEventListener('click', (e) => {
    if (e.target.id === 'dash-modal') closeModal();
  });
  document.getElementById('fin-period').addEventListener('change', loadFinance);

  if (window.__dashEscHandler) document.removeEventListener('keydown', window.__dashEscHandler);
  window.__dashEscHandler = (e) => {
    if (e.key === 'Escape') closeModal();
  };
  document.addEventListener('keydown', window.__dashEscHandler);

  await loadDashboardData();
  await loadFinance();
}

/* ---------- Dirisha la maelezo ---------- */
function openModal(title, bodyHtml) {
  const modal = document.getElementById('dash-modal');
  if (!modal) return;
  document.getElementById('dash-modal-title').textContent = title;
  document.getElementById('dash-modal-body').innerHTML = bodyHtml;
  modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('dash-modal');
  if (modal) modal.style.display = 'none';
}

function addError(msg) {
  const box = document.getElementById('dash-errors');
  if (box) box.insertAdjacentHTML('beforeend', `<div class="dash-note">${esc(msg)}</div>`);
}

/* ---------- Data ya leo, bidhaa, mauzo ya karibuni ---------- */
async function loadDashboardData() {
  // Mauzo ya leo na jana
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = addDays(todayStart, -1);
    const tomorrowStart = addDays(todayStart, 1);

    const all = (
      await fetchAll((a, b) =>
        supabase
          .from('sales')
          .select('*, profiles(full_name)')
          .gte('created_at', yesterdayStart.toISOString())
          .lt('created_at', tomorrowStart.toISOString())
          .order('created_at', { ascending: false })
          .range(a, b)
      )
    ).filter((s) => !isCancelled(s));

    const todaySales = all.filter((s) => new Date(s.created_at) >= todayStart);
    const yesterdaySales = all.filter((s) => new Date(s.created_at) < todayStart);
    state.todaySales = todaySales;

    const todayTotal = sum(todaySales, 'total');
    const yesterdayTotal = sum(yesterdaySales, 'total');

    setText('today-sales', money(todayTotal));
    setText('today-transactions', String(todaySales.length));

    const wrap = document.getElementById('sales-change-wrap');
    if (wrap) {
      if (yesterdayTotal > 0) {
        const pct = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
        const up = pct >= 0;
        wrap.className = `stat-change ${up ? 'positive' : 'negative'}`;
        wrap.innerHTML = `${icon(up ? 'arrow-up-right' : 'arrow-down-right', 14)}<span>${up ? '+' : ''}${pct.toFixed(0)}% dhidi ya jana</span>`;
      } else {
        wrap.className = 'stat-change';
        wrap.innerHTML = '<span>Hakuna mauzo jana</span>';
      }
    }
  } catch (error) {
    console.error('Dashboard sales error:', error);
    addError(`Mauzo ya leo: ${error.message}`);
  }

  // Bidhaa
  try {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) throw error;

    const products = (data || []).filter((p) => p.is_active !== false);
    state.products = products;
    setText('total-products', String(products.length));

    const lowStock = products.filter(
      (p) => p.reorder_level != null && num(p.stock_quantity) <= num(p.reorder_level)
    );
    setText('low-stock-count', String(lowStock.length));

    const lowStockContainer = document.getElementById('low-stock-products');
    if (lowStock.length === 0) {
      lowStockContainer.innerHTML = `<div class="empty-state">${icon('check-circle', 16)} Hakuna bidhaa zenye stock chini</div>`;
    } else {
      lowStockContainer.innerHTML = lowStock
        .slice(0, 5)
        .map(
          (p) => `
          <div class="low-stock-item">
            <div class="low-stock-info">
              <strong>${esc(p.name || 'Bidhaa')}</strong>
              <small>Stock: ${num(p.stock_quantity)} / Min: ${num(p.reorder_level)}</small>
            </div>
            <span class="badge badge-warning">Chini</span>
          </div>`
        )
        .join('');
    }
  } catch (error) {
    console.error('Dashboard products error:', error);
    addError(`Bidhaa: ${error.message}`);
  }

  // Mauzo ya hivi karibuni
  try {
    const { data: recentSales, error } = await supabase
      .from('sales')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(5);
    if (error) throw error;

    const recentContainer = document.getElementById('recent-sales');
    if (recentSales && recentSales.length > 0) {
      recentContainer.innerHTML = recentSales
        .map(
          (s) => `
          <div class="recent-sale-item">
            <div class="recent-sale-info">
              <strong>${esc(s.receipt_number)}</strong>
              <small>${fmtDateTime(s.created_at)}</small>
            </div>
            <div class="recent-sale-amount">
              <strong>${money(s.total)}</strong>
              <span class="badge ${s.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}">
                ${s.payment_status === 'paid' ? 'Imelipwa' : 'Inasubiri'}
              </span>
            </div>
          </div>`
        )
        .join('');
    } else {
      recentContainer.innerHTML = '<div class="empty-state">Hakuna mauzo ya hivi karibuni</div>';
    }
  } catch (error) {
    console.error('Dashboard recent sales error:', error);
    addError(`Mauzo ya hivi karibuni: ${error.message}`);
  }
}

/* ---------- Fedha: faida, hasara, matumizi, njia za malipo ---------- */
async function loadFinance() {
  const select = document.getElementById('fin-period');
  if (!select) return;
  const key = select.value;
  const label = PERIODS[key];
  const { from, to } = periodRange(key);

  ['fin-sales', 'fin-profit', 'fin-loss', 'fin-expenses'].forEach((id) => setText(id, '...'));
  setText('fin-period-label', label);

  try {
    const sales = (
      await fetchAll((a, b) =>
        supabase
          .from('sales')
          .select('*, profiles(full_name)')
          .gte('created_at', from.toISOString())
          .lt('created_at', to.toISOString())
          .order('created_at', { ascending: false })
          .range(a, b)
      )
    ).filter((s) => !isCancelled(s));

    const ids = sales.map((s) => s.id);
    const [items, payments, expenses] = await Promise.all([
      fetchByIds('sale_items', 'sale_id', ids),
      fetchByIds('payments', 'sale_id', ids),
      fetchAll((a, b) =>
        supabase
          .from('expenses')
          .select('*')
          .gte('expense_date', ymd(from))
          .lt('expense_date', ymd(to))
          .order('expense_date', { ascending: false })
          .range(a, b)
      )
    ]);

    const revenue = sum(sales, 'total');
    const cogs = items.reduce((t, it) => t + num(it.quantity) * num(it.unit_cost), 0);
    const expensesTotal = sum(expenses, 'amount');
    const gross = revenue - cogs;
    const net = gross - expensesTotal;

    // Malipo: tumia table ya payments kama safu zipo; vinginevyo tumia
    // payment_method ya sales na kiasi kilichopokelewa.
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
          const m = String(p.method || '').toLowerCase();
          if (m === 'credit') return;
          payRows.push({ sale_id: s.id, method: m || 'other', amount: num(p.amount), created_at: p.created_at || s.created_at });
        });
      } else {
        const paid = paidOf(s);
        if (paid > 0) {
          const m = String(s.payment_method || '').toLowerCase();
          payRows.push({
            sale_id: s.id,
            method: !m || m === 'credit' ? 'other' : m,
            amount: paid,
            created_at: s.created_at
          });
        }
      }
    });

    const payTotals = {};
    KNOWN_METHODS.forEach((k) => (payTotals[k] = { amount: 0, count: 0 }));
    const other = { amount: 0, count: 0 };
    payRows.forEach((r) => {
      const target = payTotals[r.method] || other;
      target.amount += r.amount;
      target.count += 1;
    });

    const creditSales = sales.filter((s) => balanceOf(s) > 0);
    const credit = {
      amount: creditSales.reduce((t, s) => t + balanceOf(s), 0),
      count: creditSales.length
    };

    state.fin = {
      label, sales, items, payRows, expenses,
      salesById: new Map(sales.map((s) => [s.id, s])),
      revenue, cogs, gross, expensesTotal, net, payTotals, other, credit, creditSales
    };

    setText('fin-sales', money(revenue));
    setText('fin-profit', money(Math.max(net, 0)));
    setText('fin-loss', money(Math.max(-net, 0)));
    setText('fin-expenses', money(expensesTotal));
    setText('fin-sales-sub', `${label} · risiti ${sales.length}`);
    setText('fin-expenses-sub', `${label} · ${expenses.length} matumizi`);

    const grid = document.getElementById('pay-grid');
    if (grid) grid.innerHTML = payCardsHtml(state.fin);
  } catch (error) {
    console.error('Dashboard finance error:', error);
    state.fin = null;
    ['fin-sales', 'fin-profit', 'fin-loss', 'fin-expenses'].forEach((id) => setText(id, 'TSh 0'));
    addError(`Fedha: ${error.message}`);
  }
}

/* ---------- Maudhui ya madirisha ya vibox ---------- */
function productProfitRows(items) {
  const map = new Map();
  items.forEach((it) => {
    const k = it.product_name || '-';
    const row = map.get(k) || { name: k, qty: 0, rev: 0, cost: 0 };
    row.qty += num(it.quantity);
    row.rev += num(it.line_total) || num(it.quantity) * num(it.unit_price);
    row.cost += num(it.quantity) * num(it.unit_cost);
    map.set(k, row);
  });
  return [...map.values()].sort((a, b) => b.rev - b.cost - (a.rev - a.cost));
}

function expensesTable(expenses) {
  return table(
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
}

function breakdown(f) {
  return summary([
    ['Jumla ya mauzo (baada ya discount)', money(f.revenue)],
    ['Gharama ya bidhaa zilizouzwa', `- ${money(f.cogs)}`],
    ['Faida ya bidhaa (kabla ya matumizi)', money(f.gross)],
    ['Matumizi', `- ${money(f.expensesTotal)}`],
    [f.net >= 0 ? 'Faida halisi' : 'Hasara halisi', money(Math.abs(f.net)), f.net >= 0 ? '#166534' : '#991b1b']
  ]);
}

function openBox(key) {
  const f = state.fin;
  const needFin = () => {
    openModal('Taarifa', '<div class="empty-state">Data ya fedha bado inapakia au imeshindikana kupakia.</div>');
  };

  switch (key) {
    case 'today-sales':
    case 'today-count': {
      const list = state.todaySales;
      openModal(
        key === 'today-sales' ? 'Mauzo ya Leo' : 'Idadi ya Mauzo ya Leo',
        summary([['Jumla ya mauzo', money(sum(list, 'total'))], ['Idadi ya risiti', String(list.length)]]) +
          salesTable(list)
      );
      break;
    }

    case 'products': {
      const list = state.products;
      openModal(
        'Bidhaa Zote',
        table(
          ['Jina', 'Kategoria', 'Stock', 'Bei ya kununulia', 'Bei ya kuuzia'],
          list.map((p) => [
            `<strong>${esc(p.name)}</strong>`,
            esc(p.category || '-'),
            String(num(p.stock_quantity)),
            money(p.cost_price),
            money(p.selling_price)
          ]),
          'Hakuna bidhaa'
        )
      );
      break;
    }

    case 'low-stock': {
      const list = state.products.filter(
        (p) => p.reorder_level != null && num(p.stock_quantity) <= num(p.reorder_level)
      );
      openModal(
        'Bidhaa zenye Stock Chini',
        table(
          ['Jina', 'Stock iliyopo', 'Kiwango cha chini', 'Upungufu'],
          list.map((p) => [
            `<strong>${esc(p.name)}</strong>`,
            String(num(p.stock_quantity)),
            String(num(p.reorder_level)),
            String(Math.max(0, num(p.reorder_level) - num(p.stock_quantity)))
          ]),
          'Hakuna bidhaa zenye stock chini'
        )
      );
      break;
    }

    case 'fin-sales': {
      if (!f) return needFin();
      openModal(
        `Mauzo - ${f.label}`,
        summary([['Jumla ya mauzo', money(f.revenue)], ['Idadi ya risiti', String(f.sales.length)]]) +
          salesTable(f.sales)
      );
      break;
    }

    case 'fin-profit': {
      if (!f) return needFin();
      const rows = productProfitRows(f.items).map((r) => [
        `<strong>${esc(r.name)}</strong>`,
        String(r.qty),
        money(r.rev),
        money(r.cost),
        `<strong>${money(r.rev - r.cost)}</strong>`
      ]);
      openModal(
        `Faida - ${f.label}`,
        breakdown(f) +
          '<h4>Faida kwa bidhaa</h4>' +
          table(['Bidhaa', 'Idadi', 'Mauzo', 'Gharama', 'Faida'], rows, 'Hakuna mauzo kwa kipindi hiki') +
          '<p class="hint">Faida inahesabiwa kwa mauzo yote ya kipindi, pamoja na yale ya mkopo. Faida kwa bidhaa haijajumuisha discount.</p>'
      );
      break;
    }

    case 'fin-loss': {
      if (!f) return needFin();
      const below = f.items
        .filter((it) => num(it.unit_cost) > 0 && num(it.unit_price) < num(it.unit_cost))
        .map((it) => [
          `<strong>${esc(it.product_name)}</strong>`,
          String(num(it.quantity)),
          money(it.unit_price),
          money(it.unit_cost),
          money((num(it.unit_cost) - num(it.unit_price)) * num(it.quantity))
        ]);
      openModal(
        `Hasara - ${f.label}`,
        breakdown(f) +
          (f.net >= 0
            ? '<p class="hint">Hakuna hasara kwa kipindi hiki: mauzo yamevuka gharama na matumizi.</p>'
            : '') +
          '<h4>Bidhaa zilizouzwa chini ya gharama</h4>' +
          table(['Bidhaa', 'Idadi', 'Bei ya kuuzia', 'Gharama', 'Hasara'], below, 'Hakuna bidhaa iliyouzwa chini ya gharama') +
          '<h4>Matumizi ya kipindi</h4>' +
          expensesTable(f.expenses)
      );
      break;
    }

    case 'fin-expenses': {
      if (!f) return needFin();
      openModal(
        `Matumizi - ${f.label}`,
        summary([['Jumla ya matumizi', money(f.expensesTotal)], ['Idadi', String(f.expenses.length)]]) +
          expensesTable(f.expenses)
      );
      break;
    }

    default: {
      if (!key.startsWith('pay-')) return;
      if (!f) return needFin();
      const method = key.slice(4);

      if (method === 'credit') {
        openModal(
          `Mkopo (Baki) - ${f.label}`,
          summary([['Jumla ya baki', money(f.credit.amount)], ['Risiti zenye deni', String(f.credit.count)]]) +
            salesTable(f.creditSales)
        );
        return;
      }

      const def = PAY_DEFS.find((d) => d.key === method);
      const list = f.payRows.filter((r) =>
        method === 'other' ? !KNOWN_METHODS.includes(r.method) : r.method === method
      );
      const total = list.reduce((t, r) => t + r.amount, 0);
      openModal(
        `${def ? def.label : 'Nyingine'} - ${f.label}`,
        summary([['Jumla', money(total)], ['Idadi ya malipo', String(list.length)]]) +
          table(
            ['Risiti', 'Tarehe', 'Mfanyakazi', 'Kiasi'],
            list.map((r) => {
              const s = f.salesById.get(r.sale_id) || {};
              return [
                `<strong>${esc(s.receipt_number || '-')}</strong>`,
                fmtDateTime(r.created_at),
                esc(s.profiles?.full_name || '-'),
                `<strong>${money(r.amount)}</strong>`
              ];
            }),
            'Hakuna malipo kwa njia hii'
          )
      );
    }
  }
}