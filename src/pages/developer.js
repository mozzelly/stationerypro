import { supabase } from '../lib/supabase.js';
import {
  esc, fmtDate, fmtDateTime, icon as baseIcon, ensureSharedStyles,
  table, summary, createDetailModal, downloadCsv
} from '../lib/shared.js';

const DEVELOPER_EMAIL = 'mussaelly1235@gmail.com';
const APP_URL = 'https://mozzelly.github.io/stationerypro/';
const DAY = 86400000;

/* ---------- Icons za ziada ---------- */
const EXTRA_ICONS = {
  'store': '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/>',
  'user-plus': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
  'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  'ban': '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  'activity': '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  'calendar': '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  'mail': '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  'check': '<path d="M20 6 9 17l-5-5"/>',
  'x-circle': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  'refresh': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'trash': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>'
};

function iconx(name, size = 24) {
  if (!EXTRA_ICONS[name]) return baseIcon(name, size);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${EXTRA_ICONS[name]}</svg>`;
}

/* ---------- Mipango ---------- */
const PLANS = {
  trial: { label: 'Majaribio', days: 14 },
  monthly: { label: 'Kila Mwezi', days: 30 },
  yearly: { label: 'Kila Mwaka', days: 365 },
  lifetime: { label: 'Kudumu', days: null }
};
const planLabel = (k) => (PLANS[k] ? PLANS[k].label : k || '-');
const planOptions = (selected) =>
  Object.entries(PLANS).map(([k, v]) => `<option value="${k}" ${k === selected ? 'selected' : ''}>${v.label}</option>`).join('');
const daysLeft = (p) => (p.plan_expires_at ? Math.ceil((new Date(p.plan_expires_at) - Date.now()) / DAY) : null);
const ymdLocal = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function planBadge(p) {
  const d = daysLeft(p);
  const label = esc(planLabel(p.plan));
  if (d === null) return `<span class="badge badge-success">${label}${p.plan === 'lifetime' ? '' : ' (bila mwisho)'}</span>`;
  if (d < 0) return `<span class="badge badge-danger">${label}: imeisha siku ${Math.abs(d)} zilizopita</span>`;
  if (d <= 7) return `<span class="badge badge-warning">${label}: siku ${d}</span>`;
  return `<span class="badge badge-success">${label}: siku ${d}</span>`;
}

/* ---------- Hali ya akaunti ---------- */
function statusBadge(p) {
  if (p.role === 'owner') {
    if (!p.is_approved && p.rejected_at) return '<span class="badge badge-danger">Amekataliwa</span>';
    if (!p.is_approved) return '<span class="badge badge-warning">Anasubiri</span>';
  }
  return p.active === false
    ? '<span class="badge badge-danger">Amefungwa</span>'
    : '<span class="badge badge-success">Active</span>';
}

/* ---------- Mawasiliano ---------- */
function waNumber(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '255' + d.slice(1);
  else if (d.length === 9) d = '255' + d;
  return d;
}

function messageFor(p, shop) {
  const name = p.full_name || 'Mteja';
  const shopTxt = shop ? ` (${shop})` : '';
  if (!p.is_approved && p.rejected_at) {
    return {
      subject: 'Ombi lako la StationeryPro',
      text: `Habari ${name}, samahani, ombi lako la StationeryPro${shopTxt} halijapitishwa.${p.rejection_reason ? ' Sababu: ' + p.rejection_reason + '.' : ''} Wasiliana nasi kwa maelezo zaidi.`
    };
  }
  if (p.is_approved && p.active === false) {
    return {
      subject: 'Akaunti yako ya StationeryPro',
      text: `Habari ${name}, akaunti yako ya StationeryPro${shopTxt} imefungwa kwa muda. Tafadhali wasiliana nasi ili kuifungua.`
    };
  }
  if (p.is_approved) {
    const exp = p.plan_expires_at ? ` Mpango wako (${planLabel(p.plan)}) unaisha ${fmtDate(p.plan_expires_at)}.` : '';
    return {
      subject: 'Akaunti yako ya StationeryPro imepitishwa',
      text: `Habari ${name}, hongera! Akaunti yako ya StationeryPro${shopTxt} imepitishwa. Ingia hapa: ${APP_URL}.${exp}`
    };
  }
  return {
    subject: 'Ombi lako la StationeryPro limepokelewa',
    text: `Habari ${name}, ombi lako la kutumia StationeryPro${shopTxt} limepokelewa. Tutakujulisha mara litakapopitishwa. Asante!`
  };
}

/* ---------- Hali ya ukurasa ---------- */
let ROOT = null;
let MODAL = null;
let USER = null;
const st = { profiles: [], shops: new Map(), stats: new Map(), statsOk: true, settings: {}, q: '' };

const $ = (sel) => ROOT.querySelector(sel);
const shopOfOwner = (id) => st.shops.get(id) || {};
const ownerShopName = (p) => (p.role === 'owner' ? shopOfOwner(p.id).business_name || '' : shopOfOwner(p.owner_id).business_name || '');

function contactLinks(p, msg) {
  const m = msg || messageFor(p, ownerShopName(p));
  const wa = waNumber(p.phone);
  const out = [];
  if (wa) {
    out.push(`<a class="btn btn-sm btn-secondary" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent(m.text)}">${iconx('message-circle', 14)} WhatsApp</a>`);
  }
  if (p.email) {
    out.push(`<a class="btn btn-sm btn-secondary" href="mailto:${esc(p.email)}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.text)}">${iconx('mail', 14)} Email</a>`);
  }
  return out.join('');
}

