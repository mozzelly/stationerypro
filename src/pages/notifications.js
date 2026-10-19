import { supabase } from '../lib/supabase.js';
import {
  esc, fmtDate, ensureSharedStyles, money, num, addDays, isCancelled,
  fetchAll, grossOf, isCreditSale, balanceShown
} from '../lib/shared.js';

const DEVELOPER_EMAIL = 'mussaelly1235@gmail.com';
const DAY = 86400000;

const ICONS = {
  'bell': '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  'user-plus': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
  'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  'package': '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  'wallet': '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  'dollar': '<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  'check': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  'calendar': '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
};
const ico = (name, size = 22) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.bell}</svg>`;

const TONES = {
  danger: { border: '#ef4444', bg: '#fef2f2' },
  warning: { border: '#f59e0b', bg: '#fffbeb' },
  success: { border: '#22c55e', bg: '#f0fdf4' },
  info: { border: '#1456c0', bg: '#eff6ff' }
};

const KIND_ICON = {
  new_owner_request: 'user-plus', new_cashier: 'users', account_approved: 'check', plan_updated: 'calendar'
};

function alertCard({ tone = 'info', ic = 'bell', title, text = '', items = [], href = '', cta = '' }) {
  const t = TONES[tone] || TONES.info;
  return `
    <div style="border-left: 4px solid ${t.border}; background: ${t.bg}; padding: 16px; border-radius: 10px; display: flex; gap: 12px;">
      <div style="color: ${t.border}; flex-shrink: 0;">${ico(ic)}</div>
      <div style="min-width: 0; flex: 1;">
        <h4 style="margin: 0 0 4px;">${esc(title)}</h4>
        ${text ? `<p style="margin: 0 0 8px; color: #475569;">${text}</p>` : ''}
        ${items.length ? `<ul style="margin: 6px 0 8px; padding-left: 20px;">${items.map((i) => `<li>${i}</li>`).join('')}</ul>` : ''}
        ${href ? `<a href="${esc(href)}" class="btn btn-sm btn-primary" style="margin-top: 4px; display: inline-block;">${esc(cta)}</a>` : ''}
      </div>
    </div>`;
}

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'sasa hivi';
  const m = Math.floor(s / 60);
  if (m < 60) return `dakika ${m} zilizopita`;
  const h = Math.floor(m / 60);
  if (h < 24) return `saa ${h} zilizopita`;
  const dd = Math.floor(h / 24);
  if (dd < 30) return `siku ${dd} zilizopita`;
  return fmtDate(d);
}

async function safe(fn) {
  try {
    return await fn();
  } catch (e) {
    console.warn('Arifa:', e);
    return [];
  }
}

const daysLeft = (p) => (p.plan_expires_at ? Math.ceil((new Date(p.plan_expires_at) - Date.now()) / DAY) : null);
const list = (arr, max, fmt) => arr.slice(0, max).map(fmt).concat(arr.length > max ? [`na ${arr.length - max} zaidi`] : []);

/* ---------- Arifa za moja kwa moja (kutoka data halisi) ---------- */
async function liveDeveloper() {
  const cards = [];
  const { data } = await supabase.from('profiles').select('*').eq('role', 'owner');
  const owners = data || [];

  const pending = owners.filter((p) => !p.is_approved && !p.rejected_at);
  if (pending.length) {
    cards.push(alertCard({
      tone: 'warning', ic: 'user-plus', title: `Maombi ${pending.length} Yanasubiri Uthibitisho`,
      items: list(pending, 5, (p) => `<strong>${esc(p.full_name || 'Hakuna Jina')}</strong> (${esc(p.email || p.phone || '-')}) - ${fmtDate(p.created_at)}`),
      href: '#developer', cta: 'Nenda Developer Dashboard'
    }));
  }

  const approved = owners.filter((p) => p.is_approved);
  const expired = approved.filter((p) => { const d = daysLeft(p); return d !== null && d < 0; });
  const expiring = approved.filter((p) => { const d = daysLeft(p); return d !== null && d >= 0 && d <= 14; });
  if (expired.length) {
    cards.push(alertCard({
      tone: 'danger', ic: 'calendar', title: `Mipango ${expired.length} Imeisha`,
      items: list(expired, 5, (p) => `<strong>${esc(p.full_name || '-')}</strong>: imeisha siku ${Math.abs(daysLeft(p))} zilizopita`),
      href: '#developer', cta: 'Simamia Mipango'
    }));
  }
  if (expiring.length) {
    cards.push(alertCard({
      tone: 'warning', ic: 'calendar', title: `Mipango ${expiring.length} Inaisha Karibuni`,
      items: list(expiring, 5, (p) => `<strong>${esc(p.full_name || '-')}</strong>: siku ${daysLeft(p)} zimebaki`),
      href: '#developer', cta: 'Simamia Mipango'
    }));
  }

  const stats = await supabase.rpc('developer_owner_stats');
  if (!stats.error) {
    const map = new Map((stats.data || []).map((s) => [s.o_id, s]));
    const inactive = approved.filter((p) => {
      if (p.active === false) return false;
      const s = map.get(p.id);
      const last = (s && s.last_sale_at) || p.approved_at || p.created_at;
      return Date.now() - new Date(last).getTime() > 14 * DAY;
    });
    if (inactive.length) {
      cards.push(alertCard({
        tone: 'info', ic: 'clock', title: `Akaunti ${inactive.length} Hazijafanya Mauzo kwa Siku 14`,
        text: 'Wasiliana nao kuona kama wanahitaji msaada wa kuanza.',
        items: list(inactive, 5, (p) => `<strong>${esc(p.full_name || '-')}</strong>`),
        href: '#developer', cta: 'Angalia'
      }));
    }
  }

  const weekNew = owners.filter((p) => Date.now() - new Date(p.created_at).getTime() < 7 * DAY);
  if (weekNew.length) {
    cards.push(alertCard({
      tone: 'success', ic: 'users', title: `Maombi ${weekNew.length} Mapya Wiki Hii`,
      text: `Owners ${approved.length} wamepitishwa kwa jumla.`
    }));
  }
  return cards;
}

async function liveShop(user, profile, kind, me) {
  const cards = [];
  const shopId = kind === 'owner' ? user.id : profile.owner_id || user.id;
  const mine = (row) => !row.owner_id || row.owner_id === shopId;

  // Stock
  const prods = await safe(async () => {
    const { data } = await supabase.from('products').select('*');
    return (data || []).filter((p) => !p.is_service && mine(p));
  });
  const out = prods.filter((p) => num(p.stock_quantity) <= 0);
  const low = prods.filter((p) => p.reorder_level != null && num(p.stock_quantity) > 0 && num(p.stock_quantity) <= num(p.reorder_level));
  if (out.length) {
    cards.push(alertCard({
      tone: 'danger', ic: 'alert', title: `Bidhaa ${out.length} Zimeisha Stock`,
      items: list(out, 8, (p) => `<strong>${esc(p.name)}</strong>`),
      href: kind === 'owner' ? '#products' : '', cta: 'Angalia Stock'
    }));
  }
  if (low.length) {
    cards.push(alertCard({
      tone: 'warning', ic: 'package', title: `Bidhaa ${low.length} Zina Stock Chini`,
      text: kind === 'owner' ? 'Zinahitaji kuagizwa tena.' : 'Mjulishe mmiliki.',
      items: list(low, 8, (p) => `<strong>${esc(p.name)}</strong>: ${num(p.stock_quantity)} (kiwango cha chini ${num(p.reorder_level)})`),
      href: kind === 'owner' ? '#products' : '', cta: 'Angalia Stock'
    }));
  }

  // Mauzo
  const since = kind === 'owner' ? addDays(new Date(), -90) : new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const sales = await safe(async () => {
    const rows = await fetchAll((a, b) =>
      supabase.from('sales').select('*').gte('created_at', since.toISOString()).order('created_at', { ascending: false }).range(a, b)
    );
    return rows.filter((s) => !isCancelled(s) && mine(s) && (kind === 'owner' || s.cashier_id === user.id));
  });
  const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const today = sales.filter((s) => new Date(s.created_at) >= todayStart);
  if (today.length) {
    const total = today.reduce((t, s) => t + grossOf(s), 0);
    cards.push(alertCard({
      tone: 'success', ic: 'dollar', title: kind === 'owner' ? 'Mauzo ya Leo' : 'Mauzo Yako ya Leo',
      text: `Risiti <strong>${today.length}</strong>, jumla <strong>${esc(money(total))}</strong>.`,
      href: '#sales', cta: 'Angalia Mauzo'
    }));
  }

  if (kind === 'owner') {
    const credit = sales.filter((s) => isCreditSale(s) && balanceShown(s) > 0);
    if (credit.length) {
      const total = credit.reduce((t, s) => t + balanceShown(s), 0);
      cards.push(alertCard({
        tone: 'warning', ic: 'wallet', title: 'Mikopo Ambayo Haijalipwa',
        text: `Risiti <strong>${credit.length}</strong> (siku 90 zilizopita), jumla <strong>${esc(money(total))}</strong>.`,
        href: '#reports', cta: 'Angalia Ripoti'
      }));
    }

    const d = daysLeft(me || {});
    if (d !== null && d <= 14) {
      cards.push(alertCard({
        tone: d < 0 ? 'danger' : 'warning', ic: 'calendar',
        title: d < 0 ? 'Mpango Wako Umeisha' : 'Mpango Wako Unaisha Karibuni',
        text: d < 0 ? `Uliisha siku ${Math.abs(d)} zilizopita. Wasiliana na msaada kuuongeza.` : `Siku ${d} zimebaki. Wasiliana na msaada kuuongeza.`,
        href: '#settings', cta: 'Angalia Mpango'
      }));
    }
  }
  return cards;
}

/* ---------- Ukurasa ---------- */
export async function renderNotifications(root, user, profile) {
  ensureSharedStyles();
  const isDeveloper = user.email === DEVELOPER_EMAIL;
  const kind = isDeveloper ? 'developer' : profile.role === 'owner' ? 'owner' : 'staff';

  root.innerHTML = `
    <div class="page-header">
      <h1>Arifa (Notifications)</h1>
      <button type="button" id="mark-all" class="btn btn-secondary btn-sm" style="display: none;">${ico('check', 16)} Weka Zote Zimesomwa</button>
    </div>
    <div class="ui-section" style="margin-top: 8px;"><h2>Zinazohitaji Hatua</h2></div>
    <div id="live-section" style="display: flex; flex-direction: column; gap: 14px;"><p class="muted">Inapakia arifa...</p></div>
    <div class="ui-section"><h2>Historia ya Arifa</h2></div>
    <div id="stored-section"><p class="muted">Inapakia...</p></div>`;

  let stored = [];

  async function loadLive() {
    let me = null;
    if (kind === 'owner') {
      const r = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      me = r.data;
    }
    const cards = kind === 'developer' ? await safe(liveDeveloper) : await safe(() => liveShop(user, profile, kind, me));
    document.getElementById('live-section').innerHTML = cards.length
      ? cards.join('')
      : `<div class="empty-state" style="padding: 30px 20px; text-align: center;"><h3>Hakuna jambo linalohitaji hatua</h3><p>Kila kitu kiko sawa kwa sasa.</p></div>`;
  }

  function paintStored() {
    const box = document.getElementById('stored-section');
    const unread = stored.filter((n) => !n.is_read).length;
    document.getElementById('mark-all').style.display = unread ? '' : 'none';

    if (!stored.length) {
      box.innerHTML = `<div class="empty-state" style="padding: 30px 20px; text-align: center;"><h3>Hakuna arifa mpya za mfumo</h3><p>Arifa mpya zitaonekana hapa.</p></div>`;
      return;
    }
    box.innerHTML = `<div style="display: flex; flex-direction: column; gap: 10px;">${stored.map((n) => `
      <div data-notif-id="${esc(n.id)}" data-link="${esc(n.link || '')}" role="button" tabindex="0"
           style="display: flex; gap: 12px; align-items: flex-start; padding: 14px; border: 1px solid #e1eae4; border-radius: 10px; cursor: pointer; background: ${n.is_read ? '#fff' : '#eff6ff'};">
        <div style="color: #1456c0; flex-shrink: 0;">${ico(KIND_ICON[n.kind] || 'bell', 20)}</div>
        <div style="min-width: 0; flex: 1;">
          <div style="font-weight: ${n.is_read ? 500 : 700};">${esc(n.title)}${n.is_read ? '' : ' <span class="badge badge-warning">Mpya</span>'}</div>
          ${n.body ? `<div style="color: #475569; font-size: 13px; margin-top: 2px;">${esc(n.body)}</div>` : ''}
          <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">${timeAgo(n.created_at)}</div>
        </div>
        <button type="button" class="btn btn-sm btn-secondary" data-delete-id="${esc(n.id)}" aria-label="Futa">${ico('x', 14)}</button>
      </div>`).join('')}</div>`;
  }

  async function loadStored() {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(50);
    if (error) {
      document.getElementById('stored-section').innerHTML =
        `<div class="empty-state" style="padding: 20px; text-align: center;"><p>Historia ya arifa bado haijawashwa. Endesha SQL ya mfumo wa arifa.</p></div>`;
      return;
    }
    stored = data || [];
    paintStored();
  }

  root.addEventListener('click', async (e) => {
    if (e.target.closest('#mark-all')) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
      stored = stored.map((n) => ({ ...n, is_read: true }));
      return paintStored();
    }
    const del = e.target.closest('[data-delete-id]');
    if (del) {
      e.stopPropagation();
      await supabase.from('notifications').delete().eq('id', del.dataset.deleteId);
      stored = stored.filter((n) => n.id !== del.dataset.deleteId);
      return paintStored();
    }
    const item = e.target.closest('[data-notif-id]');
    if (item) {
      const n = stored.find((x) => x.id === item.dataset.notifId);
      if (n && !n.is_read) {
        n.is_read = true;
        await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
        paintStored();
      }
      if (item.dataset.link) location.hash = item.dataset.link;
    }
  });

  await Promise.all([loadLive(), loadStored()]);
}