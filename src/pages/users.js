import { supabase } from '../lib/supabase.js';

let currentUser = null;
let employees = [];

const ROLE = { owner: 'Mmiliki', cashier: 'Mhasibu', employee: 'Mfanyakazi' };

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const $ = (id) => document.getElementById(id);
const openM = (id) => ($(id).style.display = 'flex');
const closeM = (id) => ($(id).style.display = 'none');

const badgeActive = (a) =>
  a ? '<span class="badge badge-success">Active</span>'
    : '<span class="badge badge-warning">Imefungwa</span>';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('sw-TZ') : '-');

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = 'form-message ' + type;
  el.style.display = 'block';
}

// Inaita functions za database (hakuna Edge Function). Ukaguzi wa mmiliki unafanyika ndani ya database.
async function callFn(body) {
  let res;

  if (body.action === 'create') {
    res = await supabase.rpc('create_employee', {
      p_email: body.email,
      p_password: body.password,
      p_full_name: body.full_name,
      p_phone: body.phone || null,
      p_role: body.role,
      p_can_view_reports: !!body.can_view_reports,
      p_can_manage_stock: body.can_manage_stock !== false,
    });
  } else if (body.action === 'update') {
    res = await supabase.rpc('update_employee', {
      p_id: body.id,
      p_role: body.role ?? null,
      p_can_view_reports: body.can_view_reports ?? null,
      p_can_manage_stock: body.can_manage_stock ?? null,
      p_password: body.password || null,
    });
  } else if (body.action === 'set_status') {
    res = await supabase.rpc('set_employee_status', {
      p_id: body.id,
      p_active: !!body.active,
    });
  } else {
    throw new Error('Action haijulikani.');
  }

  if (res.error) throw new Error(res.error.message);
  return res.data;
}

function genPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let p = '';
  const arr = new Uint32Array(10);
  crypto.getRandomValues(arr);
  arr.forEach((n) => (p += chars[n % chars.length]));
  return p;
}

const statCard = (filter, bg, fg, id, label, svg) => `
  <div class="stat-card" data-filter="${filter}" style="cursor:pointer;" role="button" tabindex="0">
    <div class="stat-icon" style="background:${bg}; color:${fg};">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>
    </div>
    <div class="stat-content">
      <p class="stat-label">${label}</p>
      <h3 class="stat-value" id="${id}">0</h3>
      <small style="color:#64748b; margin-top:4px; display:block;">Bofya kwa maelezo</small>
    </div>
  </div>`;