const abtn = (action, id, label, cls = 'btn-secondary', ic = '') =>
  `<button type="button" class="btn btn-sm ${cls}" data-action="${action}" data-id="${esc(id)}">${ic ? iconx(ic, 14) + ' ' : ''}${label}</button>`;

function actionsHtml(p) {
  const id = p.id;
  const b = [];
  if (p.role === 'owner' && !p.is_approved && !p.rejected_at) {
    b.push(abtn('approve', id, 'Pitisha', 'btn-success', 'check'), abtn('reject', id, 'Kataa', 'btn-warning', 'x-circle'));
  } else if (p.role === 'owner' && !p.is_approved && p.rejected_at) {
    b.push(abtn('restore', id, 'Rudisha', 'btn-secondary', 'refresh'));
  } else {
    const closed = p.active === false;
    b.push(abtn('toggle', id, closed ? 'Fungua' : 'Funga', closed ? 'btn-success' : 'btn-warning', closed ? 'check' : 'ban'));
    if (p.role === 'owner') b.push(abtn('plan', id, 'Mpango', 'btn-secondary', 'calendar'));
  }
  b.push(abtn('view', id, 'Maelezo', 'btn-secondary', 'activity'));
  b.push(contactLinks(p));
  b.push(abtn('delete', id, 'Futa', 'btn-danger', 'trash'));
  return `<div style="display:flex;gap:6px;flex-wrap:wrap;">${b.join('')}</div>`;
}

/* ---------- Data ---------- */
async function loadAll() {
  const [pRes, bRes, sRes, setRes] = await Promise.all([
    supabase.from('profiles').select('*').in('role', ['owner', 'cashier']).order('created_at', { ascending: false }),
    supabase.from('business_settings').select('*'),
    supabase.rpc('developer_owner_stats'),
    supabase.from('system_settings').select('key, value')
  ]);
  if (pRes.error) throw pRes.error;
  st.profiles = pRes.data || [];
  st.shops = new Map((bRes.data || []).map((b) => [b.owner_id, b]));
  st.statsOk = !sRes.error;
  st.stats = new Map((sRes.data || []).map((s) => [s.o_id, s]));
  st.settings = Object.fromEntries((setRes.data || []).map((r) => [r.key, r.value]));
}

