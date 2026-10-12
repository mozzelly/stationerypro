import { supabase } from '../lib/supabase.js';

const DEVELOPER_EMAIL = 'mussaelly1235@gmail.com';

export async function renderDeveloper(root, user, profile) {
  if (user.email !== DEVELOPER_EMAIL) {
    root.innerHTML = `<div class="notice error"><h3>Hauruhusiwi</h3></div>`;
    return;
  }

  // Muonekano wa Developer Dashboard
  root.innerHTML = `
    <div class="developer-container">
      <div class="page-header"><h1>Developer Dashboard</h1></div>

      <div class="stats-grid">
        <div class="stat-card" style="cursor: pointer;" onclick="showUsersList('all_owners')">
          <div class="stat-icon" style="background: #dbeafe; color: #1e40af;">👥</div>
          <div class="stat-content"><p class="stat-label">Jumla ya Owners</p><h3 class="stat-value" id="total-owners">0</h3></div>
        </div>
        <div class="stat-card" style="cursor: pointer;" onclick="showUsersList('pending')">
          <div class="stat-icon" style="background: #fef3c7; color: #92400e;">⏳</div>
          <div class="stat-content"><p class="stat-label">Wanasubiri Uthibitisho</p><h3 class="stat-value" id="pending-count">0</h3></div>
        </div>
        <div class="stat-card" style="cursor: pointer;" onclick="showUsersList('approved')">
          <div class="stat-icon" style="background: #dcfce7; color: #166534;">✅</div>
          <div class="stat-content"><p class="stat-label">Wamepitishwa (Active)</p><h3 class="stat-value" id="approved-count">0</h3></div>
        </div>
        <div class="stat-card" style="cursor: pointer;" onclick="showUsersList('cashiers')">
          <div class="stat-icon" style="background: #fce7f3; color: #9d174d;">👤</div>
          <div class="stat-content"><p class="stat-label">Jumla ya Cashiers</p><h3 class="stat-value" id="total-cashiers">0</h3></div>
        </div>
      </div>

      <!-- Modal ya Orodha -->
      <div id="users-modal" class="modal-overlay" style="display: none;">
        <div class="modal" style="max-width: 800px;">
          <div class="modal-header">
            <h3 id="modal-title">Orodha ya Watumiaji</h3>
            <button class="modal-close" onclick="closeUsersModal()">×</button>
          </div>
          <div class="modal-body"><div id="users-list-content">Inapakia...</div></div>
        </div>
      </div>

      <div class="section-title" style="margin-top: 32px;"><h2>Ombi Mpya za Owners (Zinasubiri Uthibitisho)</h2></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Jina</th><th>Role</th><th>Hali</th><th>Tarehe</th><th>Vitendo</th></tr></thead>
          <tbody id="pending-body"><tr><td colspan="5" class="empty-state">Inapakia...</td></tr></tbody>
        </table>
      </div>

      <div class="section-title" style="margin-top: 32px;"><h2>Owners Waliopitishwa</h2></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Jina</th><th>Role</th><th>Hali</th><th>Tarehe</th><th>Vitendo</th></tr></thead>
          <tbody id="approved-body"><tr><td colspan="5" class="empty-state">Inapakia...</td></tr></tbody>
        </table>
      </div>
    </div>
  `;

  // Pakia data zote
  await loadAllData();
}

async function loadAllData() {
  await loadStats();
  await loadPending();
  await loadApproved();
}

async function loadStats() {
  // Tunatumia id tu kwa speed
  const { data: owners } = await supabase.from('profiles').select('id').eq('role', 'owner');
  const { data: pending } = await supabase.from('profiles').select('id').eq('role', 'owner').eq('is_approved', false);
  const { data: approved } = await supabase.from('profiles').select('id').eq('role', 'owner').eq('is_approved', true);
  const { data: cashiers } = await supabase.from('profiles').select('id').eq('role', 'cashier');

  document.getElementById('total-owners').textContent = owners?.length || 0;
  document.getElementById('pending-count').textContent = pending?.length || 0;
  document.getElementById('approved-count').textContent = approved?.length || 0;
  document.getElementById('total-cashiers').textContent = cashiers?.length || 0;
}