export async function renderUsers(root, user, profile) {
  currentUser = user;

  if (profile.role !== 'owner') {
    root.innerHTML = `
      <div class="notice error">
        <h3>Hauruhusiwi</h3>
        <p>Ukurasa huu unapatikana kwa wamiliki (owners) pekee.</p>
      </div>`;
    return;
  }

  root.innerHTML = `
    <div class="page-header">
      <h1>Watumiaji wa Mfumo</h1>
      <button id="add-user-btn" class="btn btn-primary">+ Ongeza Mfanyakazi</button>
    </div>

    <div class="stats-grid" style="margin-bottom:24px;">
      ${statCard('all', '#dbeafe', '#1e40af', 'total-employees', 'Jumla ya Wafanyakazi',
        '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>')}
      ${statCard('active', '#dcfce7', '#166534', 'active-employees', 'Wanaofanya Kazi',
        '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>')}
      ${statCard('inactive', '#fee2e2', '#991b1b', 'inactive-employees', 'Waliofungiwa',
        '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>')}
    </div>

    <div style="margin-bottom:12px;">
      <input id="user-search" type="search" placeholder="Tafuta kwa jina, email au simu..."
        style="width:100%; max-width:360px; padding:10px 14px; border:1px solid #e2e8f0; border-radius:10px;" />
    </div>

    <div class="table-wrap">
      <table id="users-table">
        <thead>
          <tr>
            <th>Jina</th><th>Email</th><th>Namba ya Simu</th><th>Role</th>
            <th>Hali</th><th>Tarehe ya Kujiunga</th><th>Vitendo</th>
          </tr>
        </thead>
        <tbody id="users-body">
          <tr><td colspan="7" class="empty-state">Inapakia...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Modal: Ongeza -->
    <div id="user-modal" class="modal-overlay" style="display:none;">
      <div class="modal" style="max-width:500px;">
        <div class="modal-header">
          <h3>Ongeza Mfanyakazi</h3>
          <button class="modal-close" data-close="user-modal">×</button>
        </div>
        <div class="modal-body">
          <form id="user-form">
            <div class="form-group">
              <label>Jina kamili *</label>
              <input type="text" name="full_name" required maxlength="100" placeholder="Mfano: Juma Mwalimu" />
            </div>
            <div class="form-group">
              <label>Barua pepe *</label>
              <input type="email" name="email" required placeholder="juma@biashara.com" />
            </div>
            <div class="form-group">
              <label>Nenosiri (angalau herufi 6) *</label>
              <div style="display:flex; gap:8px;">
                <input type="text" name="password" required minlength="6" placeholder="Nenosiri" style="flex:1;" />
                <button type="button" class="btn btn-secondary" id="gen-pass">Tengeneza</button>
              </div>
              <small style="color:#64748b;">Mpe mfanyakazi nenosiri hili. Anaweza kuingia mara moja.</small>
            </div>
            <div class="form-group">
              <label>Namba ya simu</label>
              <input type="tel" name="phone" placeholder="0712345678" pattern="[0-9]{10}" />
            </div>
            <div class="form-group">
              <label>Aina ya akaunti *</label>
              <select name="role" required>
                <option value="employee">Mfanyakazi (Employee)</option>
                <option value="cashier">Mhasibu (Cashier)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Ruhusa Maalum</label>
              <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
                <label style="display:flex; align-items:center; gap:8px; font-weight:normal; cursor:pointer;">
                  <input type="checkbox" name="can_view_reports" /> <span>Aweze kuona ripoti</span>
                </label>
                <label style="display:flex; align-items:center; gap:8px; font-weight:normal; cursor:pointer;">
                  <input type="checkbox" name="can_manage_stock" checked /> <span>Aweze kusimamia stock</span>
                </label>
              </div>
            </div>
            <div id="form-message" class="form-message" style="display:none;"></div>
            <div class="form-buttons">
              <button type="button" class="btn btn-secondary" data-close="user-modal">Ghairi</button>
              <button type="submit" class="btn btn-primary">Ongeza Mfanyakazi</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal: Hariri -->
    <div id="edit-modal" class="modal-overlay" style="display:none;">
      <div class="modal" style="max-width:480px;">
        <div class="modal-header">
          <h3 id="edit-title">Hariri Mfanyakazi</h3>
          <button class="modal-close" data-close="edit-modal">×</button>
        </div>
        <div class="modal-body">
          <form id="edit-form">
            <input type="hidden" name="id" />
            <div class="form-group">
              <label>Aina ya akaunti</label>
              <select name="role">
                <option value="employee">Mfanyakazi (Employee)</option>
                <option value="cashier">Mhasibu (Cashier)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Ruhusa</label>
              <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
                <label style="display:flex; align-items:center; gap:8px; font-weight:normal; cursor:pointer;">
                  <input type="checkbox" name="can_view_reports" /> <span>Aweze kuona ripoti</span>
                </label>
                <label style="display:flex; align-items:center; gap:8px; font-weight:normal; cursor:pointer;">
                  <input type="checkbox" name="can_manage_stock" /> <span>Aweze kusimamia stock</span>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label>Nenosiri jipya (acha wazi kama hubadilishi)</label>
              <div style="display:flex; gap:8px;">
                <input type="text" name="password" minlength="6" placeholder="Nenosiri jipya" style="flex:1;" />
                <button type="button" class="btn btn-secondary" id="gen-pass-edit">Tengeneza</button>
              </div>
            </div>
            <div id="edit-message" class="form-message" style="display:none;"></div>
            <div class="form-buttons">
              <button type="button" class="btn btn-secondary" data-close="edit-modal">Ghairi</button>
              <button type="submit" class="btn btn-primary">Hifadhi</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal: Maelezo -->
    <div id="details-modal" class="modal-overlay" style="display:none;">
      <div class="modal" style="max-width:600px;">
        <div class="modal-header">
          <h3 id="details-title">Maelezo</h3>
          <button class="modal-close" data-close="details-modal">×</button>
        </div>
        <div class="modal-body" id="details-content"></div>
      </div>
    </div>
  `;

  bindEvents(root);
  await loadUsers();
}