function derive() {
  const owners = st.profiles.filter((p) => p.role === 'owner');
  const cashiers = st.profiles.filter((p) => p.role === 'cashier');
  const pending = owners.filter((p) => !p.is_approved && !p.rejected_at);
  const approved = owners.filter((p) => p.is_approved);
  const active = approved.filter((p) => p.active !== false);
  const closed = owners.filter((p) => (p.is_approved && p.active === false) || (!p.is_approved && p.rejected_at));
  const weekAgo = Date.now() - 7 * DAY;
  const newWeek = owners.filter((p) => new Date(p.created_at).getTime() >= weekAgo);
  const expiring = approved
    .filter((p) => { const d = daysLeft(p); return d !== null && d <= 14; })
    .sort((a, b) => daysLeft(a) - daysLeft(b));
  const inactive = active.filter((p) => {
    const s = st.stats.get(p.id);
    if (!st.statsOk || !s) return false;
    const last = s.last_sale_at || p.approved_at || p.created_at;
    return Date.now() - new Date(last).getTime() > 14 * DAY;
  });
  return { owners, cashiers, pending, approved, active, closed, newWeek, expiring, inactive };
}

/* ---------- Kuchora ---------- */
const card = (key, ic, bg, color, label, value, sub = '') => `
  <div class="stat-card clickable" data-box="${key}" role="button" tabindex="0">
    <div class="stat-icon" style="background:${bg};color:${color};">${iconx(ic)}</div>
    <div class="stat-content">
      <p class="stat-label">${label}</p>
      <h3 class="stat-value">${value}</h3>
      ${sub ? `<span class="stat-change"><span>${sub}</span></span>` : ''}
    </div>
  </div>`;

function userRow(p) {
  const isOwner = p.role === 'owner';
  const shopName = ownerShopName(p) || (isOwner ? '-' : (st.profiles.find((x) => x.id === p.owner_id)?.full_name || '-'));
  return [
    `<strong>${esc(p.full_name || 'Hakuna Jina')}</strong><br><small class="muted">${esc(p.role)} · ${fmtDate(p.created_at)}</small>`,
    `${esc(p.email || '-')}<br><small class="muted">${esc(p.phone || '-')}</small>`,
    esc(shopName),
    isOwner && p.is_approved ? planBadge(p) : '-',
    statusBadge(p),
    actionsHtml(p)
  ];
}

const usersTable = (list) =>
  table(['Jina', 'Mawasiliano', 'Duka', 'Mpango', 'Hali', 'Vitendo'], list.map(userRow), 'Hakuna watumiaji wa aina hii.');

function pendingTable(list) {
  return table(
    ['Jina', 'Mawasiliano', 'Duka', 'Eneo', 'Ombi', 'Vitendo'],
    list.map((p) => {
      const shop = shopOfOwner(p.id);
      const age = Math.floor((Date.now() - new Date(p.created_at).getTime()) / DAY);
      return [
        `<strong>${esc(p.full_name || 'Hakuna Jina')}</strong>`,
        `${esc(p.email || '-')}<br><small class="muted">${esc(p.phone || '-')}</small>`,
        esc(shop.business_name || '-'),
        esc(shop.business_address || '-'),
        `${fmtDate(p.created_at)}<br><small class="muted">${age === 0 ? 'Leo' : 'Siku ' + age + ' zilizopita'}</small>`,
        actionsHtml(p)
      ];
    }),
    'Hakuna ombi jipya kwa sasa.'
  );
}

function approvedTable(list) {
  const q = st.q.trim().toLowerCase();
  const filtered = !q
    ? list
    : list.filter((p) =>
        [p.full_name, p.email, p.phone, shopOfOwner(p.id).business_name].some((v) => String(v || '').toLowerCase().includes(q))
      );
  return table(
    ['Jina', 'Mawasiliano', 'Duka', 'Mpango', 'Shughuli', 'Hali', 'Vitendo'],
    filtered.map((p) => {
      const s = st.stats.get(p.id);
      const activity = st.statsOk && s
        ? `Mauzo (siku 30): <strong>${s.sales_30d}</strong><br><small class="muted">Mwisho: ${s.last_sale_at ? fmtDate(s.last_sale_at) : 'Hajauza'} · Bidhaa ${s.products_count} · Wafanyakazi ${s.cashiers_count}</small>`
        : '<small class="muted">-</small>';
      return [
        `<strong>${esc(p.full_name || 'Hakuna Jina')}</strong>`,
        `${esc(p.email || '-')}<br><small class="muted">${esc(p.phone || '-')}</small>`,
        esc(shopOfOwner(p.id).business_name || '-'),
        planBadge(p),
        activity,
        statusBadge(p),
        actionsHtml(p)
      ];
    }),
    'Hakuna owners waliopitishwa.'
  );
}