async function loadPending() {
  // TUNATUMIA COLUMNS MAALUM (Hii ndiyo siri ya kuzuia kuganda)
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, is_approved, active, created_at')
    .eq('role', 'owner')
    .eq('is_approved', false)
    .order('created_at', { ascending: false });

  const tbody = document.getElementById('pending-body');
  
  if (error) {
    console.error('Pending Error:', error);
    tbody.innerHTML = `<tr><td colspan="5" style="color:red;">Hitilafu: ${error.message}</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Hakuna ombi mpya (Wote wamepitishwa)</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(p => `
    <tr>
      <td><strong>${p.full_name || 'Hakuna Jina'}</strong></td>
      <td>${p.role}</td>
      <td><span class="badge badge-warning">Inasubiri</span></td>
      <td>${new Date(p.created_at).toLocaleDateString('sw-TZ')}</td>
      <td style="display: flex; gap: 5px;">
        <button class="btn btn-sm btn-success" onclick="approveOwner('${p.id}', true)">Pitisha</button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${p.id}')">Futa</button>
      </td>
    </tr>
  `).join('');
}

async function loadApproved() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, is_approved, active, created_at')
    .eq('role', 'owner')
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  const tbody = document.getElementById('approved-body');
  
  if (error) {
    console.error('Approved Error:', error);
    tbody.innerHTML = `<tr><td colspan="5" style="color:red;">Hitilafu: ${error.message}</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Hakuna owners waliopitishwa</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(p => `
    <tr>
      <td><strong>${p.full_name || 'Hakuna Jina'}</strong></td>
      <td>${p.role}</td>
      <td>${p.active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'}</td>
      <td>${new Date(p.created_at).toLocaleDateString('sw-TZ')}</td>
      <td style="display: flex; gap: 5px;">
        <button class="btn btn-sm btn-danger" onclick="toggleOwner('${p.id}', ${!p.active})">
          ${p.active ? 'Funga' : 'Fungua'}
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${p.id}')">Futa</button>
      </td>
    </tr>
  `).join('');
}

// Function za Modal na Vitendo
window.showUsersList = async (type) => {
  const modal = document.getElementById('users-modal');
  const title = document.getElementById('modal-title');
  const content = document.getElementById('users-list-content');
  modal.style.display = 'flex';
  content.innerHTML = 'Inapakia...';

  let query = supabase.from('profiles').select('id, full_name, role, is_approved, active, created_at');
  let label = '';

  if (type === 'all_owners') { query = query.eq('role', 'owner'); label = 'Wamiliki Wote'; }
  else if (type === 'pending') { query = query.eq('role', 'owner').eq('is_approved', false); label = 'Wanasubiri'; }
  else if (type === 'approved') { query = query.eq('role', 'owner').eq('is_approved', true); label = 'Wamepitishwa'; }
  else if (type === 'cashiers') { query = query.eq('role', 'cashier'); label = 'Cashiers'; }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    content.innerHTML = '<p class="empty-state">Hakuna watumiaji wa aina hii.</p>';
    return;
  }

  title.textContent = `${label} (${data.length})`;
  content.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Jina</th><th>Role</th><th>Hali</th><th>Tarehe</th><th>Vitendo</th></tr></thead>
        <tbody>
          ${data.map(u => `
            <tr>
              <td>${u.full_name || '-'}</td>
              <td>${u.role}</td>
              <td>${u.is_approved ? '✅' : '⏳'}</td>
              <td>${new Date(u.created_at).toLocaleDateString('sw-TZ')}</td>
              <td><button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}')">Futa</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
};

window.closeUsersModal = () => { document.getElementById('users-modal').style.display = 'none'; };

window.deleteUser = async (userId) => {
  if (!confirm('Futa akaunti hii kabisa?')) return;
  // Futa data zinazohusiana kwanza
  await supabase.from('business_settings').delete().eq('owner_id', userId);
  await supabase.from('products').delete().eq('owner_id', userId);
  // Futa profile
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) { alert('Hitilafu: ' + error.message); return; }
  alert('Imefutwa!');
  await loadAllData();
};

window.approveOwner = async (ownerId, approve) => {
  if (!confirm(`${approve ? 'Kupitisha' : 'Kukataa'} akaunti hii?`)) return;
  const { error } = await supabase.from('profiles').update({ is_approved: approve, active: approve }).eq('id', ownerId);
  if (error) { alert('Hitilafu: ' + error.message); return; }
  await loadAllData();
};

window.toggleOwner = async (ownerId, newStatus) => {
  if (!confirm(`${newStatus ? 'Kufungulia' : 'Kufunga'} akaunti?`)) return;
  const { error } = await supabase.from('profiles').update({ active: newStatus }).eq('id', ownerId);
  if (error) { alert('Hitilafu: ' + error.message); return; }
  await loadAllData();
};