function bindEvents(root) {
  // Funga modals (kitufe cha × na Ghairi)
  root.querySelectorAll('[data-close]').forEach((b) =>
    b.addEventListener('click', () => {
      closeM(b.dataset.close);
      if (b.dataset.close === 'user-modal') resetAddForm();
    }));

  // Funga ukibofya nje ya modal
  root.querySelectorAll('.modal-overlay').forEach((o) =>
    o.addEventListener('click', (e) => { if (e.target === o) closeM(o.id); }));

  $('add-user-btn').addEventListener('click', () => openM('user-modal'));

  // Vibox vinavyobofyeka
  root.querySelectorAll('.stat-card').forEach((c) => {
    const go = () => showDetails(c.dataset.filter);
    c.addEventListener('click', go);
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  });

  $('user-search').addEventListener('input', renderTable);
  $('gen-pass').addEventListener('click', () => {
    $('user-form').elements.password.value = genPassword();
  });
  $('gen-pass-edit').addEventListener('click', () => {
    $('edit-form').elements.password.value = genPassword();
  });

  // Vitendo kwenye jedwali
  $('users-body').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const emp = employees.find((x) => x.id === btn.dataset.id);
    if (!emp) return;
    if (btn.dataset.act === 'toggle') toggleStatus(emp);
    if (btn.dataset.act === 'edit') openEdit(emp);
  });

  $('user-form').addEventListener('submit', (e) => { e.preventDefault(); addUser(); });
  $('edit-form').addEventListener('submit', (e) => { e.preventDefault(); saveEdit(); });
}

async function loadUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('owner_id', currentUser.id)
    .neq('role', 'owner')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading users:', error);
    $('users-body').innerHTML =
      `<tr><td colspan="7" class="empty-state" style="color:#b91c1c;">Hitilafu: ${esc(error.message)}</td></tr>`;
    return;
  }

  employees = data || [];
  $('total-employees').textContent = employees.length;
  $('active-employees').textContent = employees.filter((u) => u.active).length;
  $('inactive-employees').textContent = employees.filter((u) => !u.active).length;
  renderTable();
}

function renderTable() {
  const q = ($('user-search')?.value || '').trim().toLowerCase();
  const list = employees.filter((u) =>
    !q || [u.full_name, u.email, u.phone].some((v) => (v || '').toLowerCase().includes(q)));

  if (!list.length) {
    $('users-body').innerHTML = `<tr><td colspan="7" class="empty-state">${
      employees.length ? 'Hakuna matokeo.' : 'Bado hujaongeza mfanyakazi. Bofya "Ongeza Mfanyakazi".'
    }</td></tr>`;
    return;
  }

  $('users-body').innerHTML = list.map((u) => `
    <tr>
      <td><strong>${esc(u.full_name || 'Hakuna jina')}</strong></td>
      <td>${esc(u.email || '-')}</td>
      <td>${esc(u.phone || '-')}</td>
      <td><span class="badge badge-primary">${ROLE[u.role] || esc(u.role)}</span></td>
      <td>${badgeActive(u.active)}</td>
      <td>${fmtDate(u.created_at)}</td>
      <td>
        <button class="btn btn-sm btn-secondary" data-act="edit" data-id="${u.id}">Hariri</button>
        <button class="btn btn-sm ${u.active ? 'btn-danger' : 'btn-success'}" data-act="toggle" data-id="${u.id}">
          ${u.active ? 'Funga' : 'Fungua'}
        </button>
      </td>
    </tr>`).join('');
}