function paint() {
  const D = derive();

  $('#dev-stats').innerHTML = [
    card('all_owners', 'store', '#dbeafe', '#1e40af', 'Jumla ya Owners', D.owners.length),
    card('pending', 'user-plus', '#fef3c7', '#92400e', 'Wanasubiri Uthibitisho', D.pending.length, D.pending.length ? 'Zinahitaji hatua yako' : 'Hakuna ombi jipya'),
    card('active', 'shield-check', '#dcfce7', '#166534', 'Wamepitishwa (Active)', D.active.length),
    card('closed', 'ban', '#fee2e2', '#991b1b', 'Wamefungwa / Wamekataliwa', D.closed.length),
    card('cashiers', 'users', '#fce7f3', '#9d174d', 'Jumla ya Cashiers', D.cashiers.length),
    card('new_week', 'activity', '#ede9fe', '#5b21b6', 'Maombi ya Wiki Hii', D.newWeek.length),
    card('expiring', 'calendar', '#ffedd5', '#9a3412', 'Mipango Inayoisha (siku 14)', D.expiring.length),
    card('inactive', 'clock', '#e5e7eb', '#374151', 'Hawajauza (siku 14)', st.statsOk ? D.inactive.length : '-', st.statsOk ? '' : 'Endesha SQL ya Hatua 1')
  ].join('');

  $('#dev-sections').innerHTML = `
    <div class="ui-section"><h2>Maombi Mapya (Zinasubiri Uthibitisho)</h2><span class="muted">${D.pending.length}</span></div>
    ${pendingTable(D.pending)}

    <div class="ui-section">
      <h2>Owners Waliopitishwa</h2>
      <input type="text" id="dev-search" placeholder="Tafuta jina, email, simu au duka..." value="${esc(st.q)}" style="max-width: 320px; width: 100%;" />
    </div>
    <div id="dev-approved">${approvedTable(D.approved)}</div>

    ${D.closed.length ? `<div class="ui-section"><h2>Waliofungwa / Waliokataliwa</h2><span class="muted">${D.closed.length}</span></div>${usersTable(D.closed)}` : ''}
  `;

  const search = $('#dev-search');
  if (search) {
    search.addEventListener('input', () => {
      st.q = search.value;
      $('#dev-approved').innerHTML = approvedTable(derive().approved);
    });
  }
}

async function refresh() {
  await loadAll();
  paint();
}

/* ---------- Madirisha ---------- */
function openBox(key) {
  const D = derive();
  const map = {
    all_owners: ['Wamiliki Wote (Owners)', D.owners],
    pending: ['Wanasubiri Uthibitisho', D.pending],
    active: ['Wamepitishwa (Active)', D.active],
    closed: ['Wamefungwa / Wamekataliwa', D.closed],
    cashiers: ['Cashiers Wote', D.cashiers],
    new_week: ['Maombi ya Wiki Hii', D.newWeek],
    expiring: ['Mipango Inayoisha (siku 14)', D.expiring],
    inactive: ['Hawajauza kwa Siku 14', D.inactive]
  };
  const entry = map[key];
  if (!entry) return;
  if (key === 'inactive' && !st.statsOk) {
    MODAL.open(entry[0], '<div class="ui-note">Takwimu hazipatikani. Endesha SQL ya Hatua 1 kisha onyesha upya.</div>');
    return;
  }
  MODAL.open(`${entry[0]} (${entry[1].length})`, usersTable(entry[1]));
}

const formMsg = (text, ok = false) => {
  const el = MODAL.el.querySelector('#dev-form-msg');
  if (!el) return;
  el.textContent = text;
  el.className = 'form-message ' + (ok ? 'success' : 'error');
  el.style.display = 'block';
};

function showSent(title, p, note = '') {
  const m = messageFor(p, ownerShopName(p));
  MODAL.open(title, `
    ${note ? `<div class="ui-note">${esc(note)}</div>` : ''}
    <p>Tuma ujumbe kwa <strong>${esc(p.full_name || '')}</strong>:</p>
    <div class="ui-summary" style="white-space: pre-wrap;">${esc(m.text)}</div>
    <div class="ui-toolbar">${contactLinks(p, m)}<button type="button" class="btn btn-secondary btn-sm" data-action="close">Funga</button></div>
    <p class="hint">Barua pepe ya kiotomatiki inatumwa na mfumo ukishaweka Hatua ya Barua Pepe. WhatsApp inafunguka na ujumbe tayari, wewe unabonyeza Tuma tu.</p>
  `);
}

const applicantInfo = (p) =>
  summary([
    ['Jina', esc(p.full_name || '-')],
    ['Email', esc(p.email || '-')],
    ['Simu', esc(p.phone || '-')],
    ['Duka', esc(ownerShopName(p) || '-')],
    ['Eneo', esc(shopOfOwner(p.id).business_address || '-')]
  ]);

function openApprove(p) {
  const trial = Number(st.settings.trial_days) || 14;
  MODAL.open(`Pitisha: ${p.full_name || 'Owner'}`, `
    ${applicantInfo(p)}
    <form id="dev-approve-form" data-id="${esc(p.id)}">
      <div class="form-grid">
        <div class="form-group"><label>Mpango</label><select name="plan">${planOptions('trial')}</select></div>
        <div class="form-group"><label>Siku za mpango (acha tupu = bila mwisho)</label><input type="number" name="days" min="1" value="${trial}" /></div>
        <div class="form-group span-all"><label>Kumbukumbu yako ya ndani (hiari)</label><textarea name="note" rows="2"></textarea></div>
      </div>
      <div id="dev-form-msg" class="form-message" style="display:none;"></div>
      <div class="form-buttons">
        <button type="button" class="btn btn-secondary" data-action="close">Ghairi</button>
        <button type="submit" class="btn btn-primary">Pitisha Akaunti</button>
      </div>
    </form>`);
}

async function submitApprove(form) {
  const p = st.profiles.find((x) => x.id === form.dataset.id);
  if (!p) return;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;

  const plan = form.plan.value;
  const days = parseInt(form.days.value, 10);
  const expires = plan === 'lifetime' || !days ? null : new Date(Date.now() + days * DAY).toISOString();
  const patch = {
    is_approved: true, active: true, approved_at: new Date().toISOString(), approved_by: USER.id,
    plan, plan_expires_at: expires, rejected_at: null, rejection_reason: null,
    developer_note: form.note.value.trim() || p.developer_note || null
  };

  let { error } = await supabase.from('profiles').update(patch).eq('id', p.id);
  let note = '';
  if (error && /column|schema cache/i.test(error.message)) {
    ({ error } = await supabase.from('profiles').update({ is_approved: true, active: true }).eq('id', p.id));
    note = 'Imepitishwa, lakini mpango haukuhifadhiwa. Endesha SQL ya Hatua 1.';
  }
  btn.disabled = false;
  if (error) return formMsg(error.message);

  await refresh();
  showSent('Imepitishwa', st.profiles.find((x) => x.id === p.id) || { ...p, is_approved: true, active: true, plan, plan_expires_at: expires }, note);
}

function openReject(p) {
  const reasons = ['Taarifa hazijakamilika', 'Namba ya simu haipatikani', 'Biashara haijathibitishwa', 'Ombi limejirudia'];
  MODAL.open(`Kataa ombi: ${p.full_name || 'Owner'}`, `
    ${applicantInfo(p)}
    <form id="dev-reject-form" data-id="${esc(p.id)}">
      <div class="ui-toolbar">${reasons.map((r) => `<button type="button" class="btn btn-secondary btn-sm" data-action="quick-reason" data-text="${esc(r)}">${esc(r)}</button>`).join('')}</div>
      <div class="form-group"><label>Sababu (mwombaji ataona)</label><textarea name="reason" rows="3" required></textarea></div>
      <div id="dev-form-msg" class="form-message" style="display:none;"></div>
      <div class="form-buttons">
        <button type="button" class="btn btn-secondary" data-action="close">Ghairi</button>
        <button type="submit" class="btn btn-danger">Kataa Ombi</button>
      </div>
    </form>`);
}