function showDetails(filter) {
  let list = employees;
  let title = 'Orodha ya Wafanyakazi Wote';
  if (filter === 'active') { list = employees.filter((u) => u.active); title = 'Wafanyakazi Wanaofanya Kazi'; }
  if (filter === 'inactive') { list = employees.filter((u) => !u.active); title = 'Wafanyakazi Waliofungiwa'; }

  $('details-title').textContent = title;
  $('details-content').innerHTML = !list.length
    ? '<div class="empty-state">Hakuna wafanyakazi kwenye kundi hili.</div>'
    : `
      <div style="max-height:400px; overflow-y:auto;">
        <table style="width:100%; border-collapse:collapse;">
          <thead style="position:sticky; top:0; background:white;">
            <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0;">
              <th style="padding:12px; text-align:left;">Jina</th>
              <th style="padding:12px; text-align:left;">Role</th>
              <th style="padding:12px; text-align:left;">Hali</th>
              <th style="padding:12px; text-align:left;">Tarehe</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((u) => `
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:12px;">
                  <div style="font-weight:600;">${esc(u.full_name || 'Hakuna jina')}</div>
                  <div style="font-size:12px; color:#64748b;">${esc(u.email || '-')}</div>
                </td>
                <td style="padding:12px;"><span class="badge badge-primary">${ROLE[u.role] || esc(u.role)}</span></td>
                <td style="padding:12px;">${badgeActive(u.active)}</td>
                <td style="padding:12px; color:#64748b;">${fmtDate(u.created_at)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div style="margin-top:16px; padding:12px; background:#f0f9ff; border-radius:8px; text-align:center; font-weight:600;">
          Jumla: ${list.length} wafanyakazi
        </div>
      </div>`;
  openM('details-modal');
}

function resetAddForm() {
  $('user-form').reset();
  $('form-message').style.display = 'none';
}

async function addUser() {
  const form = $('user-form');
  const msg = $('form-message');
  const btn = form.querySelector('button[type="submit"]');
  if (btn.disabled) return;

  const f = form.elements;
  btn.disabled = true;
  btn.textContent = 'Inachakata...';

  try {
    await callFn({
      action: 'create',
      full_name: f.full_name.value,
      email: f.email.value,
      password: f.password.value,
      phone: f.phone.value,
      role: f.role.value,
      can_view_reports: f.can_view_reports.checked,
      can_manage_stock: f.can_manage_stock.checked,
    });

    showMsg(msg, `Mfanyakazi ameongezwa. Mpe email (${f.email.value}) na nenosiri ulilomwekea ili aingie.`, 'success');
    await loadUsers();
    setTimeout(() => { closeM('user-modal'); resetAddForm(); }, 2500);
  } catch (err) {
    console.error('Add user error:', err);
    showMsg(msg, err.message || 'Imeshindikana kuongeza mfanyakazi.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Ongeza Mfanyakazi';
  }
}

function openEdit(emp) {
  const f = $('edit-form').elements;
  $('edit-title').textContent = 'Hariri: ' + (emp.full_name || emp.email);
  f.id.value = emp.id;
  f.role.value = emp.role === 'cashier' ? 'cashier' : 'employee';
  f.can_view_reports.checked = !!emp.can_view_reports;
  f.can_manage_stock.checked = !!emp.can_manage_stock;
  f.password.value = '';
  $('edit-message').style.display = 'none';
  openM('edit-modal');
}

async function saveEdit() {
  const f = $('edit-form').elements;
  const msg = $('edit-message');
  const btn = $('edit-form').querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Inahifadhi...';

  try {
    const payload = {
      action: 'update',
      id: f.id.value,
      role: f.role.value,
      can_view_reports: f.can_view_reports.checked,
      can_manage_stock: f.can_manage_stock.checked,
    };
    if (f.password.value) payload.password = f.password.value;

    await callFn(payload);
    showMsg(msg, 'Mabadiliko yamehifadhiwa.', 'success');
    await loadUsers();
    setTimeout(() => closeM('edit-modal'), 1200);
  } catch (err) {
    showMsg(msg, err.message || 'Imeshindikana kuhifadhi.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Hifadhi';
  }
}

async function toggleStatus(emp) {
  const makeActive = !emp.active;
  const action = makeActive ? 'kumfungulia' : 'kumfungia';
  if (!confirm(`Je, una uhakika unataka ${action} ${emp.full_name || 'mfanyakazi huyu'}?`)) return;

  try {
    await callFn({ action: 'set_status', id: emp.id, active: makeActive });
    await loadUsers();
  } catch (err) {
    alert('Hitilafu: ' + err.message);
  }
}