async function submitReject(form) {
  const p = st.profiles.find((x) => x.id === form.dataset.id);
  if (!p) return;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  const { error } = await supabase.from('profiles').update({
    is_approved: false, active: false, rejected_at: new Date().toISOString(),
    rejection_reason: form.reason.value.trim()
  }).eq('id', p.id);
  btn.disabled = false;
  if (error) {
    return formMsg(/column|schema cache/i.test(error.message) ? 'Endesha SQL ya Hatua 1 kwanza (safu za kukataa hazipo).' : error.message);
  }
  await refresh();
  showSent('Ombi Limekataliwa', st.profiles.find((x) => x.id === p.id) || p);
}

function openPlan(p) {
  const exp = p.plan_expires_at ? ymdLocal(new Date(p.plan_expires_at)) : '';
  MODAL.open(`Mpango: ${p.full_name || 'Owner'}`, `
    <div class="ui-summary"><div class="ui-summary-row"><span>Mpango wa sasa</span><strong>${planBadge(p)}</strong></div></div>
    <form id="dev-plan-form" data-id="${esc(p.id)}">
      <div class="form-grid">
        <div class="form-group"><label>Mpango</label><select name="plan">${planOptions(p.plan || 'trial')}</select></div>
        <div class="form-group"><label>Tarehe ya mwisho (tupu = bila mwisho)</label><input type="date" name="expires" value="${exp}" /></div>
      </div>
      <div class="ui-toolbar">
        <button type="button" class="btn btn-secondary btn-sm" data-action="add-days" data-days="30">+30 siku</button>
        <button type="button" class="btn btn-secondary btn-sm" data-action="add-days" data-days="90">+90 siku</button>
        <button type="button" class="btn btn-secondary btn-sm" data-action="add-days" data-days="365">+365 siku</button>
      </div>
      <div id="dev-form-msg" class="form-message" style="display:none;"></div>
      <div class="form-buttons">
        <button type="button" class="btn btn-secondary" data-action="close">Ghairi</button>
        <button type="submit" class="btn btn-primary">Hifadhi Mpango</button>
      </div>
    </form>`);
}

async function submitPlan(form) {
  const p = st.profiles.find((x) => x.id === form.dataset.id);
  if (!p) return;
  const plan = form.plan.value;
  const expires = plan === 'lifetime' || !form.expires.value ? null : new Date(form.expires.value + 'T23:59:59').toISOString();
  const { error } = await supabase.from('profiles').update({ plan, plan_expires_at: expires }).eq('id', p.id);
  if (error) {
    return formMsg(/column|schema cache/i.test(error.message) ? 'Endesha SQL ya Hatua 1 kwanza.' : error.message);
  }
  await refresh();
  showSent('Mpango Umesasishwa', st.profiles.find((x) => x.id === p.id) || p);
}

function openDetails(p) {
  const isOwner = p.role === 'owner';
  const shop = isOwner ? shopOfOwner(p.id) : {};
  const s = st.stats.get(p.id);
  MODAL.open(p.full_name || 'Maelezo', `
    <div class="ui-toolbar">${contactLinks(p)}</div>
    ${summary([
      ['Jina', esc(p.full_name || '-')],
      ['Email', esc(p.email || '-')],
      ['Simu', esc(p.phone || '-')],
      ['Nafasi', esc(p.role)],
      isOwner ? ['Jina la duka', esc(shop.business_name || '-')] : null,
      isOwner ? ['Eneo', esc(shop.business_address || '-')] : null,
      ['Hali', statusBadge(p)],
      ['Tarehe ya ombi', fmtDateTime(p.created_at)],
      p.approved_at ? ['Alipitishwa', fmtDateTime(p.approved_at)] : null,
      p.rejected_at ? ['Alikataliwa', fmtDateTime(p.rejected_at)] : null,
      p.rejection_reason ? ['Sababu ya kukataliwa', esc(p.rejection_reason)] : null,
      isOwner && p.is_approved ? ['Mpango', planBadge(p)] : null,
      isOwner && p.plan_expires_at ? ['Mwisho wa mpango', fmtDate(p.plan_expires_at)] : null,
      isOwner && s ? ['Mauzo (siku 30)', String(s.sales_30d)] : null,
      isOwner && s ? ['Mauzo yote', String(s.sales_all)] : null,
      isOwner && s ? ['Mauzo ya mwisho', s.last_sale_at ? fmtDateTime(s.last_sale_at) : 'Hajauza'] : null,
      isOwner && s ? ['Bidhaa', String(s.products_count)] : null,
      isOwner && s ? ['Wafanyakazi', String(s.cashiers_count)] : null
    ])}
    <form id="dev-note-form" data-id="${esc(p.id)}">
      <div class="form-group"><label>Kumbukumbu zako binafsi (mteja haoni)</label><textarea name="note" rows="3">${esc(p.developer_note || '')}</textarea></div>
      <div id="dev-form-msg" class="form-message" style="display:none;"></div>
      <div class="form-buttons"><button type="submit" class="btn btn-primary btn-sm">Hifadhi Kumbukumbu</button></div>
    </form>`);
}

async function submitNote(form) {
  const { error } = await supabase.from('profiles').update({ developer_note: form.note.value.trim() || null }).eq('id', form.dataset.id);
  if (error) return formMsg(/column|schema cache/i.test(error.message) ? 'Endesha SQL ya Hatua 1 kwanza.' : error.message);
  const p = st.profiles.find((x) => x.id === form.dataset.id);
  if (p) p.developer_note = form.note.value.trim() || null;
  formMsg('Imehifadhiwa.', true);
}

async function toggleActive(p) {
  const closing = p.active !== false;
  if (!confirm(`${closing ? 'Kufunga' : 'Kufungua'} akaunti ya ${p.full_name || 'mtumiaji huyu'}?`)) return;
  const { error } = await supabase.from('profiles').update({ active: !closing }).eq('id', p.id);
  if (error) return alert('Hitilafu: ' + error.message);
  await refresh();
  if (MODAL.current) MODAL.close();
}

async function restoreApplicant(p) {
  if (!confirm('Kurudisha ombi hili kwenye orodha ya wanaosubiri?')) return;
  const { error } = await supabase.from('profiles').update({ rejected_at: null, rejection_reason: null }).eq('id', p.id);
  if (error) return alert('Hitilafu: ' + error.message);
  await refresh();
  if (MODAL.current) MODAL.close();
}

async function deleteUser(p) {
  const name = p.full_name || p.email || 'mtumiaji huyu';
  const typed = window.prompt(`TAHADHARI: Kufuta akaunti ya "${name}" hakurudishwi.\nAndika FUTA kuthibitisha:`);
  if (typed !== 'FUTA') return;
  const { error } = await supabase.rpc('developer_delete_user', { p_user_id: p.id });
  if (error) {
    return alert(/could not find the function/i.test(error.message) ? 'Endesha SQL ya Hatua 1 kwanza.' : 'Hitilafu: ' + error.message);
  }
  await refresh();
  if (MODAL.current) MODAL.close();
  alert('Akaunti imefutwa.');
}

async function handleAction(btn) {
  const { action, id } = btn.dataset;
  const p = st.profiles.find((x) => x.id === id);

  if (action === 'quick-reason') {
    const area = MODAL.el.querySelector('textarea[name="reason"]');
    if (area) area.value = btn.dataset.text;
    return;
  }
  if (action === 'add-days') {
    const form = MODAL.el.querySelector('#dev-plan-form');
    if (!form) return;
    const cur = form.expires.value ? new Date(form.expires.value + 'T00:00:00') : new Date();
    const base = cur > new Date() ? cur : new Date();
    form.expires.value = ymdLocal(new Date(base.getTime() + Number(btn.dataset.days) * DAY));
    if (form.plan.value === 'lifetime') form.plan.value = 'monthly';
    return;
  }
  if (!p) return;

  if (action === 'approve') return openApprove(p);
  if (action === 'reject') return openReject(p);
  if (action === 'view') return openDetails(p);
  if (action === 'toggle') return toggleActive(p);
  if (action === 'plan') return openPlan(p);
  if (action === 'delete') return deleteUser(p);
  if (action === 'restore') return restoreApplicant(p);
}

function exportOwners() {
  const D = derive();
  if (!D.owners.length) return alert('Hakuna data ya kutoa nje.');
  downloadCsv(
    `Wateja_StationeryPro_${ymdLocal(new Date())}.csv`,
    ['Jina', 'Email', 'Simu', 'Duka', 'Eneo', 'Hali', 'Mpango', 'Mwisho wa Mpango', 'Tarehe ya Ombi', 'Alipitishwa', 'Mauzo (siku 30)', 'Mauzo ya Mwisho'],
    D.owners.map((p) => {
      const shop = shopOfOwner(p.id);
      const s = st.stats.get(p.id);
      const status = !p.is_approved ? (p.rejected_at ? 'Amekataliwa' : 'Anasubiri') : p.active === false ? 'Amefungwa' : 'Active';
      return [
        p.full_name || '', p.email || '', p.phone || '', shop.business_name || '', shop.business_address || '', status,
        planLabel(p.plan), p.plan_expires_at ? fmtDate(p.plan_expires_at) : '', fmtDate(p.created_at),
        p.approved_at ? fmtDate(p.approved_at) : '', s ? s.sales_30d : '', s && s.last_sale_at ? fmtDate(s.last_sale_at) : ''
      ];
    })
  );
}

/* ---------- Ukurasa ---------- */
export async function renderDeveloper(root, user, profile) {
  if (user.email !== DEVELOPER_EMAIL) {
    root.innerHTML = `<div class="notice error"><h3>Hauruhusiwi</h3></div>`;
    return;
  }

  ensureSharedStyles();
  ROOT = root;
  USER = user;
  MODAL = createDetailModal();
  st.q = '';

  root.innerHTML = `
    <div class="developer-container">
      <div class="page-header">
        <div>
          <h1>Developer Dashboard</h1>
          <p class="text-muted">Takwimu za jumla za mfumo</p>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button type="button" id="dev-export" class="btn btn-secondary btn-sm">${baseIcon('download', 16)} Export Wateja (CSV)</button>
          <button type="button" id="dev-refresh" class="btn btn-secondary btn-sm">${iconx('refresh', 16)} Onyesha Upya</button>
        </div>
      </div>
      <div id="dev-errors"></div>
      <div id="dev-stats" class="stats-grid"></div>
      <div id="dev-sections"></div>
    </div>`;

  // Vitendo vya ukurasa
  root.addEventListener('click', (e) => {
    const box = e.target.closest('[data-box]');
    if (box) return openBox(box.dataset.box);
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'dev-refresh') return refresh().catch((err) => alert(err.message));
    if (btn.id === 'dev-export') return exportOwners();
    if (btn.dataset.action) handleAction(btn);
  });
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const box = e.target.closest('[data-box]');
    if (box) { e.preventDefault(); openBox(box.dataset.box); }
  });

  // Vitendo ndani ya dirisha
  MODAL.el.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    if (['close', 'back', 'print-receipt'].includes(btn.dataset.action)) return;
    handleAction(btn);
  });
  MODAL.el.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    if (form.id === 'dev-approve-form') await submitApprove(form);
    if (form.id === 'dev-reject-form') await submitReject(form);
    if (form.id === 'dev-plan-form') await submitPlan(form);
    if (form.id === 'dev-note-form') await submitNote(form);
  });
  MODAL.el.addEventListener('change', (e) => {
    const sel = e.target.closest('select[name="plan"]');
    if (!sel) return;
    const approve = e.target.closest('#dev-approve-form');
    const plan = e.target.closest('#dev-plan-form');
    if (approve) {
      const trial = Number(st.settings.trial_days) || 14;
      const d = sel.value === 'trial' ? trial : PLANS[sel.value]?.days;
      approve.days.value = d || '';
    }
    if (plan && sel.value === 'lifetime') plan.expires.value = '';
  });

  try {
    await loadAll();
    paint();
  } catch (error) {
    console.error('Developer error:', error);
    $('#dev-errors').innerHTML = `<div class="ui-note">Hitilafu: ${esc(error.message)}</div>`;
  }

  // Kagua maombi mapya kila dakika moja
  if (window.__devTimer) clearInterval(window.__devTimer);
  window.__devTimer = setInterval(async () => {
    if (!document.body.contains(ROOT) || !ROOT.querySelector('.developer-container')) {
      clearInterval(window.__devTimer);
      return;
    }
    try {
      const before = derive().pending.length;
      await loadAll();
      if (derive().pending.length !== before) paint();
    } catch (e) { /* kimya */ }
  }, 60000);
}